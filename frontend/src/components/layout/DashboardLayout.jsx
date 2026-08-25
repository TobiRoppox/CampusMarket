import { useState } from "react";
import Sidebar from "../common/Sidebar.jsx";
import TopBar from "../common/TopBar.jsx";

export default function DashboardLayout({ children, title, subtitle, actions }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="dashboard-layout">
      <Sidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />
      {mobileOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}
      <div className="dashboard-main">
        <TopBar
          title={title}
          subtitle={subtitle}
          actions={actions}
          onMenuClick={() => setMobileOpen(true)}
        />
        <div className="dashboard-content fade-in">{children}</div>
      </div>
    </div>
  );
}
