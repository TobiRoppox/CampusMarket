/**
 * roleCheck.js — Role-Based Access Control middleware.
 *
 * Complements auth.js (which verifies the token) with fine-grained
 * role guards and resource-ownership checks.
 *
 * Usage in routes:
 *   router.delete("/:id", verifyToken, requireRole("admin"), handler);
 *   router.put("/:id",    verifyToken, requireAnyRole("seller", "admin"), handler);
 *   router.get("/mine",   verifyToken, requireSelf("userId"), handler);
 */

// ── requireRole ───────────────────────────────────────────────────────────────
/**
 * Allow access only to users with the exact specified role.
 *
 * @param {...string} roles  One or more allowed roles
 */
export const requireRole =
  (...roles) =>
  (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Access denied. Allowed role(s): ${roles.join(", ")}`,
        yourRole: req.user.role,
      });
    }

    next();
  };

// ── requireAnyRole ────────────────────────────────────────────────────────────
/**
 * Alias for requireRole — semantically clearer when listing multiple roles.
 *
 * @param {...string} roles
 */
export const requireAnyRole = requireRole;

// ── requireAdmin ──────────────────────────────────────────────────────────────
/** Shorthand: restrict to admin only. */
export const requireAdmin = requireRole("admin");

// ── requireSeller ─────────────────────────────────────────────────────────────
/** Shorthand: restrict to seller only. */
export const requireSeller = requireRole("seller");

// ── requireBuyer ──────────────────────────────────────────────────────────────
/** Shorthand: restrict to buyer only. */
export const requireBuyer = requireRole("buyer");

// ── requireSellerOrAdmin ──────────────────────────────────────────────────────
/** Shorthand: allow sellers and admins (e.g. product management). */
export const requireSellerOrAdmin = requireRole("seller", "admin");

// ── requireSelf ───────────────────────────────────────────────────────────────
/**
 * Ensure the authenticated user is acting on their own resource.
 * Admins bypass this check automatically.
 *
 * @param {string} paramName  The route param that holds the target user ID.
 *                            Defaults to "id".
 *
 * Example:
 *   router.get("/users/:id/profile", verifyToken, requireSelf("id"), handler);
 */
export const requireSelf =
  (paramName = "id") =>
  (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    // Admins can access any user resource
    if (req.user.role === "admin") return next();

    const targetId = req.params[paramName];
    if (!targetId) {
      return res
        .status(400)
        .json({ error: `Missing route param: ${paramName}` });
    }

    if (req.user.id !== targetId) {
      return res
        .status(403)
        .json({ error: "You can only access your own resources" });
    }

    next();
  };

// ── requireOwnership ─────────────────────────────────────────────────────────
/**
 * Generic ownership check via an async lookup function.
 * If the resource's owner ID does not match req.user.id, reject.
 * Admins bypass automatically.
 *
 * @param {Function} getOwnerId  Async fn(req) → ownerId string | null
 *
 * Example:
 *   const getStallOwner = async (req) => {
 *     const { data } = await supabase
 *       .from("stalls").select("owner_id").eq("id", req.params.id).single();
 *     return data?.owner_id;
 *   };
 *   router.put("/:id", verifyToken, requireOwnership(getStallOwner), handler);
 */
export const requireOwnership = (getOwnerId) => async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: "Authentication required" });
  }

  if (req.user.role === "admin") return next();

  try {
    const ownerId = await getOwnerId(req);

    if (!ownerId) {
      return res.status(404).json({ error: "Resource not found" });
    }

    if (ownerId !== req.user.id) {
      return res.status(403).json({ error: "You do not own this resource" });
    }

    next();
  } catch (err) {
    next(err);
  }
};

export default {
  requireRole,
  requireAnyRole,
  requireAdmin,
  requireSeller,
  requireBuyer,
  requireSellerOrAdmin,
  requireSelf,
  requireOwnership,
};
