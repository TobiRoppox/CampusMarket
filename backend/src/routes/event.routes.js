const express = require('express');
const router = express.Router();

// Mock database
const events = [
  { id: 1, name: 'Spring Fair', date: '2026-05-01', location: 'Central Park', description: 'A fun spring event.' },
  { id: 2, name: 'Summer Fest', date: '2026-06-15', location: 'Beachside', description: 'Enjoy summer vibes.' },
];

const stalls = [
  { id: 'A1', eventId: 1, size: 10, status: 'Available', sellerName: '', productsAvailable: [] },
  { id: 'A2', eventId: 1, size: 20, status: 'Occupied', sellerName: 'John Doe', productsAvailable: ['Candies', 'Toys'] },
];

const sellerApplications = [];

// Get all events
router.get('/events', (req, res) => {
  res.json(events);
});

// Get stalls for an event
router.get('/events/:eventId/stalls', (req, res) => {
  const { eventId } = req.params;
  const eventStalls = stalls.filter(stall => stall.eventId === parseInt(eventId));
  res.json(eventStalls);
});

// Submit seller application
router.post('/seller-applications', (req, res) => {
  const application = req.body;
  sellerApplications.push({ id: sellerApplications.length + 1, ...application, status: 'Pending' });
  res.status(201).json({ message: 'Application submitted successfully!' });
});

module.exports = router;