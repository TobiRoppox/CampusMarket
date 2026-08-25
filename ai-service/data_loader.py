"""
data_loader.py — Supabase data fetching utilities for the AI service.
Centralises all database reads so recommender.py stays clean.
"""

import os
import pandas as pd
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

_client = None


def get_client():
    """Lazy-initialise the Supabase client (singleton)."""
    global _client
    if _client is None:
        url = os.environ["SUPABASE_URL"]
        key = os.environ["SUPABASE_SERVICE_KEY"]
        _client = create_client(url, key)
    return _client


def load_all_behavior() -> pd.DataFrame:
    """
    Load the full user-behaviour log.
    Returns a DataFrame with columns: user_id, product_id, action, score.
    """
    sb = get_client()
    rows = (
        sb.table("user_behavior")
        .select("user_id, product_id, action, logged_at")
        .execute()
        .data
    )
    if not rows:
        return pd.DataFrame(columns=["user_id", "product_id", "action", "score"])

    df = pd.DataFrame(rows)
    weights = {"view": 1, "cart_add": 3, "wishlist": 2, "purchase": 5}
    df["score"] = df["action"].map(weights).fillna(1)
    return df


def load_user_behavior(user_id: str) -> pd.DataFrame:
    """Load behaviour for a single user."""
    sb = get_client()
    rows = (
        sb.table("user_behavior")
        .select("product_id, action")
        .eq("user_id", user_id)
        .execute()
        .data
    )
    if not rows:
        return pd.DataFrame(columns=["product_id", "action", "score"])

    df = pd.DataFrame(rows)
    weights = {"view": 1, "cart_add": 3, "wishlist": 2, "purchase": 5}
    df["score"] = df["action"].map(weights).fillna(1)
    return df


def load_active_products() -> pd.DataFrame:
    """
    Load all active products with fields used for content-based filtering.
    Returns: id, name, category, price, stall_id
    """
    sb = get_client()
    rows = (
        sb.table("products")
        .select("id, name, category, price, stall_id")
        .eq("is_active", True)
        .execute()
        .data
    )
    return pd.DataFrame(rows) if rows else pd.DataFrame()


def get_popular_product_ids(n: int = 12) -> list:
    """
    Return the top-N most interacted-with product IDs across all users.
    Used as the cold-start fallback.
    """
    sb = get_client()
    rows = (
        sb.table("user_behavior")
        .select("product_id, action")
        .execute()
        .data
    )
    if not rows:
        # Final fallback: newest products
        newest = (
            sb.table("products")
            .select("id")
            .eq("is_active", True)
            .order("created_at", desc=True)
            .limit(n)
            .execute()
            .data
        )
        return [r["id"] for r in newest]

    weights = {"view": 1, "cart_add": 3, "wishlist": 2, "purchase": 5}
    df = pd.DataFrame(rows)
    df["score"] = df["action"].map(weights).fillna(1)
    top = df.groupby("product_id")["score"].sum().nlargest(n).index.tolist()
    return top


def get_product_by_id(product_id: str) -> dict | None:
    """Fetch a single product record."""
    sb = get_client()
    result = (
        sb.table("products")
        .select("id, name, category, price, stall_id, is_active")
        .eq("id", product_id)
        .single()
        .execute()
    )
    return result.data