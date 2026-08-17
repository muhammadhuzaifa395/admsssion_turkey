const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
{
name: {
type: String,
required: true,
trim: true
},


email: {
  type: String,
  required: true,
  trim: true,
  lowercase: true
},

phone: {
  type: String,
  required: true,
  trim: true
},

topic: {
  type: String,
  required: true,
  trim: true
},

date: {
  type: String,
  required: true
},

time: {
  type: String,
  required: true
},

paymentStatus: {
  type: String,
  enum: [
    "pending",
    "paid",
    "failed"
  ],
  default: "pending"
},

bookingStatus: {
  type: String,
  enum: [
    "pending",
    "confirmed",
    "completed",
    "cancelled"
  ],
  default: "pending"
},

stripeSessionId: {
  type: String,
  default: ""
}


},
{
timestamps: true
}
);

module.exports =
mongoose.model(
"Booking",
bookingSchema
);
