/**
 * Utility functions for role-based access control on the frontend.
 */

export const ROLES = {
  BUYER: "buyer",
  SELLER: "seller",
  ADMIN: "admin",
};

/**
 * Check if a user has a specific role.
 */
export const hasRole = (user, role) => user?.role === role;

/**
 * Check if a user has any of the given roles.
 */
export const hasAnyRole = (user, roles = []) => roles.includes(user?.role);

/**
 * Get the home route for a given user role.
 */
export const getHomeRoute = (user) => {
  if (!user) return "/login";
  if (user.role === ROLES.ADMIN) return "/admin";
  if (user.role === ROLES.SELLER) return "/seller";
  return "/";
};

/**
 * Check if user can access a route that requires a specific role.
 * Returns { allowed: boolean, redirect: string | null }
 */
export const checkRouteAccess = (user, requiredRole) => {
  if (!user) return { allowed: false, redirect: "/login" };
  if (requiredRole && user.role !== requiredRole) {
    return { allowed: false, redirect: getHomeRoute(user) };
  }
  return { allowed: true, redirect: null };
};

export default { ROLES, hasRole, hasAnyRole, getHomeRoute, checkRouteAccess };
