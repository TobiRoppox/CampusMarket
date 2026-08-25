import React, { useState } from 'react';

const StallMap = ({ gridSize = 10, stalls }) => {
  const [selectedStall, setSelectedStall] = useState(null);

  const handleStallClick = (stall) => {
    if (stall.status === 'Occupied') {
      alert('This stall is already occupied.');
      return;
    }
    setSelectedStall(stall);
  };

  return (
    <div className="stall-map">
      <h1 className="text-2xl font-bold mb-4">Stall Map</h1>
      <div
        className="grid"
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
          gap: '4px',
        }}
      >
        {stalls.map((stall) => (
          <div
            key={stall.id}
            className={`stall-box p-2 border rounded text-center cursor-pointer ${
              stall.status === 'Available'
                ? 'bg-green-300'
                : stall.status === 'Occupied'
                ? 'bg-red-300'
                : 'bg-yellow-300'
            }`}
            onClick={() => handleStallClick(stall)}
          >
            {stall.id}
          </div>
        ))}
      </div>

      {selectedStall && (
        <div className="selected-stall-info mt-4 p-4 border rounded">
          <h2 className="text-xl font-semibold">Selected Stall</h2>
          <p>ID: {selectedStall.id}</p>
          <p>Size: {selectedStall.size} sqm</p>
          <p>
            Capacity: {selectedStall.size <= 10
              ? '1 stall'
              : selectedStall.size <= 20
              ? '2 stalls'
              : '3 stalls'}
          </p>
        </div>
      )}
    </div>
  );
};

export default StallMap;