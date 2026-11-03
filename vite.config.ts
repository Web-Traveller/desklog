import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
// @ts-expect-error type error without @types/node package
import process from "node:process";
// @ts-expect-error type error without @types/node package
import { readFileSync } from "node:fs";
// @ts-expect-error type error without @types/node package
import { resolve } from "node:path";

const host = process.env.TAURI_DEV_HOST;

// Single source of truth: read version from package.json at build time
const pkg = JSON.parse(readFileSync(resolve("package.json"), "utf-8"));
const APP_VERSION = pkg.version;

// https://vite.dev/config/
export default defineConfig(() => ({
  plugins: [react()],

  // Inject version as a global constant — no manual updates ever needed in source files
  define: {
    __APP_VERSION__: JSON.stringify(APP_VERSION),
  },

  // Vite options tailored for Tauri development and only applied in `tauri dev` or `tauri build`
  //
  // 1. prevent Vite from obscuring rust errors
  clearScreen: false,
  // 2. tauri expects a fixed port, fail if that port is not available
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      // 3. tell Vite to ignore watching `src-tauri`
      ignored: ["**/src-tauri/**"],
    },
  },
  build: {
    // Generate sourcemaps for readable stack traces in Sentry
    sourcemap: true,
  },
}));
