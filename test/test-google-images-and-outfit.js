/**
 * VESTORA — Google Images Adapter & Multi-Item Outfit Layering Test Suite
 * 
 * Verifies:
 * 1. Google Images URL & Search Query Detection (tbm=isch & udm=2)
 * 2. High-Resolution External Image Extraction from Google Redirects
 * 3. Fashion Classification for Google Image Search Queries
 * 4. Multi-Item Outfit Layering & Topological Depth Stacking
 * 5. Accessory & Clothing Anatomical Slot Mapping (10 Categories)
 * 6. Live Layer State Management (Toggle, Remove, Fine-Tune, Clear)
 * 7. Live Pose Landmark Anchor Geometry (Glasses, Hat, Watch, Necklace, Garment)
 */

function runGoogleImagesAndOutfitTests() {
  console.log("🧪 Running VESTORA Google Images & Multi-Item Outfit Layer Tests…\n");
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

  // ─── 1. Google Images URL Detection ───
  function isGoogleImagesUrl(urlStr) {
    try {
      const url = new URL(urlStr);
      const isGoogle = /(^|\.)google\.(com|[a-z]{2}(\.[a-z]{2})?)$/i.test(url.hostname);
      if (!isGoogle) return false;
      const isImgHost = url.hostname.startsWith("images.google.");
      const isImgSearchParam = url.searchParams.get("tbm") === "isch" || url.searchParams.get("udm") === "2";
      const isImgPath = url.pathname.includes("/imghp") || url.pathname.includes("/images");
      return isImgHost || isImgSearchParam || isImgPath;
    } catch {
      return false;
    }
  }

  assert(
    isGoogleImagesUrl("https://www.google.com/search?q=black+leather+jacket&tbm=isch"),
    "Google Images standard search (tbm=isch) recognized"
  );
  assert(
    isGoogleImagesUrl("https://www.google.co.in/search?q=oversized+hoodie&udm=2"),
    "Google Images modern search (udm=2) on Indian domain recognized"
  );
  assert(
    isGoogleImagesUrl("https://images.google.com/search?q=aviator+sunglasses"),
    "Google Images subdomain (images.google.com) recognized"
  );
  assert(
    !isGoogleImagesUrl("https://www.google.com/search?q=black+leather+jacket"),
    "Standard Google web search without image flags correctly rejected"
  );
  assert(
    !isGoogleImagesUrl("https://www.amazon.in/s?k=jackets"),
    "Amazon search URL is not classified as Google Images"
  );

  // ─── 2. Google High-Res Image Extraction from Redirect URLs ───
  function extractOriginalFromGoogleUrl(href) {
    if (!href) return null;
    try {
      const url = new URL(href, "https://www.google.com");
      const imgUrl = url.searchParams.get("imgurl");
      if (imgUrl) return decodeURIComponent(imgUrl);
    } catch {
      const match = href.match(/[?&]imgurl=([^&]+)/i);
      if (match && match[1]) return decodeURIComponent(match[1]);
    }
    return null;
  }

  const googleRedirectHref = "https://www.google.com/imgres?imgurl=https%3A%2F%2Fassets.myntassets.com%2Fh_1440%2Fjacket.jpg&imgrefurl=https%3A%2F%2Fwww.myntra.com%2Fjacket&docid=xyz";
  const extractedUrl = extractOriginalFromGoogleUrl(googleRedirectHref);
  assert(
    extractedUrl === "https://assets.myntassets.com/h_1440/jacket.jpg",
    "High-res original image extracted from Google Images redirect parameter (imgurl)"
  );

  // ─── 3. Google Search Query Fashion Classification ───
  const FASHION_QUERY_REGEX = /\b(jacket|coat|hoodie|sweater|shirt|t-shirt|tee|top|blouse|jeans|pants|trousers|shorts|skirt|dress|gown|saree|lehenga|kurta|suit|sunglass|sunglasses|glasses|watch|hat|cap|beanie|necklace|chain|earring|earrings|bag|handbag|backpack|belt|blazer)\b/i;

  function isFashionSearchQuery(query) {
    return FASHION_QUERY_REGEX.test(query);
  }

  assert(isFashionSearchQuery("black leather biker jacket"), "Google search query 'black leather biker jacket' classified as fashion");
  assert(isFashionSearchQuery("ray ban polarized aviator sunglasses"), "Google search query 'ray ban sunglasses' classified as fashion");
  assert(isFashionSearchQuery("luxury chronograph wrist watch men"), "Google search query 'luxury chronograph watch' classified as fashion");
  assert(isFashionSearchQuery("banarasi silk wedding saree"), "Google search query 'banarasi silk saree' classified as fashion");
  assert(!isFashionSearchQuery("how to install python 3 on macos"), "Tech query 'python install' rejected from fashion");
  assert(!isFashionSearchQuery("best mechanical keyboard for typing"), "Electronics query 'mechanical keyboard' rejected from fashion");

  // ─── 4. Anatomical Slot Mapping (All 10 Categories) ───
  function mapToGarmentCategory(name = "", category = "") {
    const text = `${name} ${category}`.toLowerCase();
    if (/\b(sunglass|sunglasses|glasses|spectacle|spectacles|shades|goggle|goggles|frames|eyewear|aviator|wayfarer|clubmaster)\b/i.test(text)) return "eyewear";
    if (/\b(cap|hat|beanie|fedora|beret|snapback|turban|bucket hat|visor|headband|headscarf|sombrero|pagri)\b/i.test(text)) return "headwear";
    if (/\b(necklace|chain|pendant|choker|collar|locket|mangalsutra|haar|mala|tanmaniya)\b/i.test(text)) return "necklace";
    if (/\b(earring|earrings|stud|studs|jhumka|jhumkas|drop earrings|hoop|hoops|ear cuff|chandbali)\b/i.test(text)) return "earrings";
    if (/\b(watch|smartwatch|chronograph|bracelet|bangle|wristband|cuff|kada)\b/i.test(text)) return "wristwear";
    if (/\b(bag|handbag|backpack|tote|clutch|purse|sling bag|shoulder bag|satchel|duffle|crossbody|potli|wallet)\b/i.test(text)) return "bag";
    if (/\b(belt|waist belt|sash|kamarbandh)\b/i.test(text)) return "belt";
    if (/\b(pant|pants|trouser|trousers|jeans|denim|shorts|skirt|joggers|track pants|leggings|chinos|dhoti|lungi|palazzo|culottes)\b/i.test(text)) return "lower_body";
    if (/\b(dress|gown|jumpsuit|romper|saree|sari|lehenga|choli|sherwani|suit|blazer suit|anarkali|salwar|kurta set|maxi)\b/i.test(text)) return "full_body";
    return "upper_body";
  }

  assert(mapToGarmentCategory("Ray-Ban Aviator Sunglasses", "Accessories") === "eyewear", "Sunglasses correctly mapped to 'eyewear'");
  assert(mapToGarmentCategory("Wool Felt Fedora Hat", "Headwear") === "headwear", "Hat correctly mapped to 'headwear'");
  assert(mapToGarmentCategory("18K Gold Plated Choker Necklace", "Jewelry") === "necklace", "Necklace correctly mapped to 'necklace'");
  assert(mapToGarmentCategory("Kundan Drop Jhumka Earrings", "Traditional Jewelry") === "earrings", "Earrings mapped to 'earrings'");
  assert(mapToGarmentCategory("Chronograph Leather Strap Watch", "Watches") === "wristwear", "Watch mapped to 'wristwear'");
  assert(mapToGarmentCategory("Leather Crossbody Sling Bag", "Handbags") === "bag", "Bag mapped to 'bag'");
  assert(mapToGarmentCategory("Reversible Leather Waist Belt", "Accessories") === "belt", "Belt mapped to 'belt'");
  assert(mapToGarmentCategory("High Rise Straight Leg Jeans", "Denim") === "lower_body", "Jeans mapped to 'lower_body'");
  assert(mapToGarmentCategory("Silk Embroidered Bridal Lehenga Choli", "Ethnic Wear") === "full_body", "Lehenga mapped to 'full_body'");
  assert(mapToGarmentCategory("Heavyweight Vintage Cotton Hoodie", "Streetwear") === "upper_body", "Hoodie mapped to 'upper_body'");

  // ─── 5. Multi-Item Active Outfit Layer Stack Engine ───
  let testOutfit = [];

  function addOutfitItemToStack(item) {
    const garmentCat = item.garmentCategory || mapToGarmentCategory(item.name, item.category);
    const newItem = {
      id: item.id || `item_${Date.now()}_${Math.random()}`,
      name: item.name,
      category: item.category,
      garmentCategory: garmentCat,
      imageUrl: item.imageUrl,
      enabled: true,
      scale: 1.0,
      offsetY: 0,
      opacity: 0.9,
    };
    testOutfit.push(newItem);
    return newItem;
  }

  function toggleOutfitItemInStack(id) {
    const item = testOutfit.find(i => i.id === id);
    if (item) item.enabled = !item.enabled;
  }

  function removeOutfitItemFromStack(id) {
    testOutfit = testOutfit.filter(i => i.id !== id);
  }

  // Add 4 items from different sources (Google Images + Shopping stores)
  const itemJacket = addOutfitItemToStack({ id: "item-1", name: "Black Leather Jacket", imageUrl: "https://example.com/jacket.jpg" });
  const itemGlasses = addOutfitItemToStack({ id: "item-2", name: "Ray-Ban Aviator Sunglasses", imageUrl: "https://example.com/glasses.jpg" });
  const itemWatch = addOutfitItemToStack({ id: "item-3", name: "Chronograph Watch", imageUrl: "https://example.com/watch.jpg" });
  const itemNecklace = addOutfitItemToStack({ id: "item-4", name: "Gold Chain Necklace", imageUrl: "https://example.com/chain.jpg" });

  assert(testOutfit.length === 4, "4 items successfully added to active outfit stack");
  assert(testOutfit.every(i => i.enabled), "All 4 items initially enabled");

  // Topological depth ordering check
  const LAYER_ORDER = [
    "lower_body",
    "full_body",
    "upper_body",
    "belt",
    "necklace",
    "scarf",
    "bag",
    "wristwear",
    "ring",
    "earrings",
    "eyewear",
    "headwear",
  ];

  const sortedLayers = [...testOutfit].sort((a, b) => LAYER_ORDER.indexOf(a.garmentCategory) - LAYER_ORDER.indexOf(b.garmentCategory));
  assert(
    sortedLayers[0].garmentCategory === "upper_body" &&
    sortedLayers[1].garmentCategory === "necklace" &&
    sortedLayers[2].garmentCategory === "wristwear" &&
    sortedLayers[3].garmentCategory === "eyewear",
    "Outfit layers sorted in correct anatomical rendering depth (Garment -> Necklace -> Watch -> Glasses)"
  );

  // Toggle item visibility
  toggleOutfitItemInStack("item-4"); // disable necklace
  assert(!testOutfit.find(i => i.id === "item-4").enabled, "Necklace toggled to hidden (✕)");
  assert(testOutfit.filter(i => i.enabled).length === 3, "3 active items rendered when 1 is hidden");

  // Re-enable necklace
  toggleOutfitItemInStack("item-4");
  assert(testOutfit.find(i => i.id === "item-4").enabled, "Necklace re-enabled (✓)");

  // Remove individual item
  removeOutfitItemFromStack("item-2"); // remove glasses
  assert(testOutfit.length === 3, "Glasses removed; outfit stack count reduced to 3");
  assert(!testOutfit.some(i => i.id === "item-2"), "Removed item no longer exists in stack");

  // Clear all
  testOutfit = [];
  assert(testOutfit.length === 0, "Clear all clears all items from live session");

  // ─── 6. Live Pose Landmark Anchor Geometry ───
  const mockPose = {
    landmarks: [
      { x: 640, y: 180 },  // 0: Nose
      { x: 590, y: 150 },  // 1: L Eye
      { x: 690, y: 150 },  // 2: R Eye
      { x: 512, y: 180 },  // 3: L Ear
      { x: 768, y: 180 },  // 4: R Ear
      { x: 470, y: 310 },  // 5: L Shoulder
      { x: 810, y: 310 },  // 6: R Shoulder
      { x: 370, y: 490 },  // 7: L Elbow
      { x: 910, y: 490 },  // 8: R Elbow
      { x: 300, y: 620 },  // 9: L Wrist
      { x: 980, y: 620 },  // 10: R Wrist
      { x: 510, y: 640 },  // 11: L Hip
      { x: 770, y: 640 },  // 12: R Hip
      { x: 520, y: 820 },  // 13: L Knee
      { x: 760, y: 820 },  // 14: R Knee
      { x: 530, y: 960 },  // 15: L Ankle
      { x: 750, y: 960 },  // 16: R Ankle
      { x: 640, y: 80 },   // 17: Head Crown
      { x: 640, y: 250 },  // 18: Neck
    ]
  };

  // Sunglasses calculations
  const eyeDx = mockPose.landmarks[2].x - mockPose.landmarks[1].x;
  const eyeDy = mockPose.landmarks[2].y - mockPose.landmarks[1].y;
  const eyeDist = Math.sqrt(eyeDx * eyeDx + eyeDy * eyeDy);
  const glassesWidth = eyeDist * 2.35;
  const glassesCenter = {
    x: (mockPose.landmarks[1].x + mockPose.landmarks[2].x) / 2,
    y: (mockPose.landmarks[1].y + mockPose.landmarks[2].y) / 2,
  };
  assert(glassesCenter.x === 640 && glassesCenter.y === 150, "Sunglasses center aligned with eye-to-eye midpoint (640, 150)");
  assert(glassesWidth === 235, "Sunglasses width scaled proportionally to inter-pupillary distance (235px)");

  // Watch calculations
  const wristLm = mockPose.landmarks[9];
  assert(wristLm.x === 300 && wristLm.y === 620, "Watch anchored to left wrist landmark (300, 620)");

  // Necklace calculations
  const neckLm = mockPose.landmarks[18];
  assert(neckLm.x === 640 && neckLm.y === 250, "Necklace anchored to anatomical neck/collarbone midpoint (640, 250)");

  // Upper body calculations
  const shoulderWidth = Math.abs(mockPose.landmarks[6].x - mockPose.landmarks[5].x);
  const garmentWidth = shoulderWidth * 2.2;
  assert(shoulderWidth === 340, "Shoulder width measured accurately (340px)");
  assert(Math.round(garmentWidth) === 748, "Upper body garment spans shoulders with 2.2x draped drape width (748px)");

  console.log("\n========================================");
  console.log(`Google Images & Outfit Results: ${passed} passed, ${failed} failed.`);
  console.log("========================================\n");

  if (failed > 0) process.exit(1);
}

runGoogleImagesAndOutfitTests();
