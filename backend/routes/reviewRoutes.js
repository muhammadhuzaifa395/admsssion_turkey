const express = require("express");
const router = express.Router();
const Review = require("../models/Review");

// GET /api/reviews - Get all public reviews from database
router.get("/", async (req, res) => {
  try {
    const reviews = await Review.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      reviews
    });
  } catch (error) {
    console.error("Get reviews error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch reviews",
      error: error.message
    });
  }
});

// POST /api/reviews - Submit a new review to database
router.post("/", async (req, res) => {
  try {
    const { name, role, rating, comment, avatar } = req.body;

    if (!name || !comment) {
      return res.status(400).json({
        success: false,
        message: "Name and review comment are required."
      });
    }

    const newReview = new Review({
      name,
      role: role || "International Student",
      rating: Number(rating) || 5,
      comment,
      avatar: avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80"
    });

    await newReview.save();

    res.status(201).json({
      success: true,
      message: "Review submitted successfully!",
      review: newReview
    });
  } catch (error) {
    console.error("Create review error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to save review",
      error: error.message
    });
  }
});

module.exports = router;
