// ── main.jsx ──────────────────────────────────────────────────────────────────
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import App from "./app.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import { CartProvider } from "./context/CartContext.jsx";
import RouteEffects from "./components/common/RouteEffects.jsx";
import "./styles/global.css";
import "./styles/enhancements.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <RouteEffects />
          <App />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3500,
              style: {
                borderRadius: "14px",
                fontFamily: "Inter, sans-serif",
                fontSize: "0.9rem",
                fontWeight: 500,
                padding: "10px 14px",
                color: "#1E293B",
                border: "1px solid #E2E8F0",
                boxShadow: "0 12px 30px -10px rgba(15, 23, 42, 0.25)",
              },
              success: { iconTheme: { primary: "#0F7B3E", secondary: "#fff" } },
              error:   { iconTheme: { primary: "#DC2626", secondary: "#fff" } },
            }}
          />
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);