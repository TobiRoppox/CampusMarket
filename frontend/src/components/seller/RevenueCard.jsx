import React from "react";

const RevenueCard = ({ revenue }) => {
  const formatted = `₱${Number(revenue).toLocaleString("en-PH", { minimumFractionDigits: 2 })}`;

  return (
    <div className="revenue-card">
      <h3>Total Revenue</h3>
      <p>{formatted}</p>
    </div>
  );
};

export default RevenueCard;
