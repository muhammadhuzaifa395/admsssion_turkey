const mongoose = require("mongoose");
const path = require("path");
module.paths.push(path.join(__dirname, "../node_modules"));

const connectDB = require("../config/db");
const Application = require("../models/Application");

async function seedApplication() {
  try {
    await connectDB();
    console.log("Connected to MongoDB Atlas!");

    const count = await Application.countDocuments();
    if (count === 0) {
      const sampleApp = new Application({
        name: "Muhammad Huzaifa",
        email: "huzaifarasheed2006@gmail.com",
        phone: "+90 551 484 08 04",
        country: "Pakistan",
        nationality: "Pakistani",
        dob: "2006-05-15",
        gender: "Male",
        fatherName: "Rasheed Ahmed",
        motherName: "Ayesha Bibi",
        passportNumber: "PK987654321",
        university: "Istanbul Bilgi University",
        program: "Computer Engineering",
        level: "Bachelor's",
        originalFee: 12000,
        discountFee: 7800,
        message: "Sample student application submitted for testing database integration.",
        status: "Pending"
      });

      const saved = await sampleApp.save();
      console.log("Seeded sample application:", saved._id);
    } else {
      console.log(`Applications already exist in database (${count} records).`);
    }

    process.exit(0);
  } catch (err) {
    console.error("Seed Application Error:", err.message);
    process.exit(1);
  }
}

seedApplication();
