import "./AdminWorkspace.css";
import { useState, useEffect } from "react";
import Sidebar from "../../components/common/Sidebar.jsx";
import { EmptyState } from "../../components/common/Ui.jsx";
import eventService from "../../services/eventService.js";
import toast from "react-hot-toast";
import { format } from "date-fns";
import { FiSearch, FiCheck, FiX, FiRefreshCw } from "react-icons/fi";

const STATUS_TABS = ["pending", "approved", "rejected", "all"];

export default function AdminApplications() {
  const [applications, setApplications] = useState([]);
  const [activeTab, setActiveTab] = useState("pending");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState(null);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const { data } = await eventService.getApplications();
      setApplications(data);
    } catch {
      toast.error("Failed to load applications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const handleReview = async (application, status) => {
    const note = window.prompt(
      status === "approved"
        ? "Approval note for the seller (e.g. assigned space, setup time):"
        : "Reason for rejecting (shown to the seller):",
    );
    if (note === null) return;
    if (note.trim().length < 5) {
      toast.error("Please write a note of at least 5 characters.");
      return;
    }
    try {
      setActingId(application.id);
      const { data } = await eventService.reviewApplication(application.id, { status, note: note.trim() });
      setApplications((prev) => prev.map((item) => (item.id === application.id ? { ...item, ...data } : item)));
      toast.success(`Application ${status}`);
    } catch (error) {
      toast.error(error.response?.data?.error || "Review failed");
    } finally {
      setActingId(null);
    }
  };

  const statusOf = (application) => String(application.status || "pending").toLowerCase();
  const filtered = applications.filter((application) => {
    const matchTab = activeTab === "all" || statusOf(application) === activeTab;
    const haystack = `${application.stall_name} ${application.business_name} ${application.seller_name || ""} ${application.event?.name || ""}`.toLowerCase();
    return matchTab && (!search || haystack.includes(search.toLowerCase()));
  });
  const tabCount = (tab) => (tab === "all" ? applications.length : applications.filter((item) => statusOf(item) === tab).length);

  return (
    <div className="dashboard-layout admin-shell">
      <Sidebar />
      <main className="dashboard-main">
        <div className="topbar">
          <div className="topbar-left">
            <div className="topbar-titles">
              <h1>Event Applications</h1>
              <p>Review sellers who applied for a stall at a campus event.</p>
            </div>
          </div>
          <div className="topbar-right">
            <button className="btn btn-ghost btn-sm" onClick={fetchApplications} disabled={loading}>
              <FiRefreshCw size={14} className={loading ? "spin" : ""} /> Refresh
            </button>
          </div>
        </div>

        <div className="dashboard-content">
          <div style={{ position: "relative", maxWidth: 360, marginBottom: "1.25rem" }}>
            <FiSearch style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--gray-400)" }} />
            <input
              className="form-input"
              placeholder="Search stall, business, seller or event..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: "2.5rem" }}
            />
          </div>

          <div className="stall-tabs">
            {STATUS_TABS.map((tab) => (
              <button key={tab} className={`stall-tab ${activeTab === tab ? "active" : ""}`} onClick={() => setActiveTab(tab)}>
                <span style={{ textTransform: "capitalize" }}>{tab}</span>
                {tabCount(tab) > 0 && <span className={`tab-count ${activeTab === tab ? "active" : ""}`}>{tabCount(tab)}</span>}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="stalls-grid">
              {[1, 2, 3].map((i) => <div key={i} className="skeleton" style={{ height: 180, borderRadius: 12 }} />)}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState icon="📋" title="No applications found" description={`No ${activeTab === "all" ? "" : activeTab} applications`} />
          ) : (
            <div className="stalls-grid">
              {filtered.map((application) => (
                <div key={application.id} className="stall-card card">
                  <div className="stall-card-body">
                    <span className={`badge status-${statusOf(application)}`} style={{ alignSelf: "flex-start" }}>{statusOf(application)}</span>
                    <p className="stall-card-name">{application.stall_name}</p>
                    <p className="text-sm text-muted">
                      {application.business_name} · by {application.seller_name || "Campus seller"}
                    </p>
                    <p className="text-sm">
                      <strong>{application.event?.name || "Event removed"}</strong>
                      {application.event?.date && ` · ${format(new Date(`${application.event.date}T00:00:00`), "MMM d, yyyy")}`}
                    </p>
                    <p className="text-sm text-muted">
                      {application.product_category} · {application.preferred_stall_size} m² · {application.duration} day(s)
                    </p>
                    <p className="stall-card-desc text-sm text-muted">{application.product_list}</p>
                    <p className="text-sm text-muted">Contact: {application.contact_info}</p>
                    {application.review_note && <p className="text-sm"><strong>Note:</strong> {application.review_note}</p>}
                    <p className="text-xs text-muted" style={{ marginTop: 4 }}>
                      Applied {format(new Date(application.created_at), "MMM d, yyyy")}
                    </p>
                    {statusOf(application) === "pending" && (
                      <div className="stall-card-actions">
                        <button className="btn btn-secondary btn-sm" onClick={() => handleReview(application, "approved")} disabled={actingId === application.id}>
                          <FiCheck size={13} /> Approve
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleReview(application, "rejected")} disabled={actingId === application.id}>
                          <FiX size={13} /> Reject
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <style>{`
        .stall-tabs { display: flex; gap: 0.25rem; margin-bottom: 1.25rem; flex-wrap: wrap; }
        .stall-tab { display: flex; align-items: center; gap: 0.5rem; padding: 0.45rem 1rem; border-radius: var(--radius-full); border: 1.5px solid var(--gray-200); background: #fff; font-size: 0.875rem; font-weight: 500; color: var(--gray-600); transition: var(--transition-fast); white-space: nowrap; }
        .stall-tab:hover { border-color: var(--color-primary); color: var(--color-primary); }
        .stall-tab.active { background: var(--color-primary); border-color: var(--color-primary); color: #fff; }
        .tab-count { background: var(--gray-200); color: var(--gray-700); font-size: 0.7rem; font-weight: 700; padding: 1px 6px; border-radius: var(--radius-full); }
        .tab-count.active { background: rgba(255,255,255,0.3); color: #fff; }
        .stalls-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.25rem; }
        .stall-card { display: flex; flex-direction: column; overflow: hidden; }
        .stall-card-body { padding: 1rem; display: flex; flex-direction: column; gap: 0.25rem; flex: 1; }
        .stall-card-name { font-weight: 700; font-size: 1rem; color: var(--gray-900); }
        .stall-card-desc { margin-top: 4px; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
        .stall-card-actions { display: flex; gap: 0.5rem; margin-top: auto; padding-top: 0.75rem; }
        .spin { animation: spin 0.7s linear infinite; }
      `}</style>
    </div>
  );
}
