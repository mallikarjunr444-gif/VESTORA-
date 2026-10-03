"""
VESTORA VTON HTTP API Server
Exposes clean REST API endpoints for the VESTORA Chrome Extension:
- POST /api/tryon
- POST /api/classify-garment
- POST /api/extract-garment
- GET  /api/tryon/status
- GET  /api/health
"""

import sys
import json
import base64
import os
from http.server import HTTPServer, BaseHTTPRequestHandler
from typing import Dict, Any

from ..engine.pipeline import VTONPipeline
from ..garment_classifier import GarmentClassifier
from ..garment_extractor import GarmentExtractor
from .vton_api import VTONApiHandler

PORT = int(os.environ.get("VTON_PORT", 5000))

# Global pipeline and modular API handler instances
api_handler = VTONApiHandler()
pipeline = VTONPipeline()
classifier = GarmentClassifier()
extractor = GarmentExtractor()

class VTONRequestHandler(BaseHTTPRequestHandler):
    def _send_cors_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")

    def do_OPTIONS(self):
        self.send_response(204)
        self._send_cors_headers()
        self.end_headers()

    def _send_json(self, data: Dict[str, Any], status: int = 200):
        self.send_response(status)
        self._send_cors_headers()
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps(data).encode("utf-8"))

    def do_GET(self):
        if self.path == "/api/health" or self.path == "/":
            self._send_json({
                "status": "ok",
                "service": "VESTORA Modular VTON Engine API",
                "version": "2.1.0",
                "active_engine": api_handler.manager.active_engine_name,
                "device": api_handler.manager.get_active_engine().device
            })
        elif self.path in ["/api/tryon/status", "/api/vton/status"]:
            self._send_json(api_handler.handle_status())
        elif self.path in ["/api/vton/engines", "/api/engines"]:
            self._send_json(api_handler.handle_list_engines())
        else:
            self._send_json({"error": "Not Found"}, status=404)

    def do_POST(self):
        content_length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(content_length)

        try:
            req_data = json.loads(body.decode("utf-8")) if body else {}
        except Exception as e:
            return self._send_json({"error": f"Invalid JSON payload: {str(e)}"}, status=400)

        # 1. POST /api/classify-garment
        if self.path == "/api/classify-garment":
            title = req_data.get("title", "Garment")
            category_hint = req_data.get("category", "")
            metadata = req_data.get("metadata", {})
            result = classifier.classify(title, category_hint, metadata)
            return self._send_json({"success": True, "classification": result})

        # 2. POST /api/extract-garment
        elif self.path == "/api/extract-garment":
            image_b64 = req_data.get("image") or req_data.get("imageUrl")
            category = req_data.get("category", "upper_body")
            garment_type = req_data.get("type", "shirt")

            if not image_b64:
                return self._send_json({"error": "Missing image field"}, status=400)

            try:
                res = extractor.extract_from_base64(image_b64, category=category, garment_type=garment_type)
                return self._send_json({
                    "success": True,
                    "extracted_garment_b64": res["extracted_b64"],
                    "bbox": res["bbox"]
                })
            except Exception as e:
                return self._send_json({"error": f"Extraction failed: {str(e)}"}, status=500)

        # 3. POST /api/tryon
        elif self.path == "/api/tryon":
            person_img = req_data.get("person") or req_data.get("personImage") or req_data.get("person_image")
            garment_img = req_data.get("garment") or req_data.get("garmentImage") or req_data.get("garment_image")
            title = req_data.get("title") or req_data.get("garment_name", "Garment")
            category_hint = req_data.get("category", "")
            options = req_data.get("options", {})

            if not person_img or not garment_img:
                return self._send_json({"error": "Both 'person' and 'garment' image fields are required"}, status=400)

            try:
                tryon_result = pipeline.process_tryon(
                    person_image=person_img,
                    garment_image=garment_img,
                    product_title=title,
                    category_hint=category_hint,
                    options=options
                )
                return self._send_json(tryon_result)
            except Exception as e:
                return self._send_json({"error": f"Try-on synthesis failed: {str(e)}"}, status=500)

        # 4. POST /api/tryon/video-frame (Continuous camera frame stream with temporal consistency)
        elif self.path == "/api/tryon/video-frame":
            frame_img = req_data.get("frame") or req_data.get("person") or req_data.get("person_image")
            garment_img = req_data.get("garment") or req_data.get("garmentImage") or req_data.get("garment_image")
            title = req_data.get("title") or req_data.get("garment_name", "Garment")
            category_hint = req_data.get("category", "")
            options = req_data.get("options", {})

            if not frame_img or not garment_img:
                return self._send_json({"error": "Both 'frame' and 'garment' fields are required"}, status=400)

            try:
                frame_result = pipeline.process_video_frame(
                    frame_image=frame_img,
                    garment_image=garment_img,
                    product_title=title,
                    category_hint=category_hint,
                    options=options
                )
                return self._send_json(frame_result)
            except Exception as e:
                return self._send_json({"error": f"Video frame synthesis failed: {str(e)}"}, status=500)

        # 5. POST /api/engine/switch or /api/vton/engine/switch
        elif self.path in ["/api/engine/switch", "/api/vton/engine/switch"]:
            engine_name = req_data.get("engine", "rt_vton")
            res = api_handler.handle_switch_engine(req_data)
            pipeline.switch_engine(engine_name)
            return self._send_json(res)

        # 6. POST /api/vton/try-on (Universal endpoint for RT-VTON, CatVTON, CatV2TON)
        elif self.path == "/api/vton/try-on":
            res = api_handler.handle_try_on(req_data)
            status_code = 200 if res.get("success") else 400
            return self._send_json(res, status=status_code)

        # 7. POST /api/vton/frame (Streaming camera frame endpoint)
        elif self.path == "/api/vton/frame":
            res = api_handler.handle_process_frame(req_data)
            status_code = 200 if res.get("success") else 400
            return self._send_json(res, status=status_code)

        else:
            self._send_json({"error": "Not Found"}, status=404)

def run_server(port: int = PORT):
    server_address = ("", port)
    httpd = HTTPServer(server_address, VTONRequestHandler)
    print("==================================================")
    print(f"✨ VESTORA Modular AI VTON Server running on http://localhost:{port}")
    print(f"✨ Active Engine: {api_handler.manager.active_engine_name.upper()} ({api_handler.manager.get_active_engine().device.upper()})")
    print("✨ Endpoints: /api/vton/try-on, /api/vton/frame, /api/vton/engines, /api/tryon, /api/tryon/video-frame")
    print("==================================================")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping VESTORA VTON Server...")
        httpd.server_close()

if __name__ == "__main__":
    run_server()
