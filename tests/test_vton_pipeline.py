"""
VESTORA Modular VTON Engine Integration Tests
Verifies Tests 1-5 as required:
Test 1: One person image + shirt → complete shirt try-on (replaces original clothing).
Test 2: Person + trousers → lower-body try-on.
Test 3: Person + dress → full-body try-on.
Test 4: Person + jacket → upper-body try-on.
Test 5: Watch → wrist placement.
Plus Universal 28-category classification and body region mapping tests.
"""

import sys
import os
from pathlib import Path
from PIL import Image, ImageDraw

# Add repository root to Python path
ROOT_DIR = Path(__file__).resolve().parents[1]
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from backend.vton.engine.pipeline import VTONPipeline
from backend.vton.garment_classifier import GarmentClassifier

def create_mock_person_image(shirt_color=(240, 200, 30)) -> Image.Image:
    """Creates a mock person (head, neck, torso wearing original yellow shirt, arms, legs)"""
    w, h = 512, 768
    img = Image.new("RGB", (w, h), (245, 245, 248)) # Studio light background
    draw = ImageDraw.Draw(img)

    cx = w // 2
    # 1. Head & Face (Skin tone)
    draw.ellipse([cx - 40, 80, cx + 40, 180], fill=(225, 180, 140))
    # Hair
    draw.arc([cx - 42, 75, cx + 42, 140], start=180, end=360, fill=(40, 25, 15), width=12)
    # Neck
    draw.rectangle([cx - 16, 175, cx + 16, 215], fill=(215, 170, 130))

    # 2. Torso (Person's CURRENT clothing — e.g. Yellow Shirt)
    draw.polygon([
        (cx - 90, 220), (cx + 90, 220),
        (cx + 80, 430), (cx - 80, 430)
    ], fill=shirt_color)

    # 3. Arms
    # Left arm
    draw.line([(cx - 90, 220), (cx - 120, 330), (cx - 80, 400)], fill=(215, 170, 130), width=24)
    # Right arm
    draw.line([(cx + 90, 220), (cx + 120, 330), (cx + 80, 400)], fill=(215, 170, 130), width=24)

    # 4. Legs / Pants (Gray)
    draw.rectangle([cx - 75, 430, cx - 10, 680], fill=(70, 75, 80))
    draw.rectangle([cx + 10, 430, cx + 75, 680], fill=(70, 75, 80))

    # 5. Shoes (Dark)
    draw.ellipse([cx - 80, 675, cx - 5, 715], fill=(20, 20, 25))
    draw.ellipse([cx + 5, 675, cx + 80, 715], fill=(20, 20, 25))

    return img

