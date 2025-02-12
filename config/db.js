const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const MONGO_URI= 'mongodb+srv://appdevswapjeo:W4bohRUi9tXrTotZ@jeoswap-cluster.f5wyc.mongodb.net/?retryWrites=true&w=majority&appName=Jeoswap-cluster'
    await mongoose.connect(MONGO_URI, {});
    console.log("Database connected");
  } catch (error) {
    console.error("Database connection error:", error);
    process.exit(1);
  }
};

module.exports = connectDB;
