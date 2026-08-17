const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('../models/User');

async function run() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const email = 'admissionturkeyoffcial@gmail.com';
    const rawPassword = 'Fcc986108@';
    const hashed = await bcrypt.hash(rawPassword, 10);

    let existing = await User.findOne({ email });
    if (existing) {
      existing.password = hashed;
      existing.role = 'admin';
      await existing.save();
      console.log('Admin updated:', existing.email);
      process.exit(0);
    }

    const admin = new User({
      name: 'Admission Turkey Admin',
      email,
      password: hashed,
      role: 'admin'
    });

    await admin.save();
    console.log('Admin user created:', email);
    process.exit(0);
  } catch (err) {
    console.error('Create admin error:', err);
    process.exit(1);
  }
}

run();
