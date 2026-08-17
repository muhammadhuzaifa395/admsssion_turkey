const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('../models/User');

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const email = 'admin@admissionturkey.local';
    const existing = await User.findOne({ email });
    if (existing) {
      console.log('Admin already exists:', existing.email);
      process.exit(0);
    }

    const hashed = await bcrypt.hash('Admin123!', 10);

    const admin = new User({
      name: 'Site Admin',
      email,
      password: hashed,
      role: 'admin'
    });

    await admin.save();
    console.log('Admin user created:', email, 'password: Admin123!');
    process.exit(0);
  } catch (err) {
    console.error('Create admin error:', err);
    process.exit(1);
  }
}

run();
