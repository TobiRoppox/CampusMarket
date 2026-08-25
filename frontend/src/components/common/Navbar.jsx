import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { useCart } from "../../context/CartContext.jsx";
import {
  FiShoppingCart,
  FiLogOut,
  FiMenu,
  FiX,
  FiSearch,
  FiBell,
  FiHome,
  FiGrid,
  FiMessageSquare,
  FiPackage,
  FiHeart,
  FiChevronDown,
} from "react-icons/fi";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { count } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchTerm.trim())
      navigate(`/browse?q=${encodeURIComponent(searchTerm.trim())}`);
  };

  const navLinks = [
    { to: "/", label: "Home" },
    { to: "/stalls", label: "Stalls" },
    { to: "/browse", label: "Products" },
    { to: "/events", label: "Events" },
  ];

  return (
    <nav className="navbar">
      <div className="navbar-inner container">
        {/* Logo */}
        <Link to="/" className="navbar-brand">
          <span className="brand-icon">🛍️</span>
          <span className="brand-text">
            CAMPUS
            <br />
            MARKET
          </span>
        </Link>

        {/* Desktop links */}
        <div className="navbar-links">
          {navLinks.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className={`nav-link ${location.pathname === l.to ? "active" : ""}`}
            >
              {l.label}
            </Link>
          ))}
        </div>

        {/* Search */}
        <form className="navbar-search" onSubmit={handleSearch} role="search">
          <FiSearch size={18} aria-hidden="true" />
          <input
            type="search"
            placeholder="Search for products, stalls, or events..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            aria-label="Search"
          />
        </form>

        {/* Right actions */}
        <div className="navbar-actions">
          {user?.role === "buyer" && (
            <>
              <Link to="/cart" className="icon-btn" aria-label="Cart">
                <FiShoppingCart size={20} />
                {count > 0 && <span className="cart-badge">{count}</span>}
              </Link>
              <Link to="/messages" className="icon-btn" aria-label="Messages">
                <FiMessageSquare size={20} />
              </Link>
              <Link
                to="/notifications"
                className="icon-btn"
                aria-label="Notifications"
              >
                <FiBell size={20} />
              </Link>
            </>
          )}

          {user ? (
            <div className="user-menu">
              <button
                className="user-avatar-btn"
                onClick={() => setDropdownOpen((p) => !p)}
              >
                {user.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user.name}
                    className="avatar-img"
                  />
                ) : (
                  <div className="avatar-initials">
                    {user.name?.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="user-info-nav">
                  <span className="user-name-nav">
                    {user.name.split(" ")[0]}
                  </span>
                  <span className="user-role-nav">
                    {user.role === "admin"
                      ? "Administrator"
                      : user.role === "seller"
                        ? "Seller"
                        : "Buyer"}
                  </span>
                </div>
                <FiChevronDown size={14} />
              </button>

              {dropdownOpen && (
                <div
                  className="dropdown"
                  onClick={() => setDropdownOpen(false)}
                >
                  <div className="dropdown-header">
                    <p className="font-semibold">{user.name}</p>
                    <p className="text-sm text-muted">{user.email}</p>
                  </div>
                  <div className="divider" style={{ margin: "0.5rem 0" }} />
                  {user.role === "buyer" && (
                    <>
                      <Link to="/orders" className="dropdown-item">
                        <FiPackage /> My Orders
                      </Link>
                      <Link to="/favorites" className="dropdown-item">
                        <FiHeart /> Favorites
                      </Link>
                      <Link to="/messages" className="dropdown-item">
                        <FiMessageSquare /> Messages
                      </Link>
                    </>
                  )}
                  {user.role === "seller" && (
                    <Link to="/seller" className="dropdown-item">
                      <FiGrid /> Seller Dashboard
                    </Link>
                  )}
                  {user.role === "admin" && (
                    <Link to="/admin" className="dropdown-item">
                      <FiGrid /> Admin Panel
                    </Link>
                  )}
                  <div className="divider" style={{ margin: "0.5rem 0" }} />
                  <button
                    className="dropdown-item danger"
                    onClick={handleLogout}
                  >
                    <FiLogOut /> Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="auth-btns">
              <Link to="/login" className="btn btn-outline btn-sm">
                Login
              </Link>
              <Link to="/register" className="btn btn-primary btn-sm">
                Sign Up
              </Link>
            </div>
          )}

          <button
            className="mobile-menu-btn"
            onClick={() => setMobileOpen((p) => !p)}
          >
            {mobileOpen ? <FiX size={22} /> : <FiMenu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="mobile-menu" onClick={() => setMobileOpen(false)}>
          <form className="mobile-search" onSubmit={handleSearch}>
            <FiSearch size={18} />
            <input
              type="search"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </form>
          {navLinks.map((l) => (
            <Link key={l.to} to={l.to} className="mobile-nav-link">
              <FiHome /> {l.label}
            </Link>
          ))}
          {user ? (
            <button className="mobile-nav-link danger" onClick={handleLogout}>
              <FiLogOut /> Logout
            </button>
          ) : (
            <>
              <Link to="/login" className="mobile-nav-link">
                Login
              </Link>
              <Link to="/register" className="mobile-nav-link">
                Sign Up
              </Link>
            </>
          )}
        </div>
      )}

      <style>{`
        .navbar {
          position: sticky; top: 0; z-index: 100;
          background: #fff;
          border-bottom: 1px solid var(--gray-200);
          box-shadow: var(--shadow-sm);
        }
        .navbar-inner {
          display: flex; align-items: center;
          height: var(--navbar-height); gap: 1.25rem;
        }
        .navbar-brand {
          display: flex; align-items: center; gap: 0.5rem;
          white-space: nowrap;
        }
        .brand-icon { font-size: 1.6rem; }
        .brand-text {
          font-size: 0.85rem; font-weight: 800; line-height: 1.05;
          color: var(--green-800, #0b3d1e); letter-spacing: 0.2px;
        }
        .navbar-links { display: flex; gap: 0.25rem; flex-shrink: 0; }
        .nav-link {
          padding: 0.4rem 0.875rem; border-radius: var(--radius-md);
          font-size: 0.9rem; font-weight: 600; color: var(--gray-600);
          transition: var(--transition-fast);
        }
        .nav-link:hover, .nav-link.active {
          background: var(--color-primary-light); color: var(--color-primary);
        }
        .navbar-search {
          flex: 1; display: flex; align-items: center; gap: 0.5rem; max-width: 380px;
          background: var(--gray-50, #f3f4f3); border: 1px solid var(--gray-200);
          border-radius: 999px; padding: 0.5rem 1rem; color: var(--gray-500);
        }
        .navbar-search input { border: none; background: none; outline: none; flex: 1; font-size: 0.875rem; }
        .navbar-actions { display: flex; align-items: center; gap: 0.375rem; margin-left: auto; }
        .icon-btn {
          position: relative; padding: 0.5rem; border-radius: 999px;
          color: var(--gray-600); transition: var(--transition-fast);
          display: flex; align-items: center;
        }
        .icon-btn:hover { background: var(--gray-100); color: var(--color-primary); }
        .cart-badge {
          position: absolute; top: -2px; right: -2px;
          background: var(--color-primary); color: #fff;
          font-size: 0.65rem; font-weight: 700;
          width: 18px; height: 18px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
        }
        .user-menu { position: relative; margin-left: 0.25rem; }
        .user-avatar-btn {
          display: flex; align-items: center; gap: 0.5rem;
          padding: 0.3rem 0.6rem; border-radius: 999px;
          border: none; background: none;
          transition: var(--transition-fast); font-size: 0.875rem;
        }
        .user-avatar-btn:hover { background: var(--gray-100); }
        .avatar-img { width: 32px; height: 32px; border-radius: 50%; object-fit: cover; }
        .avatar-initials {
          width: 32px; height: 32px; border-radius: 50%;
          background: var(--color-primary); color: #fff;
          display: flex; align-items: center; justify-content: center;
          font-size: 0.8rem; font-weight: 700;
        }
        .user-info-nav { display: flex; flex-direction: column; line-height: 1.15; text-align: left; }
        .user-name-nav { font-weight: 600; color: var(--gray-900); font-size: 0.85rem; }
        .user-role-nav { font-size: 0.7rem; color: var(--gray-500); }
        .dropdown {
          position: absolute; right: 0; top: calc(100% + 8px);
          background: #fff; border: 1px solid var(--gray-200);
          border-radius: var(--radius-xl); box-shadow: var(--shadow-xl);
          min-width: 220px; z-index: 200; padding: 0.5rem;
          animation: fadeIn 0.15s ease;
        }
        .dropdown-header { padding: 0.625rem 0.75rem; display: flex; flex-direction: column; gap: 0.25rem; }
        .dropdown-item {
          display: flex; align-items: center; gap: 0.625rem;
          padding: 0.625rem 0.75rem; border-radius: var(--radius-md);
          font-size: 0.875rem; color: var(--gray-700); width: 100%;
          transition: var(--transition-fast);
        }
        .dropdown-item:hover { background: var(--gray-100); }
        .dropdown-item.danger { color: var(--color-danger); }
        .dropdown-item.danger:hover { background: var(--color-danger-light); }
        .auth-btns { display: flex; gap: 0.5rem; }
        .mobile-menu-btn { display: none; padding: 0.5rem; border-radius: var(--radius-md); color: var(--gray-600); }
        .mobile-menu {
          display: none; flex-direction: column; gap: 0.25rem;
          padding: 0.75rem 1.5rem 1rem; border-top: 1px solid var(--gray-200);
        }
        .mobile-search {
          display: flex; align-items: center; gap: 0.5rem;
          background: var(--gray-50); border: 1px solid var(--gray-200);
          border-radius: 999px; padding: 0.5rem 1rem; margin-bottom: 0.5rem; color: var(--gray-500);
        }
        .mobile-search input { border: none; background: none; outline: none; flex: 1; font-size: 0.875rem; }
        .mobile-nav-link {
          display: flex; align-items: center; gap: 0.75rem;
          padding: 0.75rem 0.5rem; font-size: 0.9rem; font-weight: 500;
          color: var(--gray-700); border-radius: var(--radius-md);
        }
        .mobile-nav-link.danger { color: var(--color-danger); }
        @media (max-width: 900px) {
          .navbar-links { display: none; }
        }
        @media (max-width: 768px) {
          .navbar-search { display: none; }
          .user-info-nav { display: none; }
          .mobile-menu-btn { display: flex; }
          .mobile-menu { display: flex; }
          .auth-btns .btn:first-child { display: none; }
        }
        .full-center {
          display: flex; align-items: center; justify-content: center;
          min-height: 100vh;
        }
      `}</style>
    </nav>
  );
}
