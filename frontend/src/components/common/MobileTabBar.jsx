import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  FiCalendar,
  FiGrid,
  FiHome,
  FiLogIn,
  FiMapPin,
  FiShoppingBag,
  FiShoppingCart,
} from "react-icons/fi";

// Thumb-reachable navigation for phones. Rendered by Navbar so every buyer
// page gets it; hidden above 680px via CSS.
export default function MobileTabBar({ user, cartCount = 0 }) {
  const location = useLocation();

  useEffect(() => {
    document.body.classList.add("has-mobile-tabbar");
    return () => document.body.classList.remove("has-mobile-tabbar");
  }, []);

  const isActive = (path) =>
    path === "/"
      ? location.pathname === "/"
      : location.pathname === path || location.pathname.startsWith(`${path}/`);

  const tabs = [
    { to: "/", label: "Home", icon: FiHome },
    { to: "/stalls", label: "Stalls", icon: FiMapPin },
    { to: "/browse", label: "Shop", icon: FiShoppingBag },
    { to: "/events", label: "Events", icon: FiCalendar },
  ];

  if (!user) {
    tabs.push({ to: "/login", label: "Log in", icon: FiLogIn });
  } else if (user.role === "buyer") {
    tabs.push({ to: "/cart", label: "Cart", icon: FiShoppingCart, badge: cartCount });
  } else if (user.role === "seller") {
    tabs.push({ to: "/seller", label: "Dashboard", icon: FiGrid });
  } else {
    tabs.push({ to: "/admin", label: "Admin", icon: FiGrid });
  }

  return (
    <nav className="mobile-tabbar" aria-label="Quick navigation">
      {tabs.map(({ to, label, icon: Icon, badge }) => {
        const active = isActive(to);
        return (
          <Link
            key={to}
            to={to}
            className={`mobile-tab ${active ? "active" : ""}`}
            aria-current={active ? "page" : undefined}
          >
            <span className="mobile-tab-icon">
              <Icon aria-hidden="true" />
              {badge > 0 && (
                <span key={badge} className="mobile-tab-badge" aria-label={`${badge} items`}>
                  {badge > 99 ? "99+" : badge}
                </span>
              )}
            </span>
            <span className="mobile-tab-label">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
