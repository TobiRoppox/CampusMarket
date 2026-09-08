import { FiGrid } from "react-icons/fi";

export default function CategoryFilter({
  categories = [],
  selectedCategory = "",
  onSelectCategory,
  allLabel = "All categories",
  showAll = true,
}) {
  const selectCategory = (categoryId) => {
    if (typeof onSelectCategory === "function") {
      onSelectCategory(categoryId);
    }
  };

  return (
    <fieldset className="category-filter">
      <legend className="browse-filter-label">Category</legend>

      <div className="category-filter-options">
        {showAll && (
          <button
            type="button"
            className={`category-filter-option ${selectedCategory === "" ? "active" : ""}`}
            onClick={() => selectCategory("")}
            aria-pressed={selectedCategory === ""}
          >
            <span className="category-filter-icon" aria-hidden="true">
              <FiGrid />
            </span>
            <span>{allLabel}</span>
          </button>
        )}

        {categories.map((category) => {
          const categoryId = String(category.id);
          const categoryName = category.name || "Unnamed category";
          const selected = String(selectedCategory) === categoryId;
          const CategoryIcon = category.icon;

          return (
            <button
              type="button"
              key={categoryId}
              className={`category-filter-option ${selected ? "active" : ""}`}
              onClick={() => selectCategory(category.id)}
              aria-pressed={selected}
            >
              <span className="category-filter-icon" aria-hidden="true">
                {CategoryIcon ? (
                  <CategoryIcon />
                ) : (
                  categoryName.charAt(0).toUpperCase()
                )}
              </span>
              <span className="category-filter-name">{categoryName}</span>
              {Number.isFinite(category.count) && (
                <span className="category-filter-count">{category.count}</span>
              )}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
