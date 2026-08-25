import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  productService,
  behaviorService,
  messageService,
} from "../../services/api.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { useCart } from "../../context/CartContext.jsx";
import Navbar from "../../components/common/Navbar.jsx";
import ProductCard from "../../components/common/ProductCard.jsx";
import { SkeletonCard } from "../../components/common/UI.jsx";
import {
  FiShoppingCart,
  FiMessageSquare,
  FiStar,
  FiArrowLeft,
  FiCheck,
} from "react-icons/fi";
import toast from "react-hot-toast";

export default function ProductDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const { addItem } = useCart();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [similar, setSimilar] = useState([]);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    setLoading(true);
    productService
      .getOne(id)
      .then(({ data }) => {
        setProduct(data);
        if (user) behaviorService.log(id, "view").catch(() => {});
      })
      .catch(() => toast.error("Product not found"))
      .finally(() => setLoading(false));

    productService
      .getSimilar(id)
      .then(({ data }) => setSimilar(data || []))
      .catch(() => {});
  }, [id, user]);

  const handleAddToCart = async () => {
    if (!user) return toast.error("Please login first");
    if (user.role !== "buyer")
      return toast.error("Only buyers can add to cart");
    try {
      setAdding(true);
      await addItem(product, qty);
      await behaviorService.log(id, "cart_add");
      setAdded(true);
      toast.success("Added to cart!");
      setTimeout(() => setAdded(false), 2000);
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to add");
    } finally {
      setAdding(false);
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim()) return;
    if (!user) return toast.error("Please login to message the seller");
    try {
      setSending(true);
      await messageService.send({
        receiver_id: product.stalls.owner_id,
        product_id: product.id,
        content: message,
      });
      toast.success("Message sent!");
      setMessage("");
      setChatOpen(false);
    } catch {
      toast.error("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const formatPrice = (p) =>
    `₱${Number(p).toLocaleString("en-PH", { minimumFractionDigits: 2 })}`;

  if (loading) {
    return (
      <div>
        <Navbar />
        <div className="container" style={{ padding: "2rem 1.5rem" }}>
          <div className="detail-layout">
            <div
              className="skeleton"
              style={{ height: 420, borderRadius: 16 }}
            />
            <div
              style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
            >
              {[200, 100, 60, 80].map((w, i) => (
                <div
                  key={i}
                  className="skeleton"
                  style={{ height: 24, width: `${w}px` }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) return null;

  const stars = product.avg_rating || 0;

  return (
    <div>
      <Navbar />
      <div className="container" style={{ padding: "1.5rem 1.5rem 4rem" }}>
        {/* Breadcrumb */}
        <button className="back-btn" onClick={() => navigate(-1)}>
          <FiArrowLeft /> Back
        </button>

        <div className="detail-layout fade-in">
          {/* Image */}
          <div className="detail-image-wrap">
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.name}
                className="detail-img"
              />
            ) : (
              <div className="detail-img-placeholder">🛍️</div>
            )}
            <span className="detail-cat-chip">{product.category}</span>
          </div>

          {/* Info */}
          <div className="detail-info">
            <div className="detail-stall-name">{product.stalls?.name}</div>
            <h1 className="detail-title">{product.name}</h1>

            {/* Rating */}
            <div className="detail-rating">
              {[1, 2, 3, 4, 5].map((s) => (
                <FiStar
                  key={s}
                  size={16}
                  fill={s <= Math.round(stars) ? "var(--gold-600)" : "none"}
                  stroke="var(--gold-600)"
                />
              ))}
              <span className="detail-rating-val">
                {stars || "No ratings yet"}
              </span>
              {product.review_count > 0 && (
                <span className="text-muted">
                  ({product.review_count} reviews)
                </span>
              )}
            </div>

            <div className="detail-price">{formatPrice(product.price)}</div>

            {product.description && (
              <p className="detail-desc">{product.description}</p>
            )}

            <div className="detail-meta">
              <span
                className={`badge ${product.stock > 0 ? "badge-success" : "badge-danger"}`}
              >
                {product.stock > 0
                  ? `${product.stock} in stock`
                  : "Out of stock"}
              </span>
            </div>

            {/* Qty selector */}
            {user?.role === "buyer" && product.stock > 0 && (
              <div className="qty-row">
                <label className="form-label">Quantity</label>
                <div className="qty-control">
                  <button
                    className="qty-btn"
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                  >
                    −
                  </button>
                  <span className="qty-val">{qty}</span>
                  <button
                    className="qty-btn"
                    onClick={() =>
                      setQty((q) => Math.min(product.stock, q + 1))
                    }
                  >
                    +
                  </button>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="detail-actions">
              {user?.role === "buyer" && (
                <button
                  className={`btn btn-primary btn-lg ${added ? "btn-added" : ""}`}
                  onClick={handleAddToCart}
                  disabled={adding || product.stock === 0}
                  style={{ flex: 1 }}
                >
                  {adding ? (
                    <span className="spinner" />
                  ) : added ? (
                    <>
                      <FiCheck /> Added!
                    </>
                  ) : (
                    <>
                      <FiShoppingCart /> Add to Cart
                    </>
                  )}
                </button>
              )}
              {user && user.id !== product.stalls?.owner_id && (
                <button
                  className="btn btn-outline btn-lg"
                  onClick={() => setChatOpen((p) => !p)}
                >
                  <FiMessageSquare /> Message Seller
                </button>
              )}
            </div>

            {/* Seller info */}
            <div className="seller-card">
              <div className="seller-avatar">
                {product.stalls?.users?.avatar_url ? (
                  <img src={product.stalls.users.avatar_url} alt="" />
                ) : (
                  <span>{product.stalls?.users?.name?.charAt(0)}</span>
                )}
              </div>
              <div>
                <p className="seller-label">Sold by</p>
                <p className="seller-name">{product.stalls?.users?.name}</p>
                <p className="seller-stall">{product.stalls?.name}</p>
              </div>
            </div>

            {/* Chat panel */}
            {chatOpen && (
              <div className="chat-panel fade-in">
                <p className="chat-label">
                  Send a message to the seller about this product:
                </p>
                <textarea
                  className="form-input"
                  rows={3}
                  placeholder={`Hi, I'm interested in "${product.name}"...`}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  style={{ resize: "vertical" }}
                />
                <div
                  style={{
                    display: "flex",
                    gap: "0.5rem",
                    justifyContent: "flex-end",
                  }}
                >
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => setChatOpen(false)}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={handleSendMessage}
                    disabled={sending || !message.trim()}
                  >
                    {sending ? (
                      <span
                        className="spinner"
                        style={{ width: 14, height: 14, borderWidth: 2 }}
                      />
                    ) : (
                      "Send"
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Similar products */}
        {similar.length > 0 && (
          <section style={{ marginTop: "3rem" }}>
            <h2 className="section-title" style={{ marginBottom: "1rem" }}>
              Similar Products
            </h2>
            <div className="product-grid">
              {similar.slice(0, 8).map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}

        {/* Reviews */}
        {product.reviews?.length > 0 && (
          <section style={{ marginTop: "3rem" }}>
            <h2 className="section-title" style={{ marginBottom: "1rem" }}>
              Customer Reviews
            </h2>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
            >
              {product.reviews.map((r) => (
                <div key={r.id} className="review-card">
                  <div className="review-header">
                    <div className="review-avatar">
                      {r.users?.name?.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium">{r.users?.name}</p>
                      <div style={{ display: "flex", gap: 2 }}>
                        {[1, 2, 3, 4, 5].map((s) => (
                          <FiStar
                            key={s}
                            size={12}
                            fill={s <= r.rating ? "var(--gold-600)" : "none"}
                            stroke="var(--gold-600)"
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                  {r.comment && <p className="review-text">{r.comment}</p>}
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      <style>{`
        .back-btn {
          display: inline-flex; align-items: center; gap: 0.5rem;
          color: var(--gray-500); font-size: 0.9rem; padding: 0.5rem 0;
          margin-bottom: 1.25rem; transition: var(--transition-fast);
        }
        .back-btn:hover { color: var(--gray-800); }
        .detail-layout {
          display: grid; grid-template-columns: 1fr 1fr; gap: 3rem;
          align-items: start;
        }
        .detail-image-wrap {
          position: relative; border-radius: var(--radius-xl);
          overflow: hidden; background: var(--gray-100);
          aspect-ratio: 1; border: 1px solid var(--gray-200);
        }
        .detail-img { width: 100%; height: 100%; object-fit: cover; }
        .detail-img-placeholder {
          width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;
          font-size: 5rem;
        }
        .detail-cat-chip {
          position: absolute; top: 16px; left: 16px;
          background: rgba(255,255,255,0.95); color: var(--color-primary);
          font-size: 0.75rem; font-weight: 700; text-transform: capitalize;
          padding: 0.3rem 0.75rem; border-radius: 999px;
        }
        .detail-stall-name { font-size: 0.8rem; font-weight: 700; color: var(--color-secondary); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.5rem; }
        .detail-title { font-size: 1.75rem; font-weight: 800; color: var(--gray-900); line-height: 1.25; margin-bottom: 0.75rem; }
        .detail-rating { display: flex; align-items: center; gap: 0.25rem; margin-bottom: 1rem; }
        .detail-rating-val { font-weight: 600; color: var(--gray-700); margin-left: 0.25rem; }
        .detail-price { font-size: 2rem; font-weight: 800; color: var(--color-primary); margin-bottom: 1rem; }
        .detail-desc { color: var(--gray-600); line-height: 1.7; margin-bottom: 1rem; }
        .detail-meta { margin-bottom: 1.25rem; }
        .qty-row { margin-bottom: 1.25rem; }
        .qty-control { display: inline-flex; align-items: center; border: 1.5px solid var(--gray-300); border-radius: var(--radius-md); overflow: hidden; margin-top: 0.375rem; }
        .qty-btn { width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; font-size: 1.1rem; color: var(--gray-600); transition: var(--transition-fast); background: none; }
        .qty-btn:hover { background: var(--gray-100); }
        .qty-val { padding: 0 1rem; font-weight: 600; min-width: 48px; text-align: center; }
        .detail-actions { display: flex; gap: 0.75rem; margin-bottom: 1.5rem; flex-wrap: wrap; }
        .btn-added { background: var(--color-success) !important; border-color: var(--color-success) !important; }
        .seller-card { display: flex; align-items: center; gap: 0.875rem; padding: 1rem; background: var(--gray-50); border: 1px solid var(--gray-200); border-radius: var(--radius-lg); margin-bottom: 1rem; }
        .seller-avatar { width: 44px; height: 44px; border-radius: 50%; background: var(--color-secondary); color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 1.1rem; flex-shrink: 0; overflow: hidden; }
        .seller-avatar img { width: 100%; height: 100%; object-fit: cover; }
        .seller-label { font-size: 0.75rem; color: var(--gray-500); }
        .seller-name { font-weight: 600; color: var(--gray-800); }
        .seller-stall { font-size: 0.8rem; color: var(--gray-500); }
        .chat-panel { background: var(--gray-50); border: 1px solid var(--gray-200); border-radius: var(--radius-lg); padding: 1rem; display: flex; flex-direction: column; gap: 0.75rem; }
        .chat-label { font-size: 0.875rem; color: var(--gray-600); }
        .review-card { background: #fff; border: 1px solid var(--gray-200); border-radius: var(--radius-lg); padding: 1rem; }
        .review-header { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.5rem; }
        .review-avatar { width: 36px; height: 36px; border-radius: 50%; background: var(--gray-200); display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 0.9rem; }
        .review-text { color: var(--gray-600); font-size: 0.9rem; line-height: 1.6; }
        .section-title { font-size: 1.25rem; font-weight: 700; color: var(--gray-900); }
        @media (max-width: 768px) {
          .detail-layout { grid-template-columns: 1fr; gap: 1.5rem; }
        }
      `}</style>
    </div>
  );
}
