"""
Campus Market 2.0 — AI Recommendation Engine
Hybrid: user-based collaborative filtering + content-based filtering
"""

import os
import numpy as np
import pandas as pd
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.preprocessing import LabelEncoder, MinMaxScaler
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

_sb = None


def get_supabase():
    global _sb
    if _sb is None:
        _sb = create_client(
            os.environ["SUPABASE_URL"],
            os.environ["SUPABASE_SERVICE_KEY"],
        )
    return _sb


# ── Action weights ────────────────────────────────────────────────────────────
ACTION_WEIGHTS = {
    "view": 1,
    "cart_add": 3,
    "wishlist": 2,
    "purchase": 5,
}


# ── Data loading ──────────────────────────────────────────────────────────────

def load_behavior_df() -> pd.DataFrame:
    """Fetch all user-product interactions from Supabase."""
    sb = get_supabase()
    rows = sb.table("user_behavior").select("user_id, product_id, action").execute().data
    if not rows:
        return pd.DataFrame(columns=["user_id", "product_id", "action", "score"])
    df = pd.DataFrame(rows)
    df["score"] = df["action"].map(ACTION_WEIGHTS).fillna(1)
    # Aggregate multiple interactions per user-product pair
    df = df.groupby(["user_id", "product_id"], as_index=False)["score"].sum()
    return df


def load_products_df() -> pd.DataFrame:
    """Fetch all active products with category and price for content-based filtering."""
    sb = get_supabase()
    rows = sb.table("products").select("id, name, category, price, stall_id").eq("is_active", True).execute().data
    return pd.DataFrame(rows) if rows else pd.DataFrame()


def build_user_item_matrix(df: pd.DataFrame) -> pd.DataFrame:
    """Build a user × product interaction matrix."""
    if df.empty:
        return pd.DataFrame()
    pivot = df.pivot_table(
        index="user_id",
        columns="product_id",
        values="score",
        aggfunc="sum",
        fill_value=0,
    )
    return pivot


# ── Collaborative filtering ───────────────────────────────────────────────────

def collaborative_filter(user_id: str, pivot: pd.DataFrame, n: int = 12) -> list:
    """
    User-based collaborative filtering.
    Finds the most similar users and recommends products they interacted with
    that the target user hasn't seen yet.
    """
    if pivot.empty or user_id not in pivot.index:
        return []

    user_vector = pivot.loc[[user_id]].values  # shape (1, n_products)
    all_vectors = pivot.values                  # shape (n_users, n_products)

    similarities = cosine_similarity(user_vector, all_vectors)[0]
    sim_series = pd.Series(similarities, index=pivot.index)

    # Exclude self
    sim_series = sim_series.drop(user_id, errors="ignore")
    top_similar = sim_series.nlargest(20).index

    # Weighted average of similar users' scores
    weights = sim_series[top_similar].values
    similar_matrix = pivot.loc[top_similar].values
    if weights.sum() == 0:
        return []

    weighted_scores = np.average(similar_matrix, axis=0, weights=weights)
    candidate_scores = pd.Series(weighted_scores, index=pivot.columns)

    # Remove products user already interacted with (score > 0)
    user_seen = pivot.loc[user_id]
    candidate_scores = candidate_scores[user_seen == 0]

    return candidate_scores.nlargest(n).index.tolist()


# ── Content-based filtering ───────────────────────────────────────────────────

def content_based_filter(product_id: str, products_df: pd.DataFrame, n: int = 8) -> list:
    """
    Content-based similarity using category encoding + normalised price.
    """
    if products_df.empty or product_id not in products_df["id"].values:
        return []

    df = products_df.copy()
    le = LabelEncoder()
    df["cat_enc"] = le.fit_transform(df["category"])

    scaler = MinMaxScaler()
    df["price_norm"] = scaler.fit_transform(df[["price"]])

    # One-hot encode category for better distance measurement
    cat_dummies = pd.get_dummies(df["category"], prefix="cat")
    features = pd.concat([cat_dummies, df[["price_norm"]]], axis=1).values

    sim_matrix = cosine_similarity(features)
    product_idx = df[df["id"] == product_id].index[0]

    scores = sim_matrix[product_idx]
    sorted_idx = np.argsort(scores)[::-1]

    # Exclude the product itself
    result_ids = [
        df.iloc[i]["id"]
        for i in sorted_idx
        if df.iloc[i]["id"] != product_id
    ][:n]

    return result_ids


# ── Popular fallback ──────────────────────────────────────────────────────────

def get_popular_products(behavior_df: pd.DataFrame, n: int = 12) -> list:
    """Return the most interacted-with products (cold start fallback)."""
    if behavior_df.empty:
        return []
    popular = (
        behavior_df.groupby("product_id")["score"]
        .sum()
        .nlargest(n)
        .index.tolist()
    )
    return popular


# ── Main recommendation function ──────────────────────────────────────────────

def get_recommendations(user_id: str, n: int = 12) -> list:
    """
    Hybrid recommendation:
    1. Try collaborative filtering (personalised)
    2. Fallback to popular products (cold start)
    """
    behavior_df = load_behavior_df()
    pivot = build_user_item_matrix(behavior_df)

    # Check if user has any interactions
    user_interactions = behavior_df[behavior_df["user_id"] == user_id]
    if user_interactions.empty or len(user_interactions) < 3:
        # Cold start — return popular
        return get_popular_products(behavior_df, n)

    cf_ids = collaborative_filter(user_id, pivot, n=n)
    if cf_ids:
        return cf_ids

    return get_popular_products(behavior_df, n)


def get_similar(product_id: str, n: int = 8) -> list:
    """Return content-based similar products for a given product."""
    products_df = load_products_df()
    return content_based_filter(product_id, products_df, n)