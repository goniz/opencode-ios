#!/usr/bin/env node

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import express from 'express';
import * as https from 'https';
import * as http from 'http';
import plist from 'plist';
import AdmZip from 'adm-zip';
import bplistParser from 'bplist-parser';
import { 
  IPAInfo, 
  TailscaleStatus, 
  ServerConfig, 
  ManifestData, 
  Logger, 
  CLIArguments,
  CertificateFiles 
} from './types';

class OTALogger implements Logger {
  private timestamp(): string {
    return new Date().toISOString();
  }

  info(message: string): void {
    console.log(`[${this.timestamp()}] INFO: ${message}`);
  }

  warn(message: string): void {
    console.log(`[${this.timestamp()}] WARN: ${message}`);
  }

  error(message: string): void {
    console.error(`[${this.timestamp()}] ERROR: ${message}`);
  }

  debug(message: string): void {
    console.log(`[${this.timestamp()}] DEBUG: ${message}`);
  }
}

class OTAHost {
  private logger: Logger;
  private config: ServerConfig;
  private distDir = path.join(process.cwd(), 'dist', 'ota');
  private certsDir = path.join(this.distDir, 'certs');

  constructor(config: ServerConfig) {
    this.logger = new OTALogger();
    this.config = config;
    this.ensureDirectories();
  }

  private ensureDirectories(): void {
    if (!fs.existsSync(this.distDir)) {
      fs.mkdirSync(this.distDir, { recursive: true });
    }
    if (!fs.existsSync(this.certsDir)) {
      fs.mkdirSync(this.certsDir, { recursive: true });
    }
  }

  async findIpaFiles(): Promise<IPAInfo[]> {
    this.logger.debug('Searching for IPA files in current directory...');
    const files = fs.readdirSync(process.cwd());
    const ipaFiles: IPAInfo[] = [];

    for (const file of files) {
      if (file.endsWith('.ipa')) {
        const filePath = path.join(process.cwd(), file);
        const stats = fs.statSync(filePath);
        
        try {
          const metadata = await this.extractIpaMetadata(filePath);
          ipaFiles.push({
            path: filePath,
            bundleId: metadata.bundleId,
            version: metadata.version,
            displayName: metadata.displayName,
            buildNumber: metadata.buildNumber,
            size: stats.size,
            modifiedTime: stats.mtime
          });
        } catch (error) {
          this.logger.warn(`Failed to extract metadata from ${file}: ${error}`);
          // Still include the IPA with fallback metadata
          const fallbackName = file.replace('.ipa', '');
          ipaFiles.push({
            path: filePath,
            bundleId: `com.unknown.${fallbackName}`,
            version: '1.0.0',
            displayName: fallbackName,
            buildNumber: '1',
            size: stats.size,
            modifiedTime: stats.mtime
          });
          this.logger.info(`Using fallback metadata for ${file}`);
        }
      }
    }

    // Sort by modification time (newest first)
    ipaFiles.sort((a, b) => b.modifiedTime.getTime() - a.modifiedTime.getTime());
    
    this.logger.info(`Found ${ipaFiles.length} IPA file(s)`);
    return ipaFiles;
  }

  private async extractIpaMetadata(ipaPath: string): Promise<{
    bundleId: string;
    version: string;
    displayName: string;
    buildNumber?: string;
  }> {
    try {
      const zip = new AdmZip(ipaPath);
      const entries = zip.getEntries();
      
      // Find Info.plist in the app bundle
      let infoPlistEntry = null;
      for (const entry of entries) {
        if (entry.entryName.includes('.app/Info.plist')) {
          infoPlistEntry = entry;
          break;
        }
      }

      if (!infoPlistEntry) {
        throw new Error('Info.plist not found in IPA');
      }

      const plistData = infoPlistEntry.getData();
      let parsedPlist: any;
      
      // Check if it's a binary plist (starts with 'bplist')
      if (plistData[0] === 0x62 && plistData[1] === 0x70 && plistData[2] === 0x6c) {
        // Parse binary plist
        const results = bplistParser.parseBuffer(plistData);
        parsedPlist = results[0];
      } else {
        // Parse XML plist
        const plistString = plistData.toString('utf8');
        parsedPlist = plist.parse(plistString) as any;
      }

      const bundleId = parsedPlist.CFBundleIdentifier;
      const version = parsedPlist.CFBundleShortVersionString || parsedPlist.CFBundleVersion;
      const displayName = parsedPlist.CFBundleDisplayName || parsedPlist.CFBundleName || 'Unknown App';
      const buildNumber = parsedPlist.CFBundleVersion;

      if (!bundleId || !version) {
        throw new Error('Required metadata missing from Info.plist');
      }

      return { bundleId, version, displayName, buildNumber };
    } catch (error) {
      throw new Error(`Failed to extract IPA metadata: ${error}`);
    }
  }

