/**
 * VESTORA Content Script
 * Scans product images, handles Shadow DOM & CSS backgrounds, overlays "✦ Try-On" buttons,
 * and manages the floating "AI fitting room" widget.
 */

(function () {
  "use strict";

  // Prevent multiple initializations in the same frame
  if (window.__vestoraInitialized) return;
  window.__vestoraInitialized = true;

  const WIDGET_URL = chrome.runtime.getURL("widget.html");
  const MAX_SHADOW_DEPTH = 6;
  const MIN_WIDTH = 180;
  const MIN_HEIGHT = 180;
  const MIN_ASPECT_RATIO = 0.72; // height / width (portrait-ish or square)
  const MAX_ASPECT_RATIO = 2.6;

  // Skip list for banners, logos, navigation, icons, ads
  // Uses word boundaries (\b) so colors like "navy" or brands are not falsely skipped
  const SKIP_PATTERNS = [
    /\bbanner\b/i,
    /\blogo\b/i,
    /\bbrand[-_]?logo\b/i,
    /\bicon\b/i,
    /\bavatar\b/i,
    /\bpayment\b/i,
    /\bbadge\b/i,
    /\badvert(?:isement)?\b/i,
    /\bfooter\b/i,
    /\bheader\b/i,
    /\bnav(?:igation)?\b/i, // Word-bounded so "navy" clothing is never skipped!
    /\brating\b/i,
    /\breview\b/i,
    /\bstar\b/i,
    /\bsprite\b/i,
    /\bfavicon\b/i,
    /\btrustpilot\b/i,
    /\bsocial\b/i,
    /\bpayment[-_]?methods?\b/i,
    /\barrow\b/i,
    /\bcart[-_]?icon\b/i
  ];

  // WeakSets for tracking processed elements
  const processedElements = new WeakSet();
  const knownShadowRoots = new Set();
  let widgetIframe = null;
  let widgetContainer = null;
  let fittingRoomPill = null;
  let pillThumb = null;
  let isWidgetOpen = false;

  // -------------------------------------------------------------
  // 1. Shadow DOM Traversal & Style Injection
  // -------------------------------------------------------------

  function collectShadowRoots(root = document, depth = 0) {
    if (depth > MAX_SHADOW_DEPTH || !root) return;
    try {
      const walker = document.createTreeWalker(
        root instanceof Document ? root.body || root.documentElement : root,
        NodeFilter.SHOW_ELEMENT,
        null
      );

      let node;
      while ((node = walker.nextNode())) {
        if (node.shadowRoot && !knownShadowRoots.has(node.shadowRoot)) {
          knownShadowRoots.add(node.shadowRoot);
          ensureShadowStyles(node.shadowRoot);
          attachMutationObserver(node.shadowRoot);
          collectShadowRoots(node.shadowRoot, depth + 1);
        }
      }
    } catch (e) {
      // Ignore cross-origin/restricted tree walkers
    }
  }

  function ensureShadowStyles(shadowRoot) {
    if (!shadowRoot || shadowRoot.querySelector("#vestora-shadow-style")) return;
    try {
      const style = document.createElement("style");
      style.id = "vestora-shadow-style";
      style.textContent = `
        .vestora-tryon-btn {
          position: absolute !important;
          top: 10px !important;
          left: 10px !important;
          z-index: 99999 !important;
          display: inline-flex !important;
          align-items: center !important;
          gap: 6px !important;
          padding: 6px 12px !important;
          border-radius: 9999px !important;
          background: rgba(15, 17, 23, 0.85) !important;
          backdrop-filter: blur(10px) !important;
          -webkit-backdrop-filter: blur(10px) !important;
          border: 1px solid rgba(255, 255, 255, 0.18) !important;
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.35), 0 0 12px rgba(139, 92, 246, 0.25) !important;
          color: #ffffff !important;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
          font-size: 11px !important;
          font-weight: 600 !important;
          cursor: pointer !important;
          user-select: none !important;
          transition: transform 0.2s ease, background 0.2s ease !important;
          pointer-events: auto !important;
        }
        .vestora-tryon-btn:hover {
          transform: scale(1.06) !important;
          background: rgba(22, 24, 35, 0.96) !important;
          border-color: rgba(167, 139, 250, 0.6) !important;
        }
        .vestora-btn-sparkle { color: #c084fc !important; font-size: 12px !important; }
      `;
      shadowRoot.appendChild(style);
    } catch (e) {}
  }

  // -------------------------------------------------------------
  // 2. Candidate Filtering & Garment Heuristics
  // -------------------------------------------------------------

  function extractBestImageUrl(el) {
    if (el.tagName === "IMG") {
      // 1. Amazon dynamic image JSON attribute (amazon.in, amazon.com)
      const dyn = el.getAttribute("data-a-dynamic-image");
      if (dyn) {
        try {
          const parsed = JSON.parse(dyn);
          const urls = Object.keys(parsed);
          if (urls.length > 0) {
            urls.sort((a, b) => (parsed[b][0] || 0) - (parsed[a][0] || 0));
            return urls[0];
          }
        } catch (e) {}
      }

      // 2. High-res zoom attributes across Flipkart, Myntra, Ajio, Shopify, WooCommerce
      const highRes = (
        el.getAttribute("data-old-hires") ||
        el.getAttribute("data-zoom-image") ||
        el.getAttribute("data-large-image") ||
        el.getAttribute("data-high-res-src") ||
        el.getAttribute("data-full-src") ||
        el.getAttribute("data-orig")
      );
      if (highRes && /^https?:\/\//i.test(highRes)) return highRes;

      // 3. Picture source check (Zara, H&M, Uniqlo, Mango)
      const picture = el.closest("picture");
      if (picture) {
        const sources = Array.from(picture.querySelectorAll("source[srcset]"));
        for (const srcEl of sources) {
          const ss = srcEl.getAttribute("srcset");
          if (ss) {
            const parts = ss.split(",").map(p => p.trim().split(" ")[0]);
            const candidate = parts[parts.length - 1];
            if (candidate && /^https?:\/\//i.test(candidate)) return candidate;
          }
        }
      }

      // 4. srcset attribute (highest resolution candidate)
      const srcset = el.getAttribute("srcset");
      if (srcset) {
        const parts = srcset.split(",").map(p => p.trim().split(" ")[0]);
        const candidate = parts[parts.length - 1];
        if (candidate && /^https?:\/\//i.test(candidate)) return candidate;
      }

      // 5. Direct and lazy attributes across all frameworks (Meesho, Tata CLiQ, Nykaa)
      const direct = (
        el.getAttribute("data-src") ||
        el.getAttribute("data-original") ||
        el.getAttribute("data-lazy-src") ||
        el.getAttribute("data-lazy") ||
        el.getAttribute("nitro-lazy-src") ||
        el.currentSrc ||
        el.src ||
        ""
      );

      // Flipkart resolution boost: upgrade low-res 128x128 thumbnails to 832x832 product view
      if (direct && direct.includes("rukminim1.flixcart.com/image/")) {
        return direct.replace(/\/image\/\d+\/\d+\//, "/image/832/832/");
      }

      return direct;
    }

    // CSS background-image
    const bg = window.getComputedStyle(el).backgroundImage;
    if (bg && bg.startsWith("url(")) {
      const match = bg.match(/url\(['"]?(.*?)['"]?\)/i);
      if (match && match[1]) return match[1];
    }
    return "";
  }

  function isSkipElement(el, src) {
    if (!src || src.startsWith("data:image/svg") || src.endsWith(".svg")) return true;

    // Check URL
    for (const pattern of SKIP_PATTERNS) {
      if (pattern.test(src)) return true;
    }

    // Check alt text, title, class, id
    const alt = el.getAttribute("alt") || "";
    const title = el.getAttribute("title") || "";
    const className = el.className || "";
    const id = el.id || "";
    const combined = `${alt} ${title} ${className} ${id}`.toLowerCase();

    for (const pattern of SKIP_PATTERNS) {
      if (pattern.test(combined)) return true;
    }

    // Avoid tiny banners inside footers or headers
    if (el.closest("header, footer, nav, [role='banner'], [role='navigation']")) {
      return true;
    }

    return false;
  }

  function isCandidateImage(el) {
    if (processedElements.has(el)) return false;

    const rect = el.getBoundingClientRect();
    const width = rect.width || el.naturalWidth || el.width;
    const height = rect.height || el.naturalHeight || el.height;

    if (width < MIN_WIDTH || height < MIN_HEIGHT) return false;

    // Aspect ratio check: height / width
    const aspectRatio = height / width;
    if (aspectRatio < MIN_ASPECT_RATIO || aspectRatio > MAX_ASPECT_RATIO) return false;

    const src = extractBestImageUrl(el);
    if (!src || isSkipElement(el, src)) return false;

    return true;
  }

  // -------------------------------------------------------------
  // 3. Button Placement Engine
  // -------------------------------------------------------------

  function getButtonAnchor(el) {
    // Return a stable container to attach the button to
    let parent = el.parentElement;
    if (!parent) return null;

    // If parent is too small or inline, go up one step
    const parentRect = parent.getBoundingClientRect();
    if (parentRect.width < MIN_WIDTH * 0.8 || parentRect.height < MIN_HEIGHT * 0.8) {
      if (parent.parentElement) parent = parent.parentElement;
    }

    return parent;
  }

  function attachTryOnButton(el) {
    if (processedElements.has(el)) return;
    processedElements.add(el);

    const anchor = getButtonAnchor(el);
    if (!anchor || anchor.querySelector(".vestora-tryon-btn")) return;

    // Ensure anchor has positioning context
    const computedPosition = window.getComputedStyle(anchor).position;
    if (computedPosition === "static") {
      anchor.style.position = "relative";
    }

    // Create the button
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "vestora-tryon-btn";
    btn.setAttribute("aria-label", "Try on this garment with VESTORA");
    btn.innerHTML = `<span class="vestora-btn-sparkle">✦</span> Try-On`;

    // Click handler
    btn.addEventListener("click", async (e) => {
      e.preventDefault();
      e.stopPropagation();

      const originalHtml = btn.innerHTML;
      btn.innerHTML = `<span class="vestora-btn-sparkle">✦</span> Loading…`;
      btn.classList.add("is-loading");

      try {
        const imageUrl = extractBestImageUrl(el);
        if (!imageUrl) {
          btn.innerHTML = originalHtml;
          btn.classList.remove("is-loading");
          return;
        }

        // Open widget fitting room if minimized
        openWidget();

        // Inform widget of the new loading garment
        postToWidget({
          type: "VESTORA_GARMENT_FETCHING",
          imageUrl
        });

        // Request background worker to fetch image data URL to avoid CORS
        chrome.runtime.sendMessage(
          { type: "VESTORA_FETCH_IMAGE", url: imageUrl },
          (response) => {
            btn.innerHTML = originalHtml;
            btn.classList.remove("is-loading");

            if (chrome.runtime.lastError || !response || !response.success) {
              console.warn("[VESTORA] Failed to fetch image via background:", response?.error);
              // Fallback to direct URL if background fetch failed
              sendGarmentToWidget(imageUrl, imageUrl, el);
            } else {
              sendGarmentToWidget(response.dataUrl, imageUrl, el);
            }
          }
        );
      } catch (err) {
        console.error("[VESTORA] Button click error:", err);
        btn.innerHTML = originalHtml;
        btn.classList.remove("is-loading");
      }
    });

    anchor.appendChild(btn);
  }

  function extractProductInfo(el) {
    let title = "";
    let category = "T-Shirt";
    let sizes = ["S", "M", "L", "XL"];

    try {
      // 1. Title from card / alt / h1 / meta
      const alt = el.getAttribute("alt") || "";
      const parentCard = el.closest(".product-base, .item, [data-testid*='product'], article, .pdp-details, .product-card, .product-detail, [class*='ProductCard'], [class*='productCard']") || el.parentElement;
      const heading = parentCard ? parentCard.querySelector("h1, h2, h3, .product-title, .product-brand, .product-name, [class*='title'], [class*='Title']") : null;
      title = heading ? heading.textContent.trim() : (alt || document.title.split(/[-|·]/)[0].trim());

      // 2. Category detection (includes Indian ethnic wear & global apparel)
      const textToScan = `${title} ${location.pathname}`.toLowerCase();
      if (/kurta|kurti/i.test(textToScan)) category = "Kurta";
      else if (/saree|sari/i.test(textToScan)) category = "Saree";
      else if (/sherwani|indo[- ]?western/i.test(textToScan)) category = "Sherwani";
      else if (/lehenga|anarkali/i.test(textToScan)) category = "Ethnic Wear";
      else if (/nehru[- ]?jacket|bandhgala/i.test(textToScan)) category = "Nehru Jacket";
      else if (/t[-\s]?shirt|tee\b/i.test(textToScan)) category = "T-Shirt";
      else if (/polo/i.test(textToScan)) category = "Polo";
      else if (/shirt/i.test(textToScan)) category = "Shirt";
      else if (/jacket|coat|blazer|windbreaker|bomber|puffer/i.test(textToScan)) category = "Jacket";
      else if (/hoodie|sweatshirt/i.test(textToScan)) category = "Hoodie";
      else if (/dress|gown|maxi|midi|jumpsuit/i.test(textToScan)) category = "Dress";
      else if (/top|blouse|tunic|camisole/i.test(textToScan)) category = "Top";
      else if (/sweater|knitwear|cardigan|pullover/i.test(textToScan)) category = "Sweater";
      else if (/jeans|denim|trousers|pants|chinos|joggers|shorts/i.test(textToScan)) category = "Bottoms";

      // 3. Scan available sizes (supports both Alpha sizes XS-3XL and Indian/UK/US Numbered sizes 28-48)
      const sizeElements = document.querySelectorAll(
        "button, [role='radio'], [data-size], [data-attr-value], " +
        "select[name*='size'] option, select[id*='size'] option, select[data-id*='size'] option, " +
        ".size-buttons-size-button, .size-variant-item, [class*='size-item'], [class*='SizePill'], " +
        "[class*='sizeButton'], .swatch-element, .picker-option, .size-selector__size-button, ._1fGeJ5, [class*='size'] button"
      );
      const foundSizes = new Set();
      sizeElements.forEach((btn) => {
        const text = (btn.textContent || btn.getAttribute("data-size") || btn.getAttribute("data-attr-value") || "").trim().toUpperCase();
        if (!text || text.includes("SELECT") || text.includes("CHART") || text.includes("GUIDE")) return;

        // Check for alpha tokens
        const alphaMatch = text.match(/\b(3XL|XXL|XL|XS|[SML])\b/);
        if (alphaMatch) {
          foundSizes.add(alphaMatch[1]);
        }

        // Check for numeric chest / waist tokens (28 - 48)
        const numMatches = text.match(/\b(28|30|32|34|36|38|39|40|42|44|46|48)\b/g);
        if (numMatches) {
          numMatches.forEach((n) => foundSizes.add(n));
        }
      });

      if (foundSizes.size >= 2) {
        const standardOrder = ["XS", "S", "M", "L", "XL", "XXL", "3XL", "28", "30", "32", "34", "36", "38", "39", "40", "42", "44", "46", "48"];
        sizes = standardOrder.filter((s) => foundSizes.has(s));
      }
    } catch (e) {}

    return { title, category, sizes };
  }

  function sendGarmentToWidget(dataUrl, originalUrl, el) {
    // Update pill thumbnail
    if (pillThumb) {
      pillThumb.src = dataUrl || originalUrl;
      pillThumb.classList.add("has-image");
    }

    const { title, category, sizes } = extractProductInfo(el || document.body);

    postToWidget({
      type: "VESTORA_SET_GARMENT",
      dataUrl: dataUrl || originalUrl,
      originalUrl,
      productTitle: title,
      category,
      availableSizes: sizes,
      pageTitle: document.title,
      pageUrl: location.href
    });
  }

  // -------------------------------------------------------------
  // 4. Universal E-Commerce Scanner (Indian & Global Platforms)
  // -------------------------------------------------------------

  function scanSiteSpecific() {
    const host = location.hostname.toLowerCase();

    // ── 1. Indian Fashion Retailers & Marketplaces ──
    // Myntra
    if (host.includes("myntra.com")) {
      const imgs = document.querySelectorAll(
        ".image-grid-image, .product-imageSliderContainer img, .pdp-image, .img-responsive, img[src*='myntassets.com']"
      );
      imgs.forEach((img) => { if (isCandidateImage(img)) attachTryOnButton(img); });
    }

    // Ajio & Ajio Luxe
    else if (host.includes("ajio.com")) {
      const imgs = document.querySelectorAll(
        ".imgHolder img, .rilrtl-lazy-img, .preview-image-container img, img[src*='assets.ajio.com']"
      );
      imgs.forEach((img) => { if (isCandidateImage(img)) attachTryOnButton(img); });
    }

    // Flipkart
    else if (host.includes("flipkart.com")) {
      const imgs = document.querySelectorAll(
        "._396cs4, ._2r_T1I, ._2E69ox, ._53G40d img, img[src*='rukminim']"
      );
      imgs.forEach((img) => { if (isCandidateImage(img)) attachTryOnButton(img); });
    }

    // Amazon (Amazon India amazon.in & Global amazon.com, amazon.co.uk, etc.)
    else if (host.includes("amazon.")) {
      const imgs = document.querySelectorAll(
        ".s-image, #landingImage, #imgTagWrapperId img, .a-dynamic-image, img[data-a-dynamic-image]"
      );
      imgs.forEach((img) => { if (isCandidateImage(img)) attachTryOnButton(img); });
    }

    // Meesho
    else if (host.includes("meesho.com")) {
      const imgs = document.querySelectorAll(
        "img[src*='images.meesho.com'], [class*='ProductCard__ProductImage'] img, [class*='Picture'] img"
      );
      imgs.forEach((img) => { if (isCandidateImage(img)) attachTryOnButton(img); });
    }

    // Tata CLiQ & Tata CLiQ Luxury
    else if (host.includes("tatacliq.com")) {
      const imgs = document.querySelectorAll(
        ".ProductModule__baseImage, .Image__actualImage, .ImageGallery__image, img[src*='tatacliq.com']"
      );
      imgs.forEach((img) => { if (isCandidateImage(img)) attachTryOnButton(img); });
    }

    // Nykaa & Nykaa Fashion
    else if (host.includes("nykaa")) {
      const imgs = document.querySelectorAll(
        ".product-card img, [data-test-id*='product-img'], .css-11v499w img, img[src*='adn-static1.nykaa.com']"
      );
      imgs.forEach((img) => { if (isCandidateImage(img)) attachTryOnButton(img); });
    }

    // Indian Department Stores (Shoppers Stop, Lifestyle, Pantaloons, Max Fashion)
    else if (host.includes("shoppersstop.com") || host.includes("lifestylestores.com") || host.includes("pantaloons.com") || host.includes("maxfashion.in")) {
      const imgs = document.querySelectorAll(
        ".pro-image, .product-image img, .image-container img, .item-image img, .img-responsive, [class*='productImage'] img"
      );
      imgs.forEach((img) => { if (isCandidateImage(img)) attachTryOnButton(img); });
    }

    // Indian D2C Fashion & Ethnic Brands (Bewakoof, Souled Store, Snitch, Beyoung, Fabindia, Westside, Manyavar, Biba, W for Woman, Libas, Aurelia, Mufti, Rare Rabbit, Monte Carlo, NNNOW)
    else if (
      host.includes("bewakoof.com") || host.includes("thesouledstore.com") || host.includes("snitch.co.in") ||
      host.includes("beyoung.in") || host.includes("fabindia.com") || host.includes("westside.com") ||
      host.includes("manyavar.com") || host.includes("biba.in") || host.includes("wforwoman.com") ||
      host.includes("libas.in") || host.includes("shopforaurelia.com") || host.includes("muftijeans.in") ||
      host.includes("thehouseofrare.com") || host.includes("montecarlo.in") || host.includes("nnnow.com") ||
      host.includes("abfrl.in") || host.includes("allensolly.com") || host.includes("peterengland.com") ||
      host.includes("louisphilippe.com") || host.includes("vanheusenindia.com")
    ) {
      const imgs = document.querySelectorAll(
        ".productImgTag, #testProductImg, .product-image img, .zoom-image, .product-card__image, .product__media img, .product-item-photo img, .productPhoto img, [class*='ProductImage'] img, [class*='product-card'] img"
      );
      imgs.forEach((img) => { if (isCandidateImage(img)) attachTryOnButton(img); });
    }

    // ── 2. Global & International Fashion Brands ──
    // Zara & Inditex Group (Zara, Bershka, Pull&Bear, Stradivarius, Massimo Dutti)
    else if (host.includes("zara.com") || host.includes("bershka.com") || host.includes("pullandbear.com") || host.includes("stradivarius.com") || host.includes("massimodutti.com")) {
      const imgs = document.querySelectorAll(
        ".media-image__image, .media__wrapper img, .product-grid-product__figure img, picture.media-image img, .product-media img, .image-item img"
      );
      imgs.forEach((img) => { if (isCandidateImage(img)) attachTryOnButton(img); });
    }

    // H&M Group (H&M, COS, & Other Stories, Arket)
    else if (host.includes("hm.com") || host.includes("cos.com") || host.includes("stories.com") || host.includes("arket.com")) {
      const imgs = document.querySelectorAll(
        ".product-item-image, .item-image img, img.item-image, .pdp-image, img[src*='lp2.hm.com'], .product-image img"
      );
      imgs.forEach((img) => { if (isCandidateImage(img)) attachTryOnButton(img); });
    }

    // Uniqlo
    else if (host.includes("uniqlo.com")) {
      const imgs = document.querySelectorAll(
        ".image-slider img, .fr-ec-image, [data-test*='product-image'], img[src*='image.uniqlo.com']"
      );
      imgs.forEach((img) => { if (isCandidateImage(img)) attachTryOnButton(img); });
    }

    // ASOS
    else if (host.includes("asos.com")) {
      const imgs = document.querySelectorAll(
        "img[data-testid='productImage'], img[data-testid='gallery-image'], .gallery-image"
      );
      imgs.forEach((img) => { if (isCandidateImage(img)) attachTryOnButton(img); });
    }

    // Nike
    else if (host.includes("nike.com")) {
      const imgs = document.querySelectorAll(
        ".product-card__hero-image, img.css-117yvqw, .pdp_image, [data-testid*='wall-image']"
      );
      imgs.forEach((img) => { if (isCandidateImage(img)) attachTryOnButton(img); });
    }

    // Adidas
    else if (host.includes("adidas.")) {
      const imgs = document.querySelectorAll(
        ".gl-product-card__image, img.pdp-image, .gl-image, img[src*='assets.adidas.com']"
      );
      imgs.forEach((img) => { if (isCandidateImage(img)) attachTryOnButton(img); });
    }

    // Puma
    else if (host.includes("puma.com")) {
      const imgs = document.querySelectorAll(
        "img[data-test-id*='product-image'], .product-tile-image, img[src*='images.puma.com']"
      );
      imgs.forEach((img) => { if (isCandidateImage(img)) attachTryOnButton(img); });
    }

    // Global Luxury & Fast Fashion (Mango, Shein, Farfetch, SSENSE, Revolve, Net-A-Porter, Mr Porter, Nordstrom, Urban Outfitters, Gap, Old Navy, Banana Republic, Levi's, Ralph Lauren, Tommy Hilfiger, Calvin Klein, Lululemon, Under Armour, Hollister, Abercrombie, American Eagle, Boohoo)
    else if (
      host.includes("mango.com") || host.includes("shein.com") || host.includes("farfetch.com") ||
      host.includes("ssense.com") || host.includes("revolve.com") || host.includes("net-a-porter.com") ||
      host.includes("mrporter.com") || host.includes("nordstrom.com") || host.includes("urbanoutfitters.com") ||
      host.includes("anthropologie.com") || host.includes("freepeople.com") || host.includes("gap.com") ||
      host.includes("levi.com") || host.includes("levi.in") || host.includes("ralphlauren.com") ||
      host.includes("tommy.com") || host.includes("calvinklein.com") || host.includes("lululemon.com") ||
      host.includes("underarmour.com") || host.includes("hollisterco.com") || host.includes("abercrombie.com") ||
      host.includes("ae.com") || host.includes("boohoo.com") || host.includes("prettylittlething.com") ||
      host.includes("forever21.com")
    ) {
      const imgs = document.querySelectorAll(
        "img[class*='product-image'], img[class*='look-image'], .product-card__image, [data-testid='product-card-image'], img[data-test='product-image'], .image-container img, [class*='ProductCard'] img, .product-media img"
      );
      imgs.forEach((img) => { if (isCandidateImage(img)) attachTryOnButton(img); });
    }

    // ── 3. Universal Global E-Commerce Frameworks (Shopify, WooCommerce, SFCC, Magento, BigCommerce, Wix, Squarespace, Headless) ──
    const platformImgs = document.querySelectorAll(
      "img[src*='cdn.shopify.com'], .product__media img, .product-card__image, [data-product-media-type='image'] img, " +
      ".woocommerce-product-gallery__image img, .wp-post-image, .attachment-shop_catalog, " +
      "img[src*='demandware.net'], img[src*='demandware.static'], .primary-image, .tile-image, " +
      "img.product-image-photo, .fotorama__img, .card-image, .productView-image, [data-hook='product-image'] img, " +
      ".ProductItem-gallery-slides-item-image, img[srcset*='_next/image'], [data-nimg]"
    );
    platformImgs.forEach((img) => {
      if (isCandidateImage(img)) attachTryOnButton(img);
    });
  }

  // -------------------------------------------------------------
  // 5. General DOM Scanner & Observers
  // -------------------------------------------------------------

  const intersectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const target = entry.target;
          intersectionObserver.unobserve(target);
          if (isCandidateImage(target)) {
            attachTryOnButton(target);
          }
        }
      });
    },
    { rootMargin: "350px 0px" }
  );

  function scanDOM(root = document) {
    // Run site-specific check first
    scanSiteSpecific();

    // Scan regular images
    const images = (root.querySelectorAll ? root.querySelectorAll("img") : []);
    images.forEach((img) => {
      if (processedElements.has(img)) return;

      if (img.complete && img.naturalWidth > 0) {
        intersectionObserver.observe(img);
      } else {
        img.addEventListener("load", () => {
          if (isCandidateImage(img)) attachTryOnButton(img);
        }, { once: true });
        intersectionObserver.observe(img);
      }
    });

    // Scan CSS background image containers
    const bgCandidates = (root.querySelectorAll ? root.querySelectorAll("[style*='background-image'], [role='img'], .product-image, .product-card") : []);
    bgCandidates.forEach((el) => {
      if (el.tagName !== "IMG" && !processedElements.has(el)) {
        if (isCandidateImage(el)) {
          intersectionObserver.observe(el);
        }
      }
    });

    // Check open shadow roots
    collectShadowRoots(root);
    knownShadowRoots.forEach((shadowRoot) => {
      const shadowImgs = shadowRoot.querySelectorAll("img");
      shadowImgs.forEach((img) => {
        if (!processedElements.has(img) && isCandidateImage(img)) {
          attachTryOnButton(img);
        }
      });
    });
  }

  function attachMutationObserver(target) {
    let scheduled = false;
    const observer = new MutationObserver(() => {
      if (!scheduled) {
        scheduled = true;
        requestAnimationFrame(() => {
          scanDOM(target);
          scheduled = false;
        });
      }
    });
    observer.observe(target, { childList: true, subtree: true });
  }

  // -------------------------------------------------------------
  // 6. Floating Widget & "AI Fitting Room" Pill
  // -------------------------------------------------------------

  function injectFittingRoomWidget() {
    if (document.getElementById("vestora-root")) return;

    const root = document.createElement("div");
    root.id = "vestora-root";

    // 1. Iframe Container
    widgetContainer = document.createElement("div");
    widgetContainer.id = "vestora-iframe-container";
    widgetContainer.className = "is-minimized"; // Start minimized

    widgetIframe = document.createElement("iframe");
    widgetIframe.id = "vestora-widget-iframe";
    widgetIframe.src = WIDGET_URL;
    widgetIframe.allow = "camera; microphone; display-capture; autoplay";
    widgetIframe.title = "VESTORA Live AI Fitting Room";

    widgetContainer.appendChild(widgetIframe);

    // 2. Floating Pill Handle
    fittingRoomPill = document.createElement("button");
    fittingRoomPill.type = "button";
    fittingRoomPill.id = "vestora-pill";
    fittingRoomPill.setAttribute("aria-label", "Toggle VESTORA AI Fitting Room");

    pillThumb = document.createElement("img");
    pillThumb.id = "vestora-pill-thumb";
    pillThumb.alt = "Garment";

    const pillLogo = document.createElement("img");
    pillLogo.id = "vestora-pill-logo";
    pillLogo.src = chrome.runtime.getURL("icons/icon32.png");
    pillLogo.alt = "VESTORA";

    const dot = document.createElement("span");
    dot.id = "vestora-pill-dot";

    const label = document.createElement("span");
    label.textContent = "AI Fitting Room";

    fittingRoomPill.appendChild(pillThumb);
    fittingRoomPill.appendChild(pillLogo);
    fittingRoomPill.appendChild(dot);
    fittingRoomPill.appendChild(label);

    fittingRoomPill.addEventListener("click", () => {
      toggleWidget();
    });

    root.appendChild(widgetContainer);
    root.appendChild(fittingRoomPill);
    document.body.appendChild(root);

    // Listen for messages from inside widget iframe
    window.addEventListener("message", handleWidgetMessage);

    // Listen for popup messages to open fitting room
    try {
      chrome.runtime.onMessage.addListener((msg) => {
        if (msg && msg.type === "VESTORA_OPEN_FITTING_ROOM") {
          openWidget();
        }
      });
    } catch (e) {}
  }

  function openWidget() {
    if (!widgetContainer) return;
    widgetContainer.classList.remove("is-minimized");
    isWidgetOpen = true;
    postToWidget({ type: "VESTORA_WIDGET_SHOWN" });
  }

  function closeWidget() {
    if (!widgetContainer) return;
    widgetContainer.classList.add("is-minimized");
    isWidgetOpen = false;
    postToWidget({ type: "VESTORA_WIDGET_MINIMIZED" });
  }

  function toggleWidget() {
    if (isWidgetOpen) {
      closeWidget();
    } else {
      openWidget();
    }
  }

  function postToWidget(msg) {
    if (widgetIframe && widgetIframe.contentWindow) {
      widgetIframe.contentWindow.postMessage(msg, "*");
    }
  }

  function handleWidgetMessage(event) {
    const data = event.data;
    if (!data || typeof data !== "object") return;

    if (data.type === "VESTORA_MINIMIZE_REQUEST") {
      closeWidget();
    } else if (data.type === "VESTORA_EXPAND_REQUEST") {
      openWidget();
    } else if (data.type === "VESTORA_ACTIVE_GARMENT_UPDATE") {
      if (pillThumb && data.imageUrl) {
        pillThumb.src = data.imageUrl;
        pillThumb.classList.add("has-image");
      }
    }
  }

  // -------------------------------------------------------------
  // 7. Initialization
  // -------------------------------------------------------------

  function init() {
    injectFittingRoomWidget();
    scanDOM(document);
    attachMutationObserver(document.body || document.documentElement);

    // Periodic sweep for lazy loaded images
    setInterval(() => {
      scanDOM(document);
    }, 2500);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
