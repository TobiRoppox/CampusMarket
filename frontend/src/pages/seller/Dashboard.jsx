import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Sidebar from "../../components/common/Sidebar.jsx";
import { analyticsService, orderService } from "../../services/api.js";
import { useAuth } from "../../context/AuthContext.jsx";
import {
  FiAlertCircle,
  FiArrowRight,
  FiDollarSign,
  FiPackage,
  FiRefreshCw,
  FiShoppingBag,
  FiTrendingUp,
} from "react-icons/fi";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { format } from "date-fns";
import "./Dashboard.css";

const unwrapObject = (payload) => payload?.data || payload || {};

const unwrapArray = (payload, key) => {
  const value =
    payload?.data?.[key] ?? payload?.[key] ?? payload?.data ?? payload;
  return Array.isArray(value) ? value : [];
};

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value) || 0);

const formatCompactCurrency = (value) =>
  new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(Number(value) || 0);

const formatSafeDate = (value, pattern, fallback = "—") => {
  if (!value) return fallback;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? fallback : format(date, pattern);
};

const getBuyerName = (order) =>
  order?.users?.name ||
  order?.buyer?.name ||
  order?.profiles?.full_name ||
  order?.buyer_name ||
  "Campus buyer";

const getOrderTotal = (order) =>
  order?.total ?? order?.total_amount ?? order?.grand_total ?? 0;

const getOrderStatus = (order) =>
  String(order?.status || "pending")
    .toLowerCase()
    .replace(/\s+/g, "-");

function DashboardMetric({
  icon,
  label,
  value,
  note,
  tone = "green",
  loading,
}) {
  return (
    <article className={`seller-metric-card tone-${tone}`}>
      <div className="seller-metric-icon">{icon}</div>
      <div className="seller-metric-copy">
        <span>{label}</span>
        {loading ? (
          <i className="seller-dashboard-shimmer" />
        ) : (
          <strong>{value}</strong>
        )}
        <small>{note}</small>
      </div>
    </article>
  );
}

