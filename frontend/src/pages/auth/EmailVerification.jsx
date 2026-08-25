import { Link } from "react-router-dom";
import { MailCheck } from "lucide-react";
import AuthLayout from "../../components/layout/AuthLayout.jsx";

export default function EmailVerification() {
  return (
    <AuthLayout title="Verify Your Email" subtitle="We've sent a verification link to your email">
      <div style={{ textAlign: "center", padding: "1rem 0" }}>
        <div style={{
          width: 72, height: 72, borderRadius: "50%", background: "var(--cm-primary-light)",
          display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.5rem",
          color: "var(--cm-primary)",
        }}>
          <MailCheck size={36} />
        </div>
        <p style={{ color: "var(--cm-text-secondary)", marginBottom: "1.5rem", lineHeight: 1.7 }}>
          Please check your inbox and click the verification link to activate your account.
          The link expires in 24 hours.
        </p>
        <button type="button" className="btn btn-outline" style={{ width: "100%", marginBottom: "0.75rem" }}>
          Resend Verification Email
        </button>
      </div>
      <div className="auth-footer">
        <p><Link to="/login">Back to login</Link></p>
      </div>
    </AuthLayout>
  );
}
