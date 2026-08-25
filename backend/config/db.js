const mongoose = require("mongoose");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const ATLAS_URI = "mongodb+srv://huzaifarasheed2006:Fcc986108@huzaifaauth.ylrg6rk.mongodb.net/admission_turkey?retryWrites=true&w=majority&appName=HuzaifaAuth";
const PRIMARY_URI = process.env.MONGO_URI || ATLAS_URI;

let cachedPromise = null;

const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (!cachedPromise) {
    const opts = {
      serverSelectionTimeoutMS: 8000,
      connectTimeoutMS: 15000,
      maxPoolSize: 10,
      minPoolSize: 1
    };

    cachedPromise = mongoose.connect(PRIMARY_URI, opts)
      .then((db) => {
        console.log("MongoDB Connected Successfully:", PRIMARY_URI.includes("mongodb+srv") ? "Atlas Cloud DB" : "Local DB");
        return db;
      })
      .catch(async (err) => {
        console.error(`Primary DB Connection Note (${PRIMARY_URI}):`, err.message);
        if (PRIMARY_URI !== ATLAS_URI) {
          console.log("Attempting fallback connection to MongoDB Atlas Cloud...");
          return mongoose.connect(ATLAS_URI, opts).then((db) => {
            console.log("MongoDB Atlas Cloud Fallback Connected Successfully");
            return db;
          });
        }
        cachedPromise = null;
        throw err;
      })
      .catch((err) => {
        cachedPromise = null;
        console.error("Final MongoDB Connection Error:", err.message);
        throw err;
      });
  }

  return cachedPromise;
};

module.exports = connectDB;
