"""
model_train.py — Offline evaluation and diagnostics for the recommendation engine.

Run this script periodically (e.g. via cron) to:
  1. Evaluate recommendation quality (coverage, diversity)
  2. Print a sample of recommendations for inspection
  3. Export a lightweight user-item matrix snapshot (optional)

Usage:
  python model_train.py
  python model_train.py --user <user_id>
  python model_train.py --export
"""

import argparse
import json
import os
from datetime import datetime

import numpy as np
import pandas as pd

from data_loader import (
    load_all_behavior,
    load_active_products,
    get_popular_product_ids,
)
from recommender import (
    build_user_item_matrix,
    collaborative_filter,
    content_based_filter,
    get_recommendations,
)


# ── Evaluation metrics ────────────────────────────────────────────────────────

def catalog_coverage(pivot: pd.DataFrame, n: int = 12) -> float:
    """
    Fraction of the product catalog that appears in at least one user's
    top-N recommendation list.
    """
    all_products = set(pivot.columns)
    recommended = set()

    for user_id in pivot.index:
        recs = collaborative_filter(user_id, pivot, n=n)
        recommended.update(recs)

    if not all_products:
        return 0.0
    return round(len(recommended) / len(all_products), 4)


def intra_list_diversity(pivot: pd.DataFrame, products_df: pd.DataFrame, n: int = 12) -> float:
    """
    Average pairwise category diversity within each user's recommendation list.
    Higher = more varied categories recommended.
    """
    if products_df.empty:
        return 0.0

    cat_map = dict(zip(products_df["id"], products_df["category"]))
    diversities = []

    for user_id in pivot.index[:50]:  # sample first 50 users for speed
        recs = collaborative_filter(user_id, pivot, n=n)
        if len(recs) < 2:
            continue
        categories = [cat_map.get(pid, "unknown") for pid in recs]
        unique_cats = len(set(categories))
        diversity = unique_cats / len(categories)
        diversities.append(diversity)

    return round(float(np.mean(diversities)) if diversities else 0.0, 4)


# ── Main diagnostics ──────────────────────────────────────────────────────────

def run_diagnostics(export: bool = False):
    print("=" * 60)
    print(f"Campus Market 2.0 — Recommendation Engine Diagnostics")
    print(f"Run at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)

    print("\n[1/4] Loading behavior data...")
    df = load_all_behavior()
    if df.empty:
        print("  ⚠  No behavior data found. Skipping evaluation.")
        return

    print(f"  ✓  {len(df)} interaction records")
    print(f"     Users: {df['user_id'].nunique()}")
    print(f"     Products: {df['product_id'].nunique()}")
    print(f"     Action breakdown:\n{df['action'].value_counts().to_string()}")

    print("\n[2/4] Building user-item matrix...")
    pivot = build_user_item_matrix(df)
    print(f"  ✓  Matrix shape: {pivot.shape[0]} users × {pivot.shape[1]} products")
    sparsity = 1 - (pivot.astype(bool).sum().sum() / (pivot.shape[0] * pivot.shape[1]))
    print(f"     Sparsity: {sparsity:.2%}")

    print("\n[3/4] Loading product catalog...")
    products_df = load_active_products()
    print(f"  ✓  {len(products_df)} active products")
    if not products_df.empty:
        print(f"     Categories: {dict(products_df['category'].value_counts())}")

    print("\n[4/4] Evaluating metrics...")
    if pivot.shape[0] >= 2:
        coverage = catalog_coverage(pivot, n=12)
        diversity = intra_list_diversity(pivot, products_df, n=12)
        print(f"  ✓  Catalog coverage:  {coverage:.2%}")
        print(f"  ✓  Avg list diversity: {diversity:.2%}")
    else:
        print("  ⚠  Not enough users for metric evaluation (need ≥ 2)")

    print("\n[Popular fallback top-10]")
    popular = get_popular_product_ids(10)
    print(f"  {popular}")

    if export:
        path = f"matrix_snapshot_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
        pivot.to_csv(path)
        print(f"\n✓ Matrix exported to {path}")

    print("\n" + "=" * 60)
    print("Diagnostics complete.")


def run_user_sample(user_id: str):
    print(f"\nRecommendations for user: {user_id}")
    recs = get_recommendations(user_id, n=12)
    print(f"  IDs: {recs}")
    print(f"  Count: {len(recs)}")


# ── CLI entrypoint ────────────────────────────────────────────────────────────

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Campus Market AI Diagnostics")
    parser.add_argument("--user", type=str, help="Show recommendations for a specific user ID")
    parser.add_argument("--export", action="store_true", help="Export user-item matrix to CSV")
    args = parser.parse_args()

    if args.user:
        run_user_sample(args.user)
    else:
        run_diagnostics(export=args.export)