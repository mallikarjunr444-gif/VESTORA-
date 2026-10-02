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

    // Flipkart resolution upgrade
    if (direct && direct.includes("rukminim1.flixcart.com/image/")) {
      return direct.replace(/\/image\/\d+\/\d+\//, "/image/832/832/");
    }

    return direct;
  }

  // CSS background image
  const bg = window.getComputedStyle(el).backgroundImage;
  if (bg && bg.startsWith("url(")) {
    const match = bg.match(/url\(['"]?(.*?)['"]?\)/i);
    if (match && match[1]) return match[1];
  }

  return "";
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
