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
    role: "",
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
        role: form.role,
      });
      navigate("/verify-email");
    } catch {
      setError("Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Create Your Account"
      subtitle="Join Campus Market today!"
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
              placeholder="Create a password"
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
