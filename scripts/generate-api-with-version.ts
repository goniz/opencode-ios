#!/usr/bin/env tsx

import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';

/**
 * Script to generate API bindings with opencode version included
 * Handles the complete process: generate spec, update version, generate bindings, add version constant
 */

function main() {
  try {
    console.log('🚀 Starting API generation with version...');

    // Step 1: Generate the OpenAPI spec
    console.log('📄 Generating OpenAPI spec...');
    execSync('opencode generate > src/api/opencode_api.json', { stdio: 'inherit' });

    // Step 2: Get the opencode version and update the spec
    const version = execSync('opencode --version').toString().trim();
    console.log(`🔖 Using opencode version: ${version}`);

    const specPath = 'src/api/opencode_api.json';
    const spec = JSON.parse(readFileSync(specPath, 'utf8'));

    // Update the version in the spec
    spec.info.version = version;
    writeFileSync(specPath, JSON.stringify(spec, null, 2));
    console.log(`✅ Updated OpenAPI spec version to: ${version}`);

    // Step 3: Generate TypeScript bindings
    console.log('🔧 Generating TypeScript bindings...');
    execSync('openapi-ts -i src/api/opencode_api.json -o src/api -c @hey-api/client-fetch', { stdio: 'inherit' });

    // Step 4: Add version constant to index.ts
    console.log('📝 Adding version constant...');
    const indexPath = 'src/api/index.ts';
    const indexContent = readFileSync(indexPath, 'utf8');

    // Check if version constant already exists
    if (indexContent.includes('OPENCODE_VERSION')) {
      console.log('ℹ️  OPENCODE_VERSION constant already exists, skipping...');
    } else {
      // Add version export
      const versionExport = `\n// opencode version\nexport const OPENCODE_VERSION = '${version}';\n`;
      writeFileSync(indexPath, indexContent + versionExport);
      console.log(`✅ Added OPENCODE_VERSION constant to index.ts`);
    }

    console.log('🎉 API generation completed successfully!');

  } catch (error) {
    console.error('❌ Error in generate-api-with-version script:', error);
    process.exit(1);
  }
}

main();