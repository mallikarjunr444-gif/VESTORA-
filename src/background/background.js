/**
 * VESTORA Background Service Worker (Manifest V3)
 * Handles CORS-free image fetching and extension lifecycle.
 */

const DEFAULT_SERVER_URL = "http://localhost:3000";

// Ensure default settings on install
chrome.runtime.onInstalled.addListener(async (details) => {
  const existing = await chrome.storage.local.get(["vestora_server_url"]);
  if (!existing.vestora_server_url) {
    await chrome.storage.local.set({ vestora_server_url: DEFAULT_SERVER_URL });
  }
  console.log(`[VESTORA] Extension installed (${details.reason}). Default server: ${DEFAULT_SERVER_URL}`);
});

// Message listener
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || typeof message !== "object") return;

  // 1. Fetch image as base64 Data URL to bypass page CORS restrictions
  if (message.type === "VESTORA_FETCH_IMAGE") {
    (async () => {
      try {
        const url = message.url;
        if (!url || typeof url !== "string") {
          sendResponse({ success: false, error: "Missing or invalid image URL" });
          return;
        }

        const response = await fetch(url, { credentials: "omit" });
        if (!response.ok) {
          throw new Error(`Failed to fetch image: HTTP ${response.status}`);
        }

        const blob = await response.blob();
        const mimeType = blob.type || "image/jpeg";
        const arrayBuffer = await blob.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);

        // Convert arrayBuffer to base64 string safely in chunks
        let binary = "";
        const chunkSize = 8192;
        for (let i = 0; i < bytes.length; i += chunkSize) {
          const chunk = bytes.subarray(i, i + chunkSize);
          binary += String.fromCharCode.apply(null, chunk);
        }
        const base64 = btoa(binary);
        const dataUrl = `data:${mimeType};base64,${base64}`;

        sendResponse({
          success: true,
          dataUrl,
          mimeType,
          originalUrl: url
        });
      } catch (err) {
        console.error("[VESTORA Background] Error fetching garment image:", err);
        sendResponse({
          success: false,
          error: err.message || "Failed to fetch image"
        });
      }
    })();
    return true; // Keep message channel open for async response
  }

  // 2. Get server configuration
  if (message.type === "VESTORA_GET_SERVER_URL") {
    (async () => {
      try {
        const data = await chrome.storage.local.get(["vestora_server_url"]);
        sendResponse({
          success: true,
          serverUrl: data.vestora_server_url || DEFAULT_SERVER_URL
        });
      } catch (err) {
        sendResponse({ success: true, serverUrl: DEFAULT_SERVER_URL });
      }
    })();
    return true;
  }

  // 3. Set server configuration
  if (message.type === "VESTORA_SET_SERVER_URL") {
    (async () => {
      try {
        const serverUrl = message.serverUrl || DEFAULT_SERVER_URL;
        await chrome.storage.local.set({ vestora_server_url: serverUrl });
        sendResponse({ success: true, serverUrl });
      } catch (err) {
        sendResponse({ success: false, error: err.message });
      }
    })();
    return true;
  }

  // 4. Ping
  if (message.type === "VESTORA_PING") {
    sendResponse({ success: true, status: "alive", timestamp: Date.now() });
    return false;
  }
});
