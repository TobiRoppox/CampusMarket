import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ChevronDown, LogOut } from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";
import { ADMIN_NAV, SELLER_NAV, ROLE_LABELS } from "../../config/navigation.js";

export default function Sidebar({ mobileOpen, onMobileClose }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const links = user?.role === "admin" ? ADMIN_NAV : SELLER_NAV;
  const roleLabel = ROLE_LABELS[user?.role] || user?.role;

  const isActive = (path) => {
    if (path === "/seller" || path === "/admin") {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <aside className={`cm-sidebar ${mobileOpen ? "cm-sidebar--open" : ""}`}>
      <div className="cm-sidebar-brand">
        <Link to="/" className="cm-sidebar-logo" onClick={onMobileClose}>
          <img src="/logo.png" alt="Campus Market" />
          <span>CAMPUS MARKET</span>
        </Link>
      </div>

      <button
        type="button"
        className="cm-sidebar-user"
        onClick={() => setUserMenuOpen((p) => !p)}
        aria-expanded={userMenuOpen}
      >
        <div className="cm-sidebar-avatar">
          {user?.avatar_url ? (
            <img src={user.avatar_url} alt={user.name} />
          ) : (
            <span>{user?.name?.charAt(0).toUpperCase()}</span>
          )}
        </div>
        <div className="cm-sidebar-user-info">
          <p className="cm-sidebar-user-name">{user?.name}</p>
          <p className="cm-sidebar-user-role">{roleLabel}</p>
        </div>
        <ChevronDown size={16} className={`cm-sidebar-chevron ${userMenuOpen ? "open" : ""}`} />
      </button>

      <nav className="cm-sidebar-nav" aria-label="Main navigation">
        {links.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            className={`cm-sidebar-link ${isActive(to) ? "active" : ""}`}
            onClick={onMobileClose}
          >
            <Icon size={20} strokeWidth={1.75} aria-hidden="true" />
            <span>{label}</span>
          </Link>
        ))}
      </nav>

      <div className="cm-sidebar-footer">
        <button type="button" className="cm-sidebar-link cm-sidebar-link--logout" onClick={handleLogout}>
          <LogOut size={20} strokeWidth={1.75} aria-hidden="true" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
