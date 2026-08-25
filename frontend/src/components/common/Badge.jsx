import React from "react";

const Badge = ({ text, type = "default" }) => {
  const badgeClass = `badge badge-${type}`;

  return <span className={badgeClass}>{text}</span>;
};

export default Badge;