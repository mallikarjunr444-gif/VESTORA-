/**
 * VESTORA Test Suite for Image Scanning, Multi-Platform Support & Garment Filtering
 * Tests Indian Shopping Websites (Myntra, Ajio, Flipkart, Amazon.in, Meesho, Tata CLiQ),
 * Global Brands (Zara, H&M, ASOS, Uniqlo, Nike), and E-Commerce Platforms (Shopify, WooCommerce).
 */

const MIN_WIDTH = 180;
const MIN_HEIGHT = 180;
const MIN_ASPECT_RATIO = 0.72;
const MAX_ASPECT_RATIO = 2.6;

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
  /\bpayment[-_]?methods?\b/i,
  /\barrow\b/i,
  /\bcart[-_]?icon\b/i
];

function extractBestImageUrl(el) {
  if (el.tagName === "IMG") {
    // 1. Amazon dynamic image JSON attribute
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

    // 2. High-res zoom attributes
    const highRes = (
      el.getAttribute("data-old-hires") ||
      el.getAttribute("data-zoom-image") ||
      el.getAttribute("data-large-image") ||
      el.getAttribute("data-high-res-src")
    );
    if (highRes && /^https?:\/\//i.test(highRes)) return highRes;

    // 3. Direct / lazy attributes
    const direct = (
      el.getAttribute("data-src") ||
      el.getAttribute("data-original") ||
      el.getAttribute("data-lazy-src") ||
      el.currentSrc ||
      el.src ||
      ""
    );

    // Flipkart resolution boost
    if (direct && direct.includes("rukminim1.flixcart.com/image/")) {
      return direct.replace(/\/image\/\d+\/\d+\//, "/image/832/832/");
    }

    return direct;
  }

  // CSS background image
  const bg = el.style?.backgroundImage || "";
  if (bg && bg.startsWith("url(")) {
    const match = bg.match(/url\(['"]?(.*?)['"]?\)/i);
    if (match && match[1]) return match[1];
  }
  return "";
}

function isSkipElement(el, src) {
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

  if (el.isInsideHeaderOrFooter) return true;

  return false;
}

function isCandidateImage(el) {
  const width = el.width || 0;
  const height = el.height || 0;

  if (width < MIN_WIDTH || height < MIN_HEIGHT) return false;

  const aspectRatio = height / width;
  if (aspectRatio < MIN_ASPECT_RATIO || aspectRatio > MAX_ASPECT_RATIO) return false;

  const src = extractBestImageUrl(el);
  if (!src || isSkipElement(el, src)) return false;

  return true;
}

// Universal Sizing Table
const SIZE_CONVERSIONS = {
  XS:    { alpha: "XS",  chest: "36", waist: "28", eu: "44", order: 0 },
  S:     { alpha: "S",   chest: "38", waist: "30", eu: "46", order: 1 },
  M:     { alpha: "M",   chest: "40", waist: "32", eu: "48", order: 2 },
  L:     { alpha: "L",   chest: "42", waist: "34", eu: "50", order: 3 },
  XL:    { alpha: "XL",  chest: "44", waist: "36", eu: "52", order: 4 },
  XXL:   { alpha: "XXL", chest: "46", waist: "38", eu: "54", order: 5 },
  "3XL": { alpha: "3XL", chest: "48", waist: "40", eu: "56", order: 6 }
};

function getNormalizedSizeInfo(sizeToken) {
  if (!sizeToken) return null;
  const clean = String(sizeToken).trim().toUpperCase();
  for (const [alpha, info] of Object.entries(SIZE_CONVERSIONS)) {
    if (
      clean === alpha ||
      clean === info.chest ||
      clean === info.waist ||
      clean === info.eu ||
      clean === `${alpha} (${info.chest})` ||
      clean === `${info.chest} (${alpha})` ||
      clean.startsWith(alpha) ||
      clean.includes(info.chest)
    ) {
      return info;
    }
  }
  return null;
}

// -------------------------------------------------------------
// Test Execution
// -------------------------------------------------------------

function runTests() {
  console.log("🧪 Running VESTORA Multi-Platform & Indian/Global E-Commerce Tests…\n");
  let passed = 0;
  let failed = 0;

  function assert(condition, testName) {
    if (condition) {
      console.log(`  ✓ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}`);
      failed++;
    }
  }

  // ── 1. Indian Platforms ──
  // Myntra PLP Product Card
  const myntraProductImg = {
    tagName: "IMG",
    width: 280,
    height: 373,
    src: "https://assets.myntassets.com/h_720,q_90,w_540/v1/assets/images/12345/shirt.jpg",
    className: "img-responsive",
    getAttribute: (attr) => (attr === "alt" ? "Roadster Men Navy Blue Cotton Casual Shirt" : null),
  };
  assert(isCandidateImage(myntraProductImg) === true, "Myntra PLP product photo is detected");

  // Myntra PDP Background Image
  const myntraPdpBg = {
    tagName: "DIV",
    width: 500,
    height: 667,
    className: "image-grid-image",
    style: {
      backgroundImage: "url('https://assets.myntassets.com/h_1440,q_90,w_1080/v1/assets/images/12345/front.jpg')",
    },
    getAttribute: () => null,
  };
  assert(isCandidateImage(myntraPdpBg) === true, "Myntra PDP CSS background-image container is detected");

  // Ajio PLP Lazy Product
  const ajioProductImg = {
    tagName: "IMG",
    width: 250,
    height: 312,
    src: "",
    className: "rilrtl-lazy-img",
    getAttribute: (attr) => {
      if (attr === "data-src") return "https://assets.ajio.com/medias/sys_master/root/2024/prod1.jpg";
      if (attr === "alt") return "GAP Striped Crew-Neck T-Shirt";
      return null;
    },
  };
  assert(isCandidateImage(ajioProductImg) === true, "Ajio PLP product with lazy-load data-src is detected");

  // Flipkart Image with resolution boost
  const flipkartImg = {
    tagName: "IMG",
    width: 240,
    height: 300,
    src: "https://rukminim1.flixcart.com/image/128/128/xif0q/shirt/v/g/m/original-imagh.jpeg",
    className: "_2r_T1I",
    getAttribute: (attr) => (attr === "alt" ? "Men Slim Fit Checkered Cut Away Collar Casual Shirt" : null),
  };
  const boostedUrl = extractBestImageUrl(flipkartImg);
  assert(boostedUrl.includes("/image/832/832/"), "Flipkart resolution boost upgrades 128x128 to 832x832 HD");
  assert(isCandidateImage(flipkartImg) === true, "Flipkart product image is detected");

  // Amazon India & Global with dynamic image JSON
  const amazonImg = {
    tagName: "IMG",
    width: 300,
    height: 400,
    src: "https://m.media-amazon.com/images/I/71xyz._AC_UL320_.jpg",
    className: "s-image",
    getAttribute: (attr) => {
      if (attr === "data-a-dynamic-image") {
        return JSON.stringify({
          "https://m.media-amazon.com/images/I/71xyz._AC_UL320_.jpg": [320, 240],
          "https://m.media-amazon.com/images/I/71xyz._AC_UL1500_.jpg": [1500, 1125]
        });
      }
      if (attr === "alt") return "Levi's Men's Regular Fit Casual Shirt";
      return null;
    }
  };
  assert(extractBestImageUrl(amazonImg) === "https://m.media-amazon.com/images/I/71xyz._AC_UL1500_.jpg", "Amazon dynamic image selects highest resolution asset");
  assert(isCandidateImage(amazonImg) === true, "Amazon product image is detected");

  // Meesho Product Card
  const meeshoImg = {
    tagName: "IMG",
    width: 220,
    height: 290,
    src: "https://images.meesho.com/images/products/12345/p1.jpg",
    className: "ProductCard__ProductImage",
    getAttribute: (attr) => (attr === "alt" ? "Cotton Printed Kurti" : null),
  };
  assert(isCandidateImage(meeshoImg) === true, "Meesho product catalog image is detected");

  // Tata CLiQ Luxury
  const tataCliqImg = {
    tagName: "IMG",
    width: 320,
    height: 420,
    src: "https://assets.tatacliq.com/medias/sys_master/images/lux1.jpg",
    className: "ProductModule__baseImage",
    getAttribute: (attr) => (attr === "alt" ? "Armani Exchange Regular Fit Polo" : null),
  };
  assert(isCandidateImage(tataCliqImg) === true, "Tata CLiQ Luxury product photo is detected");

  // Indian Ethnic Wear Brand (Fabindia / Manyavar)
  const ethnicBrandImg = {
    tagName: "IMG",
    width: 260,
    height: 380,
    src: "https://www.manyavar.com/media/catalog/product/sherwani1.jpg",
    className: "product-card__image",
    getAttribute: (attr) => (attr === "alt" ? "Manyavar Royal Silk Wedding Sherwani" : null),
  };
  assert(isCandidateImage(ethnicBrandImg) === true, "Indian ethnic brand photo (Manyavar/Fabindia) is detected");

  // ── 2. Global & International Brands ──
  // Zara Product Figure
  const zaraImg = {
    tagName: "IMG",
    width: 300,
    height: 450,
    src: "https://static.zara.net/photos/2024/V/0/1/p/1234/567/800/2/w/850/1234567800_2_1_1.jpg",
    className: "media-image__image",
    getAttribute: (attr) => (attr === "alt" ? "STRUCTURED TEXTURED OVERSHIRT" : null),
  };
  assert(isCandidateImage(zaraImg) === true, "Zara global collection photo is detected");

  // H&M Group
  const hmImg = {
    tagName: "IMG",
    width: 280,
    height: 420,
    src: "https://lp2.hm.com/hmgoepprod?set=source[/product/main]&scale=size[960x1440]",
    className: "product-item-image",
    getAttribute: (attr) => (attr === "alt" ? "Relaxed Fit Cotton Hoodie" : null),
  };
  assert(isCandidateImage(hmImg) === true, "H&M global product image is detected");

  // ASOS Gallery
  const asosImg = {
    tagName: "IMG",
    width: 310,
    height: 396,
    src: "https://images.asos-media.com/products/topman-oversized-t-shirt/1234-1.jpg",
    className: "gallery-image",
    getAttribute: (attr) => (attr === "data-testid" ? "productImage" : (attr === "alt" ? "Topman oversized tee" : null)),
  };
  assert(isCandidateImage(asosImg) === true, "ASOS gallery product image is detected");

  // ── 3. Global Platforms (Shopify, WooCommerce) ──
  // Shopify CDN
  const shopifyImg = {
    tagName: "IMG",
    width: 250,
    height: 330,
    src: "https://cdn.shopify.com/s/files/1/0000/0001/products/jacket_800x.jpg",
    className: "product__media",
    getAttribute: (attr) => (attr === "alt" ? "Vintage Denim Trucker Jacket" : null),
  };
  assert(isCandidateImage(shopifyImg) === true, "Shopify global store product image is detected");

  // WooCommerce
  const wooImg = {
    tagName: "IMG",
    width: 260,
    height: 350,
    src: "https://mystore.com/wp-content/uploads/2024/05/linen-shirt-600x800.jpg",
    className: "wp-post-image",
    getAttribute: (attr) => (attr === "alt" ? "Pure Linen Summer Shirt" : null),
  };
  assert(isCandidateImage(wooImg) === true, "WooCommerce store product image is detected");

  // ── 4. Skip Lists & Non-Garment Filters ──
  const promoBanner = {
    tagName: "IMG",
    width: 1200,
    height: 280,
    src: "https://assets.myntassets.com/banner-summer-sale.jpg",
    className: "banner-img",
    getAttribute: (attr) => (attr === "alt" ? "Summer Sale Banner 50% Off" : null),
  };
  assert(isCandidateImage(promoBanner) === false, "Promotional banner is skipped");

  const brandLogo = {
    tagName: "IMG",
    width: 190,
    height: 190,
    src: "https://assets.ajio.com/nike-brand-logo.png",
    className: "brand-logo",
    getAttribute: (attr) => (attr === "alt" ? "Nike Brand Logo" : null),
  };
  assert(isCandidateImage(brandLogo) === false, "Brand logo is skipped");

  const headerCartIcon = {
    tagName: "IMG",
    width: 200,
    height: 200,
    src: "https://assets.myntassets.com/cart-icon.png",
    className: "cart-icon",
    isInsideHeaderOrFooter: true,
    getAttribute: () => "Cart",
  };
  assert(isCandidateImage(headerCartIcon) === false, "Header navigation/cart icon is skipped");

  // ── 5. Size Engine Dual-Conversion Tests ──
  const chest40Info = getNormalizedSizeInfo("40");
  assert(chest40Info && chest40Info.alpha === "M", "Indian/UK Chest 40 converts correctly to Alpha M");

  const alphaLInfo = getNormalizedSizeInfo("L");
  assert(alphaLInfo && alphaLInfo.chest === "42" && alphaLInfo.waist === "34", "Alpha L maps to Indian Chest 42 and Waist 34");

  const waist32Info = getNormalizedSizeInfo("32");
  assert(waist32Info && waist32Info.alpha === "M", "Waist 32 maps to Size M");

  console.log(`\n========================================`);
  console.log(`Results: ${passed} passed, ${failed} failed.`);
  console.log(`========================================\n`);

  if (failed > 0) process.exit(1);
}

runTests();
