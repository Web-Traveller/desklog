/**
 * DeskLog Application Version — Single Source of Truth
 *
 * This reads from the global __APP_VERSION__ constant injected by Vite at build time
 * from package.json. You only ever need to bump the version in package.json.
 *
 * src-tauri/tauri.conf.json and src-tauri/Cargo.toml must be kept in sync manually
 * (or via a version-bump script) before pushing a new release tag.
 */
declare const __APP_VERSION__: string;
export const APP_VERSION: string = __APP_VERSION__;
