const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Default to environment variable, but fall back to a default URI if not set
    const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/collider';
    
    // Set a shorter connection timeout to fail faster if MongoDB is not available
    const conn = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 2000 // Timeout after 2s instead of 30s default
    });
    
    console.log(`MongoDB подключена: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`Ошибка подключения к MongoDB: ${error.message}`);
    // Don't exit process in development, just log the error
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
    console.log('Будут использованы тестовые данные для разработки');
    return null;
  }
};

module.exports = connectDB;