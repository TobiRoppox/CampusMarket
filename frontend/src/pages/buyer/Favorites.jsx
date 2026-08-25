import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Heart } from "lucide-react";
import Navbar from "../../components/common/Navbar.jsx";
import ProductCard from "../../components/common/ProductCard.jsx";
import { SkeletonGrid } from "../../components/common/UI.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
// TODO: swap for the real service once it exists, e.g.:
// import favoriteService from "../../services/favoriteService.js";

export default function Favorites() {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    // TODO: replace with favoriteService.getAll(user.id)
    const timer = setTimeout(() => {
      setFavorites([]); // no favorites yet — backend not built
      setLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [user]);

  const handleRemove = (productId) => {
    // TODO: favoriteService.remove(productId)
    setFavorites((prev) => prev.filter((p) => p.id !== productId));
  };

  return (
    <div>
      <Navbar />
      <div className="favorites-page">
        <h1>Favorites</h1>
        <p className="favorites-sub">Products you've saved for later</p>

        {loading ? (
          <SkeletonGrid count={8} />
        ) : favorites.length === 0 ? (
          <div className="favorites-empty">
            <Heart size={40} className="favorites-empty-icon" />
            <h3>No favorites yet</h3>
            <p>Tap the heart icon on any product to save it here.</p>
            <Link to="/browse" className="btn btn-primary">
              Browse Products
            </Link>
          </div>
        ) : (
          <div className="product-grid fade-in">
            {favorites.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                onRemoveFavorite={() => handleRemove(p.id)}
              />
            ))}
          </div>
        )}
      </div>

      <style>{`
        .favorites-page { max-width: 1400px; margin: 0 auto; padding: 1.75rem 1.5rem 4rem; }
        .favorites-page h1 { font-size: 1.5rem; font-weight: 800; color: var(--gray-900); }
        .favorites-sub { color: var(--gray-500); font-size: 0.9rem; margin-bottom: 1.5rem; }

        .favorites-empty {
          display: flex; flex-direction: column; align-items: center; text-align: center;
          padding: 4rem 1.5rem; border: 1px dashed var(--gray-200); border-radius: var(--radius-xl);
        }
        .favorites-empty-icon { color: var(--gray-300); margin-bottom: 1rem; }
        .favorites-empty h3 { font-size: 1.1rem; font-weight: 700; color: var(--gray-800); margin-bottom: 0.25rem; }
        .favorites-empty p { color: var(--gray-500); font-size: 0.9rem; margin-bottom: 1.25rem; }
      `}</style>
    </div>
  );
}
