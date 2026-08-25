import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Sidebar from "../../components/common/Sidebar.jsx";
import { stallService } from "../../services/api.js";
import toast from "react-hot-toast";
import {
  FiShoppingBag,
  FiEdit2,
  FiMapPin,
  FiPhone,
  FiClock,
  FiSave,
} from "react-icons/fi";

const CATEGORIES = ["food", "merchandise", "mixed-use"];
const CATEGORY_LABELS = {
  food: "Food Stall",
  merchandise: "Merchandise",
  "mixed-use": "Mixed-Use",
};

const EMPTY_FORM = {
  name: "",
  description: "",
  category: "food",
  logo_url: "",
  contact_number: "",
  location: "",
  operating_hours: "",
};

export default function MyStall() {
  const [stall, setStall] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    stallService
      .getMy()
      .then(({ data }) => {
        setStall(data);
        if (data) {
          setForm({
            name: data.name || "",
            description: data.description || "",
            category: data.category || "food",
            logo_url: data.logo_url || "",
            contact_number: data.contact_number || "",
            location: data.location || "",
            operating_hours: data.operating_hours || "",
          });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (e) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const { data } = await stallService.update(stall.id, form);
      setStall(data);
      toast.success("Stall updated!");
      setEditing(false);
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to update stall");
    } finally {
      setSaving(false);
    }
  };

  const fmtDate = (d) =>
    d
      ? new Date(d).toLocaleDateString("en-PH", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : "—";

  if (loading) {
    return (
      <div className="dashboard-layout">
        <Sidebar />
        <main className="dashboard-main">
          <div className="topbar">
            <div className="topbar-left">
              <div className="topbar-titles">
                <h1>My Stall</h1>
              </div>
            </div>
          </div>
          <div className="dashboard-content">
            <div
              className="skeleton"
              style={{ height: 320, borderRadius: 12 }}
            />
          </div>
        </main>
      </div>
    );
  }

  // No stall yet — hasn't applied
  if (!stall) {
    return (
      <div className="dashboard-layout">
        <Sidebar />
        <main className="dashboard-main">
          <div className="topbar">
            <div className="topbar-left">
              <div className="topbar-titles">
                <h1>My Stall</h1>
                <p>You don't have a stall yet.</p>
              </div>
            </div>
          </div>
          <div className="dashboard-content">
            <div className="empty-state">
              <div className="empty-state-icon">
                <FiShoppingBag size={32} />
              </div>
              <h3>No stall found</h3>
              <p>
                Apply for a stall at an upcoming event to get started selling.
              </p>
              <Link
                to="/seller/apply"
                className="btn btn-primary"
                style={{ marginTop: "1rem" }}
              >
                Apply for a Stall
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="dashboard-main">
        <div className="topbar">
          <div className="topbar-left">
            <div className="topbar-titles">
              <h1>My Stall</h1>
              <p>Manage your stall's public profile.</p>
            </div>
          </div>
          <div className="topbar-right">
            {!editing && (
              <button
                className="btn btn-primary btn-sm"
                onClick={() => setEditing(true)}
              >
                <FiEdit2 size={14} /> Edit Stall
              </button>
            )}
          </div>
        </div>

        <div className="dashboard-content">
          {/* Status banner */}
          {stall.status !== "approved" && (
            <div className={`stall-status-banner status-${stall.status}`}>
              <span className={`badge status-${stall.status}`}>
                {stall.status}
              </span>
              <p>
                {stall.status === "pending"
                  ? "Your stall application is awaiting admin approval."
                  : "Your stall application was not approved. Contact support for details."}
              </p>
            </div>
          )}

          {!editing ? (
            /* ── View mode ── */
            <div className="card stall-profile-card">
              <div className="stall-profile-header">
                <div className="stall-logo">
                  {form.logo_url ? (
                    <img src={form.logo_url} alt={form.name} />
                  ) : (
                    <FiShoppingBag size={28} />
                  )}
                </div>
                <div>
                  <h2>{stall.name}</h2>
                  <span
                    className="badge badge-green"
                    style={{ textTransform: "capitalize" }}
                  >
                    {CATEGORY_LABELS[stall.category] || stall.category}
                  </span>
                </div>
              </div>

              {stall.description && (
                <p className="stall-desc">{stall.description}</p>
              )}

              <div className="stall-info-grid">
                <div className="stall-info-item">
                  <FiMapPin size={16} />
                  <div>
                    <span className="stall-info-label">Location</span>
                    <span className="stall-info-value">
                      {stall.location || "Not set"}
                    </span>
                  </div>
                </div>
                <div className="stall-info-item">
                  <FiPhone size={16} />
                  <div>
                    <span className="stall-info-label">Contact</span>
                    <span className="stall-info-value">
                      {stall.contact_number || "Not set"}
                    </span>
                  </div>
                </div>
                <div className="stall-info-item">
                  <FiClock size={16} />
                  <div>
                    <span className="stall-info-label">Operating Hours</span>
                    <span className="stall-info-value">
                      {stall.operating_hours || "Not set"}
                    </span>
                  </div>
                </div>
              </div>

              <p className="stall-since">
                Stall created on {fmtDate(stall.created_at)}
              </p>
            </div>
          ) : (
            /* ── Edit mode ── */
            <form className="card stall-form-card" onSubmit={handleSave}>
              <div className="form-group">
                <label className="form-label">Stall name *</label>
                <input
                  className="form-input"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="form-input"
                  name="description"
                  rows={3}
                  value={form.description}
                  onChange={handleChange}
                  style={{ resize: "vertical" }}
                />
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "1rem",
                }}
              >
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select
                    className="form-input form-select"
                    name="category"
                    value={form.category}
                    onChange={handleChange}
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {CATEGORY_LABELS[c]}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Contact Number</label>
                  <input
                    className="form-input"
                    name="contact_number"
                    value={form.contact_number}
                    onChange={handleChange}
                    placeholder="09XX XXX XXXX"
                  />
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "1rem",
                }}
              >
                <div className="form-group">
                  <label className="form-label">Location</label>
                  <input
                    className="form-input"
                    name="location"
                    value={form.location}
                    onChange={handleChange}
                    placeholder="e.g. Stall #12, CSUCC Grounds"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Operating Hours</label>
                  <input
                    className="form-input"
                    name="operating_hours"
                    value={form.operating_hours}
                    onChange={handleChange}
                    placeholder="e.g. 8AM – 5PM"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Logo URL</label>
                <input
                  className="form-input"
                  name="logo_url"
                  value={form.logo_url}
                  onChange={handleChange}
                  placeholder="https://..."
                />
                {form.logo_url && (
                  <img
                    src={form.logo_url}
                    alt="Preview"
                    style={{
                      marginTop: 8,
                      width: 64,
                      height: 64,
                      objectFit: "cover",
                      borderRadius: "50%",
                      border: "1px solid var(--gray-200)",
                    }}
                    onError={(e) => {
                      e.target.style.display = "none";
                    }}
                  />
                )}
              </div>

              <div
                style={{
                  display: "flex",
                  gap: "0.75rem",
                  paddingTop: "0.5rem",
                }}
              >
                <button
                  className="btn btn-primary"
                  type="submit"
                  disabled={saving}
                  style={{ flex: 1 }}
                >
                  {saving ? (
                    <span className="spinner" />
                  ) : (
                    <>
                      <FiSave size={15} /> Save Changes
                    </>
                  )}
                </button>
                <button
                  className="btn btn-ghost"
                  type="button"
                  onClick={() => {
                    setEditing(false);
                    setForm({
                      name: stall.name || "",
                      description: stall.description || "",
                      category: stall.category || "food",
                      logo_url: stall.logo_url || "",
                      contact_number: stall.contact_number || "",
                      location: stall.location || "",
                      operating_hours: stall.operating_hours || "",
                    });
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </main>

      <style>{`
        .stall-status-banner {
          display: flex; align-items: center; gap: 0.75rem;
          padding: 0.9rem 1.25rem; border-radius: var(--radius-lg);
          background: var(--gray-50); border: 1px solid var(--gray-200);
          margin-bottom: 1.5rem;
        }
        .stall-status-banner p { font-size: 0.875rem; color: var(--gray-600); margin: 0; }

        .stall-profile-card { padding: 1.5rem; }
        .stall-profile-header { display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem; }
        .stall-logo {
          width: 64px; height: 64px; border-radius: 50%; overflow: hidden; flex-shrink: 0;
          background: var(--color-secondary); color: #fff;
          display: flex; align-items: center; justify-content: center;
        }
        .stall-logo img { width: 100%; height: 100%; object-fit: cover; }
        .stall-profile-header h2 { font-size: 1.25rem; font-weight: 800; color: var(--gray-900); margin-bottom: 0.3rem; }
        .stall-desc { color: var(--gray-600); font-size: 0.9rem; line-height: 1.6; margin-bottom: 1.25rem; }

        .stall-info-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-bottom: 1.25rem; }
        .stall-info-item { display: flex; align-items: flex-start; gap: 0.6rem; color: var(--gray-500); }
        .stall-info-item > div { display: flex; flex-direction: column; }
        .stall-info-label { font-size: 0.75rem; color: var(--gray-500); }
        .stall-info-value { font-size: 0.875rem; font-weight: 600; color: var(--gray-800); }

        .stall-since { font-size: 0.8rem; color: var(--gray-400); border-top: 1px solid var(--gray-100); padding-top: 1rem; }

        .stall-form-card { padding: 1.5rem; display: flex; flex-direction: column; gap: 1.1rem; }

        @media (max-width: 768px) {
          .stall-info-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
