export interface IPAInfo {
  path: string;
  bundleId: string;
  version: string;
  displayName: string;
  buildNumber?: string;
  size: number;
  modifiedTime: Date;
}

export interface TailscaleStatus {
  isRunning: boolean;
  hostname?: string;
  machineName?: string;
  tailnetName?: string;
  certificatePath?: string;
  privateKeyPath?: string;
}

export interface ServerConfig {
  port: number;
  devMode: boolean;
  customIpaPath?: string;
  hostname: string;
  useHttps: boolean;
  certPath?: string;
  keyPath?: string;
  once?: boolean;
}

export interface ManifestData {
  bundleId: string;
  version: string;
  title: string;
  ipaUrl: string;
  iconUrls: {
    small?: string;
    large?: string;
  };
}

export interface LogLevel {
  INFO: 'info';
  WARN: 'warn';
  ERROR: 'error';
  DEBUG: 'debug';
}

export interface Logger {
  info(message: string): void;
  warn(message: string): void;
  error(message: string): void;
  debug(message: string): void;
}

export interface CLIArguments {
  dev?: boolean;
  port?: number;
  ipa?: string;
  help?: boolean;
  once?: boolean;
}

export interface CertificateFiles {
  certPath: string;
  keyPath: string;
  exists: boolean;
}