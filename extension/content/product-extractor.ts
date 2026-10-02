/**
 * VESTORA — Product Extractor
 * Normalizes detected fashion items into internal Product model (PRD Section 11).
 */

import type { Product } from "../../shared/types/index.js";
import { classifyFashionAndGarment, extractSizesFromPage } from "./generic-product-detector.js";

export function extractProductFromElement(targetEl: HTMLElement, imageUrl: string): Product {
  let name = "";
  let brand = "";
  let price = "";
  let currency = "";

  // 1. Check for JSON-LD structured product data on page
  try {
    const scripts = document.querySelectorAll('script[type="application/ld+json"]');
    for (const script of Array.from(scripts)) {
      const data = JSON.parse(script.textContent || "{}");
      const item =
        data["@type"] === "Product"
          ? data
          : Array.isArray(data["@graph"])
          ? data["@graph"].find((x: Record<string, unknown>) => x["@type"] === "Product")
          : null;
      if (item && item.name) {
        name = String(item.name);
        if (item.brand) {
          brand = typeof item.brand === "string" ? item.brand : String((item.brand as Record<string, unknown>).name || "");
        }
        if (item.offers) {
          const offers = Array.isArray(item.offers) ? item.offers[0] : item.offers;
          if (offers) {
            price = String(offers.price || offers.lowPrice || "");
            currency = String(offers.priceCurrency || "");
          }
        }
        break;
      }
    }
  } catch {
    // Fall back to DOM traversal
  }

  // 2. OpenGraph or DOM Heading fallback
  if (!name) {
    const ogTitle = document.querySelector('meta[property="og:title"]')?.getAttribute("content");
    const parentCard =
      targetEl.closest(
        ".product-base, .item, [data-testid*='product'], article, .pdp-details, .product-card, .product-detail, [class*='ProductCard'], .product-item"
      ) || targetEl.parentElement;
    const heading = parentCard?.querySelector(
      "h1, h2, h3, .product-title, .product-name, [class*='title'], [class*='Title']"
    );
    const alt = targetEl.getAttribute("alt") || "";

    name = heading?.textContent?.trim() || ogTitle || alt || document.title.split(/[-|·]/)[0].trim();
  }

  if (!brand) {
    brand =
      document.querySelector('meta[property="og:site_name"]')?.getAttribute("content") ||
      location.hostname.replace("www.", "").split(".")[0].toUpperCase();
  }

  // 3. Autonomous Fashion Classification (Western + Indian Ethnic)
  const classification = classifyFashionAndGarment(name, "", location.pathname);

  // 4. Available Sizes & Stock
  const sizeInfo = extractSizesFromPage(document);

  return {
    id: `prod_${Date.now()}`,
    name,
    brand,
    price: price ? `${currency} ${price}`.trim() : undefined,
    currency: currency || undefined,
    imageUrl,
    productUrl: location.href,
    pageUrl: location.href,
    category: classification.garmentType,
    isFashion: classification.isFashion,
    availableSizes: sizeInfo.available,
    outOfStockSizes: sizeInfo.outOfStock,
    confidence: classification.confidence,
    detectionSource: "dom-heuristic",
  };
}
