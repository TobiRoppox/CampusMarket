import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Sidebar from "../../components/common/Sidebar.jsx";
import { StatCard } from "../../components/common/UI.jsx";
import { analyticsService, orderService } from "../../services/api.js";
import { useAuth } from "../../context/AuthContext.jsx";
import {
  FiDollarSign,
  FiShoppingBag,
  FiPackage,
  FiStar,
  FiArrowRight,
  FiTrendingUp,
} from "react-icons/fi";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { format } from "date-fns";

export default function SellerDashboard() {
  const { user } = useAuth();
  const [sales, setSales] = useState(null);
  const [topProducts, setTopProducts] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      analyticsService.getSales(30),
      analyticsService.getTopProducts(),
      orderService.getSellerOrders({ status: "" }),
    ])
      .then(([s, t, o]) => {
        setSales(s.data);
        setTopProducts(t.data.slice(0, 5));
        setRecentOrders(o.data.slice(0, 6));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const fmt = (p) =>
    `₱${Number(p).toLocaleString("en-PH", { minimumFractionDigits: 2 })}`;

  const chartData = (sales?.timeline || []).map((d) => ({
    date: format(new Date(d.date), "MMM d"),
    revenue: d.revenue,
    orders: d.orders,
  }));

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="dashboard-main">
        <div className="topbar">
          <div className="topbar-left">
            <div className="topbar-titles">
              <h1>Welcome back, {user?.name?.split(" ")[0]} 👋</h1>
              <p>Here's what's happening with your stall today.</p>
            </div>
          </div>
        </div>

        <div className="dashboard-content">
          {/* Welcome banner */}
          <div className="dash-hero">
            <div className="dash-hero-card">
              <p className="dash-hero-eyebrow">Seller insights</p>
              <h2 className="dash-hero-title">
                Grow your campus stall with smarter listings and order
                visibility.
              </h2>
              <p className="dash-hero-note">
                Keep your products stocked, watch daily revenue, and manage
                orders from one beautiful dashboard.
              </p>
              <div className="dash-hero-actions">
                <Link to="/seller/products" className="btn btn-outline">
                  Manage products
                </Link>
                <Link to="/seller/orders" className="btn btn-ghost">
                  Review orders
                </Link>
              </div>
            </div>
            <div className="dash-tip-card">
              <h3>Performance tip</h3>
              <p>
                Update your top products and restock frequently to keep buyer
                interest high during campus events.
              </p>
            </div>
          </div>

          {/* Stats row */}
          <div className="stats-grid" style={{ marginBottom: "1.5rem" }}>
            <StatCard
              label="Total Revenue"
              value={loading ? "—" : fmt(sales?.total_revenue || 0)}
              icon={<FiDollarSign />}
              color="gold"
            />
            <StatCard
              label="Total Orders"
              value={loading ? "—" : sales?.total_orders || 0}
              icon={<FiShoppingBag />}
              color="green"
            />
            <StatCard
              label="Avg Order Value"
              value={loading ? "—" : fmt(sales?.avg_order_value || 0)}
              icon={<FiTrendingUp />}
              color="info"
            />
            <StatCard
              label="Top Products"
              value={loading ? "—" : topProducts.length}
              icon={<FiStar />}
              color="gray"
            />
          </div>

          <div className="dash-grid">
            {/* Revenue chart */}
            <div className="cm-card">
              <div
                className="cm-card-header"
                style={{ padding: "1.25rem 1.25rem 0" }}
              >
                <div>
                  <h2 className="cm-card-title">Revenue — Last 30 Days</h2>
                </div>
                <Link to="/seller/analytics" className="btn btn-ghost btn-sm">
                  Full analytics <FiArrowRight size={14} />
                </Link>
              </div>
              <div style={{ height: 260, padding: "0 1.25rem 1.25rem" }}>
                {loading ? (
                  <div
                    className="skeleton"
                    style={{ height: "100%", borderRadius: 8 }}
                  />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={chartData}
                      margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="var(--gray-200)"
                      />
                      <XAxis
                        dataKey="date"
                        tick={{
                          fontSize: 11,
                          fill: "var(--cm-text-secondary)",
                        }}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{
                          fontSize: 11,
                          fill: "var(--cm-text-secondary)",
                        }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(v) => `₱${v}`}
                      />
                      <Tooltip
                        contentStyle={{
                          borderRadius: 10,
                          border: "1px solid var(--cm-border)",
                          fontSize: 13,
                        }}
                        formatter={(v) => [`₱${v.toLocaleString()}`, "Revenue"]}
                      />
                      <Line
                        type="monotone"
                        dataKey="revenue"
                        stroke="var(--cm-accent)"
                        strokeWidth={2.5}
                        dot={false}
                        activeDot={{ r: 5 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Top products */}
            <div className="cm-card">
              <div
                className="cm-card-header"
                style={{ padding: "1.25rem 1.25rem 0" }}
              >
                <h2 className="cm-card-title">Top Products</h2>
                <Link to="/seller/products" className="btn btn-ghost btn-sm">
                  View all <FiArrowRight size={14} />
                </Link>
              </div>
              {loading ? (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 12,
                    padding: "0 1.25rem 1.25rem",
                  }}
                >
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className="skeleton"
                      style={{ height: 40, borderRadius: 8 }}
                    />
                  ))}
                </div>
              ) : topProducts.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">
                    <FiPackage size={32} />
                  </div>
                  <h3>No products yet</h3>
                  <p>
                    Add your first product to start seeing performance here.
                  </p>
                </div>
              ) : (
                <div
                  className="top-products-list"
                  style={{ padding: "0 1.25rem 1.25rem" }}
                >
                  {topProducts.map((p, idx) => (
                    <div key={p.product_id} className="top-product-row">
                      <span className="top-rank">#{idx + 1}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p
                          className="font-medium"
                          style={{
                            fontSize: "0.875rem",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {p.product?.name}
                        </p>
                        <p className="text-xs text-muted">
                          {p.total_sold} sold · {fmt(p.revenue)}
                        </p>
                      </div>
                      <div className="top-bar-wrap">
                        <div
                          className="top-bar"
                          style={{
                            width: `${Math.round((p.total_sold / (topProducts[0]?.total_sold || 1)) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recent orders */}
          <div className="cm-card" style={{ marginTop: "1.5rem" }}>
            <div
              className="cm-card-header"
              style={{ padding: "1.25rem 1.25rem 0" }}
            >
              <h2 className="cm-card-title">Recent Orders</h2>
              <Link to="/seller/orders" className="btn btn-ghost btn-sm">
                View all <FiArrowRight size={14} />
              </Link>
            </div>
            {loading ? (
              <div
                style={{
                  padding: "0 1.25rem 1.25rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                }}
              >
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="skeleton"
                    style={{ height: 52, borderRadius: 8 }}
                  />
                ))}
              </div>
            ) : recentOrders.length === 0 ? (
              <div className="empty-state">
                <h3>No orders yet</h3>
                <p>Orders from buyers will show up here once they come in.</p>
              </div>
            ) : (
              <div
                className="orders-table-wrap"
                style={{ padding: "0 1.25rem 1.25rem" }}
              >
                <table className="orders-table">
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Buyer</th>
                      <th>Total</th>
                      <th>Date</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.map((o) => (
                      <tr key={o.id}>
                        <td className="mono-cell">
                          #{o.id.slice(0, 8).toUpperCase()}
                        </td>
                        <td>{o.users?.name || "—"}</td>
                        <td
                          className="font-semibold"
                          style={{ color: "var(--cm-primary)" }}
                        >
                          {fmt(o.total)}
                        </td>
                        <td className="text-muted text-sm">
                          {format(new Date(o.created_at), "MMM d, yyyy")}
                        </td>
                        <td>
                          <span className={`badge status-${o.status}`}>
                            {o.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* These classes were referenced in the JSX above but never defined
          in global.css / variables.css — adding them here so the welcome
          banner, top-product bars, and order ID styling actually render
          instead of falling back to unstyled text. */}
      <style>{`
        .dash-hero {
          display: grid; grid-template-columns: 2fr 1fr; gap: var(--space-3);
          margin-bottom: var(--space-3);
        }
        .dash-hero-card {
          background: linear-gradient(135deg, var(--cm-primary) 0%, var(--cm-primary-hover) 100%);
          color: #fff; border-radius: var(--radius-lg);
          padding: var(--space-3); display: flex; flex-direction: column; gap: 0.5rem;
        }
        .dash-hero-eyebrow {
          font-size: 0.75rem; font-weight: 700; text-transform: uppercase;
          letter-spacing: 0.06em; opacity: 0.85;
        }
        .dash-hero-title { font-size: 1.35rem; font-weight: 800; line-height: 1.3; }
        .dash-hero-note { font-size: 0.875rem; opacity: 0.9; line-height: 1.6; margin-bottom: 0.25rem; }
        .dash-hero-actions { display: flex; gap: 0.625rem; flex-wrap: wrap; margin-top: 0.5rem; }
        .dash-hero-actions .btn-outline { border-color: rgba(255,255,255,0.6); color: #fff; }
        .dash-hero-actions .btn-outline:hover { background: rgba(255,255,255,0.15); }
        .dash-hero-actions .btn-ghost { color: rgba(255,255,255,0.85); }
        .dash-hero-actions .btn-ghost:hover { background: rgba(255,255,255,0.1); color: #fff; }

        .dash-tip-card {
          background: var(--cm-accent-light); border: 1px solid var(--cm-accent);
          border-radius: var(--radius-lg); padding: var(--space-3);
          display: flex; flex-direction: column; gap: 0.5rem; justify-content: center;
        }
        .dash-tip-card h3 { font-size: 0.9rem; font-weight: 700; color: #92600A; }
        .dash-tip-card p { font-size: 0.825rem; color: #92600A; line-height: 1.55; opacity: 0.9; }

        .top-bar-wrap { width: 56px; height: 6px; background: var(--gray-100); border-radius: var(--radius-full); overflow: hidden; flex-shrink: 0; }
        .top-bar { height: 100%; background: var(--cm-accent); border-radius: var(--radius-full); transition: width 0.5s ease; }

        .mono-cell { font-family: var(--font-mono); font-size: 0.8rem; color: var(--gray-700); }

        @media (max-width: 900px) {
          .dash-hero { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
