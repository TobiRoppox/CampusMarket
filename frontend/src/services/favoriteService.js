const STORAGE_PREFIX = "campus-market:favorites";
const CHANGE_EVENT = "campus-market:favorites-changed";

const storageKey = (userId) => `${STORAGE_PREFIX}:${userId || "guest"}`;

const readFavorites = (userId) => {
  if (typeof window === "undefined") return [];

  try {
    const saved = JSON.parse(
      window.localStorage.getItem(storageKey(userId)) || "[]",
    );

    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
};

const createProductSnapshot = (product) => ({
  id: product.id,
  name: product.name,
  price: product.price,
  image_url: product.image_url,
  category: product.category,
  stock: product.stock,
  avg_rating: product.avg_rating,
  review_count: product.review_count,
  description: product.description,
  stalls: product.stalls
    ? {
        id: product.stalls.id,
        name: product.stalls.name,
        logo_url: product.stalls.logo_url,
      }
    : undefined,
});

const saveFavorites = (userId, favorites) => {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(storageKey(userId), JSON.stringify(favorites));

  window.dispatchEvent(
    new CustomEvent(CHANGE_EVENT, {
      detail: {
        userId: String(userId),
        favorites,
      },
    }),
  );
};

const favoriteService = {
  async getAll(userId) {
    return readFavorites(userId);
  },

  async isFavorite(userId, productId) {
    return readFavorites(userId).some(
      (product) => String(product.id) === String(productId),
    );
  },

  async toggle(userId, product) {
    const currentFavorites = readFavorites(userId);

    const alreadySaved = currentFavorites.some(
      (savedProduct) => String(savedProduct.id) === String(product.id),
    );

    const favorites = alreadySaved
      ? currentFavorites.filter(
          (savedProduct) => String(savedProduct.id) !== String(product.id),
        )
      : [createProductSnapshot(product), ...currentFavorites];

    saveFavorites(userId, favorites);

    return {
      saved: !alreadySaved,
      favorites,
    };
  },

  async remove(userId, productId) {
    const favorites = readFavorites(userId).filter(
      (product) => String(product.id) !== String(productId),
    );

    saveFavorites(userId, favorites);

    return favorites;
  },

  subscribe(userId, listener) {
    if (typeof window === "undefined") {
      return () => {};
    }

    const key = storageKey(userId);

    const handleCustomChange = (event) => {
      if (event.detail?.userId === String(userId)) {
        listener(event.detail.favorites);
      }
    };

    const handleStorageChange = (event) => {
      if (event.key === key) {
        listener(readFavorites(userId));
      }
    };

    window.addEventListener(CHANGE_EVENT, handleCustomChange);

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener(CHANGE_EVENT, handleCustomChange);

      window.removeEventListener("storage", handleStorageChange);
    };
  },
};

export default favoriteService;