  async getTailscaleStatus(): Promise<TailscaleStatus> {
    try {
      this.logger.debug('Checking Tailscale status...');
      const statusOutput = execSync('tailscale status --json', { encoding: 'utf8' });
      const status = JSON.parse(statusOutput);
      
      if (!status.Self) {
        return { isRunning: false };
      }

      const machineName = status.Self.HostName;
      const tailnetName = status.MagicDNSSuffix?.replace('.ts.net', '') || '';
      const hostname = `${machineName}.${tailnetName}.ts.net`;

      return {
        isRunning: true,
        hostname,
        machineName,
        tailnetName
      };
    } catch (error) {
      this.logger.warn(`Tailscale not available: ${error}`);
      return { isRunning: false };
    }
  }

  async fetchTailscaleCerts(hostname: string): Promise<CertificateFiles> {
    const certPath = path.join(this.certsDir, 'server.crt');
    const keyPath = path.join(this.certsDir, 'server.key');

    try {
      this.logger.info('Fetching Tailscale TLS certificates...');
      execSync(`tailscale cert --cert-file "${certPath}" --key-file "${keyPath}" "${hostname}"`, {
        stdio: 'pipe'
      });

      return {
        certPath,
        keyPath,
        exists: fs.existsSync(certPath) && fs.existsSync(keyPath)
      };
    } catch (error) {
      this.logger.error(`Failed to fetch Tailscale certificates: ${error}`);
      return { certPath, keyPath, exists: false };
    }
  }

  private generateSelfSignedCerts(): CertificateFiles {
    const certPath = path.join(this.certsDir, 'server.crt');
    const keyPath = path.join(this.certsDir, 'server.key');

    if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
      return { certPath, keyPath, exists: true };
    }

    this.logger.info('Generating self-signed certificates for development...');
    
    try {
      execSync(`openssl req -x509 -newkey rsa:4096 -keyout "${keyPath}" -out "${certPath}" -days 365 -nodes -subj "/CN=localhost"`, {
        stdio: 'pipe'
      });

      return {
        certPath,
        keyPath,
        exists: fs.existsSync(certPath) && fs.existsSync(keyPath)
      };
    } catch (error) {
      this.logger.error(`Failed to generate self-signed certificates: ${error}`);
      return { certPath, keyPath, exists: false };
    }
  }

  async generateManifest(_ipaInfo: IPAInfo, manifestData: ManifestData): Promise<void> {
    const templatePath = path.join(__dirname, 'templates', 'manifest.plist.template');
    const manifestPath = path.join(this.distDir, 'manifest.plist');

    let template: string;
    try {
      template = fs.readFileSync(templatePath, 'utf8');
    } catch (error) {
      // Fallback template if file doesn't exist
      template = this.getDefaultManifestTemplate();
    }

    const manifest = template
      .replace(/{{BUNDLE_ID}}/g, manifestData.bundleId)
      .replace(/{{VERSION}}/g, manifestData.version)
      .replace(/{{TITLE}}/g, manifestData.title)
      .replace(/{{IPA_URL}}/g, manifestData.ipaUrl)
      .replace(/{{ICON_SMALL_URL}}/g, manifestData.iconUrls.small || '')
      .replace(/{{ICON_LARGE_URL}}/g, manifestData.iconUrls.large || '');

    fs.writeFileSync(manifestPath, manifest);
    this.logger.debug('Generated manifest.plist');
  }

  async generateInstallPage(ipaInfo: IPAInfo, installUrl: string): Promise<void> {
    const templatePath = path.join(__dirname, 'templates', 'install.html.template');
    const installPath = path.join(this.distDir, 'install.html');

    let template: string;
    try {
      template = fs.readFileSync(templatePath, 'utf8');
    } catch (error) {
      // Fallback template if file doesn't exist
      template = this.getDefaultInstallTemplate();
    }

    const html = template
      .replace(/{{APP_NAME}}/g, ipaInfo.displayName)
      .replace(/{{VERSION}}/g, ipaInfo.version)
      .replace(/{{BUNDLE_ID}}/g, ipaInfo.bundleId)
      .replace(/{{INSTALL_URL}}/g, installUrl)
      .replace(/{{FILE_SIZE}}/g, this.formatFileSize(ipaInfo.size));

    fs.writeFileSync(installPath, html);
    this.logger.debug('Generated install.html');
  }

  private getDefaultManifestTemplate(): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>items</key>
    <array>
        <dict>
            <key>assets</key>
            <array>
                <dict>
                    <key>kind</key>
                    <string>software-package</string>
                    <key>url</key>
                    <string>{{IPA_URL}}</string>
                </dict>
            </array>
            <key>metadata</key>
            <dict>
                <key>bundle-identifier</key>
                <string>{{BUNDLE_ID}}</string>
                <key>bundle-version</key>
                <string>{{VERSION}}</string>
                <key>kind</key>
                <string>software</string>
                <key>title</key>
                <string>{{TITLE}}</string>
            </dict>
        </dict>
    </array>
