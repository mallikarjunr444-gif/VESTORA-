/**
 * VESTORA — Extension Popup Controller
 * Manages camera status display, performance indicators, settings persistence, and try-on trigger (PRD Section 13).
 */

import { DEFAULT_SETTINGS, STORAGE_KEYS } from "../../shared/constants/index.js";
import type { ExtensionMessage, ExtensionSettings, Product } from "../../shared/types/index.js";

// DOM Elements
const btnTryProduct = document.getElementById("btn-try-product") as HTMLButtonElement;
const btnTryText = document.getElementById("btn-try-text") as HTMLSpanElement;
const btnOpenSidepanel = document.getElementById("btn-open-sidepanel") as HTMLButtonElement;
const btnOpenWindow = document.getElementById("btn-open-window") as HTMLButtonElement;
const detectedProductLabel = document.getElementById("detected-product-name") as HTMLParagraphElement;
const cameraStatusText = document.getElementById("camera-status-text") as HTMLSpanElement;
const perfStatusText = document.getElementById("perf-status-text") as HTMLSpanElement;

// Settings Toggles
const toggleAutoDetect = document.getElementById("toggle-autodetect") as HTMLInputElement;
const toggleOverlay = document.getElementById("toggle-overlay") as HTMLInputElement;
const togglePrivacy = document.getElementById("toggle-privacy") as HTMLInputElement;
const selectPerfMode = document.getElementById("select-perf-mode") as HTMLSelectElement;

let activeProduct: Product | null = null;

// ── 1. Initialize State ──
async function initPopup(): Promise<void> {
  // Load settings
  const storage = await chrome.storage.local.get([STORAGE_KEYS.SETTINGS, STORAGE_KEYS.ACTIVE_PRODUCT]);
  const settings = (storage[STORAGE_KEYS.SETTINGS] as ExtensionSettings) || DEFAULT_SETTINGS;
  activeProduct = (storage[STORAGE_KEYS.ACTIVE_PRODUCT] as Product) || null;

  // Apply settings to UI
  if (toggleAutoDetect) toggleAutoDetect.checked = settings.autoDetectProducts;
  if (toggleOverlay) toggleOverlay.checked = settings.showOverlayButton;
  if (togglePrivacy) togglePrivacy.checked = settings.privacyLocalOnly;
  if (selectPerfMode) selectPerfMode.value = settings.performanceMode;

  // Update product readout
  if (activeProduct) {
    detectedProductLabel.textContent = `✦ ${activeProduct.name}`;
    btnTryText.textContent = `Try "${activeProduct.name.slice(0, 18)}…"`;
  }

  // Check hardware camera availability
  checkCameraCapabilities();

  // Check performance mode label
  updatePerformanceIndicator(settings.performanceMode);

  // Setup event listeners
  setupListeners();
}

// ── 2. Check Device Camera Status ──
async function checkCameraCapabilities(): Promise<void> {
  try {
    if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = devices.filter((d) => d.kind === "videoinput");
      if (videoInputs.length > 0) {
        cameraStatusText.textContent = "Ready";
      } else {
        cameraStatusText.textContent = "No Camera";
      }
    } else {
      cameraStatusText.textContent = "Supported";
    }
  } catch {
    cameraStatusText.textContent = "Ready";
  }
}

function updatePerformanceIndicator(mode: ExtensionSettings["performanceMode"]): void {
  if (mode === "high") perfStatusText.textContent = "60 FPS (High)";
  else if (mode === "balanced") perfStatusText.textContent = "30 FPS (Balanced)";
  else if (mode === "low") perfStatusText.textContent = "Lite Mode";
  else perfStatusText.textContent = "Adaptive";
}

// ── 3. Listeners & Settings Persistence ──
function setupListeners(): void {
  // Try Current Product button
  btnTryProduct?.addEventListener("click", async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) {
      const message: ExtensionMessage = { type: "VESTORA_OPEN_TRYON" };
      chrome.tabs.sendMessage(tab.id, message).catch(() => {});
      window.close();
    }
  });

  // Open Side Panel (Like Anywear split-view)
  btnOpenSidepanel?.addEventListener("click", async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.windowId && (chrome as any).sidePanel?.open) {
      (chrome as any).sidePanel.open({ windowId: tab.windowId }).catch(() => {
        // Fallback to window
        chrome.windows.create({
          url: chrome.runtime.getURL(`tryon/tryon.html${activeProduct ? "?product=" + encodeURIComponent(JSON.stringify(activeProduct)) : ""}`),
          type: "popup",
          width: 480,
          height: 820,
        });
      });
    } else {
      chrome.windows.create({
        url: chrome.runtime.getURL(`tryon/tryon.html${activeProduct ? "?product=" + encodeURIComponent(JSON.stringify(activeProduct)) : ""}`),
        type: "popup",
        width: 480,
        height: 820,
      });
    }
    window.close();
  });

  // Open Dedicated Pop-out Window
  btnOpenWindow?.addEventListener("click", () => {
    chrome.windows.create({
      url: chrome.runtime.getURL(`tryon/tryon.html${activeProduct ? "?product=" + encodeURIComponent(JSON.stringify(activeProduct)) : ""}`),
      type: "popup",
      width: 480,
      height: 820,
    });
    window.close();
  });

  // Settings change listeners
  const saveSettings = async () => {
    const updated: Partial<ExtensionSettings> = {
      autoDetectProducts: toggleAutoDetect.checked,
      showOverlayButton: toggleOverlay.checked,
      privacyLocalOnly: togglePrivacy.checked,
      performanceMode: selectPerfMode.value as ExtensionSettings["performanceMode"],
    };

    const storage = await chrome.storage.local.get([STORAGE_KEYS.SETTINGS]);
    const current = (storage[STORAGE_KEYS.SETTINGS] as ExtensionSettings) || DEFAULT_SETTINGS;
    const merged = { ...current, ...updated };

    await chrome.storage.local.set({ [STORAGE_KEYS.SETTINGS]: merged });
    updatePerformanceIndicator(merged.performanceMode);
  };

  toggleAutoDetect?.addEventListener("change", saveSettings);
  toggleOverlay?.addEventListener("change", saveSettings);
  togglePrivacy?.addEventListener("change", saveSettings);
  selectPerfMode?.addEventListener("change", saveSettings);
}

document.addEventListener("DOMContentLoaded", initPopup);
