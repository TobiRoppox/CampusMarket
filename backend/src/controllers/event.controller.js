import { eventStore } from "../data/marketStore.js";

// GET /api/events
export const getEvents = async (_req, res, next) => {
  try {
    const events = await eventStore.listEvents();

    res.json(events);
  } catch (error) {
    next(error);
  }
};

// GET /api/events/:eventId
export const getEvent = async (req, res, next) => {
  try {
    const event = await eventStore.getById(req.params.eventId);

    res.json(event);
  } catch (error) {
    next(error);
  }
};

// GET /api/events/:eventId/stalls
export const getEventStalls = async (req, res, next) => {
  try {
    const stalls = await eventStore.listStallsForEvent(req.params.eventId);

    res.json(stalls);
  } catch (error) {
    next(error);
  }
};

// POST /api/seller-applications
export const submitSellerApplication = async (req, res, next) => {
  try {
    const application = await eventStore.submitApplication(
      req.user.id,
      req.body,
    );

    res.status(201).json({
      message: "Application submitted successfully!",
      application,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/seller-applications/my
export const getMySellerApplications = async (req, res, next) => {
  try {
    const { eventId, status } = req.query;

    const applications = await eventStore.listApplications({
      eventId,
      status,
      sellerId: req.user.id,
    });

    res.json(applications);
  } catch (error) {
    next(error);
  }
};

// GET /api/seller-applications
// Admin-only application review
export const getSellerApplications = async (req, res, next) => {
  try {
    const { eventId, status } = req.query;

    const applications = await eventStore.listApplications({
      eventId,
      status,
    });

    res.json(applications);
  } catch (error) {
    next(error);
  }
};
