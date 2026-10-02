/**
 * VESTORA — Foundation Acceptance Test Suite (Phase 1)
 * Validates Manifest V3 compliance, bundle integrity, asset resolution, and PRD contracts.
 */

import fs from "node:fs";
import path from "node:path";

function runTests() {
  console.log("🧪 Running VESTORA Phase 1 Foundation Tests…\n");
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✓ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  const distDir = path.resolve("dist");

  // 1. Manifest V3 Check
  const manifestPath = path.join(distDir, "manifest.json");
  assert(fs.existsSync(manifestPath), "dist/manifest.json exists");
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
  assert(manifest.manifest_version === 3, "Manifest version is 3 (MV3 compliant)");
  assert(manifest.name.includes("VESTORA"), "Manifest name has VESTORA branding");

  // 2. Service Worker File Check
  const swPath = path.join(distDir, manifest.background.service_worker);
  assert(fs.existsSync(swPath), `Service worker exists: ${manifest.background.service_worker}`);

  // 3. Content Scripts & Styles Check
  const contentJsPath = path.join(distDir, manifest.content_scripts[0].js[0]);
  assert(fs.existsSync(contentJsPath), `Content script exists: ${manifest.content_scripts[0].js[0]}`);

  const overlayCssPath = path.join(distDir, manifest.content_scripts[0].css[0]);
  assert(fs.existsSync(overlayCssPath), `Overlay CSS exists: ${manifest.content_scripts[0].css[0]}`);

  // 4. Popup & Assets Check
  const popupHtmlPath = path.join(distDir, manifest.action.default_popup);
  assert(fs.existsSync(popupHtmlPath), `Popup HTML exists: ${manifest.action.default_popup}`);

  const popupHtmlContent = fs.readFileSync(popupHtmlPath, "utf-8");
  assert(popupHtmlContent.includes("Wear What You Imagine."), "Popup contains official tagline 'Wear What You Imagine.'");
  assert(popupHtmlContent.includes("Your camera stays on your device."), "Popup contains PRD privacy notice");
  assert(popupHtmlContent.includes("Camera"), "Popup contains Camera status card");
  assert(popupHtmlContent.includes("Performance"), "Popup contains Performance status card");

  // 5. Icon Assets Check (16, 32, 48, 128)
  for (const size of ["16", "32", "48", "128"]) {
    const iconRel = manifest.icons[size];
    const iconAbs = path.join(distDir, iconRel);
    assert(fs.existsSync(iconAbs), `Icon ${size}x${size} exists: ${iconRel}`);
    const stats = fs.statSync(iconAbs);
    assert(stats.size > 100, `Icon ${size}x${size} is non-empty (${stats.size} bytes)`);
  }

  // 6. Logo Asset Check
  const logoAbs = path.join(distDir, "assets/logo/vestora-logo.png");
  assert(fs.existsSync(logoAbs), "Official VESTORA logo exists in dist/assets/logo/vestora-logo.png");

  // 7. Web Accessible Resources Check
  for (const war of manifest.web_accessible_resources) {
    for (const res of war.resources) {
      const resPath = path.join(distDir, res);
      assert(fs.existsSync(resPath), `Web accessible resource exists: ${res}`);
    }
  }

  // 8. Permissions Check (Side Panel & Context Menu for universal platform support)
  assert(manifest.permissions.includes("sidePanel"), "Manifest includes 'sidePanel' permission for docked try-on");
  assert(manifest.permissions.includes("contextMenus"), "Manifest includes 'contextMenus' for universal right-click try-on");

  // 9. Global Clothing Platforms Dataset Check (350 Platforms Across 9 Categories)
  const csvPath = path.resolve("clothing_platforms_list.csv");
  assert(fs.existsSync(csvPath), "clothing_platforms_list.csv exists");
  if (fs.existsSync(csvPath)) {
    const lines = fs.readFileSync(csvPath, "utf-8").trim().split("\n");
    const count = lines.length - 1; // subtract header
    assert(count === 350, `clothing_platforms_list.csv contains exactly 350 platforms (found ${count})`);
  }

  console.log(`\n========================================`);
  console.log(`Results: ${passed} passed, ${failed} failed.`);
  console.log(`========================================\n`);

  if (failed > 0) process.exit(1);
}

runTests();
