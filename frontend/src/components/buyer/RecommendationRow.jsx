import React from "react";

const RecommendationRow = ({ recommendations, onProductClick }) => {
  return (
    <div className="recommendation-row">
      <h2>Recommended for You</h2>
      <div className="recommendation-list">
        {recommendations.map((product) => (
          <div
            key={product.id}
            className="recommendation-item"
            onClick={() => onProductClick(product.id)}
          >
            <img src={product.image} alt={product.name} />
            <p>{product.name}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecommendationRow;