# IPA OTA Hosting Implementation Plan

TypeScript script to host IPA files over-the-air with Tailscale integration for secure distribution.

## Overview

Create a production-ready OTA hosting solution that:
- Automatically serves the latest IPA file from the current directory
- Integrates with Tailscale for hostname resolution and TLS certificates
- Generates proper Apple manifest.plist files
- Provides a simple HTTPS server for iOS installation

## Tasks

### Phase 1: Project Setup

- [x] Install required dependencies
  - [x] Add `@types/node` for Node.js types
  - [x] Add `express` for HTTPS server
  - [x] Add `tsx` for TypeScript execution
  - [x] Add `plist` for Apple plist XML generation

- [x] Create script directory structure
  ```
  scripts/
  ├── ota-host.ts
  ├── types.ts
  └── templates/
      ├── manifest.plist.template
      └── install.html.template
  ```

- [x] Add npm scripts to package.json
  - [x] `"ota-host": "tsx scripts/ota-host.ts"`
  - [x] `"ota-host:dev": "tsx scripts/ota-host.ts --dev --port 8443"`

### Phase 2: Core Script Architecture

- [x] Create TypeScript type definitions (`scripts/types.ts`)
  - [x] `IPAInfo` interface (bundle ID, version, name, path)
  - [x] `TailscaleStatus` interface (hostname, certificates)
  - [x] `ServerConfig` interface (port, dev mode, custom IPA)
  - [x] `ManifestData` interface (for plist generation)

- [ ] Implement main script (`scripts/ota-host.ts`)
  - [ ] Command line argument parsing (--dev, --port, --ipa)
  - [ ] Main execution flow orchestration
  - [ ] Error handling and logging

### Phase 3: IPA Detection and Analysis

- [ ] Implement IPA file discovery
  - [ ] Find all `.ipa` files in current directory
  - [ ] Sort by modification time (newest first)
  - [ ] Handle case where no IPA files exist

- [ ] Implement IPA metadata extraction
  - [ ] Extract Info.plist from IPA file (zip parsing)
  - [ ] Parse bundle identifier (`CFBundleIdentifier`)
  - [ ] Parse version (`CFBundleShortVersionString`)
  - [ ] Parse display name (`CFBundleDisplayName` or `CFBundleName`)
  - [ ] Extract app icons if available

### Phase 4: Tailscale Integration

- [ ] Implement Tailscale status detection
  - [ ] Execute `tailscale status --json` command
  - [ ] Parse machine name from status output
  - [ ] Construct hostname as `{machine-name}.{tailnet-name}.ts.net`
  - [ ] Handle case where Tailscale is not running

- [ ] Implement TLS certificate fetching
  - [ ] Use `tailscale cert {hostname}` command to fetch certificates
  - [ ] Store certificates in `dist/ota/certs/` directory
  - [ ] Handle certificate renewal/refresh
  - [ ] Fallback to self-signed certificates in dev mode

### Phase 5: File Generation

- [ ] Create manifest.plist template (`scripts/templates/manifest.plist.template`)
  - [ ] Proper Apple plist XML structure
  - [ ] Placeholder variables for dynamic values
  - [ ] Software package asset definition
  - [ ] Optional icon assets (display-image, full-size-image)

- [ ] Implement manifest generation
  - [ ] Load template file
  - [ ] Replace placeholders with actual IPA metadata
  - [ ] Generate proper HTTPS URLs for all assets
  - [ ] Write manifest.plist to `dist/ota/` directory

- [ ] Create install page template (`scripts/templates/install.html.template`)
  - [ ] Simple HTML page with app information
  - [ ] `itms-services://` link for installation
  - [ ] Basic styling for mobile-friendly display

- [ ] Implement install page generation
  - [ ] Load HTML template
  - [ ] Replace placeholders with app metadata
  - [ ] Write install.html to `dist/ota/` directory

### Phase 6: HTTPS Server Implementation

