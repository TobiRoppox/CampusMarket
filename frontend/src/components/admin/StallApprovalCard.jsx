import React from "react";

const StallApprovalCard = ({ stall, onApprove, onReject }) => {
  return (
    <div className="stall-approval-card">
      <h3>{stall.name}</h3>
      <p>{stall.description}</p>
      <button onClick={() => onApprove(stall.id)}>Approve</button>
      <button onClick={() => onReject(stall.id)}>Reject</button>
    </div>
  );
};

export default StallApprovalCard;