import { eventStore } from "../data/marketStore.js";

// GET /api/events
export const getEvents = async (_req, res, next) => {
  try {
    const events = await eventStore.listEvents();
    res.json(events);
  } catch (err) {
    next(err);
  }
};

// GET /api/events/:eventId/stalls
export const getEventStalls = async (req, res, next) => {
  try {
    const stalls = await eventStore.listStallsForEvent(req.params.eventId);
    res.json(stalls);
  } catch (err) {
    next(err);
  }
};

// POST /api/seller-applications
export const submitSellerApplication = async (req, res, next) => {
  try {
    const application = await eventStore.submitApplication(
      req.user.id,
      req.body,
    );
    res
      .status(201)
      .json({ message: "Application submitted successfully!", application });
  } catch (err) {
    next(err);
  }
};

// GET /api/seller-applications (admin review)
export const getSellerApplications = async (req, res, next) => {
  try {
    const { eventId, status } = req.query;
    const applications = await eventStore.listApplications({ eventId, status });
    res.json(applications);
  } catch (err) {
    next(err);
  }
};