export default function SellerDashboard() {
  const { user } = useAuth();
  const [sales, setSales] = useState({});
  const [topProducts, setTopProducts] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState(null);

  const loadDashboard = useCallback(async ({ quiet = false } = {}) => {
    quiet ? setRefreshing(true) : setLoading(true);
    setError("");

    const results = await Promise.allSettled([
      analyticsService.getSales(30),
      analyticsService.getTopProducts(),
      orderService.getSellerOrders({ status: "" }),
    ]);

    const [salesResult, productsResult, ordersResult] = results;
    const failedRequests = results.filter(
      (result) => result.status === "rejected",
    ).length;

    if (salesResult.status === "fulfilled") {
      setSales(unwrapObject(salesResult.value.data));
    }
    if (productsResult.status === "fulfilled") {
      setTopProducts(
        unwrapArray(productsResult.value.data, "products").slice(0, 5),
      );
    }
    if (ordersResult.status === "fulfilled") {
      setRecentOrders(
        unwrapArray(ordersResult.value.data, "orders").slice(0, 6),
      );
    }

    if (failedRequests > 0) {
      setError(
        results.some((result) => result.status === "rejected" && result.reason.response?.data?.code === "PREMIUM_REQUIRED")
          ? "Free plan: record counter sales in Point of Sale. Product analytics and advertising are available with Premium through the campus administrator."
          : failedRequests === results.length
          ? "Dashboard data is temporarily unavailable. Please try again."
          : "Some dashboard information could not be updated.",
      );
    } else {
      setLastUpdated(new Date());
    }

    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const chartData = useMemo(
    () =>
      (Array.isArray(sales?.timeline) ? sales.timeline : [])
        .map((entry) => ({
          date: formatSafeDate(entry.date, "MMM d", ""),
          revenue: Number(entry.revenue) || 0,
          orders: Number(entry.orders) || 0,
        }))
        .filter((entry) => entry.date),
    [sales],
  );

  const pendingOrders = recentOrders.filter((order) =>
    ["pending", "processing", "confirmed"].includes(getOrderStatus(order)),
  ).length;
  const firstName = user?.name?.trim().split(/\s+/)[0] || "Seller";
  const maxSold = Math.max(
    1,
    ...topProducts.map((product) =>
      Number(product.total_sold ?? product.sold_count ?? 0),
    ),
  );

  return (
    <div className="dashboard-layout seller-dashboard-shell">
      <Sidebar />

      <main className="dashboard-main">
        <header className="topbar seller-dashboard-topbar">
          <div className="topbar-left">
            <div className="topbar-titles">
              <h1>Welcome back, {firstName}</h1>
              <p>Here is your stall performance for the last 30 days.</p>
            </div>
          </div>

          <div className="seller-dashboard-topbar-actions">
            {lastUpdated && (
              <span>Updated {formatSafeDate(lastUpdated, "h:mm a")}</span>
            )}
            <button
              type="button"
              className="seller-refresh-button"
              onClick={() => loadDashboard({ quiet: true })}
              disabled={loading || refreshing}
            >
              <FiRefreshCw className={refreshing ? "is-spinning" : ""} />
              Refresh
            </button>
          </div>
        </header>

        <div className="dashboard-content seller-dashboard-content">
          {error && (
            <div className="seller-dashboard-alert" role="alert">
              <FiAlertCircle />
              <span>{error}</span>
              <button
                type="button"
                onClick={() => loadDashboard({ quiet: true })}
              >
                Retry
              </button>
            </div>
          )}

          <section className="seller-dashboard-hero">
            <div className="seller-dashboard-hero-copy">
              <span>Seller workspace</span>
              <h2>Run your campus stall with clarity.</h2>
              <p>
                Track sales, prioritize new orders, and keep your best products
                ready for buyers—all from one place.
              </p>
              <div>
                <Link to="/seller/products" className="btn btn-primary">
                  Manage products <FiArrowRight />
                </Link>
                <Link to="/seller/orders" className="btn btn-outline">
                  Review orders
                </Link>
              </div>
            </div>

          </section>

          <section
            className="seller-metrics-grid"
            aria-label="Seller performance summary"
          >
            <DashboardMetric
              label="Total revenue"
              value={formatCurrency(sales?.total_revenue)}
              note="Last 30 days"
              icon={<FiDollarSign />}
              tone="gold"
              loading={loading}
            />
            <DashboardMetric
              label="Total orders"
              value={Number(sales?.total_orders) || 0}
              note="Completed and active"
              icon={<FiShoppingBag />}
              tone="green"
              loading={loading}
            />
            <DashboardMetric
              label="Average order"
              value={formatCurrency(sales?.avg_order_value)}
              note="Revenue per order"
              icon={<FiTrendingUp />}
              tone="blue"
              loading={loading}
            />
            <DashboardMetric
              label="Needs attention"
              value={pendingOrders}
              note="Recent active orders"
              icon={<FiPackage />}
              tone="orange"
              loading={loading}
            />
          </section>

          <section className="seller-dashboard-main-grid">
            <article className="seller-dashboard-panel seller-revenue-panel">
              <div className="seller-panel-header">
                <div>
                  <span>Revenue trend</span>
                  <h2>Last 30 days</h2>
                </div>
                <Link to="/seller/analytics">
                  Full analytics <FiArrowRight />
                </Link>
              </div>

              <div className="seller-chart-area">
                {loading ? (
                  <div className="seller-chart-skeleton seller-dashboard-shimmer" />
                ) : chartData.length === 0 ? (
                  <div className="seller-panel-empty">
                    <FiTrendingUp />
                    <h3>No revenue activity yet</h3>
                    <p>
                      Your sales trend will appear after buyers place orders.
                    </p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={chartData}
                      margin={{ top: 8, right: 10, left: -10, bottom: 0 }}
                    >
                      <CartesianGrid
                        vertical={false}
                        strokeDasharray="3 3"
                        stroke="#e9eeeb"
                      />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 10, fill: "#819087" }}
                        tickLine={false}
                        axisLine={false}
                        minTickGap={20}
                      />
                      <YAxis
                        tick={{ fontSize: 10, fill: "#819087" }}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={formatCompactCurrency}
                      />
                      <Tooltip
                        cursor={{
                          stroke: "rgba(15,123,62,.18)",
                          strokeWidth: 1,
                        }}
                        contentStyle={{
                          borderRadius: 12,
                          border: "1px solid #e1e8e4",
                          boxShadow: "0 10px 28px rgba(15,52,34,.10)",
                          fontSize: 12,
                        }}
                        formatter={(value) => [
                          formatCurrency(value),
                          "Revenue",
                        ]}
                      />
                      <Line
                        type="monotone"
                        dataKey="revenue"
                        stroke="#0f7b3e"
                        strokeWidth={2.5}
                        dot={false}
                        activeDot={{
                          r: 4,
                          fill: "#0f7b3e",
                          stroke: "#fff",
                          strokeWidth: 2,
                        }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </article>

            <article className="seller-dashboard-panel seller-top-products-panel">
              <div className="seller-panel-header">
                <div>
                  <span>Product performance</span>
                  <h2>Top products</h2>
                </div>
                <Link to="/seller/products">
                  View all <FiArrowRight />
                </Link>
              </div>

              {loading ? (
                <div className="seller-list-skeleton">
                  {Array.from({ length: 5 }).map((_, index) => (
                    <i key={index} className="seller-dashboard-shimmer" />
                  ))}
                </div>
              ) : topProducts.length === 0 ? (
                <div className="seller-panel-empty compact">
                  <FiPackage />
                  <h3>No products yet</h3>
                  <p>Add your first product to begin tracking performance.</p>
                  <Link
                    to="/seller/products"
                    className="btn btn-outline btn-sm"
                  >
                    Manage products
                  </Link>
                </div>
              ) : (
                <ol className="seller-top-products-list">
                  {topProducts.map((product, index) => {
                    const sold = Number(
                      product.total_sold ?? product.sold_count ?? 0,
                    );
                    const name =
                      product.product?.name ||
                      product.name ||
                      "Untitled product";
                    return (
                      <li
                        key={
                          product.product_id || product.id || `${name}-${index}`
                        }
                      >
                        <span className="seller-product-rank">{index + 1}</span>
                        <div className="seller-product-performance">
                          <div>
                            <strong title={name}>{name}</strong>
                            <small>
                              {sold} sold ·{" "}
                              {formatCurrency(
                                product.revenue ?? product.total_revenue,
                              )}
                            </small>
                          </div>
                          <span>
                            <i
                              style={{
                                width: `${Math.max(5, Math.round((sold / maxSold) * 100))}%`,
                              }}
                            />
                          </span>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              )}
            </article>
          </section>

          <section className="seller-dashboard-panel seller-orders-panel">
            <div className="seller-panel-header">
              <div>
                <span>Order activity</span>
                <h2>Recent orders</h2>
              </div>
              <Link to="/seller/orders">
                View all <FiArrowRight />
              </Link>
            </div>

            {loading ? (
              <div className="seller-order-skeleton">
                {Array.from({ length: 4 }).map((_, index) => (
                  <i key={index} className="seller-dashboard-shimmer" />
                ))}
              </div>
            ) : recentOrders.length === 0 ? (
              <div className="seller-panel-empty">
                <FiShoppingBag />
                <h3>No orders yet</h3>
                <p>New buyer orders will appear here automatically.</p>
              </div>
            ) : (
              <div className="seller-orders-table-wrap">
                <table className="seller-orders-table">
                  <thead>
                    <tr>
                      <th>Order</th>
                      <th>Buyer</th>
                      <th>Date</th>
                      <th>Total</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.map((order, index) => {
                      const id = String(
                        order.id || order.order_id || index + 1,
                      );
                      const status = getOrderStatus(order);
                      return (
                        <tr key={id}>
                          <td data-label="Order">
                            <strong>#{id.slice(0, 8).toUpperCase()}</strong>
                          </td>
                          <td data-label="Buyer">{getBuyerName(order)}</td>
                          <td data-label="Date">
                            {formatSafeDate(
                              order.created_at || order.order_date,
                              "MMM d, yyyy",
                            )}
                          </td>
                          <td data-label="Total">
                            <strong>
                              {formatCurrency(getOrderTotal(order))}
                            </strong>
                          </td>
                          <td data-label="Status">
                            <span
                              className={`seller-order-status status-${status}`}
                            >
                              {status.replace(/-/g, " ")}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