- [ ] Implement Express HTTPS server
  - [ ] Load Tailscale TLS certificates
  - [ ] Configure proper MIME types
    - [ ] `.ipa` files as `application/octet-stream`
    - [ ] `manifest.plist` as `application/xml`
    - [ ] `.html` files as `text/html`
    - [ ] `.png` files as `image/png`
  - [ ] Set proper headers (Content-Length, CORS if needed)

- [ ] Implement route handlers
  - [ ] `/` - Serve install.html page
  - [ ] `/manifest.plist` - Serve generated manifest
  - [ ] `/latest.ipa` - Serve latest IPA file
  - [ ] `/icon57.png` and `/icon512.png` - Serve app icons (if available)

- [ ] Add server lifecycle management
  - [ ] Graceful startup with port binding
  - [ ] Proper error handling for port conflicts
  - [ ] Graceful shutdown on SIGINT/SIGTERM

### Phase 7: Development and Production Modes

- [ ] Implement development mode (`--dev` flag)
  - [ ] Use self-signed certificates instead of Tailscale
  - [ ] Default to port 8443 instead of 443
  - [ ] Enable detailed debug logging
  - [ ] Skip Tailscale hostname resolution (use localhost)

- [ ] Implement production mode (default)
  - [ ] Use Tailscale hostname and certificates
  - [ ] Default to port 443
  - [ ] Concise logging output
  - [ ] Validate all requirements before starting

### Phase 8: Error Handling and Validation

- [ ] Add comprehensive error handling
  - [ ] Validate IPA file integrity (zip format)
  - [ ] Validate extracted metadata completeness
  - [ ] Handle Tailscale command failures gracefully
  - [ ] Provide clear error messages for common issues

- [ ] Add input validation
  - [ ] Validate command line arguments
  - [ ] Validate port numbers (1-65535)
  - [ ] Validate custom IPA file paths
  - [ ] Validate bundle identifiers format

### Phase 9: Logging and Output

- [ ] Implement structured logging
  - [ ] Timestamp all log messages
  - [ ] Different log levels (info, warn, error)
  - [ ] Clear status messages for each phase

- [ ] Design console output
  - [ ] Show discovered IPA information
  - [ ] Display Tailscale hostname
  - [ ] Print install URL prominently
  - [ ] Show server start confirmation

### Phase 10: Testing and Documentation

- [ ] Test script functionality
  - [ ] Test with actual IPA files
  - [ ] Test Tailscale integration (if available)
  - [ ] Test development mode fallback
  - [ ] Test error scenarios

- [ ] Update project documentation
  - [ ] Add usage instructions to README.md
  - [ ] Document command line options
  - [ ] Add troubleshooting section

## File Structure

After implementation, the following files will be created:

```
scripts/
├── ota-host.ts                 # Main TypeScript script
├── types.ts                    # Type definitions
└── templates/
    ├── manifest.plist.template # Apple plist template
    └── install.html.template   # Install page template

dist/ota/                       # Generated at runtime
├── manifest.plist             # Generated manifest
├── install.html               # Generated install page
├── latest.ipa                 # Symlink to latest IPA
└── certs/                     # Tailscale certificates
    ├── server.crt
    └── server.key
```

## Dependencies to Add

```json
{
  "devDependencies": {
    "@types/node": "^22.0.0",
    "express": "^4.18.0",
    "tsx": "^4.0.0",
    "plist": "^3.1.0"
  }
}
```

## Usage Examples

```bash
# Production mode with Tailscale
npm run ota-host

# Development mode with self-signed certs
npm run ota-host:dev

# Custom port and IPA file
npm run ota-host -- --port 8443 --ipa custom-build.ipa
```

## Success Criteria

- [ ] Script successfully detects latest IPA file
- [ ] Generates valid Apple manifest.plist
- [ ] Integrates with Tailscale for hostname and certificates
- [ ] Serves files over HTTPS with proper MIME types
- [ ] iOS devices can install app via Safari using `itms-services://` URL
- [ ] Provides clear console output with install URL
- [ ] Handles errors gracefully with helpful messages