</dict>
</plist>`;
  }

  private getDefaultInstallTemplate(): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Install {{APP_NAME}}</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; margin: 0; padding: 20px; background: #f5f5f7; }
        .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; padding: 30px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; }
        .app-name { font-size: 28px; font-weight: 600; color: #1d1d1f; margin: 0; }
        .version { font-size: 16px; color: #6e6e73; margin: 10px 0; }
        .install-btn { display: block; background: #007AFF; color: white; text-decoration: none; padding: 16px 24px; border-radius: 8px; text-align: center; font-size: 18px; font-weight: 500; margin: 30px 0; }
        .install-btn:hover { background: #0056CC; }
        .info { background: #f6f6f6; border-radius: 8px; padding: 16px; margin: 20px 0; }
        .info-item { margin: 8px 0; }
        .label { font-weight: 500; color: #1d1d1f; }
        .value { color: #6e6e73; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1 class="app-name">{{APP_NAME}}</h1>
            <div class="version">Version {{VERSION}}</div>
        </div>
        
        <a href="{{INSTALL_URL}}" class="install-btn">Install App</a>
        
        <div class="info">
            <div class="info-item">
                <span class="label">Bundle ID:</span> 
                <span class="value">{{BUNDLE_ID}}</span>
            </div>
            <div class="info-item">
                <span class="label">File Size:</span> 
                <span class="value">{{FILE_SIZE}}</span>
            </div>
        </div>
        
        <p style="text-align: center; color: #6e6e73; font-size: 14px; margin-top: 30px;">
            Tap "Install App" above to install via iOS Safari
        </p>
    </div>
</body>
</html>`;
  }

  private formatFileSize(bytes: number): string {
    const sizes = ['B', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  }

async startServer(): Promise<void> {
    const app = express();
    
    // Configure MIME types
    app.use(express.static(this.distDir, {
      setHeaders: (res, filePath) => {
        if (filePath.endsWith('.ipa')) {
          res.setHeader('Content-Type', 'application/octet-stream');
        } else if (filePath.endsWith('.plist')) {
          res.setHeader('Content-Type', 'application/xml');
        }
      }
    }));

    const ipaFiles = await this.findIpaFiles();
    if (ipaFiles.length === 0) {
      throw new Error('No IPA files found in current directory');
    }

    const latestIpa = ipaFiles[0];
    this.logger.info(`Using IPA: ${latestIpa.displayName} v${latestIpa.version}`);

    // Setup hostname and certificates
    let hostname = this.config.hostname;
    let certs: CertificateFiles;

    if (this.config.devMode) {
      hostname = 'localhost';
      certs = this.generateSelfSignedCerts();
    } else {
      const tailscaleStatus = await this.getTailscaleStatus();
      if (!tailscaleStatus.isRunning || !tailscaleStatus.hostname) {
        throw new Error('Tailscale is not running or hostname not available');
      }
      hostname = tailscaleStatus.hostname;
      certs = await this.fetchTailscaleCerts(hostname);
    }

    if (this.config.useHttps && !certs.exists) {
      throw new Error('TLS certificates not available');
    }

    const protocol = this.config.useHttps ? 'https' : 'http';
    const baseUrl = `${protocol}://${hostname}:${this.config.port}`;

    // Generate manifest and install page
    const manifestData: ManifestData = {
      bundleId: latestIpa.bundleId,
      version: latestIpa.version,
      title: latestIpa.displayName,
      ipaUrl: `${baseUrl}/latest.ipa`,
      iconUrls: {
        small: `${baseUrl}/icon57.png`,
        large: `${baseUrl}/icon512.png`
      }
    };

    await this.generateManifest(latestIpa, manifestData);
    const installUrl = `itms-services://?action=download-manifest&url=${baseUrl}/manifest.plist`;
    await this.generateInstallPage(latestIpa, installUrl);

    // Setup routes
    app.get('/', (_req, res) => {
      res.sendFile(path.join(this.distDir, 'install.html'));
    });

    app.get('/manifest.plist', (_req, res) => {
      res.setHeader('Content-Type', 'application/xml');
      res.sendFile(path.join(this.distDir, 'manifest.plist'));
    });

    app.get('/latest.ipa', (_req, res) => {
      res.setHeader('Content-Type', 'application/octet-stream');
      res.setHeader('Content-Length', latestIpa.size.toString());
      
      // If --once flag is set, exit after serving the first IPA
      if (this.config.once) {
        this.logger.info('IPA download started, will exit after completion due to --once flag');
        
        // Wait for the download to complete before shutting down
        res.on('finish', () => {
          this.logger.info('IPA download completed, shutting down server...');
          // Give a small delay to ensure cleanup
          setTimeout(() => {
            process.exit(0);
          }, 1000);
        });
        
        // Handle download errors
        res.on('error', (err) => {
          this.logger.error(`IPA download error: ${err.message}`);
          setTimeout(() => {
            process.exit(1);
          }, 1000);
        });
      }
      
      res.sendFile(latestIpa.path);
    });

    // Create server
    let server: https.Server | http.Server;
    if (this.config.useHttps && certs.exists) {
      const httpsOptions = {
        cert: fs.readFileSync(certs.certPath),
        key: fs.readFileSync(certs.keyPath)
      };
      server = https.createServer(httpsOptions, app);
    } else {
      server = http.createServer(app);
    }

    // Graceful shutdown
    const shutdown = () => {
      this.logger.info('Shutting down server...');
      server.close(() => {
        process.exit(0);
      });
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);

    // Start server
    server.listen(this.config.port, () => {
      this.logger.info(`🚀 OTA Server started`);
      this.logger.info(`📱 App: ${latestIpa.displayName} v${latestIpa.version}`);
      this.logger.info(`🌐 Install URL: ${baseUrl}/`);
      this.logger.info(`📋 Direct install: ${installUrl}`);
      this.logger.info(`⚙️  Mode: ${this.config.devMode ? 'Development' : 'Production'}`);
    });
  }
}

