/**
 * VESTORA — Build Script (esbuild)
 * Compiles TypeScript source files into clean, self-contained Manifest V3 bundles.
 */

import * as esbuild from "esbuild";
import fs from "node:fs";
import path from "node:path";

const isDev = process.argv.includes("--watch");

async function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      await copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

async function build() {
  console.log("⚡ Compiling VESTORA Manifest V3 Extension (Phase 1)…");

  // 1. Clean and ensure dist directories
  fs.rmSync("dist", { recursive: true, force: true });
  fs.mkdirSync("dist/background", { recursive: true });
  fs.mkdirSync("dist/content", { recursive: true });
  fs.mkdirSync("dist/popup", { recursive: true });
  fs.mkdirSync("dist/styles", { recursive: true });
  fs.mkdirSync("dist/assets/logo", { recursive: true });
  fs.mkdirSync("dist/assets/icons", { recursive: true });

  // 2. Copy static assets
  fs.copyFileSync("extension/manifest.json", "dist/manifest.json");
  fs.copyFileSync("extension/popup/popup.html", "dist/popup/popup.html");
  fs.copyFileSync("extension/popup/popup.css", "dist/popup/popup.css");
  fs.copyFileSync("extension/styles/overlay.css", "dist/styles/overlay.css");

  // Copy try-on widget files
  fs.mkdirSync("dist/tryon", { recursive: true });
  fs.copyFileSync("extension/tryon/tryon.html", "dist/tryon/tryon.html");
  fs.copyFileSync("extension/tryon/tryon.css", "dist/tryon/tryon.css");
  fs.copyFileSync("extension/tryon/tryon.js", "dist/tryon/tryon.js");

  await copyDir("extension/assets", "dist/assets");

  // 3. Shared esbuild options
  const commonOptions = {
    bundle: true,
    minify: !isDev,
    sourcemap: isDev ? "inline" : false,
    target: ["chrome116"],
    define: {
      "process.env.NODE_ENV": JSON.stringify(isDev ? "development" : "production"),
    },
  };

  // 4. Bundle Background Service Worker (ESM)
  const backgroundBuild = esbuild.build({
    ...commonOptions,
    entryPoints: ["extension/background/service-worker.ts"],
    outfile: "dist/background/service-worker.js",
    format: "esm",
    platform: "browser",
  });

  // 5. Bundle Content Script (IIFE for browser page context)
  const contentBuild = esbuild.build({
    ...commonOptions,
    entryPoints: ["extension/content/product-detector.ts"],
    outfile: "dist/content/content.js",
    format: "iife",
    platform: "browser",
  });

  // 6. Bundle Popup Controller (ESM)
  const popupBuild = esbuild.build({
    ...commonOptions,
    entryPoints: ["extension/popup/popup.ts"],
    outfile: "dist/popup/popup.js",
    format: "esm",
    platform: "browser",
  });

  await Promise.all([backgroundBuild, contentBuild, popupBuild]);

  console.log("✅ VESTORA Manifest V3 Extension successfully built into dist/!");
  console.log("👉 Load unpacked in Chrome via: chrome://extensions (select 'dist' folder)");
}

build().catch((err) => {
  console.error("❌ Build failed:", err);
  process.exit(1);
});
