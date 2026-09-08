import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FiAlertCircle,
  FiCheck,
  FiCheckCircle,
  FiHeart,
  FiShoppingBag,
  FiShoppingCart,
  FiStar,
} from "react-icons/fi";
import { useCart } from "../../context/CartContext.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { behaviorService } from "../../services/api.js";
import favoriteService from "../../services/favoriteService.js";
import toast from "react-hot-toast";

const formatPrice = (price) =>
  `₱${Number(price || 0).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const toCategoryClass = (category) =>
  String(category || "other")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "other";

export default function ProductCard({ product, showStall = true }) {
  const { addItem } = useCart();
  const { user } = useAuth();
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [savingFavorite, setSavingFavorite] = useState(false);

  const stock = Number(product.stock || 0);
  const isOutOfStock = stock < 1;
  const isLowStock = stock > 0 && stock <= 5;
  const rating = Number(product.avg_rating || 0);
  const category = product.category || "Other";
  const categoryClass = toCategoryClass(category);
  const showCartAction = !user || user.role === "buyer";
  const showFavoriteAction = user?.role === "buyer";

  useEffect(() => {
    setImageFailed(false);
  }, [product.image_url]);

  useEffect(() => {
    if (!added) return undefined;
    const timer = window.setTimeout(() => setAdded(false), 2000);
    return () => window.clearTimeout(timer);
  }, [added]);

  useEffect(() => {
    if (!showFavoriteAction || !user?.id) {
      setIsFavorite(false);
      return undefined;
    }

    let active = true;
    favoriteService.isFavorite(user.id, product.id).then((saved) => {
      if (active) setIsFavorite(saved);
    });

    const unsubscribe = favoriteService.subscribe(user.id, (favorites) => {
      if (active) {
        setIsFavorite(
          favorites.some(
            (savedProduct) => String(savedProduct.id) === String(product.id),
          ),
        );
      }
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [product.id, showFavoriteAction, user?.id]);

  const handleView = () => {
    if (user) {
      behaviorService.log(product.id, "view").catch(() => {});
    }
  };

  const handleAddToCart = async () => {
    if (!user) {
      toast.error("Please log in to add items to your cart");
      return;
    }

    if (user.role !== "buyer") {
      toast.error("Only buyers can add items to the cart");
      return;
    }

    if (isOutOfStock) {
      toast.error("This product is currently out of stock");
      return;
    }

    try {
      setAdding(true);
      await addItem(product);
      setAdded(true);
      toast.success("Added to cart");
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to add item to cart");
    } finally {
      setAdding(false);
    }
  };

  const handleToggleFavorite = async () => {
    if (!user) {
      toast.error("Please log in to save favorites");
      return;
    }

    if (user.role !== "buyer") {
      toast.error("Favorites are available for buyer accounts");
      return;
    }

    try {
      setSavingFavorite(true);
      const result = await favoriteService.toggle(user.id, product);
      setIsFavorite(result.saved);
      toast.success(
        result.saved ? "Saved to favorites" : "Removed from favorites",
      );
    } catch {
      toast.error("Could not update favorites");
    } finally {
      setSavingFavorite(false);
    }
  };

  return (
    <article
      className={`product-card card ${isOutOfStock ? "is-out-of-stock" : ""} ${showCartAction ? "has-cart-action" : ""}`}
    >
      <Link
        to={`/products/${product.id}`}
        className="product-card-link"
        onClick={handleView}
        aria-label={`View ${product.name}`}
      >
        <div className="product-image-wrap">
          {product.image_url && !imageFailed ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="product-img"
              loading="lazy"
              onError={() => setImageFailed(true)}
            />
          ) : (
            <div className="product-img-placeholder" aria-hidden="true">
              <span>
                <FiShoppingBag />
              </span>
            </div>
          )}

          <span className={`badge cat-badge cat-${categoryClass}`}>
            {category}
          </span>

          {isLowStock && (
            <span className="product-stock-badge">
              <FiAlertCircle aria-hidden="true" /> Only {stock} left
            </span>
          )}

          {isOutOfStock && (
            <div className="out-of-stock-overlay">
              <span>Out of stock</span>
            </div>
          )}
        </div>

        <div className="product-body">
          {showStall && product.stalls?.name && (
            <div className="product-stall-row">
              <p className="product-stall">{product.stalls.name}</p>
              <FiCheckCircle aria-label="Verified campus seller" />
            </div>
          )}

          <h3 className="product-name" title={product.name}>
            {product.name}
          </h3>

          <div className="product-rating-row">
            {rating > 0 ? (
              <div
                className="product-rating"
                aria-label={`${rating} out of 5 stars`}
              >
                <FiStar aria-hidden="true" />
                <strong>{rating.toFixed(1)}</strong>
                <span>({product.review_count || 0})</span>
              </div>
            ) : (
              <span className="product-no-rating">New arrival</span>
            )}
          </div>

          <div className="product-footer">
            <div className="product-price-group">
              <span className="product-price">
                {formatPrice(product.price)}
              </span>
              <span className="product-price-note">Campus price</span>
            </div>
          </div>
        </div>
      </Link>

      {showFavoriteAction && (
        <button
          type="button"
          className={`product-favorite-btn ${isFavorite ? "is-favorite" : ""}`}
          onClick={handleToggleFavorite}
          disabled={savingFavorite}
          aria-pressed={isFavorite}
          aria-label={
            isFavorite
              ? `Remove ${product.name} from favorites`
              : `Save ${product.name} to favorites`
          }
          title={isFavorite ? "Remove from favorites" : "Save to favorites"}
        >
          {savingFavorite ? (
            <span
              className="spinner product-favorite-spinner"
              aria-hidden="true"
            />
          ) : (
            <FiHeart aria-hidden="true" />
          )}
        </button>
      )}

      {showCartAction && (
        <button
          type="button"
          className={`add-to-cart-btn ${added ? "added" : ""}`}
          onClick={handleAddToCart}
          disabled={adding || isOutOfStock}
          aria-label={
            isOutOfStock
              ? `${product.name} is out of stock`
              : added
                ? `${product.name} added to cart`
                : `Add ${product.name} to cart`
          }
          title={isOutOfStock ? "Out of stock" : "Add to cart"}
        >
          {adding ? (
            <span className="spinner product-cart-spinner" aria-hidden="true" />
          ) : added ? (
            <FiCheck aria-hidden="true" />
          ) : (
            <FiShoppingCart aria-hidden="true" />
          )}
        </button>
      )}

      {added && (
        <span className="sr-only" aria-live="polite">
          Added to cart
        </span>
      )}
    </article>
  );
}
