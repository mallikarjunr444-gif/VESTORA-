/**
 * VESTORA — Shared Constants
 */

import type { ExtensionSettings } from "../types/index.js";

export const BRAND_NAME = "VESTORA";
export const BRAND_TAGLINE = "Wear What You Imagine.";

export const STORAGE_KEYS = {
  SETTINGS: "vestora_settings",
  ACTIVE_PRODUCT: "vestora_active_product",
  DEVICE_PROFILE: "vestora_device_profile",
} as const;

export const DEFAULT_SETTINGS: ExtensionSettings = {
  cameraReady: true,
  performanceMode: "auto",
  privacyLocalOnly: true,
  autoDetectProducts: true,
  showOverlayButton: true,
  developerDebugMode: false,
};

export const TARGET_FPS = {
  HIGH_END: 60,
  BALANCED: 30,
  MINIMUM: 24,
} as const;

export const PRIVACY_STATEMENT =
  "Your camera is processed locally whenever supported. VESTORA does not upload your camera feed by default.";
