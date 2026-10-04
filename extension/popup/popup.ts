/**
 * VESTORA — Extension Popup Controller
 * Manages camera status display, performance indicators, settings persistence, and try-on trigger.
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

// Product Preview Card
const productPreviewCard = document.getElementById("product-preview-card") as HTMLElement;
const productPreviewThumb = document.getElementById("product-preview-thumb") as HTMLImageElement;
const productPreviewName = document.getElementById("product-preview-name") as HTMLElement;
const productPreviewCat = document.getElementById("product-preview-cat") as HTMLElement;

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

  // Update product readout from storage or active tab
  if (activeProduct && activeProduct.imageUrl) {
    showProductPreview(activeProduct);
  } else {
    // Dynamically query active tab for page garment
    chrome.tabs.query({ active: true, currentWindow: true }).then(([tab]) => {
      if (tab?.id) {
        chrome.tabs.sendMessage(tab.id, { type: "VESTORA_REQUEST_PAGE_PRODUCT" }).then((resp) => {
          if (resp?.success && resp.product) {
            activeProduct = resp.product;
            showProductPreview(activeProduct!);
          }
        }).catch(() => {});
      }
    }).catch(() => {});
  }

  // Check hardware camera availability
  checkCameraCapabilities();

  // Check performance mode label
  updatePerformanceIndicator(settings.performanceMode);

  // Setup event listeners
  setupListeners();
}

// ── Show product preview card ──
function showProductPreview(product: Product): void {
  if (!product) return;

  if (productPreviewCard) productPreviewCard.classList.remove("hidden");

  if (productPreviewThumb && product.imageUrl) {
    productPreviewThumb.src = product.imageUrl;
    productPreviewThumb.style.display = "block";
    productPreviewThumb.onerror = () => {
      if (productPreviewThumb) productPreviewThumb.style.display = "none";
    };
  }

  if (productPreviewName) {
    productPreviewName.textContent = product.name || "Fashion Item";
  }

  if (productPreviewCat) {
    productPreviewCat.textContent = product.category || "Apparel";
  }

  if (detectedProductLabel) {
    detectedProductLabel.textContent = `✦ ${product.name}`;
  }

  if (btnTryText) {
    const shortName = product.name.slice(0, 22);
    btnTryText.textContent = `Try "${shortName}${product.name.length > 22 ? '…' : ''}"`;
  }
}

// ── 2. Check Device Camera Status ──
async function checkCameraCapabilities(): Promise<void> {
  try {
    if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = devices.filter((d) => d.kind === "videoinput");
      if (cameraStatusText) {
        cameraStatusText.textContent = videoInputs.length > 0 ? "Ready" : "No Camera";
      }
    } else {
      if (cameraStatusText) cameraStatusText.textContent = "Supported";
    }
  } catch {
    if (cameraStatusText) cameraStatusText.textContent = "Ready";
  }
}

function updatePerformanceIndicator(mode: ExtensionSettings["performanceMode"]): void {
  if (!perfStatusText) return;
  if (mode === "high") perfStatusText.textContent = "60 FPS";
  else if (mode === "balanced") perfStatusText.textContent = "30 FPS";
  else if (mode === "low") perfStatusText.textContent = "Lite Mode";
  else perfStatusText.textContent = "100% Local";
}

// ── 3. Listeners & Settings Persistence ──
function setupListeners(): void {
  // Try Current Product button — opens in-page panel
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
      (chrome as any).sidePanel.open({ windowId: tab.windowId }).then(() => {
        // After side panel opens, send product to it
        if (activeProduct) {
          chrome.runtime.sendMessage({
            type: "VESTORA_OPEN_SIDEPANEL",
            payload: activeProduct,
          }).catch(() => {});
        }
      }).catch(() => {
        // Fallback to window
        openTryOnWindow();
      });
    } else {
      openTryOnWindow();
    }
    window.close();
  });

  // Open Dedicated Pop-out Window
  btnOpenWindow?.addEventListener("click", () => {
    openTryOnWindow();
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

function openTryOnWindow(): void {
  const productParam = activeProduct
    ? `?product=${encodeURIComponent(JSON.stringify(activeProduct))}`
    : "";
  chrome.windows.create({
    url: chrome.runtime.getURL(`tryon/tryon.html${productParam}`),
    type: "popup",
    width: 480,
    height: 840,
    left: 20,
    top: 60,
  });
}

document.addEventListener("DOMContentLoaded", initPopup);
