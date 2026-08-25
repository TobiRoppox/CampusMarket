import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import AuthLayout from "../../components/layout/AuthLayout.jsx";
import { useAuth } from "../../context/AuthContext.jsx";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const user = await login(form.email, form.password);
      if (user?.role === "admin") navigate("/admin");
      else if (user?.role === "seller") navigate("/seller");
      else navigate("/");
    } catch {
      setError("Invalid email or password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to your Campus Market account"
    >
      {error && (
        <div className="auth-error" role="alert">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="auth-form">
        <div className="form-group">
          <label className="form-label" htmlFor="email">
            Email
          </label>
          <div className="form-input-wrap">
            <Mail size={18} className="form-input-icon" aria-hidden="true" />
            <input
              id="email"
              type="email"
              name="email"
              className="form-input"
              placeholder="Enter your email"
              value={form.email}
              required
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
        </div>
        <div className="form-group">
          <div className="flex justify-between items-center">
            <label className="form-label" htmlFor="password">
              Password
            </label>
            <Link to="/forgot-password" className="text-sm text-primary">
              Forgot password?
            </Link>
          </div>
          <div className="form-input-wrap">
            <Lock size={18} className="form-input-icon" aria-hidden="true" />
            <input
              id="password"
              type={showPass ? "text" : "password"}
              name="password"
              className="form-input"
              placeholder="Enter your password"
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
        <button
          type="submit"
          className="btn btn-primary btn-lg w-full"
          disabled={loading}
          style={{ width: "100%" }}
        >
          {loading ? <span className="spinner" /> : "Login"}
        </button>
      </form>
      <div className="auth-footer">
        <p>
          Don&apos;t have an account? <Link to="/register">Create one</Link>
        </p>
      </div>
    </AuthLayout>
  );
}
