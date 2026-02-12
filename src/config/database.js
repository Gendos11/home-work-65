const mongoose = require("mongoose");

async function connectDatabase() {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error("MONGODB_URI is not set. Please configure MongoDB Atlas connection.");
  }

  const options = {};

  if (process.env.MONGODB_DB) {
    options.dbName = process.env.MONGODB_DB;
  }

  await mongoose.connect(mongoUri, options);
}

module.exports = connectDatabase;