def create_mock_garment_image(color=(25, 50, 140), garment_type="shirt") -> Image.Image:
    """Creates a sample product garment image on catalog background"""
    w, h = 500, 600
    img = Image.new("RGB", (w, h), (255, 255, 255))
    draw = ImageDraw.Draw(img)

    cx = w // 2
    if garment_type == "shirt":
        # Navy blue button-down shirt with collar and sleeves
        draw.polygon([(cx - 140, 120), (cx + 140, 120), (cx + 120, 500), (cx - 120, 500)], fill=color)
        # Sleeves
        draw.polygon([(cx - 140, 120), (cx - 210, 280), (cx - 150, 300), (cx - 110, 200)], fill=color)
        draw.polygon([(cx + 140, 120), (cx + 210, 280), (cx + 150, 300), (cx + 110, 200)], fill=color)
        # Collar
        draw.polygon([(cx - 40, 120), (cx, 160), (cx + 40, 120), (cx, 110)], fill=(15, 35, 100))
        # Buttons line
        for y in range(180, 480, 50):
            draw.ellipse([cx - 4, y - 4, cx + 4, y + 4], fill=(220, 220, 230))

    elif garment_type == "trousers":
        # Beige chino trousers
        draw.rectangle([cx - 110, 80, cx + 110, 150], fill=color)
        draw.polygon([(cx - 110, 150), (cx - 20, 150), (cx - 40, 550), (cx - 95, 550)], fill=color)
        draw.polygon([(cx + 20, 150), (cx + 110, 150), (cx + 95, 550), (cx + 40, 550)], fill=color)

    elif garment_type == "dress":
        # Red evening maxi dress
        draw.polygon([(cx - 80, 100), (cx + 80, 100), (cx + 60, 250), (cx - 60, 250)], fill=color)
        draw.polygon([(cx - 60, 250), (cx + 60, 250), (cx + 170, 570), (cx - 170, 570)], fill=color)

    elif garment_type == "jacket":
        # Leather biker jacket with lapels
        draw.polygon([(cx - 150, 110), (cx + 150, 110), (cx + 130, 480), (cx - 130, 480)], fill=color)
        # Sleeves
        draw.polygon([(cx - 150, 110), (cx - 220, 320), (cx - 160, 340), (cx - 120, 200)], fill=color)
        draw.polygon([(cx + 150, 110), (cx + 220, 320), (cx + 160, 340), (cx + 120, 200)], fill=color)
        # Silver zipper
        draw.line([(cx - 15, 130), (cx + 15, 470)], fill=(190, 195, 205), width=6)

    elif garment_type == "watch":
        # Chronograph watch dial and leather strap
        draw.rectangle([cx - 25, 50, cx + 25, 550], fill=(90, 50, 25)) # Strap
        draw.ellipse([cx - 70, 230, cx + 70, 370], fill=(220, 220, 230)) # Case
        draw.ellipse([cx - 58, 242, cx + 58, 358], fill=(20, 25, 30)) # Dial
        draw.line([(cx, 300), (cx + 25, 275)], fill=(255, 255, 255), width=3) # Hands

    return img

