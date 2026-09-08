import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { User, Mail, Lock, Eye, EyeOff } from "lucide-react";
import AuthLayout from "../../components/layout/AuthLayout.jsx";
import { useAuth } from "../../context/AuthContext.jsx";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "", campus_id: "", affiliation: "student", department: "", store_name: "", campus_location: "",
  });
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.role) {
      setError("Please select a role");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await register({
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role, campus_id: form.campus_id, affiliation: form.affiliation, department: form.department,
        store_name: form.store_name, campus_location: form.campus_location,
      });
      navigate("/account-status");
    } catch (err) {
      console.error("Registration error:", err);
      setError(
        err.response?.data?.details?.map((detail) => detail.message).join(" ") || err.response?.data?.error || "Registration failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Create Your Account"
      subtitle="For students, faculty, and employees of CSUCC."
    >
      {error && (
        <div className="auth-error" role="alert">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="auth-form">
        <div className="form-group">
          <label className="form-label" htmlFor="name">
            Full Name
          </label>
          <div className="form-input-wrap">
            <User size={18} className="form-input-icon" aria-hidden="true" />
            <input
              id="name"
              type="text"
              className="form-input"
              placeholder="Enter your full name"
              value={form.name}
              required
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="reg-email">
            Email
          </label>
          <div className="form-input-wrap">
            <Mail size={18} className="form-input-icon" aria-hidden="true" />
            <input
              id="reg-email"
              type="email"
              className="form-input"
              placeholder="Enter your email"
              value={form.email}
              required
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="reg-password">
            Password
          </label>
          <div className="form-input-wrap">
            <Lock size={18} className="form-input-icon" aria-hidden="true" />
            <input
              id="reg-password"
              type={showPass ? "text" : "password"}
              className="form-input"
              placeholder="At least 8 characters"
              minLength={8}
              value={form.password}
              required
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
            <button
              type="button"
              className="form-input-toggle"
              onClick={() => setShowPass(!showPass)}
              aria-label={showPass ? "Hide password" : "Show password"}
            >
              {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="confirm">
            Confirm Password
          </label>
          <div className="form-input-wrap">
            <Lock size={18} className="form-input-icon" aria-hidden="true" />
            <input
              id="confirm"
              type="password"
              className="form-input"
              placeholder="Confirm your password"
              value={form.confirmPassword}
              required
              onChange={(e) =>
                setForm({ ...form, confirmPassword: e.target.value })
              }
            />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="role">
            Role
          </label>
          <select
            id="role"
            className="form-input form-select"
            value={form.role}
            required
            onChange={(e) => setForm({ ...form, role: e.target.value })}
          >
            <option value="" disabled>
              Select your role (Buyer or Seller)
            </option>
            <option value="buyer">Buyer</option>
            <option value="seller">Seller</option>
          </select>
        </div>
        <fieldset style={{ border: "1px solid #dce8df", borderRadius: 12, padding: "1rem", display: "grid", gap: "1rem" }}>
          <legend style={{ fontSize: ".9rem", fontWeight: 700 }}>CSUCC verification</legend>
          <label className="form-label">Campus affiliation
            <select className="form-input" value={form.affiliation} onChange={(e) => setForm({ ...form, affiliation: e.target.value })}>
              <option value="student">Student</option><option value="faculty">Faculty</option><option value="employee">Employee</option>
            </select>
          </label>
          <label className="form-label">Student / employee ID number
            <input className="form-input" required minLength={3} maxLength={50} value={form.campus_id} onChange={(e) => setForm({ ...form, campus_id: e.target.value })} />
          </label>
          <label className="form-label">College, program, or office
            <input className="form-input" required minLength={2} maxLength={120} value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} />
          </label>
          <p className="text-sm text-muted">An administrator will check your ID number against CSUCC records. Your ID is visible only to you and administrators. Buying and selling become available after approval.</p>
        </fieldset>
        {form.role === "seller" && <fieldset style={{ border: "1px solid #dce8df", borderRadius: 12, padding: "1rem", display: "grid", gap: "1rem" }}>
          <legend style={{ fontSize: ".9rem", fontWeight: 700 }}>Your campus store</legend>
          <label className="form-label">Store name<input className="form-input" required minLength={2} maxLength={100} value={form.store_name} onChange={(e) => setForm({ ...form, store_name: e.target.value })} /></label>
          <label className="form-label">CSUCC location / stall<input className="form-input" required minLength={2} maxLength={150} placeholder="e.g. Main Canteen, Stall 4" value={form.campus_location} onChange={(e) => setForm({ ...form, campus_location: e.target.value })} /></label>
          <p className="text-sm text-muted">Your store starts on the Free plan and becomes public after store approval.</p>
        </fieldset>}
        <button
          type="submit"
          className="btn btn-primary btn-lg"
          disabled={loading}
          style={{ width: "100%" }}
        >
          {loading ? <span className="spinner" /> : "Register"}
        </button>
      </form>
      <div className="auth-footer">
        <p>
          Already have an account? <Link to="/login">Login here</Link>
        </p>
      </div>
    </AuthLayout>
  );
}
