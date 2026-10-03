// Downloads the two small MediaPipe models into ./models (run once: npm run models)
import fs from "node:fs";
const BASE = "https://storage.googleapis.com/mediapipe-models";
const FILES = {
  "pose_landmarker_lite.task": `${BASE}/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task`,
  "selfie_multiclass_256x256.tflite": `${BASE}/image_segmenter/selfie_multiclass_256x256/float32/latest/selfie_multiclass_256x256.tflite`,
};
fs.mkdirSync("models", { recursive: true });
for (const [name, url] of Object.entries(FILES)) {
  if (fs.existsSync(`models/${name}`)) { console.log("✓ have", name); continue; }
  process.stdout.write(`↓ ${name} … `);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${name}: HTTP ${res.status}`);
  fs.writeFileSync(`models/${name}`, Buffer.from(await res.arrayBuffer()));
  console.log("done");
}
