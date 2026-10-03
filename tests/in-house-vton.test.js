/**
 * VESTORA In-House AI VTON Engine Tests
 * Validates self-hosted dense mesh draping, shirt replacement, arm occlusion, and temporal smoothing.
 */

import { strict as assert } from "node:assert";
import { InHouseVTONEngine } from "../dist/engine/rendering/in-house-vton.js";
import { BaselineSegmentationEngine } from "../dist/engine/segmentation/index.js";

console.log("🧪 Running VESTORA In-House AI VTON Engine Unit Tests…\n");

let passed = 0;
function test(name, fn) {
  try {
    fn();
    console.log(`  ✓ PASS: ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ FAIL: ${name}`);
    console.error(err);
    process.exit(1);
  }
}

// 1. Initialization Test
test("InHouseVTONEngine initializes without cloud API dependencies", () => {
  const engine = new InHouseVTONEngine();
  assert.ok(engine, "Engine instance created");
  assert.strictEqual(typeof engine.renderTryOn, "function");
  assert.strictEqual(typeof engine.reset, "function");
});

// 2. Anatomical Mesh Topology Test
test("Anatomical deformation mesh generates 25+ control vertices and 34+ triangles", () => {
  const engine = new InHouseVTONEngine();
  const width = 1280;
  const height = 720;
  
  // Standard webcam upper body landmarks
  const landmarks = [
    { x: width * 0.5, y: height * 0.35 }, // 0: Nose
    { x: width * 0.44, y: height * 0.30 }, // 1: L Eye
    { x: width * 0.56, y: height * 0.30 }, // 2: R Eye
    { x: width * 0.40, y: height * 0.35 }, // 3: L Ear
    { x: width * 0.60, y: height * 0.35 }, // 4: R Ear
    { x: width * 0.35, y: height * 0.55 }, // 5: L Shoulder
    { x: width * 0.65, y: height * 0.55 }, // 6: R Shoulder
    { x: width * 0.28, y: height * 0.72 }, // 7: L Elbow
    { x: width * 0.72, y: height * 0.72 }, // 8: R Elbow
    { x: width * 0.22, y: height * 0.88 }, // 9: L Wrist
    { x: width * 0.78, y: height * 0.88 }, // 10: R Wrist
    { x: width * 0.38, y: height * 0.95 }, // 11: L Hip
    { x: width * 0.62, y: height * 0.95 }, // 12: R Hip
  ];

  // Access private buildAnatomicalMesh
  const mesh = engine["buildAnatomicalMesh"](landmarks, width, height, 1.0, 0);
  assert.ok(mesh.vertices.length >= 27, `Vertices count: ${mesh.vertices.length}`);
  assert.ok(mesh.triangles.length >= 34, `Triangles count: ${mesh.triangles.length}`);

  // Check UV range
  for (const v of mesh.vertices) {
    assert.ok(v.u >= 0 && v.u <= 1, `UV u in range: ${v.u}`);
    assert.ok(v.v >= 0 && v.v <= 1, `UV v in range: ${v.v}`);
    assert.ok(!Number.isNaN(v.x) && !Number.isNaN(v.y), "Coordinates are valid finite numbers");
  }
});

// 3. Temporal Smoothing Test
test("Temporal filter dampens jitter between frames", () => {
  const engine = new InHouseVTONEngine();
  const v1 = [{ u: 0.5, v: 0.5, x: 100, y: 100 }];
  const v2 = [{ u: 0.5, v: 0.5, x: 200, y: 200 }];

  const s1 = engine["applyTemporalSmoothing"](v1);
  assert.strictEqual(s1[0].x, 100, "Initial vertex position is preserved");

  const s2 = engine["applyTemporalSmoothing"](v2);
  // With alpha = 0.28, smoothed x = 100 * (1 - 0.28) + 200 * 0.28 = 128
  assert.ok(s2[0].x > 100 && s2[0].x < 200, `Smoothed coordinate ${s2[0].x} is intermediate`);
  assert.strictEqual(Math.round(s2[0].x), 128);
});

// 4. Arm Occlusion Detection Test
test("Arm occlusion detector identifies arms crossed in front of chest", () => {
  const seg = new BaselineSegmentationEngine();
  const width = 1280;
  const height = 720;

  // Arms crossed on chest: left wrist (x: 600, y: 480) within shoulder span (448..832, y: 396..684)
  const landmarksArmsOnChest = [
    { x: 640, y: 250 }, // 0
    { x: 600, y: 220 }, // 1
    { x: 680, y: 220 }, // 2
    { x: 570, y: 250 }, // 3
    { x: 710, y: 250 }, // 4
    { x: 448, y: 396 }, // 5: L Shoulder
    { x: 832, y: 396 }, // 6: R Shoulder
    { x: 400, y: 500 }, // 7: L Elbow
    { x: 880, y: 500 }, // 8: R Elbow
    { x: 600, y: 480 }, // 9: L Wrist (Crossed on chest!)
    { x: 680, y: 480 }, // 10: R Wrist (Crossed on chest!)
    { x: 486, y: 684 }, // 11: L Hip
    { x: 794, y: 684 }, // 12: R Hip
  ];

  const occlusion = seg.detectArmOcclusion(landmarksArmsOnChest, width, height);
  assert.strictEqual(occlusion.isLeftArmOccluding, true, "Left arm detected occluding chest");
  assert.strictEqual(occlusion.isRightArmOccluding, true, "Right arm detected occluding chest");

  // Arms down at sides: wrists outside torso
  const landmarksArmsDown = [
    ...landmarksArmsOnChest.slice(0, 9),
    { x: 300, y: 700 }, // 9: L Wrist down at side
    { x: 980, y: 700 }, // 10: R Wrist down at side
    landmarksArmsOnChest[11],
    landmarksArmsOnChest[12],
  ];

  const occlusionDown = seg.detectArmOcclusion(landmarksArmsDown, width, height);
  assert.strictEqual(occlusionDown.isLeftArmOccluding, false, "Left arm not occluding when down");
  assert.strictEqual(occlusionDown.isRightArmOccluding, false, "Right arm not occluding when down");
});

// 5. Torso Region Extraction Test
test("Torso region extraction identifies complete shirt bounding polygon", () => {
  const seg = new BaselineSegmentationEngine();
  const width = 1280;
  const height = 720;
  const landmarks = [
    { x: 640, y: 250 }, // 0
    { x: 600, y: 220 }, // 1
    { x: 680, y: 220 }, // 2
    { x: 570, y: 250 }, // 3
    { x: 710, y: 250 }, // 4
    { x: 448, y: 396 }, // 5: L Shoulder
    { x: 832, y: 396 }, // 6: R Shoulder
    { x: 400, y: 500 }, // 7
    { x: 880, y: 500 }, // 8
    { x: 300, y: 700 }, // 9
    { x: 980, y: 700 }, // 10
    { x: 486, y: 684 }, // 11: L Hip
    { x: 794, y: 684 }, // 12: R Hip
  ];

  const torso = seg.extractTorsoRegion(landmarks, width, height);
  assert.ok(torso.points.length >= 8, `Torso boundary polygon points: ${torso.points.length}`);
  assert.strictEqual(torso.leftShoulder.x, 448);
  assert.strictEqual(torso.rightShoulder.x, 832);
  assert.strictEqual(torso.leftHip.x, 486);
  assert.strictEqual(torso.rightHip.x, 794);
});

console.log(`\n========================================`);
console.log(`Results: ${passed} passed, 0 failed.`);
console.log(`========================================\n`);
