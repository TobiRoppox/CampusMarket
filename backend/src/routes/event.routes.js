import { Router as EventRouter } from "express";
import {
  getEvents,
  getEventStalls,
  submitSellerApplication,
  getSellerApplications,
} from "../controllers/event.controller.js";
import { verifyToken, requireRole } from "../middleware/auth.js";

const eventRouter = EventRouter();

eventRouter.get("/events", getEvents);
eventRouter.get("/events/:eventId/stalls", getEventStalls);
eventRouter.post(
  "/seller-applications",
  verifyToken,
  requireRole("seller"),
  submitSellerApplication,
);
eventRouter.get(
  "/seller-applications",
  verifyToken,
  requireRole("admin"),
  getSellerApplications,
);

export { eventRouter as default };
