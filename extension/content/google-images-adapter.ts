/**
 * VESTORA — Google Images Adapter
 * 
 * Enables direct live virtual try-on from Google Images:
 * 1. Detects Google Images search pages (tbm=isch, udm=2, /imghp, or any Google search with image results).
 * 2. Scans image result thumbnails and expanded detail preview panels.
 * 3. Extracts original uncompressed image URLs from Google redirect/preview attributes (imgurl=).
 * 4. Injects high-visibility "✦ Try with VESTORA" buttons onto Google Image cards and preview drawer.
 * 5. Passes selected garments and accessories seamlessly into the live camera try-on.
 */

import type { Product } from "../../shared/types/index.js";
import { classifyFashionAndGarment } from "./generic-product-detector.js";

const processedCards = new WeakSet<HTMLElement>();

export function isGoogleImagesPage(loc: Location = location): boolean {
  const host = loc.hostname.toLowerCase();
  const path = loc.pathname.toLowerCase();
  const search = loc.search.toLowerCase();

  const isGoogle = host.includes("google.");
  if (!isGoogle) return false;

  // 1. Explicit search parameters or image paths
  if (
    host.startsWith("images.google.") ||
    search.includes("tbm=isch") ||
    search.includes("udm=2") ||
    path.startsWith("/imghp") ||
    path.startsWith("/images")
  ) {
    return true;
  }

  // 2. Query or DOM indicators on google.com/search (handles dynamic tab navigation)
  if (path === "/search" || path === "/" || path === "/webhp") {
    if (typeof document !== "undefined") {
      const hasImageIndicators = !!document.querySelector(
        "a[href*='/imgres'], a[href*='imgurl='], div[data-ri], #islrg, #islsp, div[jsname='r5xlne'], div.isv-r, img.YQ4gaf, img.rg_i"
      );
      if (hasImageIndicators) return true;
    }
  }

  return false;
}

/**
 * Extracts raw high-resolution image URL from Google redirect/preview strings.
 * E.g., /imgres?imgurl=https%3A%2F%2Fstore.com%2Fjacket.jpg -> https://store.com/jacket.jpg
 */
