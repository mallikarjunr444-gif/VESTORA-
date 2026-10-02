/**
 * VESTORA — Google Images Adapter
 * 
 * Enables direct live virtual try-on from Google Images:
 * 1. Detects Google Images search pages (tbm=isch, udm=2, /imghp).
 * 2. Scans image result thumbnails and expanded detail preview panels.
 * 3. Extracts original uncompressed image URLs from Google redirect/preview attributes.
 * 4. Injects "✦ Try with VESTORA" buttons onto Google Image cards and preview drawer.
 * 5. Passes selected garments and accessories seamlessly into the live camera try-on.
 */

import type { Product } from "../../shared/types/index.js";
import { classifyFashionAndGarment } from "./generic-product-detector.js";
import { attachTryOnButton } from "./tryon-button.js";

export function isGoogleImagesPage(loc: Location = location): boolean {
  const host = loc.hostname.toLowerCase();
  const path = loc.pathname.toLowerCase();
  const search = loc.search.toLowerCase();

  const isGoogle = host.includes("google.");
  if (!isGoogle) return false;

  return (
    host.startsWith("images.google.") ||
    search.includes("tbm=isch") ||
    search.includes("udm=2") ||
    path.startsWith("/imghp") ||
    path.startsWith("/images") ||
    (path === "/search" && (search.includes("tbm=isch") || search.includes("udm=2")))
  );
}

/**
 * Extracts raw high-resolution image URL from Google redirect/preview strings.
 * E.g., /imgres?imgurl=https%3A%2F%2Fstore.com%2Fjacket.jpg -> https://store.com/jacket.jpg
 */
export function extractGoogleHighResImageUrl(imgEl: HTMLElement): string {
  // 1. Direct href on parent anchor containing imgurl parameter
  const anchor = imgEl.closest("a[href*='imgurl=']") as HTMLAnchorElement | null;
  if (anchor && anchor.href) {
    try {
      const parsedUrl = new URL(anchor.href);
      const rawImgUrl = parsedUrl.searchParams.get("imgurl");
      if (rawImgUrl && /^https?:\/\//i.test(rawImgUrl)) {
        return rawImgUrl;
      }
    } catch {}
  }

  // 2. Expanded preview element attributes in Google side panel
  if (imgEl.tagName === "IMG") {
    const img = imgEl as HTMLImageElement;

    // Check for high-res preview attributes in Google Images side panel
    const fullSrc =
      img.getAttribute("data-src") ||
      img.getAttribute("data-deferred") ||
      img.getAttribute("src") ||
      "";

    // Skip small base64 data URLs if an external HTTP URL exists in siblings
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
  const container = targetEl.closest("div[data-ri], div.isv-r, div[jsname='dTDiAc'], #islsp, div[jsname='figiqf']") || targetEl.parentElement;

  // 1. Extract item title from anchor title, heading, or alt text
  let name = "";
  const titleEl = container?.querySelector("h3, a[title], [data-lpage] h2, [data-lpage] h3, div.zbN8od, div.mNsIgd");
  if (titleEl) {
    name = titleEl.textContent?.trim() || titleEl.getAttribute("title") || "";
  }

  if (!name && targetEl.tagName === "IMG") {
    name = targetEl.getAttribute("alt") || "";
  }

  // Fallback to Google search query
  if (!name || name.length < 3) {
    const params = new URLSearchParams(location.search);
    const query = params.get("q") || "";
    if (query) {
      name = query.replace(/[+]/g, " ").trim();
    } else {
      name = "Google Fashion Item";
    }
  }

  // 2. Extract source brand/domain
  let brand = "Web";
  const domainEl = container?.querySelector("div.NJbYFc, span.yNF4af, span.fA3vx");
  if (domainEl && domainEl.textContent) {
    brand = domainEl.textContent.trim();
  }

  // 3. Classify garment or accessory
  const classification = classifyFashionAndGarment(name, "", location.search);

  return {
    id: `gimg_${Date.now()}`,
    name,
    brand,
    imageUrl,
    productUrl: location.href,
    pageUrl: location.href,
    category: classification.garmentType,
    isFashion: classification.isFashion,
    availableSizes: ["XS", "S", "M", "L", "XL", "XXL"],
    confidence: classification.confidence,
    detectionSource: "dom-heuristic",
  };
}

/**
 * Scans Google Images DOM and attaches VESTORA try-on buttons on candidate items.
 */
export function initGoogleImagesScanner(onTryClick: (product: Product) => void): void {
  if (!isGoogleImagesPage()) return;

  function scanGoogleResults() {
    // 1. Expanded detail preview panel in Google Images (#islsp)
    const previewImages = Array.from(
      document.querySelectorAll<HTMLImageElement>(
        "#islsp img.n3VNCb, #islsp img.sFlh5c, #islsp img.pT0Scc, div.v6bBac img, img[jsname='HiaYvf']"
      )
    );

    previewImages.forEach((img) => {
      const src = extractGoogleHighResImageUrl(img) || img.src;
      if (src && !src.startsWith("data:") && src.length > 20) {
        attachTryOnButton(img, (product) => {
          const refined = extractProductFromGoogleCard(img, src);
          onTryClick({ ...product, ...refined, imageUrl: src });
        });
      }
    });

    // 2. Standard image grid result cards
    const gridCards = Array.from(
      document.querySelectorAll<HTMLElement>(
        "div[data-ri] img, div.isv-r img, div[jsname='dTDiAc'] img, div.eA0Zlc img"
      )
    );

    gridCards.forEach((img) => {
      const w = img.clientWidth || (img as HTMLImageElement).naturalWidth || 0;
      const h = img.clientHeight || (img as HTMLImageElement).naturalHeight || 0;
      if (w < 100 || h < 100) return;

      const src = extractGoogleHighResImageUrl(img) || (img as HTMLImageElement).src;
      if (src && !src.startsWith("data:")) {
        attachTryOnButton(img, (product) => {
          const refined = extractProductFromGoogleCard(img, src);
          onTryClick({ ...product, ...refined, imageUrl: src });
        });
      }
    });
  }

  scanGoogleResults();

  // Observer for infinite scrolling Google Image grid and opening detail preview panel
  const observer = new MutationObserver(() => {
    scanGoogleResults();
  });

  observer.observe(document.body, { childList: true, subtree: true });
}
