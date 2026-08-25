import React from "react";

const PlatformStats = ({ stats }) => {
  return (
    <div className="platform-stats">
      <h2>Platform Statistics</h2>
      <ul>
        {stats.map((stat, index) => (
          <li key={index}>
            <strong>{stat.label}:</strong> {stat.value}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default PlatformStats;