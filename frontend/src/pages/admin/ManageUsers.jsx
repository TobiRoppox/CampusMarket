import { useState, useEffect, useCallback } from "react";
import Sidebar from "../../components/common/Sidebar.jsx";
import { EmptyState } from "../../components/common/Ui.jsx";
import { adminService } from "../../services/api.js";
import toast from "react-hot-toast";
import { format } from "date-fns";
import { FiSearch, FiUserX, FiUserCheck, FiRefreshCw } from "react-icons/fi";

const ROLE_OPTIONS = ["all", "buyer", "seller", "admin"];

export default function ManageUsers() {
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [banningId, setBanningId] = useState(null);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [review, setReview] = useState(null);
  const [note, setNote] = useState("");
  const [checked, setChecked] = useState(false);
  const [reviewing, setReviewing] = useState(false);

  const fetchUsers = useCallback(() => {
    setLoading(true);
    const params = { page, limit: 20, q: search };
    if (statusFilter !== "all") params.status = statusFilter;
    if (roleFilter !== "all") params.role = roleFilter;

    adminService
      .getUsers(params)
      .then(({ data }) => {
        setUsers(data.data || []);
        setTotal(data.total || 0);
      })
      .catch(() => toast.error("Failed to load users"))
      .finally(() => setLoading(false));
  }, [page, search, roleFilter, statusFilter]);

  useEffect(fetchUsers, [fetchUsers]);

  useEffect(() => {
    setPage(1);
  }, [search, roleFilter]);

  const handleBan = async (userId, currentBanStatus) => {
    const action = currentBanStatus ? "unban" : "ban";
    if (!window.confirm(`Are you sure you want to ${action} this user?`))
      return;
    try {
      setBanningId(userId);
      const { data } = await adminService.banUser(userId, !currentBanStatus);
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, is_banned: data.is_banned } : u,
        ),
      );
      toast.success(`User ${action}ned successfully`);
    } catch {
      toast.error(`Failed to ${action} user`);
    } finally {
      setBanningId(null);
    }
  };

  const submitReview = async (status) => {
    setReviewing(true);
    try {
      await adminService.reviewUser(review.id, { status, note, credentials_checked: checked });
      setReview(null); fetchUsers(); toast.success(`Registration ${status}`);
    } catch (error) { toast.error(error.response?.data?.error || "Review failed"); }
    finally { setReviewing(false); }
  };

  const roleColor = { buyer: "gold", seller: "green", admin: "danger" };

  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="dashboard-main">
        <div className="topbar">
          <div className="topbar-left">
            <div className="topbar-titles">
              <h1>Manage Users</h1>
              <p>View, filter, and manage all platform accounts.</p>
            </div>
          </div>
        </div>

        <div className="dashboard-content">
          {/* Toolbar */}
          <div className="toolbar" style={{ marginBottom: "1.25rem" }}>
            <div style={{ position: "relative", flex: 1, maxWidth: 340 }}>
              <FiSearch
                style={{
                  position: "absolute",
                  left: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--gray-400)",
                }}
              />
              <input
                className="form-input"
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                style={{ paddingLeft: "2.5rem" }}
              />
            </div>

            <div className="role-filter-group">
              {ROLE_OPTIONS.map((r) => (
                <button
                  key={r}
                  className={`role-filter-btn ${roleFilter === r ? "active" : ""}`}
                  onClick={() => {
                    setRoleFilter(r);
                    setPage(1);
                  }}
                >
                  {r.charAt(0).toUpperCase() + r.slice(1)}
                </button>
              ))}
            </div>

            <button
              className="btn btn-ghost btn-sm"
              onClick={fetchUsers}
              disabled={loading}
            >
              <FiRefreshCw size={14} className={loading ? "spin" : ""} />
            </button>
          </div>

          <label className="form-label">Registration status
            <select className="form-input" style={{ maxWidth: 280, marginBottom: "1rem" }} value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
              <option value="pending">Pending review</option><option value="approved">Approved</option><option value="rejected">Rejected</option><option value="all">All registrations</option>
            </select>
          </label>
          {review && <section className="card" style={{ padding: "1.5rem", marginBottom: "1rem" }} aria-labelledby="review-title">
            <h2 id="review-title">Review {review.name}</h2>
            <p>{review.role} · {review.affiliation || "Affiliation missing"} · {review.department || "Department missing"}</p>
            <p><strong>CSUCC ID:</strong> {review.campus_id || "Not provided"}</p>
            <p>Check this identity against authorized CSUCC enrollment or personnel records before approval.</p>
            <label style={{ display: "flex", gap: ".5rem", margin: "1rem 0" }}><input type="checkbox" checked={checked} onChange={(e) => setChecked(e.target.checked)} /> I verified the ID, name, and current CSUCC membership.</label>
            <label>Review note / reason<textarea className="form-input" value={note} minLength={5} maxLength={500} onChange={(e) => setNote(e.target.value)} placeholder="Record the verification method or explain what needs correction." /></label>
            <div style={{ display: "flex", gap: ".75rem", marginTop: "1rem", flexWrap: "wrap" }}>
              <button className="btn btn-primary" disabled={reviewing || !checked || !review.campus_id || note.trim().length < 5} onClick={() => submitReview("approved")}>Approve registration</button>
              <button className="btn btn-danger" disabled={reviewing || note.trim().length < 5} onClick={() => submitReview("rejected")}>Request correction</button>
              <button className="btn btn-outline" disabled={reviewing} onClick={() => setReview(null)}>Close</button>
            </div>
          </section>}
          {/* Users table */}
          {loading ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem",
              }}
            >
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="skeleton"
                  style={{ height: 60, borderRadius: 10 }}
                />
              ))}
            </div>
          ) : users.length === 0 ? (
            <EmptyState
              icon="👥"
              title="No users found"
              description="Try adjusting your search or filters"
            />
          ) : (
            <div className="card">
              <div style={{ overflowX: "auto" }}>
                <table className="users-table">
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Status</th>
                      <th>Joined</th>
                      <th style={{ textAlign: "right" }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr
                        key={user.id}
                        className={user.is_banned ? "banned-row" : ""}
                      >
                        <td>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "0.75rem",
                            }}
                          >
                            <div className="user-avatar">
                              {user.avatar_url ? (
                                <img src={user.avatar_url} alt={user.name} />
                              ) : (
                                <span>
                                  {user.name?.charAt(0).toUpperCase()}
                                </span>
                              )}
                            </div>
                            <span
                              className="font-medium"
                              style={{ fontSize: "0.875rem" }}
                            >
                              {user.name}
                            </span>
                          </div>
                        </td>
                        <td className="text-sm text-muted">{user.email}</td>
                        <td>
                          <span
                            className={`badge badge-${roleColor[user.role] || "gray"}`}
                          >
                            {user.role}
                          </span>
                        </td>
                        <td>
                          <span
                            className={`badge ${user.is_banned ? "badge-danger" : "badge-success"}`}
                          >
                            {user.is_banned ? "Banned" : user.status}
                          </span>
                        </td>
                        <td className="text-sm text-muted">
                          {format(new Date(user.created_at), "MMM d, yyyy")}
                        </td>
                        <td style={{ textAlign: "right" }}>
                          {user.status === "pending" && user.role !== "admin" && <button className="btn btn-primary btn-sm" onClick={() => { setReview(user); setNote(""); setChecked(false); }}>Review credentials</button>}
                          {user.role !== "admin" && (
                            <button
                              className={`btn btn-sm ${user.is_banned ? "btn-outline" : "btn-danger"}`}
                              onClick={() => handleBan(user.id, user.is_banned)}
                              disabled={banningId === user.id}
                              style={{ fontSize: "0.8rem" }}
                            >
                              {banningId === user.id ? (
                                <span
                                  className="spinner"
                                  style={{
                                    width: 12,
                                    height: 12,
                                    borderWidth: 2,
                                  }}
                                />
                              ) : user.is_banned ? (
                                <>
                                  <FiUserCheck size={13} /> Unban
                                </>
                              ) : (
                                <>
                                  <FiUserX size={13} /> Ban
                                </>
                              )}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="table-footer">
                <p className="text-sm text-muted">
                  Showing {users.length} of {total} users
                </p>
                <div
                  style={{
                    display: "flex",
                    gap: "0.5rem",
                    alignItems: "center",
                  }}
                >
                  <button
                    className="btn btn-ghost btn-sm"
                    disabled={page === 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    ← Prev
                  </button>
                  <span className="text-sm text-muted">Page {page}</span>
                  <button
                    className="btn btn-ghost btn-sm"
                    disabled={users.length < 20}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next →
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      <style>{`
        .toolbar { display: flex; align-items: center; gap: 0.875rem; flex-wrap: wrap; }
        .role-filter-group { display: flex; border: 1.5px solid var(--gray-200); border-radius: var(--radius-md); overflow: hidden; }
        .role-filter-btn { padding: 0.4rem 0.875rem; font-size: 0.8rem; font-weight: 500; color: var(--gray-600); background: #fff; transition: var(--transition-fast); border-right: 1px solid var(--gray-200); }
        .role-filter-btn:last-child { border-right: none; }
        .role-filter-btn.active { background: var(--color-primary); color: #fff; border-color: var(--color-primary); }
        .role-filter-btn:not(.active):hover { background: var(--gray-100); }
        .users-table { width: 100%; border-collapse: collapse; font-size: 0.875rem; }
        .users-table th { text-align: left; padding: 0.75rem 1rem; color: var(--gray-500); font-weight: 600; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.04em; border-bottom: 1px solid var(--gray-200); background: var(--gray-50); }
        .users-table td { padding: 0.875rem 1rem; border-bottom: 1px solid var(--gray-100); vertical-align: middle; }
        .users-table tr:last-child td { border-bottom: none; }
        .users-table tr:hover td { background: var(--gray-50); }
        .banned-row td { opacity: 0.6; }
        .user-avatar { width: 34px; height: 34px; border-radius: 50%; background: var(--color-secondary); color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.875rem; flex-shrink: 0; overflow: hidden; }
        .user-avatar img { width: 100%; height: 100%; object-fit: cover; }
        .table-footer { display: flex; align-items: center; justify-content: space-between; padding: 0.875rem 1rem; border-top: 1px solid var(--gray-100); }
        .spin { animation: spin 0.7s linear infinite; }
      `}</style>
    </div>
  );
}
