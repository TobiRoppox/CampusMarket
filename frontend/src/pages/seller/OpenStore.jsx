import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../components/common/Navbar.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import api from "../../services/api.js";

export default function OpenStore() {
  const { updateUser, user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", location: "", description: "", category: "food" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (event) => {
    event.preventDefault(); setBusy(true); setError("");
    try {
      const { data } = await api.post("/auth/start-selling", form);
      updateUser(data.user); navigate("/seller/stall");
    } catch (err) { setError(err.response?.data?.error || "Unable to submit your store."); }
    finally { setBusy(false); }
  };
  return <><Navbar /><main style={{ maxWidth: 640, margin: "2rem auto", padding: "1.5rem" }} className="card">
    <h1>Open your campus store</h1><p>Your store needs an administrator’s approval before it appears publicly. New stores start on the Free plan.</p>
    {user.role === "buyer" && <p>Your account will switch to Seller, giving you store tools and the point of sale.</p>}
    {error && <p role="alert">{error}</p>}
    <form onSubmit={submit} style={{ display: "grid", gap: "1rem", marginTop: "1.5rem" }}>
      <label>Store name<input className="form-input" required minLength={2} maxLength={100} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
      <label>CSUCC location / stall<input className="form-input" required minLength={2} maxLength={150} placeholder="Main Canteen, Stall 4" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} /></label>
      <label>Category<select className="form-input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>{["food", "merchandise", "services", "mixed", "other"].map((value) => <option key={value}>{value}</option>)}</select></label>
      <label>About your store<textarea className="form-input" maxLength={1000} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label>
      <button className="btn btn-primary" disabled={busy}>{busy ? "Submitting…" : "Submit store for approval"}</button>
    </form>
  </main></>;
}
