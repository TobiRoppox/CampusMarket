import React from "react";

const CategoryFilter = ({ categories, onSelectCategory }) => {
  return (
    <div className="category-filter">
      <h3>Filter by Category</h3>
      <ul>
        {categories.map((category) => (
          <li key={category.id}>
            <button onClick={() => onSelectCategory(category.id)}>{category.name}</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default CategoryFilter;