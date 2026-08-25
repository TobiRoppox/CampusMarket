import { useState } from "react";
import { Link } from "react-router-dom";
import { FiShoppingCart, FiStar, FiCheck } from "react-icons/fi";
import { useCart } from "../../context/CartContext.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { behaviorService } from "../../services/api.js";
import toast from "react-hot-toast";

export default function ProductCard({ product, showStall = true }) {
  const { addItem } = useCart();
  const { user } = useAuth();
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  const handleView = () => {
    if (user) behaviorService.log(product.id, "view").catch(() => {});
  };

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      toast.error("Please login to add items to cart");
      return;
    }
    if (user.role !== "buyer") {
      toast.error("Only buyers can add items to cart");
      return;
    }
    if (product.stock < 1) {
      toast.error("Out of stock");
      return;
    }
    try {
      setAdding(true);
      await addItem(product);
      setAdded(true);
      toast.success("Added to cart!");
      setTimeout(() => setAdded(false), 2000);
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to add to cart");
    } finally {
      setAdding(false);
    }
  };

  const formatPrice = (price) =>
    `₱${Number(price).toLocaleString("en-PH", { minimumFractionDigits: 2 })}`;

  return (
    <Link to={`/products/${product.id}`} className="product-card card card-hover" onClick={handleView}>
      {/* Image */}
      <div className="product-image-wrap">
        {product.image_url ? (
          <img src={product.image_url} alt={product.name} className="product-img" loading="lazy" />
        ) : (
          <div className="product-img-placeholder">🛍️</div>
        )}
        <span className={`badge cat-badge cat-${product.category}`}>
          {product.category}
        </span>
        {product.stock === 0 && (
          <div className="out-of-stock-overlay">Out of Stock</div>
        )}
      </div>

      {/* Body */}
      <div className="product-body">
        {showStall && product.stalls?.name && (
          <p className="product-stall">{product.stalls.name}</p>
        )}
        <h3 className="product-name" title={product.name}>{product.name}</h3>

        {/* Rating */}
        {product.avg_rating && (
          <div className="product-rating">
            <FiStar size={12} fill="currentColor" />
            <span>{product.avg_rating}</span>
            <span className="text-muted">({product.review_count})</span>
          </div>
        )}

        <div className="product-footer">
          <span className="product-price">{formatPrice(product.price)}</span>
          {user?.role === "buyer" && (
            <button
              className={`add-to-cart-btn ${added ? "added" : ""}`}
              onClick={handleAddToCart}
              disabled={adding || product.stock === 0}
              title="Add to cart"
            >
              {adding ? (
                <span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
              ) : added ? (
                <FiCheck size={15} />
              ) : (
                <FiShoppingCart size={15} />
              )}
            </button>
          )}
        </div>

        {product.stock > 0 && product.stock <= 5 && (
          <p className="low-stock">Only {product.stock} left!</p>
        )}
      </div>

      <style>{`
        .product-card {
          display: flex; flex-direction: column;
          text-decoration: none; color: inherit;
          cursor: pointer;
        }
        .product-image-wrap {
          position: relative; overflow: hidden;
          aspect-ratio: 4/3; background: var(--gray-100);
        }
        .product-img {
          width: 100%; height: 100%; object-fit: cover;
          transition: transform 0.4s ease;
        }
        .product-card:hover .product-img { transform: scale(1.05); }
        .product-img-placeholder {
          width: 100%; height: 100%; display: flex;
          align-items: center; justify-content: center;
          font-size: 2.5rem; color: var(--gray-300);
        }
        .cat-badge {
          position: absolute; top: 8px; left: 8px;
          text-transform: capitalize; font-size: 0.7rem;
        }
        .cat-food        { background: #FEF9C3; color: #92400E; }
        .cat-clothing    { background: #EDE9FE; color: #5B21B6; }
        .cat-electronics { background: #DBEAFE; color: #1E40AF; }
        .cat-accessories { background: #FCE7F3; color: #9D174D; }
        .cat-student-made{ background: var(--green-100); color: var(--green-800); }
        .cat-other       { background: var(--gray-100); color: var(--gray-700); }
        .out-of-stock-overlay {
          position: absolute; inset: 0; background: rgba(0,0,0,0.45);
          display: flex; align-items: center; justify-content: center;
          color: #fff; font-weight: 600; font-size: 0.875rem;
        }
        .product-body { padding: 0.875rem; display: flex; flex-direction: column; gap: 0.3rem; flex: 1; }
        .product-stall { font-size: 0.75rem; color: var(--color-secondary); font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; }
        .product-name {
          font-size: 0.9rem; font-weight: 600; color: var(--gray-800);
          display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
          line-height: 1.4;
        }
        .product-rating { display: flex; align-items: center; gap: 3px; font-size: 0.75rem; color: var(--gold-600); }
        .product-footer { display: flex; align-items: center; justify-content: space-between; margin-top: auto; padding-top: 0.5rem; }
        .product-price { font-size: 1.05rem; font-weight: 700; color: var(--color-primary); }
        .add-to-cart-btn {
          width: 34px; height: 34px; border-radius: var(--radius-md);
          background: var(--color-primary); color: #fff;
          display: flex; align-items: center; justify-content: center;
          transition: var(--transition-fast); flex-shrink: 0;
          border: none;
        }
        .add-to-cart-btn:hover:not(:disabled) { background: var(--color-primary-hover); transform: scale(1.08); }
        .add-to-cart-btn.added { background: var(--color-success); }
        .add-to-cart-btn:disabled { opacity: 0.55; }
        .low-stock { font-size: 0.75rem; color: var(--color-danger); font-weight: 500; }
      `}</style>
    </Link>
  );
}