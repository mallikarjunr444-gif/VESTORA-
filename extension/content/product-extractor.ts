/**
 * VESTORA — Product Extractor
 * Normalizes detected fashion items into internal Product model (PRD Section 11).
 */

import type { Product } from "../../shared/types/index.js";

export function extractProductFromElement(targetEl: HTMLElement, imageUrl: string): Product {
  let name = "";
  let category = "T-Shirt";
  let availableSizes: string[] = [];

  // 1. Check for JSON-LD structured product data on page
  try {
    const scripts = document.querySelectorAll('script[type="application/ld+json"]');
    for (const script of Array.from(scripts)) {
      const data = JSON.parse(script.textContent || "{}");
      const item = data["@type"] === "Product" ? data : Array.isArray(data["@graph"]) ? data["@graph"].find((x: Record<string, unknown>) => x["@type"] === "Product") : null;
      if (item && item.name) {
        name = String(item.name);
        break;
      }
    }
  } catch {
    // Fall back to DOM traversal
  }

  // 2. OpenGraph or DOM Heading fallback
  if (!name) {
    const ogTitle = document.querySelector('meta[property="og:title"]')?.getAttribute("content");
    const parentCard = targetEl.closest(".product-base, .item, [data-testid*='product'], article, .pdp-details, .product-card, .product-detail, [class*='ProductCard']") || targetEl.parentElement;
    const heading = parentCard?.querySelector("h1, h2, h3, .product-title, .product-name, [class*='title'], [class*='Title']");
    const alt = targetEl.getAttribute("alt") || "";

    name = heading?.textContent?.trim() || ogTitle || alt || document.title.split(/[-|·]/)[0].trim();
  }

  // 3. Category Heuristic (Universal Global + Indian Ethnic Apparel)
  const text = `${name} ${location.pathname}`.toLowerCase();
  if (/kurta|kurti/i.test(text)) category = "Kurta";
  else if (/saree|sari/i.test(text)) category = "Saree";
  else if (/lehenga|ghagra|choli/i.test(text)) category = "Lehenga";
  else if (/anarkali/i.test(text)) category = "Anarkali Suit";
  else if (/sherwani/i.test(text)) category = "Sherwani";
  else if (/nehru[- ]?jacket|bundi/i.test(text)) category = "Nehru Jacket";
  else if (/bandhgala|jodhpuri/i.test(text)) category = "Bandhgala";
  else if (/salwar|churidar|patiala/i.test(text)) category = "Salwar Suit";
  else if (/ethnic[- ]?set/i.test(text)) category = "Ethnic Set";
  else if (/indo[- ]?western/i.test(text)) category = "Indo-Western";
  else if (/co[- ]?ord|coord/i.test(text)) category = "Co-ord Set";
  else if (/t[-\s]?shirt|tee\b/i.test(text)) category = "T-Shirt";
  else if (/polo/i.test(text)) category = "Polo";
  else if (/shirt/i.test(text)) category = "Shirt";
  else if (/jacket|coat|blazer/i.test(text)) category = "Jacket";
  else if (/hoodie|sweatshirt/i.test(text)) category = "Hoodie";
  else if (/dress|gown/i.test(text)) category = "Dress";
  else if (/top|blouse|tunic/i.test(text)) category = "Top";
  else if (/sweater|cardigan/i.test(text)) category = "Sweater";
  else if (/pants|jeans|trousers|joggers|shorts/i.test(text)) category = "Bottoms";

  // 4. Available Sizes Scraper
  const sizeElements = document.querySelectorAll(
    "button, [role='radio'], [data-size], [data-attr-value], select[name*='size'] option, select[id*='size'] option, .size-buttons-size-button, .size-variant-item, [class*='size-item']"
  );
  const foundSizes = new Set<string>();
  sizeElements.forEach((btn) => {
    const raw = (btn.textContent || btn.getAttribute("data-size") || btn.getAttribute("data-attr-value") || "").trim().toUpperCase();
    const alpha = raw.match(/\b(3XL|XXL|XL|XS|[SML])\b/);
    if (alpha) foundSizes.add(alpha[1]);
    const num = raw.match(/\b(28|30|32|34|36|38|39|40|42|44|46|48)\b/);
    if (num) foundSizes.add(num[1]);
  });

  if (foundSizes.size >= 2) {
    const standardOrder = ["XS", "S", "M", "L", "XL", "XXL", "3XL", "28", "30", "32", "34", "36", "38", "39", "40", "42", "44", "46", "48"];
    availableSizes = standardOrder.filter((s) => foundSizes.has(s));
  } else {
    availableSizes = ["S", "M", "L", "XL"];
  }

  return {
    name,
    imageUrl,
    productUrl: location.href,
    pageUrl: location.href,
    category,
    availableSizes,
  };
}