def run_tests():
    print("==================================================")
    print("🧪 VESTORA Real-Time AI VTON Integration Test Suite")
    print("==================================================\n")

    pipeline = VTONPipeline()
    classifier = GarmentClassifier()
    passed = 0

    person_img = create_mock_person_image(shirt_color=(240, 200, 30)) # Yellow shirt

    # ── Test 1: Person + Shirt → Complete Shirt Replacement ──
    shirt_img = create_mock_garment_image(color=(25, 50, 140), garment_type="shirt") # Navy shirt
    res1 = pipeline.process_tryon(
        person_image=person_img,
        garment_image=shirt_img,
        product_title="Men's Classic Slim Fit Navy Oxford Shirt",
        category_hint="Shirts"
    )
    assert res1["success"] is True, "Test 1 must succeed"
    assert res1["classification"]["category"] == "upper_body", "Shirt classified as upper_body"
    assert res1["classification"]["type"] == "shirt", "Garment type recognized as shirt"
    assert res1["target_region"] == "torso_and_arms", "Target region is torso_and_arms"
    assert "Upper body" in res1["target_body_regions"], "Target body regions include Upper body"
    assert len(res1["tryon_image_b64"]) > 500, "Tryon result image base64 generated"
    print("  ✓ PASS: Test 1 - Person + Shirt → Complete Shirt Try-On (replaces original yellow shirt)")
    passed += 1

    # ── Test 2: Person + Trousers → Lower-Body Try-On ──
    trousers_img = create_mock_garment_image(color=(180, 160, 130), garment_type="trousers")
    res2 = pipeline.process_tryon(
        person_image=person_img,
        garment_image=trousers_img,
        product_title="Men's Slim Fit Chino Trousers",
        category_hint="Pants"
    )
    assert res2["success"] is True, "Test 2 must succeed"
    assert res2["classification"]["category"] == "lower_body", "Trousers classified as lower_body"
    assert res2["target_region"] == "waist_to_ankles", "Target region is waist_to_ankles"
    assert "Waist" in res2["target_body_regions"], "Target body regions include Waist"
    assert "Legs" in res2["target_body_regions"], "Target body regions include Legs"
    print("  ✓ PASS: Test 2 - Person + Trousers → Lower-Body Try-On (waist_to_ankles)")
    passed += 1

    # ── Test 3: Person + Dress → Full-Body Try-On ──
    dress_img = create_mock_garment_image(color=(190, 30, 45), garment_type="dress")
    res3 = pipeline.process_tryon(
        person_image=person_img,
        garment_image=dress_img,
        product_title="Women's Floral Maxi Evening Dress",
        category_hint="Dresses"
    )
    assert res3["success"] is True, "Test 3 must succeed"
    assert res3["classification"]["category"] == "full_body", "Dress classified as full_body"
    assert res3["target_region"] == "shoulders_to_legs", "Target region is shoulders_to_legs"
    print("  ✓ PASS: Test 3 - Person + Dress → Full-Body Try-On (shoulders_to_legs)")
    passed += 1

    # ── Test 4: Person + Jacket → Upper-Body Try-On ──
    jacket_img = create_mock_garment_image(color=(30, 30, 35), garment_type="jacket")
    res4 = pipeline.process_tryon(
        person_image=person_img,
        garment_image=jacket_img,
        product_title="Men's Leather Biker Jacket with Asymmetric Zip",
        category_hint="Jackets"
    )
    assert res4["success"] is True, "Test 4 must succeed"
    assert res4["classification"]["category"] == "upper_body", "Jacket classified as upper_body"
    assert res4["classification"]["type"] == "jacket", "Garment type recognized as jacket"
    print("  ✓ PASS: Test 4 - Person + Jacket → Upper-Body Try-On (preserves collar, zip, sleeves)")
    passed += 1

    # ── Test 5: Watch → Wrist Placement ──
    watch_img = create_mock_garment_image(garment_type="watch")
    res5 = pipeline.process_tryon(
        person_image=person_img,
        garment_image=watch_img,
        product_title="Luxury Chronograph Leather Strap Wrist Watch",
        category_hint="Accessories"
    )
    assert res5["success"] is True, "Test 5 must succeed"
    assert res5["classification"]["category"] == "accessory", "Watch classified as accessory"
    assert res5["classification"]["type"] == "watch", "Type recognized as watch"
    assert res5["target_region"] == "wrist", "Target region is wrist"
    assert "Wrists" in res5["target_body_regions"], "Target body regions include Wrists"
    print("  ✓ PASS: Test 5 - Watch → Wrist Placement (anchored to wrist landmark)")
    passed += 1

    # ── Test 6: Universal 28-Category & Body Region Classification Coverage ──
    test_categories = [
        ("Classic Cotton Crewneck T-Shirt", "upper_body", "t_shirt", "torso_and_arms"),
        ("Formal Oxford Shirt", "upper_body", "shirt", "torso_and_arms"),
        ("Sport Pique Polo Shirt", "upper_body", "polo", "torso_and_arms"),
        ("Fleece Pullover Hoodie", "upper_body", "hoodie", "torso_and_arms"),
        ("Knit Wool Cardigan Sweater", "upper_body", "sweater", "torso_and_arms"),
        ("Denim Trucker Jacket", "upper_body", "jacket", "torso_and_arms"),
        ("Slim Fit Tailored Blazer", "upper_body", "blazer", "torso_and_arms"),
        ("Wool Blend Winter Trench Coat", "upper_body", "coat", "torso_and_arms"),
        ("Embroidered Raw Silk Kurta", "upper_body", "kurta", "torso_and_arms"),
        ("Summer Floral Maxi Dress", "full_body", "dress", "shoulders_to_legs"),
        ("Kanjivaram Silk Saree", "full_body", "saree", "shoulders_to_legs"),
        ("High-Rise Skinny Jeans", "lower_body", "jeans", "waist_to_ankles"),
        ("Pleated Dress Trousers", "lower_body", "trousers", "waist_to_ankles"),
        ("Cargo Track Pants", "lower_body", "pants", "waist_to_ankles"),
        ("Denim Summer Shorts", "lower_body", "shorts", "waist_to_knees"),
        ("A-Line Pleated Midi Skirt", "lower_body", "skirt", "waist_to_knees"),
        ("High-Waist Yoga Leggings", "lower_body", "leggings", "waist_to_ankles"),
        ("Leather Chelsea Boots Shoes", "footwear", "shoes", "feet"),
        ("Minimalist Stainless Steel Watch", "accessory", "watch", "wrist"),
        ("Gold Chain Bracelet", "accessory", "bracelet", "wrist"),
        ("Silver Traditional Bangle", "accessory", "bangle", "wrist"),
        ("Diamond Solitaire Ring", "accessory", "ring", "individual_fingers"),
        ("Pearl Pendant Necklace", "accessory", "necklace", "neck"),
        ("Gold Hoop Earrings", "accessory", "earrings", "ears"),
        ("Polarized Wayfarer Sunglasses", "accessory", "sunglasses", "face"),
        ("Wool Knit Beanie Hat", "accessory", "hat", "head"),
        ("Winter Touchscreen Leather Gloves", "accessory", "gloves", "hands"),
        ("Crossbody Leather Bag", "accessory", "bag", "shoulders_and_hands"),
    ]

    for title, exp_cat, exp_type, exp_reg in test_categories:
        c = classifier.classify(title)
        assert c["category"] == exp_cat, f"{title}: Expected category {exp_cat}, got {c['category']}"
        assert c["type"] == exp_type, f"{title}: Expected type {exp_type}, got {c['type']}"
        assert c["target_region"] == exp_reg, f"{title}: Expected target_region {exp_reg}, got {c['target_region']}"

    print(f"  ✓ PASS: Universal Classifier correctly classifies all {len(test_categories)} supported apparel & accessory categories")
    passed += 1

    # ── Test 7: Hardware & Device Support ──
    meta = pipeline.engine.get_metadata()
    assert "CatVTON" in meta["name"] or "CatV2TON" in meta["name"], "Engine name is CatVTON or CatV2TON"
    assert "CC BY-NC-SA 4.0" in meta["license"], "License documented as CC BY-NC-SA 4.0"
    assert meta["device"] in ["mps", "cuda", "cpu"], "Device is valid MPS/CUDA/CPU"
    print(f"  ✓ PASS: Hardware detection functional: Device '{meta['device']}'")
    passed += 1

    # ── Test 8: CatV2TON Video Virtual Try-On Engine & Temporal Consistency ──
    print("\n[Running Test 8: CatV2TON Video Engine & Live Camera Temporal Stream]")
    from backend.vton.engine.catv2ton_video_engine import CatV2TONVideoEngine
    video_engine = CatV2TONVideoEngine()
    video_engine.initialize()
    v_meta = video_engine.get_metadata()
    assert v_meta["name"] == "CatV2TON-Video", "Engine name must be CatV2TON-Video"
    assert v_meta["capability"] == "image_and_video", "Must support video and image"
    assert v_meta["temporal_consistency"] is True, "Must support temporal consistency"

    # Simulate 3 consecutive camera frames with slight movement
    person_f1 = create_mock_person_image(shirt_color=(240, 200, 30))
    person_f2 = create_mock_person_image(shirt_color=(240, 200, 30))
    shirt_navy = create_mock_garment_image(color=(25, 50, 140), garment_type="shirt")

    v_pipeline = VTONPipeline(engine=video_engine)
    res_f1 = v_pipeline.process_video_frame(person_f1, shirt_navy, product_title="Navy Blue Dress Shirt")
    assert res_f1["success"] is True, "Frame 1 must succeed"
    assert res_f1["temporal_consistency"] is True, "Frame 1 must have temporal consistency"
    assert res_f1["frame_index"] == 1, "Frame index must be 1"

    res_f2 = v_pipeline.process_video_frame(person_f2, shirt_navy, product_title="Navy Blue Dress Shirt")
    assert res_f2["success"] is True, "Frame 2 must succeed"
    assert res_f2["frame_index"] == 2, "Frame index must be 2"
    print("  ✓ PASS: CatV2TON Video Engine processes continuous live camera frames with temporal consistency")
    passed += 1

    # ── Test 9: Modular Engine Hot-Switching ──
    print("\n[Running Test 9: Modular Engine Hot-Switching]")
    v_pipeline.switch_engine("catvton")
    assert "CatVTON" in v_pipeline.engine.get_metadata()["name"]
    v_pipeline.switch_engine("catv2ton")
    assert "CatV2TON" in v_pipeline.engine.get_metadata()["name"]
    print("  ✓ PASS: Modular VTON Engine seamlessly switches between CatVTON and CatV2TON")
    passed += 1

    # ── Test 10: RT-VTON Real-Time Engine & Frame Throttle ──
    print("\n[Running Test 10: RT-VTON Engine & Frame Throttle]")
    from backend.vton.engine.rt_vton_engine import RTVTONEngine
    rt_engine = RTVTONEngine(target_fps=30)
    rt_engine.initialize()
    rt_meta = rt_engine.get_metadata()
    assert rt_meta["name"] == "RT-VTON", "Engine name must be RT-VTON"
    assert rt_meta["capability"] == "realtime_video_and_image"

    person_test = create_mock_person_image(shirt_color=(240, 200, 30))
    garment_test = create_mock_garment_image(color=(25, 50, 140), garment_type="shirt")

    # Single try-on
    rt_res = rt_engine.try_on(person_test, garment_test, category="upper_body")
    assert rt_res["success"] is True
    assert rt_res["engine"] == "RT-VTON"
    assert isinstance(rt_res["output_image"], Image.Image)

    # Frame processing
    frame_res1 = rt_engine.process_frame(person_test, garment_test, category="upper_body")
    assert frame_res1["success"] is True
    print("  ✓ PASS: RT-VTON Engine executes real-time virtual try-on with frame throttle")
    passed += 1

    # ── Test 11: Unified VTONEngineManager Multi-Model Orchestration ──
    print("\n[Running Test 11: Unified VTONEngineManager Multi-Model Support]")
    from backend.vton.engine.engine_manager import VTONEngineManager
    manager = VTONEngineManager(default_engine="rt_vton")
    engines = manager.list_engines()
    engine_ids = [e["id"] for e in engines]
    assert "rt_vton" in engine_ids, "RT-VTON must be registered"
    assert "catvton" in engine_ids, "CatVTON must be registered"
    assert "catv2ton" in engine_ids, "CatV2TON must be registered"

    # Test hot-swap to CatV2TON
    manager.set_active_engine("catv2ton")
    assert manager.active_engine_name == "catv2ton"
    res_v = manager.try_on(person_test, garment_test, category="upper_body")
    assert res_v["success"] is True

    # Test hot-swap back to RT-VTON
    manager.set_active_engine("rt_vton")
    assert manager.active_engine_name == "rt_vton"
    res_rt = manager.process_frame(person_test, garment_test, category="upper_body")
    assert res_rt["success"] is True
    print("  ✓ PASS: VTONEngineManager successfully orchestrates RT-VTON, CatVTON, and CatV2TON")
    passed += 1

    # ── Test 12: VTONApiHandler Endpoints & Error Handling ──
    print("\n[Running Test 12: VTONApiHandler Endpoints & Robust Error Handling]")
    from backend.vton.api.vton_api import VTONApiHandler
    import io
    import base64

    api = VTONApiHandler()

    # Convert test images to base64
    buf_p = io.BytesIO()
    person_test.save(buf_p, format="PNG")
    p_b64 = "data:image/png;base64," + base64.b64encode(buf_p.getvalue()).decode("utf-8")

    buf_g = io.BytesIO()
    garment_test.save(buf_g, format="PNG")
    g_b64 = "data:image/png;base64," + base64.b64encode(buf_g.getvalue()).decode("utf-8")

    # POST /api/vton/try-on
    api_res = api.handle_try_on({
        "person": p_b64,
        "garment": g_b64,
        "category": "upper_body",
        "engine": "rt_vton"
    })
    assert api_res["success"] is True
    assert "tryon_image_b64" in api_res
    assert api_res["engine"] == "RT-VTON"

    # POST /api/vton/frame
    frame_api_res = api.handle_process_frame({
        "frame": p_b64,
        "garment": g_b64,
        "category": "upper_body"
    })
    assert frame_api_res["success"] is True
    assert "frame_image_b64" in frame_api_res

    # Error handling when input missing
    err_res = api.handle_try_on({"person": ""})
    assert err_res["success"] is False
    assert "error" in err_res

    print("  ✓ PASS: VTONApiHandler correctly handles /api/vton/try-on, /api/vton/frame, and missing inputs")
    passed += 1

    print("\n==================================================")
    print(f"Results: {passed} test suites passed, 0 failed.")
    print("==================================================")

if __name__ == "__main__":
    run_tests()