export function extractGoogleHighResImageUrl(imgEl: HTMLElement): string {
  // 1. Direct href on parent anchor containing imgurl parameter
  const anchor = (imgEl.tagName === "A" ? imgEl : imgEl.closest("a[href*='imgurl='], a[href*='/imgres']")) as HTMLAnchorElement | null;
  if (anchor && anchor.href) {
    try {
      const parsedUrl = new URL(anchor.href, location.origin);
      const rawImgUrl = parsedUrl.searchParams.get("imgurl");
      if (rawImgUrl && /^https?:\/\//i.test(rawImgUrl)) {
        return rawImgUrl;
      }
    } catch {}
    const match = anchor.href.match(/[?&]imgurl=([^&]+)/i);
    if (match && match[1]) {
      try {
        const decoded = decodeURIComponent(match[1]);
        if (/^https?:\/\//i.test(decoded)) return decoded;
      } catch {}
    }
  }

  // 2. Expanded preview element attributes in Google side panel
  const img = (imgEl.tagName === "IMG" ? imgEl : imgEl.querySelector("img")) as HTMLImageElement | null;
  if (img) {
    const fullSrc =
      img.getAttribute("data-src") ||
      img.getAttribute("data-deferred") ||
      img.currentSrc ||
      img.src ||
      "";

    if (fullSrc.startsWith("data:") || fullSrc.length < 50) {
      const container = img.closest("#islsp, div[jsname='figiqf'], div.v6bBac, div[data-ri]");
      if (container) {
        const candidateImg = container.querySelector<HTMLImageElement>("img[src^='http']:not([src*='google.com/favicon'])");
        if (candidateImg && candidateImg.src && !candidateImg.src.includes("encrypted-tbn")) {
          return candidateImg.src;
        }
      }
    }

    if (fullSrc && /^https?:\/\//i.test(fullSrc)) {
      return fullSrc;
    }
  }

  return "";
}

/**
 * Extracts product metadata from Google Images card or preview drawer.
 */
export function extractProductFromGoogleCard(targetEl: HTMLElement, imageUrl: string): Product {
  const container = targetEl.closest("a[href*='/imgres'], a[href*='imgurl='], div[data-ri], div.isv-r, div[jsname='dTDiAc'], #islsp, div[jsname='figiqf']") || targetEl.parentElement;

  // 1. Extract item title from anchor title, heading, or alt text
  let name = "";
  const titleEl = container?.querySelector("h3, a[title], [data-lpage] h2, [data-lpage] h3, div.zbN8od, div.mNsIgd");
  if (titleEl) {
    name = titleEl.textContent?.trim() || titleEl.getAttribute("title") || "";
  }

  if (!name && targetEl.tagName === "IMG") {
    name = targetEl.getAttribute("alt") || "";
  }

  if (!name && container) {
    const imgInside = container.querySelector("img");
    if (imgInside) name = imgInside.getAttribute("alt") || "";
  }

  // Fallback to Google search query
  if (!name || name.length < 3) {
    const params = new URLSearchParams(location.search);
    const query = params.get("q") || "";
    if (query) {
      name = query.replace(/[+]/g, " ").trim();
    } else {
      name = "Fashion Item";
    }
  }

  // 2. Extract source brand/domain
  let brand = "Web";
  const domainEl = container?.querySelector("div.NJbYFc, span.yNF4af, span.fA3vx, div.mNsIgd");
  if (domainEl && domainEl.textContent) {
    brand = domainEl.textContent.trim();
  }

  // 3. Classify garment or accessory
  const classification = classifyFashionAndGarment(name, "", location.search);

  return {
    id: `gimg_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    name,
    brand,
    imageUrl,
    productUrl: location.href,
    pageUrl: location.href,
    category: classification.garmentType,
    garmentCategory: classification.category,
    isFashion: true,
    availableSizes: ["XS", "S", "M", "L", "XL", "XXL"],
    confidence: classification.confidence || 0.92,
    detectionSource: "dom-heuristic",
  };
}

/**
 * Attaches a prominent "✦ Try with VESTORA" button on a Google Images result card.
 */
function attachGoogleTryOnButton(
  container: HTMLElement,
  imageUrl: string,
  onTryClick: (product: Product) => void,
  imgElement?: HTMLElement | null
): void {
  if (processedCards.has(container)) return;
  if (container.querySelector(".vestora-tryon-btn, .vestora-google-tryon-pill")) return;
  processedCards.add(container);

  // Ensure positioning context on the card container
  const computedPos = window.getComputedStyle(container).position;
  if (computedPos === "static") {
    container.style.position = "relative";
  }

  // Create high-visibility VESTORA pill button
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "vestora-tryon-btn vestora-google-tryon-pill";
  btn.setAttribute("aria-label", "Try with VESTORA");
  btn.innerHTML = `<span class="vestora-btn-sparkle">✦</span> Try with VESTORA`;

  btn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();

    const targetEl = imgElement || container;
    const product = extractProductFromGoogleCard(targetEl, imageUrl);

    btn.classList.add("is-active");
    setTimeout(() => btn.classList.remove("is-active"), 1200);

    onTryClick(product);
  });

  btn.addEventListener("touchstart", (e) => {
    e.stopPropagation();
  }, { passive: true });

  container.appendChild(btn);
}

/**
 * Scans Google Images DOM and attaches VESTORA try-on buttons on candidate items.
 */
export function initGoogleImagesScanner(onTryClick: (product: Product) => void): void {
  function scanGoogleResults() {
    // 1. Expanded detail preview panel in Google Images (#islsp)
    const previewImages = Array.from(
      document.querySelectorAll<HTMLImageElement>(
        "#islsp img.n3VNCb, #islsp img.sFlh5c, #islsp img.pT0Scc, div.v6bBac img, img[jsname='HiaYvf'], div[jsname='figiqf'] img"
      )
    );

    previewImages.forEach((img) => {
      const src = extractGoogleHighResImageUrl(img) || img.currentSrc || img.src;
      if (src && !src.startsWith("data:image/svg") && src.length > 20) {
        const parentAnchor = (img.closest("#islsp, div[jsname='figiqf'], div.v6bBac") as HTMLElement) || img.parentElement;
        if (parentAnchor) attachGoogleTryOnButton(parentAnchor, src, onTryClick, img);
      }
    });

    // 2. All Google Image search result cards via their anchors
    // Every image result on Google Images is wrapped in or contains an anchor with /imgres or imgurl=
    const imageAnchors = Array.from(
      document.querySelectorAll<HTMLElement>(
        "a[href*='/imgres'], a[href*='imgurl='], div[data-ri], div.isv-r, div.eA0Zlc, div.foyFie, div.mNsIgd"
      )
    );

    imageAnchors.forEach((cardEl) => {
      const img = cardEl.querySelector<HTMLImageElement>("img") || (cardEl.tagName === "IMG" ? (cardEl as unknown as HTMLImageElement) : null);
      if (!img) return;

      const src = extractGoogleHighResImageUrl(cardEl) || extractGoogleHighResImageUrl(img) || img.currentSrc || img.src;
      if (src && !src.startsWith("data:image/svg") && src.length > 20) {
        attachGoogleTryOnButton(cardEl, src, onTryClick, img);
      }
    });

    // 3. Fallback: Any search result thumbnail images
    const genericGoogleImages = Array.from(
      document.querySelectorAll<HTMLImageElement>("img.YQ4gaf, img.rg_i, img.Q4LuSd")
    );
    genericGoogleImages.forEach((img) => {
      const cardContainer = (img.closest<HTMLElement>("a[href*='/imgres'], a[href*='imgurl='], div[data-ri], div.isv-r") as HTMLElement) || img.parentElement;
      if (!cardContainer) return;
      const src = extractGoogleHighResImageUrl(img) || img.currentSrc || img.src;
      if (src && !src.startsWith("data:image/svg") && src.length > 20) {
        attachGoogleTryOnButton(cardContainer, src, onTryClick, img);
      }
    });
  }

  scanGoogleResults();

  // Observer for infinite scrolling Google Image grid and opening detail preview panel
  const observer = new MutationObserver(() => {
    scanGoogleResults();
  });

  observer.observe(document.body, { childList: true, subtree: true });

  // Periodically re-scan for dynamic Google SPA updates
  setInterval(scanGoogleResults, 1200);
}
