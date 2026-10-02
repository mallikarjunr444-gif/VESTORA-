/**
 * VESTORA — Product Detector (Main Content Script)
 * 
 * Autonomous Generic Fashion Detection:
 * Works on ANY shopping website (unknown Shopify, WooCommerce, Indian D2C brands,
 * marketplaces like Myntra, Amazon, Ajio, Zara, etc.) without hardcoding domains.
 * 
 * Pipeline:
 * DOM + URL
 *   ↓
 * 1. Product-Page Detection (assessProductPage)
 *   ↓
 * 2. Fashion & Garment Detection (detectHeroFashionProduct)
 *   ↓
 * 3. Triggers: Floating Corner Badge + In-Image "Try with VESTORA" Pills
 *   ↓
 * 4. Virtual Try-On Execution (Iframe / SidePanel / Window)
 */

import type { ExtensionMessage, Product } from "../../shared/types/index.js";
import { Logger } from "../../shared/utilities/logger.js";
import {
  assessProductPage,
  detectHeroFashionProduct,
  isCandidateFashionImage,
  extractBestImageUrl,
} from "./generic-product-detector.js";
import { attachTryOnButton, attachCornerFloatingBadge } from "./tryon-button.js";
import { extractProductFromElement } from "./product-extractor.js";
import { isGoogleImagesPage, initGoogleImagesScanner } from "./google-images-adapter.js";

const logger = new Logger("ProductDetector");

