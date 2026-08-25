import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, Truck, Store } from "lucide-react";
import Navbar from "../../components/common/Navbar.jsx";
import { useCart } from "../../context/CartContext.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import orderService from "../../services/orderService.js";
import toast from "react-hot-toast";

const formatPrice = (p) =>
  `₱${Number(p).toLocaleString("en-PH", { minimumFractionDigits: 2 })}`;

export default function Checkout() {
  const { items, total, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [fulfillment, setFulfillment] = useState("pickup"); // "pickup" | "delivery"
  const [notes, setNotes] = useState("");
  const [placing, setPlacing] = useState(false);

  const handlePlaceOrder = async () => {
    if (items.length === 0) return;
    try {
      setPlacing(true);
      await orderService.createOrder({
        items: items.map((i) => ({
          product_id: i.products?.id ?? i.product_id ?? i.id,
          quantity: i.quantity,
        })),
        fulfillment,
        notes,
      });
      await clearCart();
      toast.success("Order placed!");
      navigate("/orders");
    } catch (err) {
      // orderService already unwraps to error.response?.data or error.message,
      // so `err` here is a plain object/string, not an axios error
      const msg =
        typeof err === "string"
          ? err
          : err?.error || err?.message || "Failed to place order";
      toast.error(msg);
    } finally {
      setPlacing(false);
    }
  };

  if (items.length === 0) {
    return (
      <div>
        <Navbar />
        <div className="checkout-page">
          <div className="checkout-empty">
            <h3>Nothing to check out</h3>
            <p>Your cart is empty.</p>
            <button
              className="btn btn-primary"
              onClick={() => navigate("/browse")}
            >
              Browse Products
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navbar />
      <div className="checkout-page">
        <h1>Checkout</h1>

        <div className="checkout-layout">
          {/* Left: fulfillment + items */}
          <div className="checkout-main">
            <section className="checkout-card">
              <h2>Fulfillment Method</h2>
              <div className="fulfillment-options">
                <button
                  className={`fulfillment-option ${fulfillment === "pickup" ? "active" : ""}`}
                  onClick={() => setFulfillment("pickup")}
                >
                  <Store size={18} />
                  <div>
                    <strong>Campus Pickup</strong>
                    <span>Pick up directly from the seller's stall</span>
                  </div>
                </button>
                <button
                  className={`fulfillment-option ${fulfillment === "delivery" ? "active" : ""}`}
                  onClick={() => setFulfillment("delivery")}
                >
                  <Truck size={18} />
                  <div>
                    <strong>Campus Delivery</strong>
                    <span>Delivered to a dorm/building on campus</span>
                  </div>
                </button>
              </div>

              {fulfillment === "delivery" && (
                <div className="checkout-address">
                  <MapPin size={16} />
                  {/* TODO: pull real address from user profile once that field exists */}
                  <span>
                    {user?.address ||
                      "No delivery address on file — add one in Profile settings."}
                  </span>
                </div>
              )}
            </section>

            <section className="checkout-card">
              <h2>Order Notes</h2>
              <textarea
                className="form-input"
                rows={3}
                placeholder="Any special instructions for the seller (optional)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </section>

            <section className="checkout-card">
              <h2>Items ({items.length})</h2>
              <div className="checkout-items">
                {items.map((item) => {
                  const product = item.products || item;
                  const price = product.price ?? item.price ?? 0;
                  return (
                    <div key={item.id} className="checkout-item">
                      <div className="checkout-item-thumb">
                        {product.image_url ? (
                          <img src={product.image_url} alt={product.name} />
                        ) : (
                          "🛍️"
                        )}
                      </div>
                      <div className="checkout-item-info">
                        <span className="checkout-item-name">
                          {product.name}
                        </span>
                        <span className="checkout-item-qty">
                          Qty {item.quantity}
                        </span>
                      </div>
                      <span className="checkout-item-price">
                        {formatPrice(price * item.quantity)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>

          {/* Right: summary */}
          <aside className="checkout-summary">
            <h2>Order Summary</h2>
            <div className="checkout-summary-row">
              <span>Subtotal</span>
              <span>{formatPrice(total)}</span>
            </div>
            <div className="checkout-summary-row">
              <span>Delivery fee</span>
              <span>
                {fulfillment === "delivery" ? "Calculated by seller" : "Free"}
              </span>
            </div>
            <div className="checkout-summary-divider" />
            <div className="checkout-summary-row checkout-summary-total">
              <span>Total</span>
              <span>{formatPrice(total)}</span>
            </div>
            <button
              className="btn btn-primary btn-lg checkout-submit"
              onClick={handlePlaceOrder}
              disabled={placing}
            >
              {placing ? <span className="spinner" /> : "Place Order"}
            </button>
          </aside>
        </div>
      </div>

      <style>{`
        .checkout-page { max-width: 1100px; margin: 0 auto; padding: 1.75rem 1.5rem 4rem; }
        .checkout-page h1 { font-size: 1.5rem; font-weight: 800; color: var(--gray-900); margin-bottom: 1.5rem; }

        .checkout-empty {
          display: flex; flex-direction: column; align-items: center; text-align: center;
          padding: 4rem 1.5rem; border: 1px dashed var(--gray-200); border-radius: var(--radius-xl);
        }
        .checkout-empty h3 { font-weight: 700; margin-bottom: 0.25rem; }
        .checkout-empty p { color: var(--gray-500); margin-bottom: 1.25rem; }

        .checkout-layout { display: grid; grid-template-columns: 1fr 340px; gap: 1.5rem; align-items: start; }

        .checkout-card {
          background: #fff; border: 1px solid var(--gray-200); border-radius: var(--radius-xl);
          padding: 1.25rem; margin-bottom: 1.25rem;
        }
        .checkout-card h2 { font-size: 1rem; font-weight: 700; color: var(--gray-900); margin-bottom: 0.9rem; }

        .fulfillment-options { display: flex; flex-direction: column; gap: 0.6rem; }
        .fulfillment-option {
          display: flex; align-items: center; gap: 0.75rem; padding: 0.9rem;
          border: 1.5px solid var(--gray-200); border-radius: var(--radius-lg); background: #fff;
          text-align: left; cursor: pointer; transition: var(--transition-fast);
        }
        .fulfillment-option:hover { border-color: var(--color-primary); }
        .fulfillment-option.active { border-color: var(--color-primary); background: var(--color-primary-light); }
        .fulfillment-option strong { display: block; font-size: 0.9rem; color: var(--gray-900); }
        .fulfillment-option span { font-size: 0.8rem; color: var(--gray-500); }
        .checkout-address {
          display: flex; align-items: center; gap: 0.5rem; margin-top: 0.9rem; padding: 0.75rem;
          background: var(--gray-50); border-radius: var(--radius-md); font-size: 0.85rem; color: var(--gray-600);
        }

        .checkout-items { display: flex; flex-direction: column; gap: 0.75rem; }
        .checkout-item { display: flex; align-items: center; gap: 0.75rem; }
        .checkout-item-thumb {
          width: 44px; height: 44px; border-radius: var(--radius-md); overflow: hidden; flex-shrink: 0;
          background: var(--gray-100); display: flex; align-items: center; justify-content: center; font-size: 1.1rem;
        }
        .checkout-item-thumb img { width: 100%; height: 100%; object-fit: cover; }
        .checkout-item-info { display: flex; flex-direction: column; flex: 1; min-width: 0; }
        .checkout-item-name { font-size: 0.85rem; font-weight: 600; color: var(--gray-900); }
        .checkout-item-qty { font-size: 0.78rem; color: var(--gray-500); }
        .checkout-item-price { font-size: 0.85rem; font-weight: 700; color: var(--gray-800); white-space: nowrap; }

        .checkout-summary {
          background: var(--gray-50); border: 1px solid var(--gray-200); border-radius: var(--radius-xl);
          padding: 1.25rem; position: sticky; top: calc(var(--navbar-height, 64px) + 1rem);
        }
        .checkout-summary h2 { font-size: 1rem; font-weight: 700; margin-bottom: 0.9rem; }
        .checkout-summary-row {
          display: flex; align-items: center; justify-content: space-between;
          font-size: 0.875rem; color: var(--gray-600); margin-bottom: 0.5rem;
        }
        .checkout-summary-divider { height: 1px; background: var(--gray-200); margin: 0.75rem 0; }
        .checkout-summary-total { font-size: 1.1rem; font-weight: 800; color: var(--gray-900); }
        .checkout-submit { width: 100%; margin-top: 1rem; }

        @media (max-width: 900px) {
          .checkout-layout { grid-template-columns: 1fr; }
          .checkout-summary { position: static; }
        }
      `}</style>
    </div>
  );
}
