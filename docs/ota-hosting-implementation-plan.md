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

- [x] Implement main script (`scripts/ota-host.ts`)
  - [x] Command line argument parsing (--dev, --port, --ipa)
  - [x] Main execution flow orchestration
  - [x] Error handling and logging

### Phase 3: IPA Detection and Analysis

- [x] Implement IPA file discovery
  - [x] Find all `.ipa` files in current directory
  - [x] Sort by modification time (newest first)
  - [x] Handle case where no IPA files exist

- [x] Implement IPA metadata extraction
  - [x] Extract Info.plist from IPA file (zip parsing)
  - [x] Parse bundle identifier (`CFBundleIdentifier`)
  - [x] Parse version (`CFBundleShortVersionString`)
  - [x] Parse display name (`CFBundleDisplayName` or `CFBundleName`)
  - [x] Extract app icons if available

### Phase 4: Tailscale Integration

- [x] Implement Tailscale status detection
  - [x] Execute `tailscale status --json` command
  - [x] Parse machine name from status output
  - [x] Construct hostname as `{machine-name}.{tailnet-name}.ts.net`
  - [x] Handle case where Tailscale is not running

- [x] Implement TLS certificate fetching
  - [x] Use `tailscale cert {hostname}` command to fetch certificates
  - [x] Store certificates in `dist/ota/certs/` directory
  - [x] Handle certificate renewal/refresh
  - [x] Fallback to self-signed certificates in dev mode

### Phase 5: File Generation

- [x] Create manifest.plist template (`scripts/templates/manifest.plist.template`)
  - [x] Proper Apple plist XML structure
  - [x] Placeholder variables for dynamic values
  - [x] Software package asset definition
  - [x] Optional icon assets (display-image, full-size-image)

- [x] Implement manifest generation
  - [x] Load template file
  - [x] Replace placeholders with actual IPA metadata
  - [x] Generate proper HTTPS URLs for all assets
  - [x] Write manifest.plist to `dist/ota/` directory

- [x] Create install page template (`scripts/templates/install.html.template`)
  - [x] Simple HTML page with app information
  - [x] `itms-services://` link for installation
  - [x] Basic styling for mobile-friendly display

- [x] Implement install page generation
  - [x] Load HTML template
  - [x] Replace placeholders with app metadata
  - [x] Write install.html to `dist/ota/` directory

### Phase 6: HTTPS Server Implementation

- [x] Implement Express HTTPS server
  - [x] Load Tailscale TLS certificates
  - [x] Configure proper MIME types
    - [x] `.ipa` files as `application/octet-stream`
    - [x] `manifest.plist` as `application/xml`
    - [x] `.html` files as `text/html`
    - [x] `.png` files as `image/png`
  - [x] Set proper headers (Content-Length, CORS if needed)

- [x] Implement route handlers
  - [x] `/` - Serve install.html page
  - [x] `/manifest.plist` - Serve generated manifest
  - [x] `/latest.ipa` - Serve latest IPA file
  - [x] `/icon57.png` and `/icon512.png` - Serve app icons (if available)

- [x] Add server lifecycle management
  - [x] Graceful startup with port binding
  - [x] Proper error handling for port conflicts
  - [x] Graceful shutdown on SIGINT/SIGTERM

### Phase 7: Development and Production Modes

- [x] Implement development mode (`--dev` flag)
  - [x] Use self-signed certificates instead of Tailscale
  - [x] Default to port 8443 instead of 443
  - [x] Enable detailed debug logging
  - [x] Skip Tailscale hostname resolution (use localhost)

- [x] Implement production mode (default)
  - [x] Use Tailscale hostname and certificates
  - [x] Default to port 443
  - [x] Concise logging output
  - [x] Validate all requirements before starting

### Phase 8: Error Handling and Validation

- [x] Add comprehensive error handling
  - [x] Validate IPA file integrity (zip format)
  - [x] Validate extracted metadata completeness
  - [x] Handle Tailscale command failures gracefully
  - [x] Provide clear error messages for common issues

- [x] Add input validation
  - [x] Validate command line arguments
  - [x] Validate port numbers (1-65535)
  - [x] Validate custom IPA file paths
  - [x] Validate bundle identifiers format

### Phase 9: Logging and Output

- [x] Implement structured logging
  - [x] Timestamp all log messages
  - [x] Different log levels (info, warn, error)
  - [x] Clear status messages for each phase

- [x] Design console output
  - [x] Show discovered IPA information
  - [x] Display Tailscale hostname
  - [x] Print install URL prominently
  - [x] Show server start confirmation

### Phase 10: Testing and Documentation

- [x] Test script functionality
  - [x] Test with actual IPA files
  - [x] Test Tailscale integration (if available)
  - [x] Test development mode fallback
  - [x] Test error scenarios

- [x] Update project documentation
  - [x] Add usage instructions to README.md
  - [x] Document command line options
  - [x] Add troubleshooting section

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

- [x] Script successfully detects latest IPA file
- [x] Generates valid Apple manifest.plist
- [x] Integrates with Tailscale for hostname and certificates
- [x] Serves files over HTTPS with proper MIME types
- [x] iOS devices can install app via Safari using `itms-services://` URL
- [x] Provides clear console output with install URL
- [x] Handles errors gracefully with helpful messages