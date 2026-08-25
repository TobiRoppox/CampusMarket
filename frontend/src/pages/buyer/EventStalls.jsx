import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

const EventStalls = () => {
  const { eventId } = useParams();
  const [stalls, setStalls] = useState([]);

  useEffect(() => {
    // Fetch stalls for the event from the backend
    fetch(`/api/events/${eventId}/stalls`)
      .then((response) => response.json())
      .then((data) => setStalls(data))
      .catch((error) => console.error('Error fetching stalls:', error));
  }, [eventId]);

  return (
    <div className="event-stalls">
      <h1 className="text-2xl font-bold mb-4">Stalls</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {stalls.map(stall => (
          <div key={stall.id} className="stall-card p-4 border rounded shadow">
            <h3 className="text-lg font-bold">{stall.name}</h3>
            <p>Seller: {stall.sellerName}</p>
            <p>Products: {stall.productsAvailable.join(', ')}</p>
            <p>Status: {stall.status}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EventStalls;