// CLI Argument parsing
function parseArguments(): CLIArguments {
  const args: CLIArguments = {};
  const argv = process.argv.slice(2);

  for (let i = 0; i < argv.length; i++) {
    switch (argv[i]) {
      case '--dev':
        args.dev = true;
        break;
      case '--port':
        args.port = parseInt(argv[++i], 10);
        break;
      case '--ipa':
        args.ipa = argv[++i];
        break;
      case '--once':
        args.once = true;
        break;
      case '--help':
      case '-h':
        args.help = true;
        break;
    }
  }

  return args;
}

function validateArguments(args: CLIArguments): void {
  if (args.port && (args.port < 1 || args.port > 65535)) {
    throw new Error('Port must be between 1 and 65535');
  }

  if (args.ipa && !fs.existsSync(args.ipa)) {
    throw new Error(`Custom IPA file not found: ${args.ipa}`);
  }

  if (args.ipa && !args.ipa.endsWith('.ipa')) {
    throw new Error('Custom file must have .ipa extension');
  }
}

function showHelp(): void {
  console.log(`
OTA Host - iOS App Over-The-Air Distribution

Usage: npm run ota-host [options]

Options:
  --dev             Development mode (self-signed certs, localhost)
  --port <number>   Server port (default: 443 prod, 8443 dev)
  --ipa <path>      Use specific IPA file
  --once            Exit after serving the first IPA file
  --help, -h        Show this help message

Examples:
  npm run ota-host                    # Production mode
  npm run ota-host:dev               # Development mode  
  npm run ota-host -- --port 9000    # Custom port
  npm run ota-host -- --ipa app.ipa  # Specific IPA file
  npm run ota-host -- --once         # Exit after first IPA served
`);
}

// Main execution
async function main(): Promise<void> {
  try {
    const args = parseArguments();

    if (args.help) {
      showHelp();
      return;
    }

    validateArguments(args);

    const config: ServerConfig = {
      port: args.port || (args.dev ? 8443 : 443),
      devMode: args.dev || false,
      customIpaPath: args.ipa,
      hostname: 'localhost',
      useHttps: true,
      once: args.once || false
    };

    const otaHost = new OTAHost(config);
    await otaHost.startServer();

  } catch (error) {
    console.error(`Fatal error: ${error}`);
    process.exit(1);
  }
}

// Run if this file is executed directly
if (require.main === module) {
  main();
}