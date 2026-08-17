const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();

const DEFAULT_ADMIN_EMAIL = "admissionturkeyoffcial@gmail.com";
const DEFAULT_ADMIN_PASS = "Fcc986108@";

async function ensureDefaultAdmin() {
  try {
    const adminEmail = DEFAULT_ADMIN_EMAIL.toLowerCase().trim();
    let admin = await User.findOne({ email: adminEmail });

    if (!admin) {
      const hashedPassword = await bcrypt.hash(DEFAULT_ADMIN_PASS, 10);
      admin = new User({
        name: "Admission Turkey Admin",
        email: adminEmail,
        password: hashedPassword,
        role: "admin"
      });
      await admin.save();
      console.log("Default admin account created:", adminEmail);
    } else {
      let updated = false;
      if (admin.role !== "admin") {
        admin.role = "admin";
        updated = true;
      }
      const isPassMatch = await bcrypt.compare(DEFAULT_ADMIN_PASS, admin.password);
      if (!isPassMatch) {
        admin.password = await bcrypt.hash(DEFAULT_ADMIN_PASS, 10);
        updated = true;
      }
      if (updated) {
        await admin.save();
        console.log("Default admin account updated:", adminEmail);
      }
    }
  } catch (err) {
    console.error("Error ensuring default admin:", err.message);
  }
}

// Ensure default admin exists on module load if connected
ensureDefaultAdmin();

// ========================================
// SIGNUP
// ========================================

router.post("/signup", async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      password
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Name, email and password are required."
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({
      email: normalizedEmail
    });

    if (existingUser) {
      return res.status(400).json({
        message: "User already exists."
      });
    }

    const hashedPassword = await bcrypt.hash(
      password,
      10
    );

    const userRole = normalizedEmail === DEFAULT_ADMIN_EMAIL.toLowerCase() ? "admin" : "user";

    const newUser = new User({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: userRole
    });

    await newUser.save();

    res.status(201).json({
      message: "Account created successfully."
    });

  } catch (error) {
    console.error("Signup Error:", error);

    res.status(500).json({
      message: "Server error during signup."
    });
  }
});


// ========================================
// LOGIN
// ========================================

router.post("/login", async (req, res) => {
  try {
    const {
      email,
      password
    } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required."
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Ensure default admin exists when logging in with admin email
    if (normalizedEmail === DEFAULT_ADMIN_EMAIL.toLowerCase()) {
      await ensureDefaultAdmin();
    }

    const user = await User.findOne({
      email: normalizedEmail
    });

    if (!user) {
      return res.status(401).json({
        message: "Invalid email or password."
      });
    }

    const isPasswordCorrect =
      await bcrypt.compare(
        password,
        user.password
      );

    if (!isPasswordCorrect) {
      return res.status(401).json({
        message: "Invalid email or password."
      });
    }


    // ========================================
    // CREATE JWT TOKEN
    // ========================================

    const token = jwt.sign(
      {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      process.env.JWT_SECRET || "secretkey",
      {
        expiresIn: "7d"
      }
    );


    // ========================================
    // LOGIN RESPONSE
    // ========================================

    res.status(200).json({

      message: "Login successful.",

      token: token,

      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }

    });

  } catch (error) {

    console.error(
      "Login Error:",
      error
    );

    res.status(500).json({
      message: "Server error during login."
    });
  }
});


module.exports = {
  router,
  ensureDefaultAdmin
};