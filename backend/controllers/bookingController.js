const Booking = require("../models/Booking");

exports.createBooking = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      topic,
      date,
      time
    } = req.body;

    if (
      !name ||
      !email ||
      !phone ||
      !topic ||
      !date ||
      !time
    ) {
      return res.status(400).json({
        success: false,
        message: "Please fill all required fields."
      });
    }

    const booking = await Booking.create({
      name,
      email,
      phone,
      topic,
      date,
      time,
     paymentStatus: "completed",
     bookingStatus: "confirmed"
    });

    res.status(201).json({
      success: true,
      message: "Booking created successfully.",
      booking
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      success: false,
      message: "Server Error"
    });

  }
};


exports.getBookings = async (req, res) => {

  try {

    const bookings = await Booking.find().sort({
      createdAt: -1
    });

    res.status(200).json(bookings);

  } catch (error) {

    res.status(500).json({
      success: false,
      message: "Server Error"
    });

  }

};