import { useState, useEffect } from "react";
import Sidebar from "../../components/common/Sidebar.jsx";
import { StatCard } from "../../components/common/UI.jsx";
import { analyticsService } from "../../services/api.js";
import {
  FiDollarSign,
  FiShoppingBag,
  FiTrendingUp,
  FiBarChart2,
} from "react-icons/fi";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { format } from "date-fns";

const PERIOD_OPTIONS = [
  { label: "7 days", value: "7" },
  { label: "30 days", value: "30" },
  { label: "90 days", value: "90" },
];

// Matches your --cm-* palette (gold accent, green primary/secondary) plus
// a few extra hues for categories beyond those two
const PIE_COLORS = [
  "#F4C430", // cm-accent (gold)
  "#0F7B3E", // cm-primary (green)
  "#3B82F6", // cm-info
  "#EF4444", // cm-danger
  "#9333EA",
  "#64748B", // gray-500
];

export default function Analytics() {
  const [period, setPeriod] = useState("30");
  const [sales, setSales] = useState(null);
  const [topProducts, setTopProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      analyticsService.getSales(period),
      analyticsService.getTopProducts(),
      analyticsService.getCategories(),
    ])
      .then(([s, t, c]) => {
        setSales(s.data);
        setTopProducts(t.data || []);
        setCategories(c.data || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [period]);

  const fmt = (p) =>
    `₱${Number(p).toLocaleString("en-PH", { minimumFractionDigits: 2 })}`;

  const chartTimeline = (sales?.timeline || []).map((d) => ({
    date: format(new Date(d.date), "MMM d"),
    Revenue: d.revenue,
    Orders: d.orders,
  }));

  const topProductsChart = topProducts.slice(0, 8).map((p) => ({
    name:
      p.product?.name?.slice(0, 16) + (p.product?.name?.length > 16 ? "…" : ""),
    Sold: p.total_sold,
    Revenue: p.revenue,
  }));

  const pieData = categories.map((c) => ({
    name:
      c.category.charAt(0).toUpperCase() +
      c.category.slice(1).replace("-", " "),
    value: c.revenue,
  }));

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="dashboard-main">
        <div className="topbar">
          <div className="topbar-left">
            <div className="topbar-titles">
              <h1>Analytics</h1>
              <p>Track your stall's performance and sales trends.</p>
            </div>
          </div>
          <div className="topbar-right">
            <div className="period-toggle">
              {PERIOD_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  className={`period-btn ${period === opt.value ? "active" : ""}`}
                  onClick={() => setPeriod(opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="dashboard-content">
          {/* KPI stats */}
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
              label="Product Categories"
              value={loading ? "—" : categories.length}
              icon={<FiBarChart2 />}
              color="gray"
            />
          </div>

          {/* Revenue over time */}
          <div className="card chart-card" style={{ marginBottom: "1.5rem" }}>
            <div className="chart-card-header">
              <h2 className="card-title">Revenue Over Time</h2>
            </div>
            <div style={{ height: 300, padding: "0 1.25rem 1.25rem" }}>
              {loading ? (
                <div
                  className="skeleton"
                  style={{ height: "100%", borderRadius: 8 }}
                />
              ) : chartTimeline.length === 0 ? (
                <div className="empty-state" style={{ height: "100%" }}>
                  <p>No data for this period</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={chartTimeline}
                    margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="var(--gray-200)"
                    />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11, fill: "var(--gray-500)" }}
                      tickLine={false}
                    />
                    <YAxis
                      yAxisId="revenue"
                      tick={{ fontSize: 11, fill: "var(--gray-500)" }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => `₱${v}`}
                    />
                    <YAxis
                      yAxisId="orders"
                      orientation="right"
                      tick={{ fontSize: 11, fill: "var(--gray-500)" }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: 10,
                        border: "1px solid var(--gray-200)",
                        fontSize: 13,
                      }}
                      formatter={(v, name) => [
                        name === "Revenue" ? `₱${v.toLocaleString()}` : v,
                        name,
                      ]}
                    />
                    <Legend wrapperStyle={{ fontSize: 13 }} />
                    <Line
                      yAxisId="revenue"
                      type="monotone"
                      dataKey="Revenue"
                      stroke="var(--cm-accent)"
                      strokeWidth={2.5}
                      dot={false}
                      activeDot={{ r: 5 }}
                    />
                    <Line
                      yAxisId="orders"
                      type="monotone"
                      dataKey="Orders"
                      stroke="var(--cm-primary)"
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 4 }}
                      strokeDasharray="5 3"
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Top products + Category breakdown */}
          <div className="analytics-grid">
            {/* Top products bar chart */}
            <div className="card chart-card">
              <div className="chart-card-header">
                <h2 className="card-title">Top Products by Units Sold</h2>
              </div>
              <div style={{ height: 280, padding: "0 1.25rem 1.25rem" }}>
                {loading ? (
                  <div
                    className="skeleton"
                    style={{ height: "100%", borderRadius: 8 }}
                  />
                ) : topProductsChart.length === 0 ? (
                  <div className="empty-state" style={{ height: "100%" }}>
                    <p>No sales yet</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={topProductsChart}
                      layout="vertical"
                      margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="var(--gray-200)"
                        horizontal={false}
                      />
                      <XAxis
                        type="number"
                        tick={{ fontSize: 11, fill: "var(--gray-500)" }}
                        tickLine={false}
                      />
                      <YAxis
                        type="category"
                        dataKey="name"
                        tick={{ fontSize: 11, fill: "var(--gray-600)" }}
                        width={90}
                        tickLine={false}
                      />
                      <Tooltip
                        contentStyle={{
                          borderRadius: 10,
                          border: "1px solid var(--gray-200)",
                          fontSize: 13,
                        }}
                      />
                      <Bar
                        dataKey="Sold"
                        fill="var(--cm-accent)"
                        radius={[0, 4, 4, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Category pie chart */}
            <div className="card chart-card">
              <div className="chart-card-header">
                <h2 className="card-title">Revenue by Category</h2>
              </div>
              <div style={{ height: 280, padding: "0 1.25rem 1.25rem" }}>
                {loading ? (
                  <div
                    className="skeleton"
                    style={{ height: "100%", borderRadius: 8 }}
                  />
                ) : pieData.length === 0 ? (
                  <div className="empty-state" style={{ height: "100%" }}>
                    <p>No data yet</p>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={3}
                        dataKey="value"
                        label={({ name, percent }) =>
                          `${name} ${(percent * 100).toFixed(0)}%`
                        }
                        labelLine={false}
                      >
                        {pieData.map((_, idx) => (
                          <Cell
                            key={idx}
                            fill={PIE_COLORS[idx % PIE_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          borderRadius: 10,
                          border: "1px solid var(--gray-200)",
                          fontSize: 13,
                        }}
                        formatter={(v) => [
                          `₱${Number(v).toLocaleString()}`,
                          "Revenue",
                        ]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>
          </div>

          {/* Top products table */}
          {!loading && topProducts.length > 0 && (
            <div className="card" style={{ marginTop: "1.5rem" }}>
              <div className="chart-card-header">
                <h2 className="card-title">Product Performance Details</h2>
              </div>
              <div style={{ overflowX: "auto" }}>
                <table className="analytics-table">
                  <thead>
                    <tr>
                      <th>Rank</th>
                      <th>Product</th>
                      <th>Category</th>
                      <th>Units Sold</th>
                      <th>Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topProducts.map((p, idx) => (
                      <tr key={p.product_id}>
                        <td>
                          <span
                            className="rank-badge"
                            style={{
                              background:
                                idx < 3
                                  ? "var(--cm-accent-light)"
                                  : "var(--gray-100)",
                              color: idx < 3 ? "#92600A" : "var(--gray-600)",
                            }}
                          >
                            #{idx + 1}
                          </span>
                        </td>
                        <td
                          className="font-medium"
                          style={{ fontSize: "0.875rem" }}
                        >
                          {p.product?.name}
                        </td>
                        <td>
                          <span
                            className={`badge cat-badge cat-${p.product?.category}`}
                            style={{ textTransform: "capitalize" }}
                          >
                            {p.product?.category}
                          </span>
                        </td>
                        <td className="font-semibold">{p.total_sold}</td>
                        <td
                          className="font-semibold"
                          style={{ color: "var(--color-primary)" }}
                        >
                          {fmt(p.revenue)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>

      <style>{`
        .period-toggle { display: flex; border: 1.5px solid var(--cm-border); border-radius: var(--radius-md); overflow: hidden; }
        .period-btn { padding: 0.375rem 0.875rem; font-size: 0.8rem; font-weight: 500; color: var(--cm-text-secondary); background: #fff; transition: var(--transition-fast); }
        .period-btn.active { background: var(--cm-primary); color: #fff; }
        .period-btn:not(.active):hover { background: var(--gray-100); }
        .chart-card-header { padding: 1.25rem 1.25rem 0.75rem; }
        .card-title { font-size: 1rem; font-weight: 700; color: var(--gray-900); }
        .analytics-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
        .analytics-table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
        .analytics-table th { text-align: left; padding: 0.75rem 1.25rem; color: var(--gray-500); font-weight: 600; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.04em; border-bottom: 1px solid var(--gray-200); background: var(--gray-50); }
        .analytics-table td { padding: 0.875rem 1.25rem; border-bottom: 1px solid var(--gray-100); vertical-align: middle; }
        .analytics-table tr:last-child td { border-bottom: none; }
        .rank-badge { padding: 2px 8px; border-radius: var(--radius-full); font-size: 0.75rem; font-weight: 700; }
        .cat-badge { text-transform: capitalize; font-size: 0.7rem; }
        .cat-food        { background: #FEF9C3; color: #92400E; }
        .cat-clothing    { background: #EDE9FE; color: #5B21B6; }
        .cat-electronics { background: #DBEAFE; color: #1E40AF; }
        .cat-accessories { background: #FCE7F3; color: #9D174D; }
        .cat-student-made{ background: var(--cm-secondary-light); color: #15803D; }
        .cat-other       { background: var(--gray-100); color: var(--gray-700); }
        @media (max-width: 1024px) { .analytics-grid { grid-template-columns: 1fr; } }
        @media (max-width: 768px) { .topbar { flex-direction: column; align-items: flex-start; gap: 0.75rem; height: auto; padding: 1rem 1.5rem; } }
      `}</style>
    </div>
  );
}
