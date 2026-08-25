/**
 * jwt.js — Centralised JWT configuration and token utilities.
 *
 * All token signing/verification lives here so expiry values,
 * secrets, and payload shape are defined in exactly one place.
 */

import jwt from "jsonwebtoken";

// ── Constants ─────────────────────────────────────────────────────────────────
const SECRET = process.env.JWT_SECRET;
const ACCESS_EXPIRES = process.env.JWT_EXPIRES_IN || "15m";
const REFRESH_EXPIRES = process.env.JWT_REFRESH_EXPIRES_IN || "7d";

if (!SECRET) {
  throw new Error("[jwt.js] JWT_SECRET is not set. Add it to your .env file.");
}

// ── Token signing ─────────────────────────────────────────────────────────────

/**
 * Sign a short-lived access token.
 * Payload includes the fields needed for RBAC and UI rendering.
 *
 * @param {{ id: string, email: string, role: string, name: string }} user
 * @returns {string} Signed JWT
 */
export function signAccessToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    },
    SECRET,
    { expiresIn: ACCESS_EXPIRES },
  );
}

/**
 * Sign a long-lived refresh token.
 * Minimal payload — only the user ID and a type discriminator.
 *
 * @param {string} userId
 * @returns {string} Signed JWT
 */
export function signRefreshToken(userId) {
  return jwt.sign({ id: userId, type: "refresh" }, SECRET, {
    expiresIn: REFRESH_EXPIRES,
  });
}

// ── Token verification ────────────────────────────────────────────────────────

/**
 * Verify and decode any JWT signed with the app secret.
 * Throws a `JsonWebTokenError` or `TokenExpiredError` on failure.
 *
 * @param {string} token
 * @returns {object} Decoded payload
 */
export function verifyToken(token) {
  return jwt.verify(token, SECRET);
}

/**
 * Decode a token WITHOUT verifying the signature.
 * Safe to use only for reading non-sensitive metadata (e.g. expiry check
 * before attempting a network refresh).  Never use for authorisation.
 *
 * @param {string} token
 * @returns {object|null}
 */
export function decodeToken(token) {
  return jwt.decode(token);
}

/**
 * Check whether a token is expired without throwing.
 *
 * @param {string} token
 * @returns {boolean}
 */
export function isExpired(token) {
  try {
    jwt.verify(token, SECRET);
    return false;
  } catch (err) {
    return err.name === "TokenExpiredError";
  }
}

/**
 * Return both tokens for a freshly authenticated user.
 * Convenience wrapper used in auth.controller.js.
 *
 * @param {{ id: string, email: string, role: string, name: string }} user
 * @returns {{ accessToken: string, refreshToken: string }}
 */
export function issueTokenPair(user) {
  return {
    accessToken: signAccessToken(user),
    refreshToken: signRefreshToken(user.id),
  };
}

export default {
  signAccessToken,
  signRefreshToken,
  verifyToken,
  decodeToken,
  isExpired,
  issueTokenPair,
};
