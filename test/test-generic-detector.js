/**
 * VESTORA — Autonomous Generic Fashion Product Detector Test Suite
 * 
 * Verifies that VESTORA detects fashion products automatically across ANY store:
 * 1. Unknown Shopify D2C store
 * 2. Unknown Indian ethnic startup
 * 3. Unknown WooCommerce store
 * 4. Non-fashion product pages (electronics, appliances, books) are skipped
 * 5. Non-product pages (checkout, cart, account) are skipped
 * 6. Fashion taxonomy classification (Western + Indian Ethnic)
 * 7. Universal CDN HD image resolution
 * 8. Sizing & stock extraction
 */

import {
  assessProductPage,
  classifyFashionAndGarment,
  upgradeGenericImageUrl,
  extractSizesFromPage,
  isCandidateFashionImage,
} from "./lib-generic-detector.js";

function runGenericDetectorTests() {
  console.log("🧪 Running VESTORA Autonomous Generic Fashion Detector Tests…\n");
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

  // ── 1. Unknown Shopify Fashion Store ──
  const mockShopifyDoc = {
    pathname: "/products/acid-wash-vintage-hoodie",
    href: "https://unknown-skater-apparel.myshopify.com/products/acid-wash-vintage-hoodie",
    querySelectorAll: (selector) => {
      if (selector === 'script[type="application/ld+json"]') {
        return [
          {
            textContent: JSON.stringify({
              "@context": "https://schema.org/",
              "@type": "Product",
              name: "Acid Wash Vintage Oversized Hoodie",
              image: "https://cdn.shopify.com/s/files/1/0001/products/hoodie_medium.jpg?v=123",
              brand: { "@type": "Brand", name: "SkaterCo" },
              offers: { "@type": "Offer", price: "79.99", priceCurrency: "USD" }
            })
          }
        ];
      }
      if (selector.includes("button")) {
        return [
          { textContent: "Add to cart", getAttribute: () => null }
        ];
      }
      return [];
    },
    querySelector: (selector) => {
      if (selector.includes("price")) return { textContent: "$79.99" };
      return null;
    }
  };

  const shopifyAssessment = assessProductPage(mockShopifyDoc, {
    pathname: "/products/acid-wash-vintage-hoodie",
    href: "https://unknown-skater-apparel.myshopify.com/products/acid-wash-vintage-hoodie"
  });

  assert(shopifyAssessment.isProductPage === true, "Unknown Shopify store detected as Product Page");
  assert(shopifyAssessment.confidence >= 0.70, "Unknown Shopify store has high PDP confidence score");

  const shopifyClassification = classifyFashionAndGarment("Acid Wash Vintage Oversized Hoodie", "Heavyweight fleece hoodie");
  assert(shopifyClassification.isFashion === true, "Shopify hoodie correctly classified as Fashion");
  assert(shopifyClassification.category === "upper_body", "Hoodie classified under upper_body category");
  assert(shopifyClassification.garmentType === "Hoodie", "Hoodie garment type recognized as Hoodie");

  // ── 2. Unknown Indian D2C Ethnic Startup ──
  const mockIndianStartupDoc = {
    pathname: "/shop/pure-cotton-anarkali-kurti-set",
    href: "https://small-artisan-brand.in/shop/pure-cotton-anarkali-kurti-set",
    querySelectorAll: (selector) => {
      if (selector === 'script[type="application/ld+json"]') return [];
      if (selector.includes("button")) {
        return [
          { textContent: "Add to Bag", getAttribute: () => null },
          { textContent: "Buy Now", getAttribute: () => null }
        ];
      }
      return [];
    },
    querySelector: (selector) => {
      if (selector.includes("price")) return { textContent: "₹ 2,499.00" };
      if (selector.includes("size")) return { textContent: "Size: M" };
      return null;
    }
  };

  const indianAssessment = assessProductPage(mockIndianStartupDoc, {
    pathname: "/shop/pure-cotton-anarkali-kurti-set",
    href: "https://small-artisan-brand.in/shop/pure-cotton-anarkali-kurti-set"
  });

  assert(indianAssessment.isProductPage === true, "Unknown Indian D2C store detected as Product Page via DOM heuristics");
  const ethnicClassification = classifyFashionAndGarment("Handblock Printed Anarkali Kurti Set with Dupatta", "Pure mulmul cotton");
  assert(ethnicClassification.isFashion === true, "Indian ethnic apparel classified as Fashion");
  assert(ethnicClassification.garmentType === "Anarkali Suit" || ethnicClassification.category === "full_body", "Ethnic ensemble correctly classified");

  // ── 3. Unknown WooCommerce Store ──
  const mockWooDoc = {
    pathname: "/product/italian-linen-summer-jacket/",
    href: "https://bespoke-tailor.co.uk/product/italian-linen-summer-jacket/",
    querySelectorAll: (selector) => {
      if (selector === 'script[type="application/ld+json"]') return [];
      if (selector.includes("button")) return [{ textContent: "Add to basket", getAttribute: () => null }];
      return [];
    },
    querySelector: (selector) => {
      if (selector.includes("price")) return { textContent: "£185.00" };
      return null;
    }
  };

  const wooAssessment = assessProductPage(mockWooDoc, {
    pathname: "/product/italian-linen-summer-jacket/",
    href: "https://bespoke-tailor.co.uk/product/italian-linen-summer-jacket/"
  });
  assert(wooAssessment.isProductPage === true, "Unknown WooCommerce store detected as Product Page");

  // ── 4. Non-Fashion Site Detection (Electronics, Hardware, Books) ──
  const electronicsClass = classifyFashionAndGarment("Apple iPhone 16 Pro Max Silicone Case with MagSafe", "Drop protection case");
  assert(electronicsClass.isFashion === false, "Phone case is correctly rejected from Fashion try-on");
  assert(electronicsClass.category === "other", "Non-apparel item categorized as 'other'");

  const laptopClass = classifyFashionAndGarment("Dell XPS 15 4K Touchscreen Laptop 32GB RAM", "Intel Core i9");
  assert(laptopClass.isFashion === false, "Laptop is correctly rejected from Fashion try-on");

  const kitchenwareClass = classifyFashionAndGarment("Prestige Non-Stick 3-Piece Cookware Set", "Frying pan and kadai");
  assert(kitchenwareClass.isFashion === false, "Kitchenware is correctly rejected from Fashion try-on");

  // ── 5. Non-Product Page Rejection (Checkout, Cart, Account) ──
  const cartAssessment = assessProductPage(mockShopifyDoc, {
    pathname: "/checkout",
    href: "https://any-fashion-store.com/checkout"
  });
  assert(cartAssessment.isProductPage === false, "Checkout page is correctly skipped");

  const loginAssessment = assessProductPage(mockShopifyDoc, {
    pathname: "/account/login",
    href: "https://any-fashion-store.com/account/login"
  });
  assert(loginAssessment.isProductPage === false, "Login page is correctly skipped");

  // ── 6. Autonomous Generic CDN Image Resolution ──
  // Cloudinary generic upgrade
  const cloudinaryRaw = "https://res.cloudinary.com/store/image/upload/c_scale,w_300/v1/shirt.jpg";
  const cloudinaryHd = upgradeGenericImageUrl(cloudinaryRaw);
  assert(cloudinaryHd.includes("w_1440"), "Cloudinary CDN images automatically upgraded to 1440w HD");

  // Shopify CDN generic upgrade
  const shopifyRaw = "https://cdn.shopify.com/s/files/1/products/denim_compact.jpg?width=300";
  const shopifyHd = upgradeGenericImageUrl(shopifyRaw);
  assert(shopifyHd.includes("_master.jpg") && shopifyHd.includes("width=1440"), "Shopify CDN images automatically upgraded from compact to _master HD");

  // Imgix / Fastly generic upgrade
  const imgixRaw = "https://images.customstore.com/items/jacket.jpg?w=400&quality=60";
  const imgixHd = upgradeGenericImageUrl(imgixRaw);
  assert(imgixHd.includes("w=1440") && imgixHd.includes("quality=95"), "Imgix query downsampling automatically elevated to HD");

  // Scene7 generic upgrade
  const scene7Raw = "https://s7.brand.com/is/image/Brand/dress?wid=350";
  const scene7Hd = upgradeGenericImageUrl(scene7Raw);
  assert(scene7Hd.includes("wid=1600"), "Scene7 / Adobe media automatically elevated to wid=1600");

  // ── 7. Fashion Taxonomy Breadth Tests (Western & Indian Ethnic) ──
  const testGarments = [
    { title: "Men's Slim Fit Chino Trousers", expectedCat: "lower_body", expectedType: "Trousers" },
    { title: "Kanjivaram Silk Wedding Saree with Zari Border", expectedCat: "full_body", expectedType: "Saree" },
    { title: "Bandhgala Jodhpuri Suit for Men", expectedCat: "upper_body", expectedType: "Nehru Jacket" },
    { title: "Bridal Embroidered Lehenga Choli", expectedCat: "full_body", expectedType: "Lehenga" },
    { title: "Floral Chiffon Summer Maxi Dress", expectedCat: "full_body", expectedType: "Dress" },
    { title: "Men's Air Jordan Retro High Sneakers", expectedCat: "shoes", expectedType: "Sneakers" },
    { title: "Polarized Wayfarer Sunglasses", expectedCat: "accessories", expectedType: "Sunglasses" },
    { title: "High Rise Wide Leg Ripped Jeans", expectedCat: "lower_body", expectedType: "Jeans" },
    { title: "Royal Raw Silk Embroidered Sherwani", expectedCat: "full_body", expectedType: "Sherwani" },
  ];

  for (const g of testGarments) {
    const res = classifyFashionAndGarment(g.title, "");
    assert(res.isFashion === true && res.category === g.expectedCat, `Fashion item "${g.title}" mapped to ${g.expectedCat} (${res.garmentType})`);
  }

  // ── 8. Size & Stock Availability Extraction ──
  const mockSizeDoc = {
    querySelectorAll: (sel) => {
      if (sel.includes("button")) {
        return [
          { textContent: "S", className: "size-pill", getAttribute: () => null, hasAttribute: () => false },
          { textContent: "M", className: "size-pill", getAttribute: () => null, hasAttribute: () => false },
          { textContent: "L", className: "size-pill disabled out-of-stock", getAttribute: () => null, hasAttribute: () => true },
          { textContent: "XL", className: "size-pill", getAttribute: () => null, hasAttribute: () => false },
        ];
      }
      return [];
    },
    querySelector: () => null,
  };

  const sizes = extractSizesFromPage(mockSizeDoc);
  assert(sizes.available.includes("S") && sizes.available.includes("M") && sizes.available.includes("XL"), "Available sizes (S, M, XL) extracted");
  assert(sizes.outOfStock.includes("L"), "Out of stock size (L) correctly recognized");

  console.log(`\n========================================`);
  console.log(`Generic Detector Results: ${passed} passed, ${failed} failed.`);
  console.log(`========================================\n`);

  if (failed > 0) process.exit(1);
}

runGenericDetectorTests();
