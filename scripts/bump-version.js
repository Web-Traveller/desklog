#!/usr/bin/env node
/**
 * DeskLog Version Synchronization Utility
 *
 * Updates application version across:
 * 1. package.json
 * 2. src-tauri/tauri.conf.json
 * 3. src-tauri/Cargo.toml
 *
 * Frontend code automatically receives this version via Vite injection (vite.config.ts).
 *
 * Usage:
 *   npm run bump 1.0.8
 *   node scripts/bump-version.js 1.0.8
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const newVersion = process.argv[2];

if (!newVersion || !/^\d+\.\d+\.\d+(-[a-zA-Z0-9.]+)?$/.test(newVersion)) {
  console.error('\x1b[31mError: Please provide a valid semver version string (e.g., 1.0.8 or 1.0.8-beta.1)\x1b[0m');
  console.error('Usage: npm run bump <version>');
  process.exit(1);
}

const rootDir = process.cwd();

// 1. Update package.json
const pkgPath = resolve(rootDir, 'package.json');
const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
const oldVersion = pkg.version;
pkg.version = newVersion;
writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
console.log(`\x1b[32m✔ Updated package.json: ${oldVersion} -> ${newVersion}\x1b[0m`);

// 2. Update src-tauri/tauri.conf.json
const tauriConfPath = resolve(rootDir, 'src-tauri/tauri.conf.json');
const tauriConf = JSON.parse(readFileSync(tauriConfPath, 'utf-8'));
tauriConf.version = newVersion;
writeFileSync(tauriConfPath, JSON.stringify(tauriConf, null, 2) + '\n');
console.log(`\x1b[32m✔ Updated src-tauri/tauri.conf.json: ${newVersion}\x1b[0m`);

// 3. Update src-tauri/Cargo.toml
const cargoPath = resolve(rootDir, 'src-tauri/Cargo.toml');
let cargoContent = readFileSync(cargoPath, 'utf-8');
cargoContent = cargoContent.replace(/^version\s*=\s*"[^"]+"/m, `version = "${newVersion}"`);
writeFileSync(cargoPath, cargoContent);
console.log(`\x1b[32m✔ Updated src-tauri/Cargo.toml: ${newVersion}\x1b[0m`);

console.log(`\n\x1b[36m🎉 Version synchronized to v${newVersion} across all files!\x1b[0m`);
console.log(`Frontend automatically reads this version via Vite build define.`);
