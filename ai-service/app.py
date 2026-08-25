"""
Campus Market 2.0 — AI Recommendation Service
Flask REST API wrapper around the recommendation engine.
"""

import os
from flask import Flask, jsonify, request
from flask_cors import CORS
from dotenv import load_dotenv
from recommender import get_recommendations, get_similar

load_dotenv()

app = Flask(__name__)
CORS(app, origins=[os.environ.get("BACKEND_URL", "http://localhost:4000")])

# ── Simple API key auth for internal service calls ─────────────────────────────
AI_SECRET = os.environ.get("AI_SERVICE_SECRET", "change-me-in-production")


def check_secret():
    secret = request.headers.get("X-AI-Secret")
    if secret != AI_SECRET:
        return jsonify({"error": "Unauthorised"}), 401
    return None


# ── Health check ──────────────────────────────────────────────────────────────
@app.route("/health")
def health():
    return jsonify({"status": "ok"})


# ── GET /recommend/<user_id> ──────────────────────────────────────────────────
@app.route("/recommend/<user_id>")
def recommend(user_id):
    err = check_secret()
    if err:
        return err

    n = int(request.args.get("n", 12))
    try:
        product_ids = get_recommendations(user_id, n=n)
        return jsonify({
            "user_id": user_id,
            "recommended_product_ids": product_ids,
            "count": len(product_ids),
        })
    except Exception as e:
        app.logger.error(f"Recommendation error for {user_id}: {e}")
        return jsonify({"error": "Recommendation service error", "detail": str(e)}), 500


# ── GET /similar/<product_id> ─────────────────────────────────────────────────
@app.route("/similar/<product_id>")
def similar(product_id):
    err = check_secret()
    if err:
        return err

    n = int(request.args.get("n", 8))
    try:
        product_ids = get_similar(product_id, n=n)
        return jsonify({
            "product_id": product_id,
            "similar_product_ids": product_ids,
            "count": len(product_ids),
        })
    except Exception as e:
        app.logger.error(f"Similar products error for {product_id}: {e}")
        return jsonify({"error": "Service error", "detail": str(e)}), 500


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5001))
    debug = os.environ.get("FLASK_ENV") == "development"
    app.run(host="0.0.0.0", port=port, debug=debug)