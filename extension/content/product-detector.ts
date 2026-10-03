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
import { attachTryOnButton, attachCornerFloatingBadge, attachSideFloatingDock } from "./tryon-button.js";
import { extractProductFromElement } from "./product-extractor.js";
import { isGoogleImagesPage, initGoogleImagesScanner } from "./google-images-adapter.js";

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
    handleTryOnClick(prod);
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
    const existing = document.getElementById("vestora-tryon-container");
    if (existing) {
      existing.remove();
      document.body.style.overflow = "";
    }

    // Floating window container (draggable, non-blocking pane)
    const container = document.createElement("div");
    container.id = "vestora-tryon-container";
    container.className = "vestora-pane-mode";

    // Header bar: "Try-On ✦ VESTORA"
    const header = document.createElement("div");
    header.className = "vestora-pane-header";
    header.innerHTML = `
      <div class="vestora-pane-title">
        <span>Try-On</span>
        <span class="vestora-pane-sparkle">✦</span>
        <span class="vestora-pane-brand">VESTORA</span>
        <span class="vestora-pane-free-badge">FREE · NO QUEUE</span>
      </div>
      <div class="vestora-pane-actions">
        <button type="button" class="vestora-pane-btn" id="vestora-pane-expand" title="Toggle Fullscreen" aria-label="Toggle Fullscreen">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>
        </button>
        <button type="button" class="vestora-pane-btn" id="vestora-pane-close" title="Close" aria-label="Close">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
    `;

    // Try-on iframe
    const iframe = document.createElement("iframe");
    iframe.id = "vestora-tryon-frame";
    iframe.allow = "camera; microphone; autoplay; fullscreen";
    iframe.src = chrome.runtime.getURL("tryon/tryon.html");

    iframe.addEventListener("load", () => {
      if (iframe.contentWindow) {
        iframe.contentWindow.postMessage({
          type: "VESTORA_LOAD_PRODUCT",
          product: product,
        }, "*");
      }
    });

    container.appendChild(header);
    container.appendChild(iframe);
    document.body.appendChild(container);

    // Draggable header logic
    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let startLeft = 0;
    let startTop = 0;

    header.addEventListener("mousedown", (e) => {
      const target = e.target as HTMLElement;
      if (target.closest(".vestora-pane-btn")) return;
      if (container.classList.contains("vestora-fullscreen-mode")) return;

      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      const rect = container.getBoundingClientRect();
      startLeft = rect.left;
      startTop = rect.top;

      container.style.bottom = "auto";
      container.style.right = "auto";
      container.style.left = `${startLeft}px`;
      container.style.top = `${startTop}px`;
      e.preventDefault();
    });

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      const newLeft = Math.max(8, Math.min(window.innerWidth - container.offsetWidth - 8, startLeft + dx));
      const newTop = Math.max(8, Math.min(window.innerHeight - container.offsetHeight - 8, startTop + dy));
      container.style.left = `${newLeft}px`;
      container.style.top = `${newTop}px`;
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);

    // Fullscreen toggle
    const expandBtn = header.querySelector("#vestora-pane-expand") as HTMLButtonElement | null;
    expandBtn?.addEventListener("click", () => {
      const isFull = container.classList.toggle("vestora-fullscreen-mode");
      container.classList.toggle("vestora-pane-mode", !isFull);
      if (isFull) {
        document.body.style.overflow = "hidden";
      } else {
        document.body.style.overflow = "";
      }
    });

    // Close button
    const closeWidget = () => {
      container.style.opacity = "0";
      container.style.transform = "scale(0.96)";
      setTimeout(() => {
        container.remove();
        document.body.style.overflow = "";
      }, 200);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      window.removeEventListener("message", widgetMessageHandler);
      document.removeEventListener("keydown", escHandler);
    };

    const closeBtn = header.querySelector("#vestora-pane-close") as HTMLButtonElement | null;
    closeBtn?.addEventListener("click", closeWidget);

    // Listen for messages from inside iframe
    const widgetMessageHandler = (event: MessageEvent) => {
      if (event.data?.type === "VESTORA_CLOSE_TRYON") {
        closeWidget();
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
        closeWidget();
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
