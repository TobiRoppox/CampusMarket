import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail } from "lucide-react";
import AuthLayout from "../../components/layout/AuthLayout.jsx";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <AuthLayout title="Forgot Password" subtitle="Enter your email and we'll send a reset link">
      {sent ? (
        <div className="auth-success">
          Check your inbox at <strong>{email}</strong> for reset instructions.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label className="form-label" htmlFor="fp-email">Email</label>
            <div className="form-input-wrap">
              <Mail size={18} className="form-input-icon" aria-hidden="true" />
              <input id="fp-email" type="email" className="form-input" placeholder="Enter your email"
                value={email} required onChange={(e) => setEmail(e.target.value)} />
            </div>
          </div>
          <button type="submit" className="btn btn-primary btn-lg" style={{ width: "100%" }}>
            Send Reset Link
          </button>
        </form>
      )}
      <div className="auth-footer">
        <p><Link to="/login">Back to login</Link></p>
      </div>
    </AuthLayout>
  );
}
