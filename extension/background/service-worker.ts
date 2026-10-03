/**
 * VESTORA — Background Service Worker (Manifest V3)
 * Manages extension lifecycle, local settings persistence, and CORS-free image caching.
 */

import { DEFAULT_SETTINGS, STORAGE_KEYS } from "../../shared/constants/index.js";
import type { ExtensionMessage, ExtensionSettings, Product } from "../../shared/types/index.js";
import { Logger } from "../../shared/utilities/logger.js";

const logger = new Logger("ServiceWorker");

// ── 1. Extension Lifecycle (Installation & Defaults) ──
chrome.runtime.onInstalled.addListener(async (details) => {
  logger.info(`Extension installed/updated. Reason: ${details.reason}`);

  try {
    if ((chrome as any).sidePanel?.setPanelBehavior) {
      await (chrome as any).sidePanel.setPanelBehavior({ openPanelOnActionClick: false }).catch(() => {});
    }

    // Register universal Right-Click Context Menu for any shopping website
    if (chrome.contextMenus) {
      chrome.contextMenus.removeAll(() => {
        chrome.contextMenus.create({
          id: "vestora-try-image",
          title: "✦ Try on with VESTORA",
          contexts: ["image", "link", "page"],
        });
      });
    }

    const existing = await chrome.storage.local.get([STORAGE_KEYS.SETTINGS]);
    if (!existing[STORAGE_KEYS.SETTINGS]) {
      await chrome.storage.local.set({
        [STORAGE_KEYS.SETTINGS]: DEFAULT_SETTINGS,
      });
      logger.info("Initialized default VESTORA settings in chrome.storage.local");
    }
  } catch (error) {
    logger.error("Failed to initialize default settings:", error);
  }
});

// ── 2. Message Dispatcher & Image Fetching ──
chrome.runtime.onMessage.addListener(
  (
    message: ExtensionMessage,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response?: unknown) => void
  ) => {
    if (!message || typeof message !== "object") return false;

    switch (message.type) {
      case "VESTORA_PING": {
        sendResponse({ success: true, timestamp: Date.now(), status: "active" });
        return false;
      }

      case "VESTORA_GET_SETTINGS": {
        chrome.storage.local.get([STORAGE_KEYS.SETTINGS]).then((data) => {
          sendResponse({
            success: true,
            settings: (data[STORAGE_KEYS.SETTINGS] as ExtensionSettings) || DEFAULT_SETTINGS,
          });
        }).catch((err) => {
          sendResponse({ success: false, error: String(err) });
        });
        return true;
      }

      case "VESTORA_UPDATE_SETTINGS": {
        const updated = message.payload as Partial<ExtensionSettings>;
        chrome.storage.local.get([STORAGE_KEYS.SETTINGS]).then(async (data) => {
          const current = (data[STORAGE_KEYS.SETTINGS] as ExtensionSettings) || DEFAULT_SETTINGS;
          const merged = { ...current, ...updated };
          await chrome.storage.local.set({ [STORAGE_KEYS.SETTINGS]: merged });
          sendResponse({ success: true, settings: merged });
        }).catch((err) => {
          sendResponse({ success: false, error: String(err) });
        });
        return true;
      }

      case "VESTORA_PRODUCT_DETECTED": {
        const product = message.payload as Product;
        if (product && sender.tab?.id) {
          chrome.action.setBadgeText({
            tabId: sender.tab.id,
            text: "✦",
          });
          chrome.action.setBadgeBackgroundColor({
            tabId: sender.tab.id,
            color: "#8b5cf6",
          });
          // Cache active product for popup
          chrome.storage.local.set({ [STORAGE_KEYS.ACTIVE_PRODUCT]: product });
        }
        sendResponse({ success: true });
        return false;
      }

      case "VESTORA_FETCH_IMAGE": {
        const imageUrl = (message.payload as { url: string })?.url;
        if (!imageUrl) {
          sendResponse({ success: false, error: "Missing image URL" });
          return false;
        }

        fetchImageAsDataUrl(imageUrl)
          .then((dataUrl) => {
            sendResponse({ success: true, dataUrl });
          })
          .catch((err) => {
            logger.warn(`Failed to fetch image ${imageUrl}:`, err);
            sendResponse({ success: false, error: String(err) });
          });
        return true; // Keep channel open for async response
      }

      case "VESTORA_OPEN_SIDEPANEL": {
        const windowId = sender.tab?.windowId;
        const tabId = sender.tab?.id;
        const product = message.payload as Product | undefined;
        if (product) {
          // Store with BOTH keys — ACTIVE_PRODUCT for popup, vestora_pending_product for tryon.js auto-load
          chrome.storage.local.set({
            [STORAGE_KEYS.ACTIVE_PRODUCT]: product,
            vestora_pending_product: product,
          });
        }
        if ((chrome as any).sidePanel?.open && windowId) {
          (chrome as any).sidePanel.open({ windowId })
            .then(() => {
              // After side panel opens, also push product via runtime message to tryon.html
              setTimeout(() => {
                if (tabId) {
                  chrome.runtime.sendMessage({ type: "VESTORA_LOAD_PRODUCT", product }).catch(() => {});
                }
              }, 800);
              sendResponse({ success: true });
            })
            .catch((err: unknown) => {
              logger.warn("Failed to open sidePanel, falling back to window:", err);
              openTryOnWindow(product);
              sendResponse({ success: true, fallback: "window" });
            });
          return true;
        } else {
          openTryOnWindow(product);
          sendResponse({ success: true, fallback: "window" });
          return false;
        }
      }

      case "VESTORA_OPEN_WINDOW": {
        const product = message.payload as Product | undefined;
        openTryOnWindow(product);
        sendResponse({ success: true });
        return false;
      }

      case "VESTORA_GRAB_CURRENT_TAB_PRODUCT": {
        chrome.tabs.query({ active: true, lastFocusedWindow: true }).then(([tab]) => {
          if (tab?.id) {
            chrome.tabs.sendMessage(tab.id, { type: "VESTORA_REQUEST_PAGE_PRODUCT" })
              .then((resp) => {
                sendResponse(resp || { success: false, error: "No product detected" });
              })
              .catch((err) => {
                sendResponse({ success: false, error: String(err) });
              });
          } else {
            sendResponse({ success: false, error: "No active tab found" });
          }
        }).catch((err) => {
          sendResponse({ success: false, error: String(err) });
        });
        return true; // Keep channel open for async response
      }

      default:
        return false;
    }
  }
);

