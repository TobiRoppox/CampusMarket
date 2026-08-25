// Demo data for UI pages when API is unavailable

export const DEMO_SALES_CHART = [
  { month: "Jan", sales: 8200 },
  { month: "Feb", sales: 9100 },
  { month: "Mar", sales: 7800 },
  { month: "Apr", sales: 10200 },
  { month: "May", sales: 11400 },
  { month: "Jun", sales: 12450 },
];

export const DEMO_TOP_PRODUCTS = [
  { id: 1, name: "Cheese Pandesal", revenue: 2450 },
  { id: 2, name: "Brownies", revenue: 2200 },
  { id: 3, name: "Iced Coffee", revenue: 1950 },
  { id: 4, name: "Keychain", revenue: 1500 },
];

export const DEMO_RECENT_ORDERS = [
  { id: "ORD-1042", customer: "Juan Dela Cruz", total: 450, status: "completed" },
  { id: "ORD-1041", customer: "Maria Santos", total: 320, status: "pending" },
  { id: "ORD-1040", customer: "Ana Reyes", total: 890, status: "processing" },
  { id: "ORD-1039", customer: "Pedro Lim", total: 175, status: "completed" },
];

export const DEMO_RESERVATIONS = [
  { id: 1, event: "CSU Food Fest 2024", dates: "May 10 - 12, 2024", status: "approved" },
  { id: 2, event: "Eco Fair 2024", dates: "May 25 - 26, 2024", status: "pending" },
];

export const DEMO_ADMIN_STATS = {
  totalUsers: 1248,
  activeSellers: 342,
  totalSales: 245780,
  totalEvents: 15,
  userGrowth: 18,
  sellerGrowth: 15,
  salesGrowth: 22,
};

export const DEMO_USER_BREAKDOWN = [
  { name: "Buyers", value: 72, color: "#0F7B3E" },
  { name: "Sellers", value: 24, color: "#2BA84A" },
  { name: "Admins", value: 4, color: "#3B82F6" },
];

export const DEMO_SELLER_APPROVALS = [
  { id: 1, name: "John Mark", stall: "Sweet Treats", date: "May 8, 2024", avatar: "JM" },
  { id: 2, name: "Sweet Finds PH", stall: "Sweet Finds PH", date: "May 7, 2024", avatar: "SF" },
  { id: 3, name: "Crafty Hands", stall: "Crafty Hands", date: "May 6, 2024", avatar: "CH" },
];

export const DEMO_COMPLAINTS = [
  { id: 1, title: "Inappropriate Product", date: "May 9, 2024", type: "product" },
  { id: 2, title: "Seller Issue", date: "May 8, 2024", type: "seller" },
  { id: 3, title: "Fraud Report", date: "May 7, 2024", type: "fraud" },
];

export const STALL_CATEGORIES = {
  food: { label: "Food Stall", class: "stall-cell--food" },
  merchandise: { label: "Merchandise", class: "stall-cell--merchandise" },
  mixed: { label: "Mixed-Use", class: "stall-cell--mixed" },
  reserved: { label: "Reserved", class: "stall-cell--reserved" },
  available: { label: "Available", class: "stall-cell--available" },
};

export const generateStallGrid = () => {
  const categories = ["food", "food", "food", "food", "food", "food", "merchandise", "merchandise",
    "food", "food", "food", "food", "merchandise", "merchandise", "mixed", "merchandise",
    "merchandise", "merchandise", "merchandise", "merchandise", "merchandise", "mixed", "food", "mixed",
    "mixed", "mixed", "mixed", "mixed", "merchandise", "food", "mixed", "mixed",
    "merchandise", "merchandise", "food", "food", "food", "merchandise", "mixed", "mixed",
    "merchandise", "merchandise", "food", "mixed", "mixed", "food", "mixed", "mixed"];
  return Array.from({ length: 48 }, (_, i) => ({
    id: i + 1,
    number: i + 1,
    category: categories[i] || "available",
    size: "3m x 3m",
    price: 300,
    status: categories[i] === "mixed" && i === 21 ? "reserved" : categories[i] ? "occupied" : "available",
  }));
};

export const DEMO_EVENTS = [
  {
    id: 1,
    name: "CSU Food Fest 2024",
    dates: "May 10 - 12, 2024",
    location: "CSUCC Grounds",
    stallsAvailable: 12,
    banner: null,
  },
  {
    id: 2,
    name: "Eco Fair 2024",
    dates: "May 25 - 26, 2024",
    location: "CSUCC Gymnasium",
    stallsAvailable: 24,
    banner: null,
  },
];

export const DEMO_CATEGORIES = [
  { key: "food", label: "Food & Snacks", count: 128, icon: "🍱" },
  { key: "clothing", label: "Clothing", count: 64, icon: "👕" },
  { key: "electronics", label: "Electronics", count: 42, icon: "📱" },
  { key: "accessories", label: "Accessories", count: 56, icon: "💍" },
  { key: "student-made", label: "Student Made", count: 89, icon: "🎨" },
  { key: "services", label: "Services", count: 23, icon: "🛠️" },
];

export const DEMO_SELLERS = [
  { id: 1, name: "Maria's Bakeshop", rating: 4.9, products: 24, avatar: "MB" },
  { id: 2, name: "Tech Hub CSU", rating: 4.7, products: 18, avatar: "TH" },
  { id: 3, name: "Craft Corner", rating: 4.8, products: 31, avatar: "CC" },
];
