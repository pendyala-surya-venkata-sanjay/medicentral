import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from '../config/db.js';

dotenv.config();

const run = async () => {
  await connectDB();
  const col = mongoose.connection.db.collection('hospitaltenants');
  try {
    await col.dropIndex('orgCode_1');
    console.log('Dropped stale orgCode_1 index');
  } catch (e) {
    console.log('Index drop:', e.message);
  }
  const cursor = col.find({ $or: [{ orgCode: null }, { orgCode: { $exists: false } }] });
  for await (const doc of cursor) {
    const orgCode = doc.slug || `tenant-${doc._id}`;
    await col.updateOne({ _id: doc._id }, { $set: { orgCode } });
    console.log('Updated orgCode for', doc.slug || doc._id);
  }
  await mongoose.disconnect();
};

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
