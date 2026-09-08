import { Link } from "react-router-dom";

export default function AuthLayout({ children, title, subtitle }) {
  return (
    <div className="auth-page">
      <div className="auth-shell">
        {/* Brand panel */}
        <div className="auth-brand-panel">
          <Link to="/" className="auth-logo-link">
            <img
              src="/images/buyer/campusmarket-logo.png"
              alt="Campus Market"
              className="auth-logo-img"
            />
          </Link>
          <p className="auth-tagline">Buy. Sell. Connect.</p>

          <div className="auth-brand-illustration">
            <img
              src="/images/student.png"
              alt="Two students shopping on Campus Market"
              className="auth-illustration-img"
            />
          </div>

          <p className="auth-brand-note">
            Exclusive for Caraga State University — Cabadbaran Campus
          </p>
        </div>

        {/* Form panel */}
        <div className="auth-form-panel">
          <div className="auth-form-inner fade-in">
            <div className="auth-form-header">
              <h1>{title}</h1>
              {subtitle && <p>{subtitle}</p>}
            </div>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
