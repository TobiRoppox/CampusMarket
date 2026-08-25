import { useState, useEffect } from "react";
import Sidebar from "../../components/common/Sidebar.jsx";
import RevenueCard from "../../components/seller/RevenueCard.jsx";
import { analyticsService } from "../../services/api.js";
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

const PERIOD_OPTIONS = [
  { label: "7 days", value: "7" },
  { label: "30 days", value: "30" },
  { label: "90 days", value: "90" },
];

export default function Reports() {
  const [period, setPeriod] = useState("30");
  const [sales, setSales] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    analyticsService
      .getSales(period)
      .then(({ data }) => setSales(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [period]);

  const chartData = (sales?.timeline || []).map((d) => ({
    date: format(new Date(d.date), "MMM d"),
    Revenue: d.revenue,
  }));

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="dashboard-main">
        <div className="topbar">
          <div className="topbar-left">
            <div className="topbar-titles">
              <h1>Reports</h1>
              <p>Platform-wide sales performance over time.</p>
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
          <div className="reports-top-row">
            <RevenueCard revenue={sales?.total_revenue || 0} />
            <div className="card reports-mini-stat">
              <h3>Total Orders</h3>
              <p>
                {loading ? "—" : sales?.total_orders?.toLocaleString() || 0}
              </p>
            </div>
            <div className="card reports-mini-stat">
              <h3>Avg Order Value</h3>
              <p>
                {loading
                  ? "—"
                  : `₱${Number(sales?.avg_order_value || 0).toLocaleString("en-PH", { minimumFractionDigits: 2 })}`}
              </p>
            </div>
          </div>

          <div className="card chart-card">
            <div className="chart-card-header">
              <h2 className="card-title">Revenue Over Time</h2>
            </div>
            <div style={{ height: 320, padding: "0 1.25rem 1.25rem" }}>
              {loading ? (
                <div
                  className="skeleton"
                  style={{ height: "100%", borderRadius: 8 }}
                />
              ) : chartData.length === 0 ? (
                <div className="empty-state" style={{ height: "100%" }}>
                  <p>No data for this period</p>
                </div>
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
                      tick={{ fontSize: 11, fill: "var(--gray-500)" }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: "var(--gray-500)" }}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => `₱${v}`}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: 10,
                        border: "1px solid var(--gray-200)",
                        fontSize: 13,
                      }}
                      formatter={(v) => [`₱${v.toLocaleString()}`, "Revenue"]}
                    />
                    <Line
                      type="monotone"
                      dataKey="Revenue"
                      stroke="var(--cm-primary)"
                      strokeWidth={2.5}
                      dot={false}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      </main>

      <style>{`
        .period-toggle { display: flex; border: 1.5px solid var(--cm-border); border-radius: var(--radius-md); overflow: hidden; }
        .period-btn { padding: 0.375rem 0.875rem; font-size: 0.8rem; font-weight: 500; color: var(--cm-text-secondary); background: #fff; transition: var(--transition-fast); }
        .period-btn.active { background: var(--cm-primary); color: #fff; }
        .period-btn:not(.active):hover { background: var(--gray-100); }

        .reports-top-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-bottom: 1.5rem; }

        /* RevenueCard.jsx ships with zero CSS — no class names to hook into
           besides .revenue-card, so styling it here rather than editing that
           tiny component directly */
        .revenue-card {
          background: linear-gradient(135deg, var(--cm-primary) 0%, var(--cm-primary-hover) 100%);
          color: #fff; border-radius: var(--radius-lg); padding: 1.5rem;
          box-shadow: var(--shadow-sm);
        }
        .revenue-card h3 { font-size: 0.8125rem; font-weight: 500; opacity: 0.85; margin-bottom: 0.5rem; }
        .revenue-card p { font-size: 1.75rem; font-weight: 800; }

        .reports-mini-stat {
          padding: 1.5rem; display: flex; flex-direction: column; justify-content: center;
        }
        .reports-mini-stat h3 { font-size: 0.8125rem; font-weight: 500; color: var(--cm-text-secondary); margin-bottom: 0.5rem; }
        .reports-mini-stat p { font-size: 1.75rem; font-weight: 800; color: var(--cm-text); }

        .chart-card-header { padding: 1.25rem 1.25rem 0.75rem; }
        .card-title { font-size: 1rem; font-weight: 700; color: var(--gray-900); }

        @media (max-width: 900px) { .reports-top-row { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  );
}
