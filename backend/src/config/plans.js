// Listing totals include hidden products. Delete a listing to release a slot.
export const PLANS = Object.freeze({
  free: { name: "Free", listing_limit: 15, analytics: false, advertising: false, pos: true },
  premium: { name: "Premium", listing_limit: 50, analytics: true, advertising: true, pos: true },
});
export const getPlan = (tier) => PLANS[tier] || PLANS.free;
