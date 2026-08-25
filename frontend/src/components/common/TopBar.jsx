import { Menu, Bell, Search } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";

export default function TopBar({ title, subtitle, actions, onMenuClick }) {
  const { user } = useAuth();

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button
          type="button"
          className="topbar-menu-btn"
          onClick={onMenuClick}
          aria-label="Open navigation menu"
        >
          <Menu size={20} />
        </button>
        <div className="topbar-titles">
          {title && <h1>{title}</h1>}
          {subtitle && <p>{subtitle}</p>}
        </div>
      </div>

      <div className="topbar-right">
        {actions}
        <div className="topbar-search" role="search">
          <Search size={18} aria-hidden="true" />
          <input type="search" placeholder="Search..." aria-label="Search" />
        </div>
        <Link
          to={user?.role === "admin" ? "/admin/settings" : "/seller/settings"}
          className="topbar-icon-btn"
          aria-label="Notifications"
        >
          <Bell size={20} />
          <span className="topbar-notif-dot" />
        </Link>
      </div>
    </header>
  );
}