(function initVestoraContent() {
  if ((window as unknown as { __vestoraInitialized?: boolean }).__vestoraInitialized) return;
  (window as unknown as { __vestoraInitialized?: boolean }).__vestoraInitialized = true;

  logger.info("VESTORA autonomous product detector active on", location.hostname);

  let activeProduct: Product | null = null;
  let hasEvaluatedPage = false;

  // Google Search & Google Images Dedicated Scanner
  const isGoogle = location.hostname.toLowerCase().includes("google.");
  if (isGoogle || isGoogleImagesPage()) {
    logger.info("Google Search/Images detected — activating dedicated Google Images Try-On Scanner");
    initGoogleImagesScanner(handleTryOnClick);
    return;
  }

  const intersectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const target = entry.target as HTMLElement;
          intersectionObserver.unobserve(target);
          if (isCandidateFashionImage(target)) {
            attachTryOnButton(target, handleTryOnClick);
          }
        }
      });
    },
    { rootMargin: "300px 0px" }
  );

  function scanDOM(root: Document | HTMLElement = document) {
    // 1. Scan <img> elements
    const images = Array.from(root.querySelectorAll<HTMLImageElement>("img"));
    images.forEach((img) => {
      if (img.complete && img.naturalWidth > 0) {
        if (isCandidateFashionImage(img)) attachTryOnButton(img, handleTryOnClick);
      } else {
        img.addEventListener(
          "load",
          () => {
            if (isCandidateFashionImage(img)) attachTryOnButton(img, handleTryOnClick);
          },
          { once: true }
        );
        intersectionObserver.observe(img);
      }
    });

    // 2. Scan CSS background-image containers and custom media elements
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
      if (isCandidateFashionImage(el)) {
        attachTryOnButton(el, handleTryOnClick);
      }
    });

    // 3. Autonomous Page Evaluation (PDP Check + Corner Floating Badge)
    if (!hasEvaluatedPage) {
      evaluatePageForFashionPDP();
    }
  }

  function evaluatePageForFashionPDP() {
    const assessment = assessProductPage(document, location);
    if (assessment.isProductPage) {
      logger.info("Generic PDP detected with confidence:", assessment.confidence, "Signals:", assessment.signals);

      const detected = detectHeroFashionProduct(document, location);
      if (detected && detected.imageUrl) {
        activeProduct = detected;
        hasEvaluatedPage = true;

        // Notify background worker & store badge
        chrome.runtime.sendMessage({
          type: "VESTORA_PRODUCT_DETECTED",
          payload: detected,
        }).catch(() => {});

        // Attach autonomous floating corner badge
        attachCornerFloatingBadge(detected, handleTryOnClick);
      }
    }
  }

  function getHeroProduct(): Product | null {
    if (activeProduct) return activeProduct;

    // Use autonomous generic detector first
    const detected = detectHeroFashionProduct(document, location);
    if (detected && detected.imageUrl) {
      activeProduct = detected;
      return detected;
    }

    // Largest candidate on page fallback
    const allImages = Array.from(document.querySelectorAll<HTMLElement>("img, [style*='background-image']"));
    const candidates = allImages.filter(isCandidateFashionImage);
    if (candidates.length > 0) {
      const best = candidates[0];
      const imgUrl = extractBestImageUrl(best);
      if (imgUrl) {
        activeProduct = extractProductFromElement(best, imgUrl);
        return activeProduct;
      }
    }

    return null;
  }

  function handleTryOnClick(product: Product) {
    logger.info("User requested try-on for:", product.name);
    activeProduct = product;

    // Check if live try-on widget is already open on page (Multi-item layering)
    const existingIframe = document.getElementById("vestora-tryon-frame") as HTMLIFrameElement | null;
    if (existingIframe && existingIframe.contentWindow) {
      existingIframe.contentWindow.postMessage({
        type: "VESTORA_ADD_OUTFIT_ITEM",
        product: product,
      }, "*");

      const toast = document.createElement("div");
      toast.className = "vestora-feedback-toast";
      toast.innerHTML = `<span class="vestora-toast-icon">✦</span> Added <strong>${product.name.slice(0, 28)}…</strong> to active live try-on!`;
      document.body.appendChild(toast);
      setTimeout(() => toast.classList.add("is-visible"), 10);
      setTimeout(() => {
        toast.classList.remove("is-visible");
        setTimeout(() => toast.remove(), 400);
      }, 2600);
      return;
    }

    // Notify background worker
    const message: ExtensionMessage<Product> = {
      type: "VESTORA_PRODUCT_DETECTED",
      payload: product,
    };
    chrome.runtime.sendMessage(message).catch(() => {});

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

    // Open try-on widget
    openTryOnWidget(product);
  }

  function openTryOnWidget(product: Product) {
    // Remove existing widget if open
    const existing = document.getElementById("vestora-tryon-overlay");
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

    iframe.src = chrome.runtime.getURL("tryon/tryon.html");

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

    requestAnimationFrame(() => {
      overlay.style.opacity = "1";
    });

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
        window.removeEventListener("message", widgetMessageHandler);
        document.removeEventListener("keydown", escHandler);
      }
    };
    document.addEventListener("keydown", escHandler);
  }

  // Initial scan
  scanDOM(document);

  // MutationObserver for dynamic SPAs (Shopify Hydrogen, Next.js, Nuxt, React, Angular)
  const mutationObserver = new MutationObserver(() => {
    scanDOM(document);
  });
  mutationObserver.observe(document.body, { childList: true, subtree: true });

  // Periodic evaluation for slow/lazy hydration
  setTimeout(() => {
    if (!hasEvaluatedPage) {
      evaluatePageForFashionPDP();
    }
  }, 1500);

  // Listen for extension commands (Popup / SidePanel / ContextMenu)
  chrome.runtime.onMessage.addListener((msg: ExtensionMessage, _sender, sendResponse) => {
    if (msg && msg.type === "VESTORA_OPEN_TRYON") {
      logger.info("Received request to open try-on from popup/action");
      const prod = activeProduct || getHeroProduct();
      if (prod) {
        openTryOnWidget(prod);
        sendResponse?.({ success: true, product: prod });
      } else {
        const images = Array.from(document.querySelectorAll<HTMLImageElement>("img"));
        for (const img of images) {
          if (isCandidateFashionImage(img)) {
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
})();
