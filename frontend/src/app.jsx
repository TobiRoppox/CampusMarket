import AccountStatus from "./pages/auth/AccountStatus.jsx";
import PointOfSale from "./pages/seller/PointOfSale.jsx";
import OpenStore from "./pages/seller/OpenStore.jsx";
import { Navigate, Route, Routes } from "react-router-dom";
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
import StallDetails from "./pages/buyer/StallDetails.jsx";

// Seller pages
import SellerDashboard from "./pages/seller/Dashboard.jsx";
import MyStall from "./pages/seller/Mystall.jsx";
import ManageProducts from "./pages/seller/ManageProducts.jsx";
import SellerOrders from "./pages/seller/SellerOrders.jsx";
import Analytics from "./pages/seller/Analytics.jsx";
import SellerMessages from "./pages/seller/SellerMessages.jsx";
import SellerApplicationForm from "./pages/seller/SellerApplicationForm.jsx";
import SellerReservations from "./pages/seller/SellerReservations.jsx";
import Reviews from "./pages/seller/Reviews.jsx";
import Settings from "./pages/seller/Settings.jsx";

// Admin pages
import AdminDashboard from "./pages/admin/AdminDashboard.jsx";
import ManageUsers from "./pages/admin/ManageUsers.jsx";
import ManageStalls from "./pages/admin/ManageStalls.jsx";
import AdminEvents from "./pages/admin/AdminEvents.jsx";

function LoadingScreen() {
  return (
    <div className="full-center" role="status" aria-label="Loading application">
      <div className="spinner spinner-dark" />
    </div>
  );
}

function getDashboardPath(role) {
  if (role === "admin") return "/admin";
  if (role === "seller") return "/seller";
  return "/";
}

function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.status !== "approved") return <Navigate to="/account-status" replace />;

  if (role && user.role !== role) {
    return <Navigate to={getDashboardPath(user.role)} replace />;
  }

  return children;
}

function GuestRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (user) {
    return <Navigate to={user.status === "approved" ? getDashboardPath(user.role) : "/account-status"} replace />;
  }

  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/account-status" element={<AccountStatus />} />
      <Route path="/open-store" element={<ProtectedRoute><OpenStore /></ProtectedRoute>} />
      <Route path="/seller/pos" element={<ProtectedRoute role="seller"><PointOfSale /></ProtectedRoute>} />
      {/* Authentication */}
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

      {/* Buyer pages */}
      <Route path="/" element={<BuyerHome />} />
      <Route path="/browse" element={<Browse />} />
      <Route path="/products/:id" element={<ProductDetail />} />
      <Route path="/stalls" element={<Stalls />} />
      <Route path="/stalls/:stallId" element={<StallDetails />} />
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

      {/* Seller pages */}
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
        path="/seller/apply"
        element={
          <ProtectedRoute role="seller">
            <SellerApplicationForm />
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
        path="/seller/reservations"
        element={
          <ProtectedRoute role="seller">
            <SellerReservations />
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
            <Messages sellerMode />
          </ProtectedRoute>
        }
      />

      <Route
        path="/seller/reviews"
        element={
          <ProtectedRoute role="seller">
            <Reviews />
          </ProtectedRoute>
        }
      />

      <Route
        path="/seller/settings"
        element={
          <ProtectedRoute role="seller">
            <Settings />
          </ProtectedRoute>
        }
      />

      {/* Admin pages */}
      <Route path="/admin/events" element={<ProtectedRoute role="admin"><AdminEvents /></ProtectedRoute>} />
      <Route path="/admin/events/:eventId/map" element={<ProtectedRoute role="admin"><AdminEvents /></ProtectedRoute>} />
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

      {/* Unknown routes */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
