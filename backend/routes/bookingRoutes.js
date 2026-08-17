const express = require("express");
const router = express.Router();

const {
  createBooking,
  getBookings
} = require("../controllers/bookingController");

// ========================================
// CREATE BOOKING
// ========================================

router.post("/", createBooking);

// ========================================
// GET ALL BOOKINGS
// ========================================

router.get("/", getBookings);

module.exports = router;