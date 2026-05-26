import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`MongoDB connection failed: ${error.message}`);
    if (error.message.includes('whitelist') || error.message.includes('IP')) {
      console.error(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  FIX: MongoDB Atlas → Network Access
  → Add IP Address → "Allow access from anywhere" (0.0.0.0/0)
  → Wait 1–2 minutes, then restart the backend.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);
    }
    if (error.message.includes('bad auth') || error.message.includes('authentication failed')) {
      console.error('→ Check MONGO_URI password (@ must be encoded as %40)\n');
    }
    console.error('→ Local alternative: MONGO_URI=mongodb://127.0.0.1:27017/medicentral\n');
    process.exit(1);
  }
};

export default connectDB;
