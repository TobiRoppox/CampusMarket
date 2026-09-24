import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Sidebar from "../../components/common/Sidebar.jsx";
import { StatCard } from "../../components/common/Ui.jsx";
import { adminService, stallService } from "../../services/api.js";
import toast from "react-hot-toast";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell } from "recharts";
import "./AdminWorkspace.css";
import {
  FiUsers,
  FiShoppingBag,
  FiDollarSign,
  FiActivity,
  FiArrowRight,
  FiCheck,
  FiX,
} from "react-icons/fi";

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [pendingStalls, setPendingStalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [approvingId, setApprovingId] = useState(null);
  const [error, setError] = useState(false);

  const fetchData = () => {
    setLoading(true);
    setError(false);
    Promise.all([adminService.getStats(), adminService.getPendingStalls()])
      .then(([s, p]) => {
        setStats(s.data);
        setPendingStalls(p.data || []);
      })
      .catch(() => { setError(true); toast.error("Failed to load dashboard"); })
      .finally(() => setLoading(false));
  };

  useEffect(fetchData, []);

  const handleStallAction = async (stallId, status) => {
    try {
      setApprovingId(stallId);
      await stallService.updateStatus(stallId, status);
      setPendingStalls((prev) => prev.filter((s) => s.id !== stallId));
      toast.success(`Stall ${status} successfully`);
      adminService.getStats().then(({ data }) => setStats(data)).catch(() => toast.error("Stall updated, but dashboard totals could not refresh."));
    } catch {
      toast.error("Failed to update stall");
    } finally {
      setApprovingId(null);
    }
  };

  const fmt = (p) =>
    `₱${Number(p).toLocaleString("en-PH", { minimumFractionDigits: 2 })}`;

  return (
    <div className="dashboard-layout admin-shell">
      <Sidebar />
      <main className="dashboard-main">
        <div className="topbar">
          <div className="topbar-left">
            <div className="topbar-titles">
              <h1>Admin Overview</h1>
              <p>Platform health and management at a glance.</p>
            </div>
          </div>
        </div>

        <div className="dashboard-content">
          {error && <div role="alert" className="card admin-panel"><p>Dashboard data could not be loaded.</p><button className="btn btn-outline" onClick={fetchData}>Retry</button></div>}
          <div className="dashboard-hero">
            <div className="hero-card card">
              <div className="hero-card-inner">
                <p className="eyebrow">Admin workspace</p>
                <h2 className="hero-callout">
                  Monitor marketplace health and approve seller stalls with
                  confidence.
                </h2>
                <p className="hero-note">
                  Manage users, track revenue, and keep your campus market
                  running smoothly from one centralized admin hub.
                </p>
                <div className="hero-actions">
                  <Link to="/admin/stalls" className="btn btn-outline">
                    Review stalls
                  </Link>
                  <Link to="/admin/users" className="btn btn-ghost">
                    Manage users
                  </Link>
                  <Link to="/admin/events" className="btn btn-ghost">Events & stall maps</Link>
                </div>
              </div>
            </div>
            <div className="info-panel">
              <h3>Action items</h3>
              <p>
                Keep an eye on pending applications, platform activity, and
                merchant growth to ensure a trusted campus marketplace.
              </p>
            </div>
          </div>

          {/* Platform stats */}
          <div className="stats-grid" style={{ marginBottom: "1.75rem" }}>
            <StatCard
              label="Total Users"
              value={loading || error ? "—" : stats?.total_users?.toLocaleString() || 0}
              icon={<FiUsers />}
              color="info"
            />
            <StatCard
              label="Active Stalls"
              value={loading || error ? "—" : stats?.active_stalls || 0}
              icon={<FiShoppingBag />}
              color="green"
            />
            <StatCard
              label="Total Events"
              value={loading || error ? "—" : stats?.total_events?.toLocaleString() || 0}
              icon={<FiActivity />}
              color="gold"
            />
            <StatCard
              label="Completed Order Sales"
              value={loading || error ? "—" : fmt(stats?.total_revenue || 0)}
              icon={<FiDollarSign />}
              color="gray"
            />
          </div>

          {!loading && !error && <div className="admin-charts">
            <section className="card admin-chart"><h2>Sales overview</h2><p>Last six calendar months · completed and delivered online orders · PHP</p><ResponsiveContainer width="100%" height={240}><BarChart data={stats?.sales_history || []}><XAxis dataKey="month" tick={{ fontSize: 11 }} /><YAxis tick={{ fontSize: 11 }} width={65} /><Tooltip formatter={(value) => fmt(value)} /><Bar dataKey="sales" name="Sales" fill="#167342" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer>{!stats?.sales_history?.some((month) => month.sales > 0) && <p>No completed sales in this period.</p>}</section>
            <section className="card admin-chart"><h2>User breakdown</h2><p>{stats?.total_users || 0} registered accounts · all time</p>{stats?.total_users > 0 && <ResponsiveContainer width="100%" height={220}><PieChart><Pie data={stats?.user_breakdown || []} dataKey="value" nameKey="name" innerRadius={60} outerRadius={90}>{["#167342", "#287ec1", "#9270bd"].map((color) => <Cell key={color} fill={color} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer>}<div className="admin-breakdown">{stats?.user_breakdown?.map((item, index) => <span key={item.name}><i style={{ background: ["#167342", "#287ec1", "#9270bd"][index] }} />{item.name}: {item.value} ({stats.total_users ? Math.round(item.value / stats.total_users * 100) : 0}%)</span>)}</div></section>
          </div>}
          <div className="admin-grid">
            {/* Pending stall approvals */}
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">
                  Stall Approvals
                  {pendingStalls.length > 0 && (
                    <span
                      className="badge badge-warning"
                      style={{ marginLeft: 8 }}
                    >
                      {pendingStalls.length} pending
                    </span>
                  )}
                </h2>
                <Link to="/admin/stalls" className="btn btn-ghost btn-sm">
                  View all <FiArrowRight size={14} />
                </Link>
              </div>

              {error ? <p role="status" style={{ padding: "1.25rem" }}>Approval queue unavailable. Retry loading above.</p> : loading ? (
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
                      style={{ height: 72, borderRadius: 10 }}
                    />
                  ))}
                </div>
              ) : pendingStalls.length === 0 ? (
                <div className="empty-state" style={{ padding: "2rem" }}>
                  <div
                    className="empty-state-icon"
                    style={{ fontSize: "2rem" }}
                  >
                    ✅
                  </div>
                  <p style={{ color: "var(--gray-500)", fontSize: "0.9rem" }}>
                    All caught up! No pending stalls.
                  </p>
                </div>
              ) : (
                <div
                  style={{
                    padding: "0 1.25rem 1.25rem",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.75rem",
                  }}
                >
                  {pendingStalls.map((stall) => (
                    <div key={stall.id} className="approval-card">
                      <div className="approval-info">
                        <p
                          className="font-semibold"
                          style={{ fontSize: "0.9rem" }}
                        >
                          {stall.name}
                        </p>
                        <p className="text-xs text-muted">
                          by {stall.users?.name} · {stall.users?.email}
                        </p>
                        {stall.description && (
                          <p
                            className="text-xs"
                            style={{
                              color: "var(--gray-600)",
                              marginTop: 2,
                              overflow: "hidden",
                              display: "-webkit-box",
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: "vertical",
                            }}
                          >
                            {stall.description}
                          </p>
                        )}
                      </div>
                      <div className="approval-actions">
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() =>
                            handleStallAction(stall.id, "approved")
                          }
                          disabled={approvingId !== null}
                        >
                          {approvingId === stall.id ? (
                            <span
                              className="spinner"
                              style={{ width: 12, height: 12, borderWidth: 2 }}
                            />
                          ) : (
                            <>
                              <FiCheck size={13} /> Approve
                            </>
                          )}
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() =>
                            handleStallAction(stall.id, "rejected")
                          }
                          disabled={approvingId !== null}
                        >
                          <FiX size={13} /> Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick nav cards */}
            <div
              style={{ display: "flex", flexDirection: "column", gap: "1rem" }}
            >
              <h2
                style={{
                  fontSize: "1rem",
                  fontWeight: 700,
                  color: "var(--gray-800)",
                }}
              >
                Quick Actions
              </h2>
              {[
                {
                  to: "/admin/users",
                  icon: "👥",
                  label: "Manage Users",
                  desc: "View, ban, or unban accounts",
                  color: "info",
                },
                {
                  to: "/admin/stalls",
                  icon: "🏪",
                  label: "Manage Stalls",
                  desc: "Approve, reject, suspend stalls",
                  color: "green",
                },
              ].map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className="quick-nav-card card card-hover"
                >
                  <div
                    className={`quick-nav-icon quick-nav-icon--${item.color}`}
                  >
                    {item.icon}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p className="font-semibold">{item.label}</p>
                    <p className="text-sm text-muted">{item.desc}</p>
                  </div>
                  <FiArrowRight className="text-muted" />
                </Link>
              ))}

              {/* Platform metrics box */}
              <div className="card" style={{ padding: "1.25rem" }}>
                <h3
                  className="font-semibold"
                  style={{ marginBottom: "0.875rem", fontSize: "0.9rem" }}
                >
                  Platform Metrics
                </h3>
                {[
                  {
                    label: "User interactions",
                    value: loading
                      ? "—"
                      : stats?.total_interactions?.toLocaleString() || 0,
                  },
                  {
                    label: "Avg completed order value",
                    value: loading
                      ? "—"
                      : fmt(
                          (stats?.total_revenue || 0) /
                            Math.max(stats?.completed_orders || 1, 1),
                        ),
                  },
                  {
                    label: "Stalls per user",
                    value: loading
                      ? "—"
                      : stats?.total_users
                        ? (
                            (stats.active_stalls / stats.total_users) *
                            100
                          ).toFixed(1) + "%"
                        : "—",
                  },
                ].map((m) => (
                  <div key={m.label} className="metric-row">
                    <span className="text-sm text-muted">{m.label}</span>
                    <span
                      className="font-semibold"
                      style={{ fontSize: "0.9rem" }}
                    >
                      {m.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      <style>{`
        .card-header { display: flex; align-items: center; justify-content: space-between; padding: 1.25rem 1.25rem 1rem; }
        .card-title { font-size: 1rem; font-weight: 700; color: var(--gray-900); display: flex; align-items: center; }
        .admin-grid { display: grid; grid-template-columns: 1.4fr 1fr; gap: 1.5rem; }
        .approval-card { display: flex; align-items: flex-start; gap: 0.875rem; padding: 0.875rem; background: var(--gray-50); border: 1px solid var(--gray-200); border-radius: var(--radius-lg); }
        .approval-info { flex: 1; min-width: 0; }
        .approval-actions { display: flex; gap: 0.5rem; flex-shrink: 0; }
        .quick-nav-card { display: flex; align-items: center; gap: 1rem; padding: 1rem 1.25rem; text-decoration: none; color: inherit; }
        .quick-nav-icon { font-size: 1.5rem; width: 44px; height: 44px; border-radius: var(--radius-md); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .quick-nav-icon--info  { background: var(--color-info-light); }
        .quick-nav-icon--green { background: var(--color-secondary-light); }
        .metric-row { display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid var(--gray-100); }
        .metric-row:last-child { border-bottom: none; }

        /* dashboard-hero / hero-card / info-panel were referenced but never
           defined anywhere — banner rendered as plain unstyled text/links */
        .dashboard-hero { display: grid; grid-template-columns: 2fr 1fr; gap: var(--space-3); margin-bottom: 1.75rem; }
        .hero-card { padding: 0; overflow: hidden; }
        .hero-card-inner {
          background: linear-gradient(135deg, var(--cm-primary) 0%, var(--cm-primary-hover) 100%);
          color: #fff; padding: var(--space-3); display: flex; flex-direction: column; gap: 0.5rem; height: 100%;
        }
        .eyebrow { font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; opacity: 0.85; }
        .hero-callout { font-size: 1.35rem; font-weight: 800; line-height: 1.3; }
        .hero-note { font-size: 0.875rem; opacity: 0.9; line-height: 1.6; margin-bottom: 0.25rem; }
        .hero-actions { display: flex; gap: 0.625rem; flex-wrap: wrap; margin-top: 0.5rem; }
        .hero-actions .btn-outline { border-color: rgba(255,255,255,0.6); color: #fff; }
        .hero-actions .btn-outline:hover { background: rgba(255,255,255,0.15); }
        .hero-actions .btn-ghost { color: rgba(255,255,255,0.85); }
        .hero-actions .btn-ghost:hover { background: rgba(255,255,255,0.1); color: #fff; }
        .info-panel {
          background: var(--cm-accent-light); border: 1px solid var(--cm-accent);
          border-radius: var(--radius-lg); padding: var(--space-3);
          display: flex; flex-direction: column; gap: 0.5rem; justify-content: center;
        }
        .info-panel h3 { font-size: 0.9rem; font-weight: 700; color: #92600A; }
        .info-panel p { font-size: 0.825rem; color: #92600A; line-height: 1.55; opacity: 0.9; }

        @media (max-width: 1024px) { .admin-grid { grid-template-columns: 1fr; } }
        @media (max-width: 900px) { .dashboard-hero { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  );
}
