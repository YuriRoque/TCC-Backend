import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

const DB_URL_LOCAL = process.env.DB_URL_LOCAL;
const DB_URL_ATLAS = process.env.DB_URL_ATLAS;

const connectDB = async () => {
  try {
    await mongoose.connect(DB_URL_ATLAS, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Database connected...');
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
};

export default connectDB;
