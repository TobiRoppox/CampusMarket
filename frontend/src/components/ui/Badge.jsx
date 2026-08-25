import { Link } from "react-router-dom";

const VARIANTS = {
  success: "badge-success",
  warning: "badge-warning",
  danger: "badge-danger",
  info: "badge-info",
  green: "badge-green",
  gray: "badge-gray",
  pending: "badge-warning",
  processing: "badge-info",
  completed: "badge-success",
  approved: "badge-success",
  rejected: "badge-danger",
  reserved: "badge-green",
  available: "badge-gray",
};

export default function Badge({ children, variant = "gray", className = "" }) {
  const cls = VARIANTS[variant] || VARIANTS.gray;
  return <span className={`cm-badge ${cls} ${className}`}>{children}</span>;
}

export function StatusBadge({ status }) {
  const label = status?.charAt(0).toUpperCase() + status?.slice(1);
  return <Badge variant={status?.toLowerCase()}>{label}</Badge>;
}