// ── 3. Context Menu Click Handler (Universal Try-On) ──
if (chrome.contextMenus) {
  chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    if (info.menuItemId === "vestora-try-image") {
      let imageUrl = info.srcUrl || info.linkUrl || "";
      if (!imageUrl && tab?.url) {
        imageUrl = tab.url;
      }

      const domain = tab?.url ? new URL(tab.url).hostname.replace("www.", "") : "Store";
      const product: Product = {
        id: `ctx_${Date.now()}`,
        name: `Clothing item from ${domain}`,
        brand: domain,
        category: "upper_body",
        imageUrl,
        productUrl: tab?.url || "",
        pageUrl: tab?.url || "",
        confidence: 1.0,
        availableSizes: ["XS", "S", "M", "L", "XL", "XXL"],
      };

      await chrome.storage.local.set({ [STORAGE_KEYS.ACTIVE_PRODUCT]: product });

      if (tab?.windowId && (chrome as any).sidePanel?.open) {
        try {
          await (chrome as any).sidePanel.open({ windowId: tab.windowId });
          return;
        } catch {}
      }

      openTryOnWindow(product);
    }
  });
}

function openTryOnWindow(product?: Product): void {
  if (product) {
    chrome.storage.local.set({
      [STORAGE_KEYS.ACTIVE_PRODUCT]: product,
      vestora_pending_product: product,
    });
  }
  const productParam = product ? `?product=${encodeURIComponent(JSON.stringify(product))}` : "";
  chrome.windows.create({
    url: chrome.runtime.getURL(`tryon/tryon.html${productParam}`),
    type: "popup",
    left: 20,
    top: 60,
    width: 480,
    height: 840,
    focused: true,
  });
}

// ── 3. Helper: Fetch Image as Base64 Data URL (CORS Bypass) ──
async function fetchImageAsDataUrl(url: string): Promise<string> {
  const response = await fetch(url, { credentials: "omit" });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} when fetching image`);
  }
  const blob = await response.blob();
  const mimeType = blob.type || "image/jpeg";
  const buffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(buffer);

  let binary = "";
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, Array.from(chunk));
  }

  const base64 = btoa(binary);
  return `data:${mimeType};base64,${base64}`;
}
