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

    // Also scan custom fashion e-commerce containers (Myntra, Ajio, Zara, Flipkart, Shein, Amazon, Shopify)
    const customSelectors = [
      "[style*='background-image']",
      ".image-grid-image",
      ".image-grid-col",
      ".pdp-image-container",
      ".product-sliderContainer",
      ".product-image",
      ".img-container",
      ".prod-image",
      ".product__media",
      ".product-single__photo",
      ".product-media",
      ".gallery-image",
      "[data-testid*='product-image']",
      "._396cs4",
      "#landingImage",
      ".product-base",
      ".results-base",
    ].join(", ");

    const customElements = Array.from(root.querySelectorAll<HTMLElement>(customSelectors));
    customElements.forEach((el) => {
      if (isCandidateImage(el)) {
        attachTryOnButton(el, handleTryOnClick);
      }
    });
  }

  let activeProduct: Product | null = null;

  function getHeroProduct(): Product | null {
    if (activeProduct) return activeProduct;

    const heroSelectors = [
      ".image-grid-image img",
      ".image-grid-image",
      ".pdp-image-container img",
      "#landingImage",
      "#imgBlkFront",
      ".product__media img",
      ".product-single__photo img",
      ".prod-image img",
      "._396cs4",
    ];

    for (const sel of heroSelectors) {
      const el = document.querySelector<HTMLElement>(sel);
      if (el && isCandidateImage(el)) {
        const imgUrl = extractBestImageUrl(el);
        if (imgUrl) {
          activeProduct = extractProductFromElement(el, imgUrl);
          return activeProduct;
        }
      }
    }

    // OpenGraph fallback
    const ogImg = document.querySelector('meta[property="og:image"]')?.getAttribute("content");
    const ogTitle = document.querySelector('meta[property="og:title"]')?.getAttribute("content") || document.title;
    if (ogImg && !ogImg.includes("logo") && !ogImg.includes("favicon")) {
      return {
        id: `hero_${Date.now()}`,
        name: ogTitle.split(/[-|·]/)[0].trim(),
        imageUrl: ogImg,
        productUrl: location.href,
        pageUrl: location.href,
        category: "upper_body",
        availableSizes: ["XS", "S", "M", "L", "XL", "XXL"],
      };
    }

    // Largest candidate on page
    const allImages = Array.from(document.querySelectorAll<HTMLElement>("img, [style*='background-image']"));
    const candidates = allImages.filter((el) => isCandidateImage(el));
    if (candidates.length > 0) {
      const best = candidates[0];
      const imgUrl = extractBestImageUrl(best);
      if (imgUrl) return extractProductFromElement(best, imgUrl);
    }

    return null;
  }

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

    // Listen for messages from widget
    const widgetMessageHandler = (event: MessageEvent) => {
      if (event.data?.type === "VESTORA_CLOSE_TRYON") {
        overlay.style.opacity = "0";
        setTimeout(() => {
          overlay.remove();
          document.body.style.overflow = "";
        }, 300);
        window.removeEventListener("message", widgetMessageHandler);
      } else if (event.data?.type === "VESTORA_REQUEST_PAGE_PRODUCT") {
        const prod = activeProduct || getHeroProduct();
        if (iframe.contentWindow) {
          iframe.contentWindow.postMessage({
            type: "VESTORA_REQUEST_PAGE_PRODUCT_RESULT",
            product: prod,
          }, "*");
        }
      }
    };
    window.addEventListener("message", widgetMessageHandler);

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

  // Listen for messages from popup / sidepanel
  chrome.runtime.onMessage.addListener((msg: ExtensionMessage, _sender, sendResponse) => {
    if (msg && msg.type === "VESTORA_OPEN_TRYON") {
      logger.info("Received request to open try-on from popup");
      const prod = activeProduct || getHeroProduct();
      if (prod) {
        openTryOnWidget(prod);
        sendResponse?.({ success: true, product: prod });
      } else {
        const images = Array.from(document.querySelectorAll<HTMLImageElement>("img"));
        for (const img of images) {
          if (isCandidateImage(img)) {
            const imageUrl = extractBestImageUrl(img);
            const product = extractProductFromElement(img, imageUrl);
            openTryOnWidget(product);
            sendResponse?.({ success: true, product });
            break;
          }
        }
      }
      return false;
    }

    if (msg && msg.type === "VESTORA_REQUEST_PAGE_PRODUCT") {
      const prod = activeProduct || getHeroProduct();
      sendResponse?.({ success: !!prod, product: prod });
      return false;
    }
  });

  // Auto-detect and cache active product for extension action / side panel on PDPs
  setTimeout(() => {
    const hero = getHeroProduct();
    if (hero) {
      chrome.runtime.sendMessage({
        type: "VESTORA_PRODUCT_DETECTED",
        payload: hero,
      }).catch(() => {});
    }
  }, 1200);
})();

