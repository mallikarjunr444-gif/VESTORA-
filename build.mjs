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
  fs.mkdirSync("dist/models", { recursive: true });

  // 2. Copy static assets
  fs.copyFileSync("extension/manifest.json", "dist/manifest.json");
  fs.copyFileSync("extension/popup/popup.html", "dist/popup/popup.html");
  fs.copyFileSync("extension/popup/popup.css", "dist/popup/popup.css");
  fs.copyFileSync("extension/styles/overlay.css", "dist/styles/overlay.css");

  // Copy try-on widget static files (html, css, permission helper)
  fs.mkdirSync("dist/tryon", { recursive: true });
  fs.copyFileSync("extension/tryon/tryon.html", "dist/tryon/tryon.html");
  fs.copyFileSync("extension/tryon/tryon.css", "dist/tryon/tryon.css");
  fs.copyFileSync("extension/tryon/permission.html", "dist/tryon/permission.html");

  await copyDir("extension/assets", "dist/assets");
  for (const modelFile of ["pose_landmarker_lite.task", "selfie_multiclass_256x256.tflite"]) {
    const srcPath = path.join("models", modelFile);
    if (fs.existsSync(srcPath)) {
      fs.copyFileSync(srcPath, path.join("dist/models", modelFile));
    }
  }

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

  // 7. Bundle Try-On Controller with In-House Neural VTON Engine (ESM)
  const tryonBuild = esbuild.build({
    ...commonOptions,
    entryPoints: ["extension/tryon/tryon.js"],
    outfile: "dist/tryon/tryon.js",
    format: "esm",
    platform: "browser",
  });

  // 8. Compile Engine modules for Node testing and runtime imports
  const engineBuild = esbuild.build({
    entryPoints: {
      "rendering/in-house-vton": "engine/rendering/in-house-vton.ts",
      "segmentation/index": "engine/segmentation/index.ts",
    },
    outdir: "dist/engine",
    format: "esm",
    target: ["node20"],
  });

  await Promise.all([backgroundBuild, contentBuild, popupBuild, tryonBuild, engineBuild]);

  // 7. Synchronize to root directory so loading the root repository in Chrome works seamlessly
  fs.copyFileSync("dist/manifest.json", "manifest.json");
  await copyDir("dist/background", "background");
  await copyDir("dist/content", "content");
  await copyDir("dist/popup", "popup");
  await copyDir("dist/styles", "styles");
  await copyDir("dist/tryon", "tryon");
  await copyDir("dist/assets", "assets");

  // Clean out legacy files that referenced external Decart / Anywear URLs
  const legacyFilesToRemove = [
    "background.js",
    "content.js",
    "config.js",
    "widget.html",
    "widget-core.js",
    "widget-init.js",
    "widget.bundle.js",
    "crash_reports.js",
    "button-detector.js",
    "revolve.js",
    "ugg.js",
    "guess.js",
    "factory54.js",
    "uniqlo.js",
    "per_website_garment_filter.js",
    "popup.html",
    "popup.js",
  ];
  for (const file of legacyFilesToRemove) {
    if (fs.existsSync(file)) {
      fs.rmSync(file, { force: true });
    }
  }

  console.log("✅ VESTORA Manifest V3 Extension successfully built into dist/ and root!");
  console.log("👉 Load unpacked in Chrome via: chrome://extensions (select 'dist' or root folder)");
}

build().catch((err) => {
  console.error("❌ Build failed:", err);
  process.exit(1);
});
