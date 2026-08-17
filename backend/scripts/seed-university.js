const mongoose = require('mongoose');
const University = require('../models/University');
require('dotenv').config({ path: __dirname + '/../.env' });

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    const uni = new University({
      name: 'Istanbul Topkapi University',
      location: 'Istanbul, Turkey',
      description: 'Preview university record for testing image display on the university list.',
      image: 'https://www.topkapi.edu.tr/resources/files/logo_tr.jpg',
      applicationLink: 'https://www.topkapi.edu.tr',
      programs: {
        associate: [],
        bachelors: [
          {
            name: 'Computer Engineering',
            duration: '4 Years',
            originalFee: 11000,
            discountFee: 7000,
            description: 'A strong engineering program in Istanbul.'
          }
        ],
        masters: [],
        phd: []
      }
    });

    const saved = await uni.save();
    console.log('Seeded university:', saved);
    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
}

seed();
