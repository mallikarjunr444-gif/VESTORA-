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

PORT = int(os.environ.get("VTON_PORT", 5000))

# Global pipeline instance
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
                "version": "2.0.0",
                "engine": "CatVTON-Modular",
                "device": pipeline.engine.device
            })
        elif self.path == "/api/tryon/status":
            self._send_json({
                "status": "ready",
                "active_engine": "CatVTON",
                "device": pipeline.engine.device,
                "metadata": pipeline.engine.get_metadata()
            })
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
            person_img = req_data.get("person") or req_data.get("personImage")
            garment_img = req_data.get("garment") or req_data.get("garmentImage")
            title = req_data.get("title", "Garment")
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

        else:
            self._send_json({"error": "Not Found"}, status=404)

def run_server(port: int = PORT):
    server_address = ("", port)
    httpd = HTTPServer(server_address, VTONRequestHandler)
    print("==================================================")
    print(f"✨ VESTORA Modular AI VTON Server running on http://localhost:{port}")
    print(f"✨ Active Engine: CatVTON ({pipeline.engine.device.upper()})")
    print("✨ Endpoints: /api/tryon, /api/classify-garment, /api/extract-garment, /api/tryon/status")
    print("==================================================")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping VESTORA VTON Server...")
        httpd.server_close()

if __name__ == "__main__":
    run_server()
