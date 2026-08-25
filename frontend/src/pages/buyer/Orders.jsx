import React, { useState, useEffect } from "react";
import Navbar from "../../components/common/Navbar.jsx";
import OrderTable from "../../components/seller/OrderTable.jsx";
import { orderService } from "../../services/api.js";
import { useAuth } from "../../context/AuthContext.jsx";

const Orders = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      setLoading(true);
      orderService.getOrders(user.id).then(({ data }) => {
        setOrders(data);
        setLoading(false);
      });
    }
  }, [user]);

  return (
    <div>
      <Navbar />
      <div className="orders-page container">
        <h1>Your Orders</h1>
        {loading ? (
          <p>Loading...</p>
        ) : orders.length > 0 ? (
          <OrderTable orders={orders} />
        ) : (
          <p>You have no orders yet.</p>
        )}
      </div>
    </div>
  );
};

export default Orders;