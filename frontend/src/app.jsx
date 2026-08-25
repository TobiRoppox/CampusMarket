import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext.jsx";

// Auth pages
import Login from "./pages/auth/Login.jsx";
import Register from "./pages/auth/Register.jsx";

// Buyer pages
import BuyerHome from "./pages/buyer/Home.jsx";
import Browse from "./pages/buyer/Browse.jsx";
import ProductDetail from "./pages/buyer/ProductDetail.jsx";
import Cart from "./pages/buyer/Cart.jsx";
import Orders from "./pages/buyer/Orders.jsx";
import Messages from "./pages/buyer/Messages.jsx";
import Stalls from "./pages/buyer/Stalls.jsx";
import Notifications from "./pages/buyer/Notifications.jsx";
import BuyerEvents from "./pages/buyer/BuyerEvents.jsx";
import EventStalls from "./pages/buyer/EventStalls.jsx";
import Checkout from "./pages/buyer/Checkout.jsx";
import Favorites from "./pages/buyer/Favorites.jsx";

// Seller pages
import SellerDashboard from "./pages/seller/Dashboard.jsx";
import MyStall from "./pages/seller/MyStall.jsx";
import ManageProducts from "./pages/seller/ManageProducts.jsx";
import SellerOrders from "./pages/seller/SellerOrders.jsx";
import Analytics from "./pages/seller/Analytics.jsx";

// Admin pages
import AdminDashboard from "./pages/admin/AdminDashboard.jsx";
import ManageUsers from "./pages/admin/ManageUsers.jsx";
import ManageStalls from "./pages/admin/ManageStalls.jsx";

// ── Route guards ──────────────────────────────────────────────────────────────
function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth();
  if (loading)
    return (
      <div className="full-center">
        <div className="spinner spinner-dark" />
      </div>
    );
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) {
    // Redirect to the correct dashboard
    if (user.role === "admin") return <Navigate to="/admin" replace />;
    if (user.role === "seller") return <Navigate to="/seller" replace />;
    return <Navigate to="/" replace />;
  }
  return children;
}

function GuestRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading)
    return (
      <div className="full-center">
        <div className="spinner spinner-dark" />
      </div>
    );
  if (user) {
    if (user.role === "admin") return <Navigate to="/admin" replace />;
    if (user.role === "seller") return <Navigate to="/seller" replace />;
    return <Navigate to="/" replace />;
  }
  return children;
}

export default function App() {
  return (
    <Routes>
      {/* ── Auth ── */}
      <Route
        path="/login"
        element={
          <GuestRoute>
            <Login />
          </GuestRoute>
        }
      />
      <Route
        path="/register"
        element={
          <GuestRoute>
            <Register />
          </GuestRoute>
        }
      />
      {/* ── Buyer ── */}
      <Route path="/" element={<BuyerHome />} />
      <Route path="/browse" element={<Browse />} />
      <Route path="/products/:id" element={<ProductDetail />} />
      <Route path="/stalls" element={<Stalls />} />
      <Route path="/events" element={<BuyerEvents />} />
      <Route path="/events/:eventId/stalls" element={<EventStalls />} />
      <Route
        path="/favorites"
        element={
          <ProtectedRoute role="buyer">
            <Favorites />
          </ProtectedRoute>
        }
      />
      Two things to flag:
      <Route
        path="/checkout"
        element={
          <ProtectedRoute role="buyer">
            <Checkout />
          </ProtectedRoute>
        }
      />
      <Route
        path="/notifications"
        element={
          <ProtectedRoute role="buyer">
            <Notifications />
          </ProtectedRoute>
        }
      />
      <Route
        path="/cart"
        element={
          <ProtectedRoute role="buyer">
            <Cart />
          </ProtectedRoute>
        }
      />
      <Route
        path="/orders"
        element={
          <ProtectedRoute role="buyer">
            <Orders />
          </ProtectedRoute>
        }
      />
      <Route
        path="/messages"
        element={
          <ProtectedRoute role="buyer">
            <Messages />
          </ProtectedRoute>
        }
      />
      <Route
        path="/messages/:partnerId"
        element={
          <ProtectedRoute role="buyer">
            <Messages />
          </ProtectedRoute>
        }
      />
      {/* ── Seller ── */}
      <Route
        path="/seller"
        element={
          <ProtectedRoute role="seller">
            <SellerDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/seller/stall"
        element={
          <ProtectedRoute role="seller">
            <MyStall />
          </ProtectedRoute>
        }
      />
      <Route
        path="/seller/products"
        element={
          <ProtectedRoute role="seller">
            <ManageProducts />
          </ProtectedRoute>
        }
      />
      <Route
        path="/seller/orders"
        element={
          <ProtectedRoute role="seller">
            <SellerOrders />
          </ProtectedRoute>
        }
      />
      <Route
        path="/seller/analytics"
        element={
          <ProtectedRoute role="seller">
            <Analytics />
          </ProtectedRoute>
        }
      />
      <Route
        path="/seller/messages"
        element={
          <ProtectedRoute role="seller">
            <Messages />
          </ProtectedRoute>
        }
      />
      {/* ── Admin ── */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute role="admin">
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/users"
        element={
          <ProtectedRoute role="admin">
            <ManageUsers />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/stalls"
        element={
          <ProtectedRoute role="admin">
            <ManageStalls />
          </ProtectedRoute>
        }
      />
      {/* ── 404 ── */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
