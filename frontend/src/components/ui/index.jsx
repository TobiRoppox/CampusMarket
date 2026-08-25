export { StatCard, SkeletonCard, SkeletonGrid, EmptyState, Modal } from "../common/Ui.jsx";
export { default as Badge } from "./Badge.jsx";
export { default as DataTable } from "./DataTable.jsx";
export { default as PageSection } from "./PageSection.jsx";
export { default as StatusBadge } from "./StatusBadge.jsx";

export function StatCardV2({ label, value, delta, deltaLabel, link, linkText, icon: Icon, variant = "default" }) {
  return (
    <div className={`stat-card-v2 stat-card-v2--${variant}`}>
      <div className="stat-card-v2-top">
        <p className="stat-card-v2-label">{label}</p>
        {Icon && (
          <div className="stat-card-v2-icon">
            <Icon size={20} strokeWidth={1.75} />
          </div>
        )}
      </div>
      <p className="stat-card-v2-value">{value}</p>
      {delta !== undefined && (
        <p className={`stat-card-v2-delta ${delta >= 0 ? "up" : "down"}`}>
          {delta >= 0 ? "+" : ""}{delta}% {deltaLabel || "vs last month"}
        </p>
      )}
      {link && linkText && (
        <a href={link} className="stat-card-v2-link">{linkText}</a>
      )}
    </div>
  );
}

export function Card({ children, className = "", hover = false, padding = true }) {
  return (
    <div className={`cm-card ${hover ? "cm-card--hover" : ""} ${padding ? "cm-card--padded" : ""} ${className}`}>
      {children}
    </div>
  );
}

export function CardHeader({ title, action, subtitle }) {
  return (
    <div className="cm-card-header">
      <div>
        <h2 className="cm-card-title">{title}</h2>
        {subtitle && <p className="cm-card-subtitle">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
