/**
 * VESTORA — Product Detector (Main Content Script)
 * Scans page images, injects Try-On buttons, and reports detected products (PRD Section 11 & 12).
 */

import type { ExtensionMessage, Product } from "../../shared/types/index.js";
import { Logger } from "../../shared/utilities/logger.js";
import { isCandidateImage, extractBestImageUrl } from "./page-adapter.js";
import { attachTryOnButton } from "./tryon-button.js";
import { extractProductFromElement } from "./product-extractor.js";

const logger = new Logger("ProductDetector");

(function initVestoraContent() {
  if ((window as unknown as { __vestoraInitialized?: boolean }).__vestoraInitialized) return;
  (window as unknown as { __vestoraInitialized?: boolean }).__vestoraInitialized = true;

  logger.info("VESTORA content script active on", location.hostname);

  const intersectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const target = entry.target as HTMLElement;
          intersectionObserver.unobserve(target);
          if (isCandidateImage(target)) {
            attachTryOnButton(target, handleTryOnClick);
          }
        }
      });
    },
    { rootMargin: "300px 0px" }
  );

  function scanDOM(root: Document | HTMLElement = document) {
    const images = Array.from(root.querySelectorAll<HTMLImageElement>("img"));
    images.forEach((img) => {
      if (img.complete && img.naturalWidth > 0) {
        if (isCandidateImage(img)) attachTryOnButton(img, handleTryOnClick);
      } else {
        img.addEventListener(
          "load",
          () => {
            if (isCandidateImage(img)) attachTryOnButton(img, handleTryOnClick);
          },
          { once: true }
        );
        intersectionObserver.observe(img);
      }
    });

    // Also scan background-image containers
    const bgElements = Array.from(root.querySelectorAll<HTMLElement>("[style*='background-image'], .image-grid-image, .product-image"));
    bgElements.forEach((el) => {
      if (el.tagName !== "IMG" && isCandidateImage(el)) {
        attachTryOnButton(el, handleTryOnClick);
      }
    });
  }

  let activeProduct: Product | null = null;

  function handleTryOnClick(product: Product) {
    logger.info("User requested try-on for:", product.name);
    activeProduct = product;

    // Notify background worker
    const message: ExtensionMessage<Product> = {
      type: "VESTORA_PRODUCT_DETECTED",
      payload: product,
    };
    chrome.runtime.sendMessage(message);

    // Show feedback toast
    const toast = document.createElement("div");
    toast.className = "vestora-feedback-toast";
    toast.innerHTML = `<span class="vestora-toast-icon">✦</span> Starting VESTORA Live Try-On for <strong>${product.name.slice(0, 32)}…</strong>`;
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add("is-visible"), 10);
    setTimeout(() => {
      toast.classList.remove("is-visible");
      setTimeout(() => toast.remove(), 400);
    }, 2800);

    // Open the try-on widget
    openTryOnWidget(product);
  }

  function openTryOnWidget(product: Product) {
    // Remove existing widget if open
    const existing = document.getElementById("vestora-tryon-frame");
    if (existing) existing.remove();

    // Create fullscreen overlay container
    const overlay = document.createElement("div");
    overlay.id = "vestora-tryon-overlay";
    overlay.style.cssText = `
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      width: 100vw !important;
      height: 100vh !important;
      z-index: 2147483646 !important;
      background: rgba(0, 0, 0, 0.85) !important;
      backdrop-filter: blur(8px) !important;
      -webkit-backdrop-filter: blur(8px) !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      opacity: 0 !important;
      transition: opacity 0.3s ease !important;
    `;

    // Create try-on iframe
    const iframe = document.createElement("iframe");
    iframe.id = "vestora-tryon-frame";
    iframe.allow = "camera; microphone; autoplay; fullscreen";
    iframe.style.cssText = `
      width: 100% !important;
      height: 100% !important;
      max-width: 100vw !important;
      max-height: 100vh !important;
      border: none !important;
      border-radius: 0 !important;
      background: #0a0c12 !important;
    `;

    // Set the iframe source to the try-on widget page
    iframe.src = chrome.runtime.getURL("tryon/tryon.html");

    // Pass product data to iframe once loaded
    iframe.addEventListener("load", () => {
      if (iframe.contentWindow) {
        iframe.contentWindow.postMessage({
          type: "VESTORA_LOAD_PRODUCT",
          product: product,
        }, "*");
      }
    });

    overlay.appendChild(iframe);
    document.body.appendChild(overlay);

    // Animate in
    requestAnimationFrame(() => {
      overlay.style.opacity = "1";
    });

    // Prevent body scroll while widget is open
    document.body.style.overflow = "hidden";

    // Listen for close message from widget
    const closeHandler = (event: MessageEvent) => {
      if (event.data?.type === "VESTORA_CLOSE_TRYON") {
        overlay.style.opacity = "0";
        setTimeout(() => {
          overlay.remove();
          document.body.style.overflow = "";
        }, 300);
        window.removeEventListener("message", closeHandler);
      }
    };
    window.addEventListener("message", closeHandler);

    // Close on Escape key
    const escHandler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        overlay.style.opacity = "0";
        setTimeout(() => {
          overlay.remove();
          document.body.style.overflow = "";
        }, 300);
        window.removeEventListener("message", closeHandler);
        document.removeEventListener("keydown", escHandler);
      }
    };
    document.addEventListener("keydown", escHandler);
  }

  // Initial Scan & Mutation Observer
  scanDOM(document);

  const mutationObserver = new MutationObserver(() => {
    scanDOM(document);
  });
  mutationObserver.observe(document.body, { childList: true, subtree: true });

  // Listen for popup messages
  chrome.runtime.onMessage.addListener((msg: ExtensionMessage) => {
    if (msg && msg.type === "VESTORA_OPEN_TRYON") {
      logger.info("Received request to open try-on from popup");
      if (activeProduct) {
        openTryOnWidget(activeProduct);
      } else {
        // If no product detected yet, scan and try the first candidate
        const images = Array.from(document.querySelectorAll<HTMLImageElement>("img"));
        for (const img of images) {
          if (isCandidateImage(img)) {
            const imageUrl = extractBestImageUrl(img);
            const product = extractProductFromElement(img, imageUrl);
            openTryOnWidget(product);
            break;
          }
        }
      }
    }
  });
})();

