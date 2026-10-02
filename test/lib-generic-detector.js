const PDP_URL_PATTERNS = [
  /\/(?:products?|items?|goods|catalog|dp|gp\/product|p)\/([^/?#]+)/i,
  /[?&](?:sku|product[-_]?id|item[-_]?id|pid|variant)=/i,
  /\/(?:buy|shop)\/([^/?#]+)/i,
  /\b[A-Za-z0-9_-]{5,16}(?:pdp|prd)\b/i
];
const NON_PDP_URL_PATTERNS = [
  /\/(?:cart|checkout|basket|bag)\b/i,
  /\/(?:account|login|signin|register|signup|profile|my-account)\b/i,
  /\/(?:terms|privacy|contact|help|faq|about|policy|support|shipping)\b/i,
  /\/(?:search|categories|collections|c)\/?$/i,
  /\/(?:blog|article|stories|news)\//i
];
const COMMERCIAL_BUTTON_PATTERNS = [
  /add\s*(?:to)?\s*(?:cart|bag|basket)/i,
  /buy\s*(?:it)?\s*now/i,
  /order\s*now/i,
  /bag\s*it/i,
  /quick\s*buy/i,
  /purchase/i,
  /add\s*to\s*tote/i
];
const CURRENCY_SYMBOLS = ["\u20B9", "$", "\u20AC", "\xA3", "\xA5", "Rs.", "INR", "USD", "EUR", "GBP", "AED", "AUD", "CAD"];
function assessProductPage(doc = document, loc = location) {
  const signals = [];
  let score = 0;
  const pathname = loc.pathname || "";
  for (const neg of NON_PDP_URL_PATTERNS) {
    if (neg.test(pathname)) {
      return { isProductPage: false, confidence: 0, signals: [`negative_url:${neg}`] };
    }
  }
  for (const pos of PDP_URL_PATTERNS) {
    if (pos.test(loc.href)) {
      score += 0.35;
      signals.push("pdp_url_pattern");
      break;
    }
  }
  let foundJsonLd = null;
  try {
    const scripts = doc.querySelectorAll('script[type="application/ld+json"]');
    for (const script of Array.from(scripts)) {
      const text = script.textContent?.trim() || "";
      if (!text) continue;
      const parsed = JSON.parse(text);
      const items = Array.isArray(parsed) ? parsed : parsed["@graph"] ? parsed["@graph"] : [parsed];
      for (const item of items) {
        if (item && (item["@type"] === "Product" || item["@type"] === "IndividualProduct")) {
          foundJsonLd = item;
          score += 0.5;
          signals.push("json_ld_product");
          break;
        }
      }
      if (foundJsonLd) break;
    }
  } catch {
  }
  if (!foundJsonLd) {
    const microdataProduct = doc.querySelector('[itemscope][itemtype*="schema.org/Product"]');
    if (microdataProduct) {
      score += 0.4;
      signals.push("microdata_product");
    }
  }
  const ogType = doc.querySelector('meta[property="og:type"]')?.getAttribute("content");
  if (ogType && /product/i.test(ogType)) {
    score += 0.35;
    signals.push("opengraph_product_type");
  }
  if (doc.querySelector('meta[property="product:price:amount"], meta[property="og:price:amount"]')) {
    score += 0.25;
    signals.push("opengraph_price");
  }
  const buttons = Array.from(
    doc.querySelectorAll("button, input[type='submit'], input[type='button'], a[role='button'], .btn, .button")
  );
  let hasAddToCart = false;
  for (const btn of buttons) {
    const txt = (btn.textContent || btn.getAttribute("aria-label") || btn.getAttribute("value") || "").trim();
    if (txt && COMMERCIAL_BUTTON_PATTERNS.some((p) => p.test(txt))) {
      hasAddToCart = true;
      score += 0.3;
      signals.push(`add_to_cart_btn:${txt.slice(0, 20)}`);
      break;
    }
  }
  const priceSelectors = [
    "[class*='price']",
    "[id*='price']",
    "[data-price]",
    ".pdp-price",
    ".product-price",
    ".price-box"
  ];
  let hasPrice = false;
  for (const sel of priceSelectors) {
    const el = doc.querySelector(sel);
    if (el) {
      const text = el.textContent || "";
      if (CURRENCY_SYMBOLS.some((c) => text.includes(c)) || /\d+[.,]\d{2}/.test(text)) {
        hasPrice = true;
        score += 0.2;
        signals.push("dom_price_indicator");
        break;
      }
    }
  }
  const sizeWidgets = doc.querySelector(
    "[class*='size-selector'], [class*='size-buttons'], select[name*='size'], [data-testid*='size'], .size-swatches, [role='radiogroup'][aria-label*='size' i]"
  );
  if (sizeWidgets) {
    score += 0.2;
    signals.push("dom_size_selector");
  }
  const confidence = Math.min(1, score);
  const isProductPage = confidence >= 0.45;
  return {
    isProductPage,
    confidence,
    signals,
    rawJsonLd: foundJsonLd || void 0
  };
}
const NON_FASHION_KEYWORDS = [
  /\b(?:smartphone|iphone|samsung\s*galaxy|android|laptop|macbook|computer|charger|usb|cable|keyboard|mouse|headphone|earbud|speaker|monitor|television|smartwatch)\b/i,
  /\b(?:sofa|couch|dining\s*table|bedsheet|pillow|mattress|curtain|blanket|kitchenware|cooker|pan|knife|cutlery|refrigerator|microwave)\b/i,
  /\b(?:shampoo|conditioner|face\s*wash|lotion|serum|lipstick|eyeliner|perfume|cologne|toothpaste|skincare|sunscreen)\b/i,
  /\b(?:grocery|snack|chocolate|coffee|tea|supplement|protein|vitamin|pet\s*food)\b/i,
  /\b(?:book|novel|ebook|magazine|comic|stationery|pen|pencil|notebook)\b/i,
  /\b(?:drill|hammer|wrench|screw|hardware|car\s*part|tire|motor\s*oil)\b/i,
  /\b(?:toy|lego|board\s*game|doll|action\s*figure|puzzle)\b/i
];
const FASHION_TAXONOMY = [
  // Full Body (Ethnic & Ensembles)
  { category: "full_body", type: "Saree", pattern: /\b(?:saree|sari|kanjivaram|banarasi|chanderi)\b/i },
  { category: "full_body", type: "Lehenga", pattern: /\b(?:lehenga|ghagra|chaniya\s*choli)\b/i },
  { category: "full_body", type: "Anarkali Suit", pattern: /\b(?:anarkali|angrakha)\b/i },
  { category: "full_body", type: "Salwar Suit", pattern: /\b(?:salwar\s*(?:suit|kameez)|churidar\s*suit|patiala\s*suit)\b/i },
  { category: "full_body", type: "Sherwani", pattern: /\b(?:sherwani|achkan|indo[- ]?western\s*suit)\b/i },
  { category: "full_body", type: "Ethnic Set", pattern: /\b(?:ethnic\s*set|kurta\s*set|kurta\s*pajama)\b/i },
  { category: "full_body", type: "Co-ord Set", pattern: /\b(?:co[- ]?ord|coord\s*set|two[- ]?piece\s*set)\b/i },
  { category: "full_body", type: "Dress", pattern: /\b(?:dress|gown|maxi\s*dress|midi\s*dress|mini\s*dress|sundress|frock|slip\s*dress)\b/i },
  { category: "full_body", type: "Jumpsuit", pattern: /\b(?:jumpsuit|romper|dungaree|playsuit)\b/i },
  { category: "full_body", type: "Tracksuit", pattern: /\b(?:tracksuit|sweatsuit)\b/i },
  { category: "full_body", type: "Kaftan", pattern: /\b(?:kaftan|caftan)\b/i },
  // Upper Body (Tops, Shirts, Jackets, Ethnic Uppers)
  { category: "upper_body", type: "Kurta", pattern: /\b(?:kurta|kurti|tunic)\b/i },
  { category: "upper_body", type: "Nehru Jacket", pattern: /\b(?:nehru\s*jacket|bundi|bandhgala(?:[- ]?jacket)?|jodhpuri(?:[- ]?suit)?|waistcoat)\b/i },
  { category: "upper_body", type: "T-Shirt", pattern: /\b(?:t[-\s]?shirt|tee|graphic\s*tee|crewneck|v[- ]?neck)\b/i },
  { category: "upper_body", type: "Polo", pattern: /\b(?:polo\s*shirt|polo\s*tee|polo)\b/i },
  { category: "upper_body", type: "Shirt", pattern: /\b(?:casual\s*shirt|formal\s*shirt|linen\s*shirt|overshirt|button[- ]?down|flannel)\b/i },
  { category: "upper_body", type: "Hoodie", pattern: /\b(?:hoodie|hooded\s*sweatshirt|pullover\s*hoodie)\b/i },
  { category: "upper_body", type: "Sweatshirt", pattern: /\b(?:sweatshirt|fleece\s*crew)\b/i },
  { category: "upper_body", type: "Jacket", pattern: /\b(?:denim\s*jacket|bomber\s*jacket|puffer|windbreaker|biker\s*jacket|varsity|leather\s*jacket)\b/i },
  { category: "upper_body", type: "Blazer", pattern: /\b(?:blazer|suit\s*jacket|sport\s*coat)\b/i },
  { category: "upper_body", type: "Coat", pattern: /\b(?:overcoat|trench\s*coat|parka|peacoat)\b/i },
  { category: "upper_body", type: "Top", pattern: /\b(?:crop\s*top|tank\s*top|camisole|halter\s*top|blouse|corset|tube\s*top)\b/i },
  { category: "upper_body", type: "Sweater", pattern: /\b(?:sweater|cardigan|pullover|knitwear|jumper)\b/i },
  { category: "upper_body", type: "Vest", pattern: /\b(?:gilet|vest|puffer\s*vest)\b/i },
  // Lower Body (Bottoms)
  { category: "lower_body", type: "Jeans", pattern: /\b(?:jeans|denim\s*pants|skinny\s*jeans|baggy\s*jeans|flare\s*jeans|straight\s*fit\s*jeans)\b/i },
  { category: "lower_body", type: "Trousers", pattern: /\b(?:trousers|chinos|formal\s*pants|khakis|slacks)\b/i },
  { category: "lower_body", type: "Shorts", pattern: /\b(?:shorts|bermuda|cargo\s*shorts|denim\s*shorts|boardshorts)\b/i },
  { category: "lower_body", type: "Skirt", pattern: /\b(?:skirt|mini\s*skirt|midi\s*skirt|pleated\s*skirt|pencil\s*skirt)\b/i },
  { category: "lower_body", type: "Joggers", pattern: /\b(?:joggers|sweatpants|track\s*pants|lounge\s*pants)\b/i },
  { category: "lower_body", type: "Leggings", pattern: /\b(?:leggings|tights|yoga\s*pants)\b/i },
  { category: "lower_body", type: "Ethnic Bottoms", pattern: /\b(?:palazzo|dhoti|salwar|churidar|sharara|gharara)\b/i },
  { category: "lower_body", type: "Cargos", pattern: /\b(?:cargo\s*pants|cargos|combat\s*pants)\b/i },
  // Footwear
  { category: "shoes", type: "Sneakers", pattern: /\b(?:sneakers|trainers|running\s*shoes|kicks|tennis\s*shoes)\b/i },
  { category: "shoes", type: "Boots", pattern: /\b(?:boots|chelsea\s*boots|ankle\s*boots|combat\s*boots)\b/i },
  { category: "shoes", type: "Loafers", pattern: /\b(?:loafers|moccasins|boat\s*shoes)\b/i },
  { category: "shoes", type: "Heels", pattern: /\b(?:heels|stilettos|pumps|wedges)\b/i },
  { category: "shoes", type: "Sandals", pattern: /\b(?:sandals|slides|flip[- ]?flops|slippers|clogs|crocs)\b/i },
  { category: "shoes", type: "Ethnic Footwear", pattern: /\b(?:juttis|mojaris|kolhapuris)\b/i },
  // Accessories
  { category: "accessories", type: "Sunglasses", pattern: /\b(?:sunglasses|shades|eyewear)\b/i },
  { category: "accessories", type: "Watch", pattern: /\b(?:watch|wrist\s*watch|chronograph)\b/i },
  { category: "accessories", type: "Bag", pattern: /\b(?:handbag|backpack|tote\s*bag|clutch|sling\s*bag|duffel)\b/i },
  { category: "accessories", type: "Hat", pattern: /\b(?:cap|hat|beanie|bucket\s*hat|fedora)\b/i },
  { category: "accessories", type: "Dupatta", pattern: /\b(?:dupatta|stole|scarf|shawl)\b/i },
  { category: "accessories", type: "Belt", pattern: /\b(?:leather\s*belt|waist\s*belt)\b/i }
];
function classifyFashionAndGarment(title, description = "", urlPath = "", categoryBreadcrumbs = []) {
  const combined = `${title} ${description} ${urlPath} ${categoryBreadcrumbs.join(" ")}`.toLowerCase();
  for (const nonFashionPattern of NON_FASHION_KEYWORDS) {
    if (nonFashionPattern.test(combined)) {
      const hasStrongFashionKeyword = /\b(?:t-shirt|shirt|hoodie|jeans|dress|saree|kurta|jacket|blazer|top|pants|sneakers)\b/i.test(combined);
      if (!hasStrongFashionKeyword) {
        return {
          isFashion: false,
          category: "other",
          garmentType: "Non-Apparel",
          confidence: 0.95
        };
      }
    }
  }
  for (const item of FASHION_TAXONOMY) {
    if (item.pattern.test(combined)) {
      return {
        isFashion: true,
        category: item.category,
        garmentType: item.type,
        confidence: 0.94
      };
    }
  }
  const genericApparel = /\b(?:apparel|clothing|wear|outfit|garment|fashion|attire)\b/i.test(combined);
  if (genericApparel) {
    return {
      isFashion: true,
      category: "upper_body",
      garmentType: "Apparel",
      confidence: 0.7
    };
  }
  return {
    isFashion: false,
    category: "unknown",
    garmentType: "Item",
    confidence: 0.4
  };
}
const SKIP_IMAGE_PATTERNS = [
  /\b(?:logo|brand[-_]?logo|site[-_]?logo)\b/i,
  /\b(?:banner|promo|hero[-_]?banner|slide[-_]?banner)\b/i,
  /\b(?:icon|favicon|cart[-_]?icon|search[-_]?icon|close[-_]?icon|arrow)\b/i,
  /\b(?:avatar|user[-_]?profile|author|testimonial)\b/i,
  /\b(?:payment|visa|mastercard|amex|rupay|upi|paypal|paytm)\b/i,
  /\b(?:badge|seal|guarantee|trustpilot|certified|ssl)\b/i,
  /\b(?:rating|star|review[-_]?star)\b/i,
  /\b(?:social|facebook|instagram|twitter|youtube|linkedin|tiktok)\b/i,
  /\b(?:sprite|pixel|spacer|blank\.gif|loading|placeholder)\b/i
];
function extractBestImageUrl(el) {
  if (el.tagName === "IMG") {
    const img = el;
    const dyn = img.getAttribute("data-a-dynamic-image");
    if (dyn) {
      try {
        const parsed = JSON.parse(dyn);
        const urls = Object.keys(parsed);
        if (urls.length > 0) {
          urls.sort((a, b) => (parsed[b][0] || 0) - (parsed[a][0] || 0));
          return upgradeGenericImageUrl(urls[0]);
        }
      } catch {
      }
    }
    const highResAttrs = [
      "data-zoom-image",
      "data-old-hires",
      "data-large-image",
      "data-high-res-src",
      "data-full-src",
      "data-magnify-src",
      "data-zoom",
      "data-origin",
      "data-original",
      "data-src",
      "data-lazy-src"
    ];
    for (const attr of highResAttrs) {
      const val = img.getAttribute(attr);
      if (val && /^https?:\/\//i.test(val)) {
        return upgradeGenericImageUrl(val);
      }
    }
    const picture = img.closest("picture");
    if (picture) {
      const sources = Array.from(picture.querySelectorAll("source[srcset]"));
      for (const srcEl of sources) {
        const ss = srcEl.getAttribute("srcset");
        if (ss) {
          const highest = getHighestResolutionFromSrcset(ss);
          if (highest) return upgradeGenericImageUrl(highest);
        }
      }
    }
    const srcset = img.getAttribute("srcset");
    if (srcset) {
      const highest = getHighestResolutionFromSrcset(srcset);
      if (highest) return upgradeGenericImageUrl(highest);
    }
    const direct = img.currentSrc || img.src || "";
    return upgradeGenericImageUrl(direct);
  }
  const bg = el.style.backgroundImage || window.getComputedStyle(el).backgroundImage;
  if (bg && bg.startsWith("url(")) {
    const match = bg.match(/url\(['"]?(.*?)['"]?\)/i);
    if (match && match[1]) return upgradeGenericImageUrl(match[1]);
  }
  const nestedImg = el.querySelector("img");
  if (nestedImg) return extractBestImageUrl(nestedImg);
  return "";
}
function getHighestResolutionFromSrcset(srcset) {
  const parts = srcset.split(",").map((p) => p.trim());
  if (parts.length === 0) return null;
  let bestUrl = null;
  let maxDescriptorVal = 0;
  for (const part of parts) {
    const tokens = part.split(/\s+/);
    const url = tokens[0];
    const desc = tokens[1] || "";
    let val = 1;
    if (desc.endsWith("w")) {
      val = parseInt(desc.replace("w", ""), 10) || 1;
    } else if (desc.endsWith("x")) {
      val = (parseFloat(desc.replace("x", "")) || 1) * 1e3;
    }
    if (val >= maxDescriptorVal && /^https?:\/\//i.test(url)) {
      maxDescriptorVal = val;
      bestUrl = url;
    }
  }
  return bestUrl || parts[parts.length - 1]?.split(/\s+/)[0] || null;
}
function upgradeGenericImageUrl(url) {
  if (!url) return "";
  if (url.includes("/image/upload/")) {
    url = url.replace(/\/image\/upload\/(?:[a-zA-Z0-9_,]+)\//, "/image/upload/q_auto:best,f_auto,w_1440/");
  }
  if (url.includes("cdn.shopify.com")) {
    url = url.replace(/_(?:pico|icon|thumb|small|compact|medium|large|grande|\d+x\d+)\.(jpg|jpeg|png|webp)/i, "_master.$1");
    url = url.replace(/[?&]width=\d+/, "?width=1440");
  }
  if (/[?&](?:w|width)=\d+/i.test(url)) {
    url = url.replace(/([?&](?:w|width)=)\d+/i, "$11440");
  }
  if (/[?&]quality=\d+/i.test(url)) {
    url = url.replace(/([?&]quality=)\d+/i, "$195");
  }
  if (/[?&]wid=\d+/i.test(url)) {
    url = url.replace(/([?&]wid=)\d+/i, "$11600");
  }
  if (url.includes("assets.myntassets.com")) {
    url = url.replace(/\/f_webp,[^/]+\//, "/h_1440,q_95,w_1080/").replace(/\/h_\d+,q_\d+,w_\d+\//, "/h_1440,q_95,w_1080/").replace(/\/w_\d+,c_limit,fl_progressive\//, "/h_1440,q_95,w_1080/");
  } else if (url.includes("flixcart.com/image/")) {
    url = url.replace(/\/image\/\d+\/\d+\//, "/image/832/832/");
  } else if (url.includes("media-amazon.com") || url.includes("images-amazon.com")) {
    url = url.replace(/\._[A-Z0-9_,]+_\./, "._AC_SL1500_.");
  } else if (url.includes("static.zara.net") || url.includes("itxweb.com")) {
    url = url.replace(/\/w\/\d+\//, "/w/1024/");
  } else if (url.includes("ltwebstatic.com")) {
    url = url.replace(/_thumbnail_\d+x\d+/, "").replace(/_\d+x\d+\.jpg/, ".jpg");
  } else if (url.includes("asos-media.com")) {
    url = url.replace(/\?\$[^$]+\$/, "?$n_960w$");
  } else if (url.includes("images.meesho.com")) {
    url = url.replace(/\/(?:256|512)\//, "/1024/");
  }
  return url;
}
function isCandidateFashionImage(el) {
  const rect = el.getBoundingClientRect();
  const width = rect.width || el.naturalWidth || el.width || 0;
  const height = rect.height || el.naturalHeight || el.height || 0;
  if (width < 180 || height < 180) return false;
  const aspectRatio = height / width;
  if (aspectRatio < 0.65 || aspectRatio > 2.8) return false;
  const src = extractBestImageUrl(el);
  if (!src || src.startsWith("data:image/svg") || src.endsWith(".svg")) return false;
  for (const pattern of SKIP_IMAGE_PATTERNS) {
    if (pattern.test(src)) return false;
  }
  const alt = el.getAttribute("alt") || "";
  const title = el.getAttribute("title") || "";
  const className = String(el.className || "");
  const id = el.id || "";
  const combined = `${alt} ${title} ${className} ${id}`.toLowerCase();
  for (const pattern of SKIP_IMAGE_PATTERNS) {
    if (pattern.test(combined)) return false;
  }
  if (el.closest("header, footer, nav, [role='banner'], [role='navigation']")) {
    return false;
  }
  return true;
}
const ALPHA_SIZES = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "2XL", "3XL", "4XL"];
const NUMERIC_SIZES = ["28", "30", "32", "34", "36", "38", "39", "40", "42", "44", "46", "48"];
function extractSizesFromPage(doc = document) {
  const availableSet = /* @__PURE__ */ new Set();
  const outOfStockSet = /* @__PURE__ */ new Set();
  const sizeElements = Array.from(
    doc.querySelectorAll(
      "button, [role='radio'], [data-size], [data-attr-value], .size-buttons-size-button, .size-pill, .size-option, [class*='size-item'], [class*='size-btn'], [class*='SizeButton']"
    )
  );
  for (const el of sizeElements) {
    const raw = (el.textContent || el.getAttribute("data-size") || el.getAttribute("data-attr-value") || "").trim().toUpperCase();
    if (!raw) continue;
    let matchedToken = null;
    const alphaMatch = raw.match(/\b(XXS|XS|S|M|L|XL|XXL|2XL|3XL|4XL)\b/);
    if (alphaMatch) matchedToken = alphaMatch[1];
    if (!matchedToken) {
      const numMatch = raw.match(/\b(28|30|32|34|36|38|39|40|42|44|46|48)\b/);
      if (numMatch) matchedToken = numMatch[1];
    }
    if (matchedToken) {
      const isOos = el.hasAttribute("disabled") || el.getAttribute("aria-disabled") === "true" || /\b(?:disabled|out[-_]?of[-_]?stock|sold[-_]?out|unavailable|strikethrough)\b/i.test(el.className);
      if (isOos) {
        outOfStockSet.add(matchedToken);
      } else {
        availableSet.add(matchedToken);
      }
    }
  }
  if (availableSet.size === 0) {
    const select = doc.querySelector("select[name*='size' i], select[id*='size' i]");
    if (select) {
      for (const opt of Array.from(select.options)) {
        const text = opt.text.trim().toUpperCase();
        for (const s of [...ALPHA_SIZES, ...NUMERIC_SIZES]) {
          if (text.includes(s)) {
            if (opt.disabled || text.includes("OUT OF STOCK") || text.includes("SOLD OUT")) {
              outOfStockSet.add(s);
            } else {
              availableSet.add(s);
            }
          }
        }
      }
    }
  }
  if (availableSet.size === 0) {
    return {
      available: ["XS", "S", "M", "L", "XL", "XXL"],
      outOfStock: [],
      source: "default"
    };
  }
  const sortOrder = [...ALPHA_SIZES, ...NUMERIC_SIZES];
  const sortedAvail = sortOrder.filter((s) => availableSet.has(s));
  const sortedOos = sortOrder.filter((s) => outOfStockSet.has(s));
  return {
    available: sortedAvail,
    outOfStock: sortedOos,
    source: "dom-pills"
  };
}
function detectHeroFashionProduct(doc = document, loc = location) {
  const assessment = assessProductPage(doc, loc);
  let name = "";
  let brand = "";
  let price = "";
  let currency = "";
  let imageUrl = "";
  if (assessment.rawJsonLd) {
    const json = assessment.rawJsonLd;
    name = String(json.name || "");
    if (json.brand) {
      brand = typeof json.brand === "string" ? json.brand : String(json.brand.name || "");
    }
    if (json.image) {
      const imgVal = Array.isArray(json.image) ? json.image[0] : json.image;
      imageUrl = typeof imgVal === "string" ? imgVal : String(imgVal?.url || "");
    }
    if (json.offers) {
      const offers = Array.isArray(json.offers) ? json.offers[0] : json.offers;
      if (offers) {
        price = String(offers.price || offers.lowPrice || "");
        currency = String(offers.priceCurrency || "");
      }
    }
  }
  if (!name) {
    name = doc.querySelector('meta[property="og:title"]')?.getAttribute("content") || doc.querySelector("h1")?.textContent?.trim() || doc.title.split(/[-|·]/)[0].trim();
  }
  if (!brand) {
    brand = doc.querySelector('meta[property="og:site_name"]')?.getAttribute("content") || loc.hostname.replace("www.", "").split(".")[0].toUpperCase();
  }
  const classification = classifyFashionAndGarment(name, "", loc.pathname);
  if (!imageUrl) {
    const ogImg = doc.querySelector('meta[property="og:image"]')?.getAttribute("content");
    if (ogImg && !ogImg.includes("logo") && !ogImg.includes("favicon")) {
      imageUrl = upgradeGenericImageUrl(ogImg);
    }
  }
  if (!imageUrl) {
    const allImages = Array.from(doc.querySelectorAll("img, [style*='background-image']"));
    const candidates = allImages.filter(isCandidateFashionImage);
    if (candidates.length > 0) {
      imageUrl = extractBestImageUrl(candidates[0]);
    }
  }
  if (!imageUrl) return null;
  const sizes = extractSizesFromPage(doc);
  return {
    id: `prod_${Date.now()}`,
    name,
    brand,
    price: price ? `${currency} ${price}`.trim() : void 0,
    currency: currency || void 0,
    imageUrl,
    productUrl: loc.href,
    pageUrl: loc.href,
    category: classification.garmentType,
    isFashion: classification.isFashion,
    availableSizes: sizes.available,
    outOfStockSizes: sizes.outOfStock,
    confidence: assessment.confidence,
    detectionSource: assessment.rawJsonLd ? "json-ld" : "dom-heuristic"
  };
}
export {
  assessProductPage,
  classifyFashionAndGarment,
  detectHeroFashionProduct,
  extractBestImageUrl,
  extractSizesFromPage,
  isCandidateFashionImage,
  upgradeGenericImageUrl
};
