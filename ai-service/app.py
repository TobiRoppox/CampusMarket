"""
Campus Market 2.0 — AI Recommendation Service
Flask REST API wrapper around the recommendation engine.

Only the backend calls this service (server to server), authenticated with the
shared AI_SERVICE_SECRET header. It returns product IDs; the backend loads the
products and applies its own visibility rules.
"""

import hmac
import os

from dotenv import load_dotenv
from flask import Flask, jsonify, request

load_dotenv()

from recommender import get_recommendations, get_similar  # noqa: E402  (needs env loaded)

app = Flask(__name__)

AI_SECRET = os.environ.get("AI_SERVICE_SECRET", "")
if len(AI_SECRET) < 16:
    raise RuntimeError("Set AI_SERVICE_SECRET (16+ characters) to the same value as the backend.")


@app.before_request
def check_secret():
    if request.path == "/health":
        return None
    supplied = request.headers.get("X-AI-Secret", "")
    if not hmac.compare_digest(supplied.encode(), AI_SECRET.encode()):
        return jsonify({"error": "Unauthorised"}), 401
    return None


def requested_count(default: int) -> int:
    try:
        return max(1, min(50, int(request.args.get("n", default))))
    except ValueError:
        return default


@app.route("/health")
def health():
    return jsonify({"status": "ok"})


@app.route("/recommend/<user_id>")
def recommend(user_id):
    try:
        product_ids = get_recommendations(user_id, n=requested_count(12))
    except Exception:
        app.logger.exception("Recommendation error for %s", user_id)
        return jsonify({"error": "Recommendation service error"}), 500
    return jsonify({"user_id": user_id, "recommended_product_ids": product_ids, "count": len(product_ids)})


@app.route("/similar/<product_id>")
def similar(product_id):
    try:
        product_ids = get_similar(product_id, n=requested_count(8))
    except Exception:
        app.logger.exception("Similar products error for %s", product_id)
        return jsonify({"error": "Service error"}), 500
    return jsonify({"product_id": product_id, "similar_product_ids": product_ids, "count": len(product_ids)})


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5002))
    debug = os.environ.get("FLASK_ENV") == "development"
    app.run(host="127.0.0.1", port=port, debug=debug)
