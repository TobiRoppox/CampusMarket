import { useState, useEffect } from "react";
import Sidebar from "../../components/common/Sidebar.jsx";
import { EmptyState } from "../../components/common/UI.jsx";
import { orderService } from "../../services/api.js";
import toast from "react-hot-toast";
import { format } from "date-fns";
import { FiRefreshCw } from "react-icons/fi";

const STATUS_FLOW = {
  pending: {
    next: "confirmed",
    label: "Confirm Order",
    btnClass: "btn-primary",
  },
  confirmed: {
    next: "ready",
    label: "Mark as Ready",
    btnClass: "btn-secondary",
  },
  ready: {
    next: "delivered",
    label: "Mark Delivered",
    btnClass: "btn-success",
  },
  delivered: { next: null, label: "Completed", btnClass: "btn-ghost" },
  cancelled: { next: null, label: "Cancelled", btnClass: "btn-ghost" },
};

const STATUS_TABS = [
  "all",
  "pending",
  "confirmed",
  "ready",
  "delivered",
  "cancelled",
];

export default function SellerOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [updatingId, setUpdatingId] = useState(null);

  const fetchOrders = () => {
    setLoading(true);
    const params = activeTab !== "all" ? { status: activeTab } : {};
    orderService
      .getSellerOrders(params)
      .then(({ data }) => setOrders(data || []))
      .catch(() => toast.error("Failed to load orders"))
      .finally(() => setLoading(false));
  };

  useEffect(fetchOrders, [activeTab]);

  const handleStatusUpdate = async (orderId, newStatus) => {
    try {
      setUpdatingId(orderId);
      const { data } = await orderService.updateStatus(orderId, newStatus);
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: data.status } : o)),
      );
      toast.success(`Order marked as ${newStatus}`);
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to update order");
    } finally {
      setUpdatingId(null);
    }
  };

  const fmt = (p) =>
    `₱${Number(p).toLocaleString("en-PH", { minimumFractionDigits: 2 })}`;

  const tabCounts = STATUS_TABS.reduce((acc, tab) => {
    acc[tab] =
      tab === "all"
        ? orders.length
        : orders.filter((o) => o.status === tab).length;
    return acc;
  }, {});

  const displayedOrders =
    activeTab === "all" ? orders : orders.filter((o) => o.status === activeTab);

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="dashboard-main">
        <div className="topbar">
          <div className="topbar-left">
            <div className="topbar-titles">
              <h1>Orders</h1>
              <p>Manage and fulfil your incoming orders.</p>
            </div>
          </div>
          <div className="topbar-right">
            <button
              className="btn btn-ghost btn-sm"
              onClick={fetchOrders}
              disabled={loading}
            >
              <FiRefreshCw size={14} className={loading ? "spin" : ""} />{" "}
              Refresh
            </button>
          </div>
        </div>

        <div className="dashboard-content">
          {/* Status tabs */}
          <div className="order-tabs">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab}
                className={`order-tab ${activeTab === tab ? "active" : ""}`}
                onClick={() => setActiveTab(tab)}
              >
                <span style={{ textTransform: "capitalize" }}>{tab}</span>
                {tabCounts[tab] > 0 && (
                  <span
                    className={`tab-count ${activeTab === tab ? "active" : ""}`}
                  >
                    {tabCounts[tab]}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Orders list */}
          {loading ? (
            <div
              style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
            >
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="skeleton"
                  style={{ height: 160, borderRadius: 12 }}
                />
              ))}
            </div>
          ) : displayedOrders.length === 0 ? (
            <EmptyState
              icon="📦"
              title="No orders"
              description={`No ${activeTab === "all" ? "" : activeTab} orders found`}
            />
          ) : (
            <div
              style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
            >
              {displayedOrders.map((order) => {
                const flow = STATUS_FLOW[order.status] || STATUS_FLOW.delivered;
                return (
                  <div key={order.id} className="order-card card">
                    <div className="order-card-header">
                      <div className="order-info">
                        <p className="order-id">
                          #{order.id.slice(0, 8).toUpperCase()}
                        </p>
                        <p className="text-sm text-muted">
                          {format(
                            new Date(order.created_at),
                            "MMM d, yyyy · h:mm a",
                          )}
                        </p>
                      </div>
                      <div className="order-header-right">
                        <span className={`badge status-${order.status}`}>
                          {order.status}
                        </span>
                        <p className="order-total">{fmt(order.total)}</p>
                      </div>
                    </div>

                    <div className="buyer-info">
                      <div className="buyer-avatar">
                        {order.users?.avatar_url ? (
                          <img src={order.users.avatar_url} alt="" />
                        ) : (
                          <span>{order.users?.name?.charAt(0)}</span>
                        )}
                      </div>
                      <div>
                        <p
                          className="font-medium"
                          style={{ fontSize: "0.875rem" }}
                        >
                          {order.users?.name || "Unknown buyer"}
                        </p>
                        <p className="text-xs text-muted">
                          {order.users?.email}
                        </p>
                      </div>
                    </div>

                    <div className="order-items-list">
                      {order.order_items?.map((item) => (
                        <div key={item.id} className="order-line-item">
                          <div className="order-item-img">
                            {item.products?.image_url ? (
                              <img
                                src={item.products.image_url}
                                alt={item.products?.name}
                              />
                            ) : (
                              <span>📦</span>
                            )}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p
                              className="font-medium"
                              style={{ fontSize: "0.875rem" }}
                            >
                              {item.products?.name}
                            </p>
                            <p className="text-xs text-muted">
                              {fmt(item.unit_price)} × {item.quantity}
                            </p>
                          </div>
                          <p
                            className="font-semibold"
                            style={{ fontSize: "0.875rem" }}
                          >
                            {fmt(item.unit_price * item.quantity)}
                          </p>
                        </div>
                      ))}
                    </div>

                    {order.delivery_notes && (
                      <div className="delivery-notes">
                        <p className="text-xs text-muted">
                          📝 {order.delivery_notes}
                        </p>
                      </div>
                    )}

                    {flow.next && (
                      <div className="order-card-footer">
                        <button
                          className={`btn ${flow.btnClass} btn-sm`}
                          onClick={() =>
                            handleStatusUpdate(order.id, flow.next)
                          }
                          disabled={updatingId === order.id}
                        >
                          {updatingId === order.id ? (
                            <span
                              className="spinner"
                              style={{ width: 14, height: 14, borderWidth: 2 }}
                            />
                          ) : (
                            flow.label
                          )}
                        </button>
                        {order.status === "pending" && (
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() =>
                              handleStatusUpdate(order.id, "cancelled")
                            }
                            disabled={updatingId === order.id}
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <style>{`
        .order-tabs {
          display: flex; gap: 0.25rem; margin-bottom: 1.25rem;
          overflow-x: auto; padding-bottom: 4px;
        }
        .order-tab {
          display: flex; align-items: center; gap: 0.5rem;
          padding: 0.5rem 1rem; border-radius: var(--radius-full);
          border: 1.5px solid var(--gray-200); background: #fff;
          font-size: 0.875rem; font-weight: 500; color: var(--gray-600);
          transition: var(--transition-fast); white-space: nowrap;
        }
        .order-tab:hover { border-color: var(--color-primary); color: var(--color-primary); }
        .order-tab.active { background: var(--color-primary); border-color: var(--color-primary); color: #fff; }
        .tab-count {
          background: var(--gray-200); color: var(--gray-700);
          font-size: 0.7rem; font-weight: 700;
          padding: 1px 6px; border-radius: var(--radius-full);
        }
        .tab-count.active { background: rgba(255,255,255,0.3); color: #fff; }
        .order-card { padding: 0; overflow: hidden; }
        .order-card-header {
          display: flex; align-items: flex-start; justify-content: space-between;
          padding: 1rem 1.25rem; border-bottom: 1px solid var(--gray-100);
        }
        .order-id { font-family: var(--font-mono); font-weight: 700; font-size: 0.9rem; color: var(--gray-800); }
        .order-header-right { text-align: right; display: flex; flex-direction: column; align-items: flex-end; gap: 4px; }
        .order-total { font-weight: 700; font-size: 1rem; color: var(--color-primary); }
        .buyer-info {
          display: flex; align-items: center; gap: 0.75rem;
          padding: 0.875rem 1.25rem; background: var(--gray-50);
          border-bottom: 1px solid var(--gray-100);
        }
        .buyer-avatar {
          width: 36px; height: 36px; border-radius: 50%;
          background: var(--color-secondary); color: #fff;
          display: flex; align-items: center; justify-content: center;
          font-weight: 700; flex-shrink: 0; overflow: hidden;
        }
        .buyer-avatar img { width: 100%; height: 100%; object-fit: cover; }
        .order-items-list { padding: 0.875rem 1.25rem; display: flex; flex-direction: column; gap: 0.625rem; }
        .order-line-item { display: flex; align-items: center; gap: 0.75rem; }
        .order-item-img {
          width: 40px; height: 40px; border-radius: var(--radius-md);
          background: var(--gray-100); overflow: hidden;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0; font-size: 1.1rem;
        }
        .order-item-img img { width: 100%; height: 100%; object-fit: cover; }
        .delivery-notes {
          padding: 0.625rem 1.25rem; background: var(--color-warning-light);
          border-top: 1px solid var(--gray-100);
        }
        .order-card-footer {
          display: flex; gap: 0.625rem; align-items: center;
          padding: 0.875rem 1.25rem; border-top: 1px solid var(--gray-100);
          background: var(--gray-50);
        }
        .btn-success { background: var(--color-success); color: #fff; border-color: var(--color-success); }
        .btn-success:hover { background: #15803D; }
        .spin { animation: spin 0.7s linear infinite; }
      `}</style>
    </div>
  );
}
