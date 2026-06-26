const mongoose = require('mongoose');
const dns = require('dns');

const connectDB = async () => {
  // If we are in the test environment, we don't connect here, testing setup will handle it.
  if (process.env.NODE_ENV === 'test') {
    return;
  }
  
  try {
    // Set public DNS servers to resolve MongoDB SRV records reliably
    dns.setServers(['8.8.8.8', '1.1.1.1']);
    
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (err) {
    console.error(`Error connecting to MongoDB: ${err.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
