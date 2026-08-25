import React from "react";

const Toast = ({ message, type = "info", onClose }) => {
  const toastClass = `toast toast-${type}`;

  return (
    <div className={toastClass}>
      <span>{message}</span>
      <button onClick={onClose} className="close-button">&times;</button>
    </div>
  );
};

export default Toast;