/**
 * Shared MediaPipe Tasks-Vision loader (all files are bundled in the extension,
 * so nothing is fetched from a CDN — required by Manifest V3).
 */
import { FilesetResolver } from "@mediapipe/tasks-vision";

export function assetUrl(relPath) {
  if (typeof chrome !== "undefined" && chrome.runtime?.getURL) {
    return chrome.runtime.getURL(relPath);
  }
  return new URL(`../../${relPath}`, import.meta.url).href;
}

let filesetPromise = null;
export function getFileset() {
  if (!filesetPromise) {
    filesetPromise = FilesetResolver.forVisionTasks(assetUrl("mediapipe/wasm"));
  }
  return filesetPromise;
}
