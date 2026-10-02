/**
 * VESTORA — Page Adapter
 * Extracts high-resolution product imagery and filters out non-garment assets (PRD Section 11 & 27).
 */

const MIN_WIDTH = 180;
const MIN_HEIGHT = 180;
const MIN_ASPECT_RATIO = 0.70;
const MAX_ASPECT_RATIO = 2.60;

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
  /\bnav(?:igation)?\b/i,
  /\brating\b/i,
  /\breview\b/i,
  /\bstar\b/i,
  /\bsprite\b/i,
  /\bfavicon\b/i,
  /\btrustpilot\b/i,
  /\bsocial\b/i,
  /\bcart[-_]?icon\b/i,
];

export function extractBestImageUrl(el: HTMLElement): string {
  if (el.tagName === "IMG") {
    const img = el as HTMLImageElement;

    // 1. Amazon dynamic image JSON attribute
    const dyn = img.getAttribute("data-a-dynamic-image");
    if (dyn) {
      try {
        const parsed = JSON.parse(dyn) as Record<string, [number, number]>;
        const urls = Object.keys(parsed);
        if (urls.length > 0) {
          urls.sort((a, b) => (parsed[b][0] || 0) - (parsed[a][0] || 0));
          return urls[0];
        }
      } catch {
        // Fall through
      }
    }

    // 2. High-res zoom attributes across fashion platforms
    const highRes =
      img.getAttribute("data-old-hires") ||
      img.getAttribute("data-zoom-image") ||
      img.getAttribute("data-large-image") ||
      img.getAttribute("data-high-res-src") ||
      img.getAttribute("data-full-src");
    if (highRes && /^https?:\/\//i.test(highRes)) return highRes;

    // 3. Picture source element check
    const picture = img.closest("picture");
    if (picture) {
      const sources = Array.from(picture.querySelectorAll("source[srcset]"));
      for (const srcEl of sources) {
        const ss = srcEl.getAttribute("srcset");
        if (ss) {
          const parts = ss.split(",").map((p) => p.trim().split(" ")[0]);
          const candidate = parts[parts.length - 1];
          if (candidate && /^https?:\/\//i.test(candidate)) return candidate;
        }
      }
    }

    // 4. srcset attribute (highest resolution candidate)
    const srcset = img.getAttribute("srcset");
    if (srcset) {
      const parts = srcset.split(",").map((p) => p.trim().split(" ")[0]);
      const candidate = parts[parts.length - 1];
      if (candidate && /^https?:\/\//i.test(candidate)) return candidate;
    }

    // 5. Direct and lazy-loaded attributes
    const direct =
      img.getAttribute("data-src") ||
      img.getAttribute("data-original") ||
      img.getAttribute("data-lazy-src") ||
      img.currentSrc ||
      img.src ||
      "";

    // Apply resolution upgrade
    return upgradeImageUrl(direct);
  }

  // CSS background image (Myntra, Zara, luxury portals)
  const bg = el.style.backgroundImage || window.getComputedStyle(el).backgroundImage;
  if (bg && bg.startsWith("url(")) {
    const match = bg.match(/url\(['"]?(.*?)['"]?\)/i);
    if (match && match[1]) return upgradeImageUrl(match[1]);
  }

  // Look for nested background image container (e.g. Myntra .image-grid-col > .image-grid-image)
  const nestedBgEl = el.querySelector<HTMLElement>("[style*='background-image'], .image-grid-image");
  if (nestedBgEl) {
    const nBg = nestedBgEl.style?.backgroundImage || window.getComputedStyle(nestedBgEl).backgroundImage;
    if (nBg && nBg.startsWith("url(")) {
      const match = nBg.match(/url\(['"]?(.*?)['"]?\)/i);
      if (match && match[1]) return upgradeImageUrl(match[1]);
    }
  }

  // Look for nested img inside wrapper
  const nestedImg = el.querySelector("img");
  if (nestedImg) {
    return extractBestImageUrl(nestedImg);
  }

  return "";
}

export function upgradeImageUrl(url: string): string {
  if (!url) return "";

  // 1. Myntra resolution upgrade (assets.myntassets.com)
  if (url.includes("assets.myntassets.com")) {
    return url
      .replace(/\/f_webp,[^/]+\//, "/h_1440,q_95,w_1080/")
      .replace(/\/h_\d+,q_\d+,w_\d+\//, "/h_1440,q_95,w_1080/")
      .replace(/\/w_\d+,c_limit,fl_progressive\//, "/h_1440,q_95,w_1080/");
  }

  // 2. Flipkart resolution upgrade (flixcart.com)
  if (url.includes("flixcart.com/image/")) {
    return url.replace(/\/image\/\d+\/\d+\//, "/image/832/832/");
  }

  // 3. Amazon resolution upgrade (media-amazon.com / images-amazon.com)
  if (url.includes("media-amazon.com") || url.includes("images-amazon.com")) {
    return url.replace(/\._[A-Z0-9_,]+_\./, "._AC_SL1500_.");
  }

  // 4. Zara / Inditex brands (Massimo Dutti, Pull&Bear, Bershka, Stradivarius)
  if (url.includes("static.zara.net") || url.includes("itxweb.com")) {
    return url.replace(/\/w\/\d+\//, "/w/1024/");
  }

  // 5. SHEIN / Romwe (ltwebstatic.com)
  if (url.includes("ltwebstatic.com")) {
    return url
      .replace(/_thumbnail_\d+x\d+/, "")
      .replace(/_\d+x\d+\.jpg/, ".jpg");
  }

  // 6. ASOS (asos-media.com)
  if (url.includes("asos-media.com")) {
    return url.replace(/\?\$[^$]+\$/, "?$n_960w$");
  }

  // 7. Shopify stores (cdn.shopify.com - 4.5M+ stores globally)
  if (url.includes("cdn.shopify.com")) {
    return url.replace(/_(?:pico|icon|thumb|small|compact|medium|large|grande|\d+x\d+)\.(jpg|jpeg|png|webp)/i, "_master.$1");
  }

  // 8. Meesho (images.meesho.com)
  if (url.includes("images.meesho.com")) {
    return url.replace(/\/(?:256|512)\//, "/1024/");
  }

  // 9. Ajio (assets.ajio.com)
  if (url.includes("assets.ajio.com")) {
    return url.replace(/\?.*$/, "");
  }

  // 10. Nike & Adidas
  if (url.includes("nike.com") || url.includes("adidas.com")) {
    return url.replace(/[?&]wid=\d+/, "?wid=1400");
  }

  return url;
}

export function isCandidateImage(el: HTMLElement): boolean {
  const rect = el.getBoundingClientRect();
  const width = rect.width || (el as HTMLImageElement).naturalWidth || (el as HTMLImageElement).width || 0;
  const height = rect.height || (el as HTMLImageElement).naturalHeight || (el as HTMLImageElement).height || 0;

  if (width < MIN_WIDTH || height < MIN_HEIGHT) return false;

  const aspectRatio = height / width;
  if (aspectRatio < MIN_ASPECT_RATIO || aspectRatio > MAX_ASPECT_RATIO) return false;

  const src = extractBestImageUrl(el);
  if (!src || isSkipElement(el, src)) return false;

  return true;
}

function isSkipElement(el: HTMLElement, src: string): boolean {
  if (!src || src.startsWith("data:image/svg") || src.endsWith(".svg")) return true;

  for (const pattern of SKIP_PATTERNS) {
    if (pattern.test(src)) return true;
  }

  const alt = el.getAttribute("alt") || "";
  const title = el.getAttribute("title") || "";
  const className = el.className || "";
  const id = el.id || "";
  const combined = `${alt} ${title} ${className} ${id}`.toLowerCase();

  for (const pattern of SKIP_PATTERNS) {
    if (pattern.test(combined)) return true;
  }

  if (el.closest("header, footer, nav, [role='banner'], [role='navigation']")) {
    return true;
  }

  return false;
}
