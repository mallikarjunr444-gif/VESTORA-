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
 * 4. Virtual Try-On Execution (Shadow DOM Left Panel — no iframe CSP issues)
 */

import type { ExtensionMessage, Product } from "../../shared/types/index.js";
import { Logger } from "../../shared/utilities/logger.js";
import {
  assessProductPage,
  detectHeroFashionProduct,
  isCandidateFashionImage,
  extractBestImageUrl,
} from "./generic-product-detector.js";
import { attachTryOnButton, attachCornerFloatingBadge, attachSideFloatingDock } from "./tryon-button.js";
import { extractProductFromElement } from "./product-extractor.js";
import { isGoogleImagesPage, initGoogleImagesScanner } from "./google-images-adapter.js";
import { openVestoraPanel, addProductToPanel } from "./vestora-panel.js";

const logger = new Logger("ProductDetector");

(function initVestoraContent() {
  if ((window as unknown as { __vestoraInitialized?: boolean }).__vestoraInitialized) return;
  (window as unknown as { __vestoraInitialized?: boolean }).__vestoraInitialized = true;

  logger.info("VESTORA autonomous product detector active on", location.hostname);

  let activeProduct: Product | null = null;
  let hasEvaluatedPage = false;

  // Suppress third-party / competing try-on widgets (Anywear / Decart)
  function suppressCompetitorWidgets() {
    const competitorSelectors = [
      "#__decart-tryon-widget",
      "#__decart-pill-btn",
      ".vton-btn",
      "[id*='decart']",
      "[class*='anywear']",
      "[id*='anywear']",
    ];
    competitorSelectors.forEach((sel) => {
      document.querySelectorAll(sel).forEach((node) => {
        try {
          (node as HTMLElement).style.setProperty("display", "none", "important");
          node.remove();
        } catch {}
      });
    });
  }

  // Google Search & Google Images Dedicated Scanner
  const isGoogle = location.hostname.toLowerCase().includes("google.");
  if (isGoogle || isGoogleImagesPage()) {
    logger.info("Google Search/Images detected — activating dedicated Google Images Try-On Scanner");
    initGoogleImagesScanner(handleTryOnClick);
    return;
  }

  // Initial suppression and side dock attachment
  suppressCompetitorWidgets();
  attachSideFloatingDock(() => {
    const prod = activeProduct || getHeroProduct() || {
      id: `prod_dock_${Date.now()}`,
      name: document.title.split(/[-|·]/)[0].trim() || "Detected Apparel",
      brand: location.hostname.replace("www.", "").split(".")[0].toUpperCase(),
      imageUrl: "",
      productUrl: location.href,
      pageUrl: location.href,
      category: "upper_body",
      isFashion: true,
      availableSizes: ["S", "M", "L", "XL"],
      outOfStockSizes: [],
      confidence: 1.0,
      detectionSource: "dom-heuristic" as const,
    };
    openVestoraPanel(prod);
    showPageToast(`✦ VESTORA Live Try-On ready!`);
  });

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
    suppressCompetitorWidgets();
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
    const allImages = Array.from(document.querySelectorAll<HTMLElement>("img, [style*='background-image'], .image-grid-image, .image-grid-col"));
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

    // Primary: Open VESTORA In-Page Shadow DOM Panel (no navigation, stays on shopping site)
    openVestoraPanel(product);

    // Also notify background service worker to store active product
    chrome.runtime.sendMessage({
      type: "VESTORA_PRODUCT_DETECTED",
      payload: product,
    }).catch(() => {});

    // Show a brief toast on the page so user knows try-on is launching
    showPageToast(`✦ VESTORA Live Try-On ready!`);
  }


  function showPageToast(msg: string) {
    const toast = document.createElement("div");
    toast.style.cssText = `
      position:fixed; bottom:24px; left:50%; transform:translateX(-50%) translateY(20px);
      background:linear-gradient(135deg,#7c3aed,#4f46e5); color:#fff;
      padding:12px 24px; border-radius:100px; font-family:'Inter',sans-serif;
      font-size:14px; font-weight:600; z-index:2147483647; opacity:0;
      box-shadow:0 8px 32px rgba(124,58,237,0.4); transition:all 0.3s cubic-bezier(.34,1.56,.64,1);
      white-space:nowrap; letter-spacing:0.02em;
    `;
    toast.textContent = msg;
    document.body.appendChild(toast);
    requestAnimationFrame(() => {
      toast.style.opacity = "1";
      toast.style.transform = "translateX(-50%) translateY(0)";
    });
    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateX(-50%) translateY(20px)";
      setTimeout(() => toast.remove(), 400);
    }, 3000);
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
        openVestoraPanel(prod);
        showPageToast(`✦ VESTORA Live Try-On ready!`);
        sendResponse?.({ success: true, product: prod });
      } else {
        // No product detected — open panel with sample garments
        const emptyProduct: Product = {
          id: `prod_popup_${Date.now()}`,
          name: "Browse & Try Fashion",
          brand: location.hostname.replace("www.", "").split(".")[0].toUpperCase(),
          imageUrl: "",
          productUrl: location.href,
          pageUrl: location.href,
          category: "upper_body",
          isFashion: true,
          availableSizes: ["S", "M", "L", "XL"],
          outOfStockSizes: [],
          confidence: 1.0,
          detectionSource: "dom-heuristic" as const,
        };
        openVestoraPanel(emptyProduct);
        showPageToast(`✦ VESTORA ready — hover any garment image!`);
        sendResponse?.({ success: true, product: emptyProduct });
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
