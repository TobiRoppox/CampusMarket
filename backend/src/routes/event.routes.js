import { Router } from "express";

import {
  getEvent,
  getEvents,
  getEventStalls,
  getMySellerApplications,
  getSellerApplications,
  submitSellerApplication,
} from "../controllers/event.controller.js";

import { requireRole, verifyToken } from "../middleware/auth.js";

const eventRouter = Router();

// Public event routes
eventRouter.get("/events", getEvents);

eventRouter.get("/events/:eventId/stalls", getEventStalls);

eventRouter.get("/events/:eventId", getEvent);

// Seller submits a stall application
eventRouter.post(
  "/seller-applications",
  verifyToken,
  requireRole("seller"),
  submitSellerApplication,
);

// Seller retrieves only their own applications
eventRouter.get(
  "/seller-applications/my",
  verifyToken,
  requireRole("seller"),
  getMySellerApplications,
);

// Admin retrieves all applications
eventRouter.get(
  "/seller-applications",
  verifyToken,
  requireRole("admin"),
  getSellerApplications,
);

export default eventRouter;
