import mongoose from 'mongoose';

export async function connectDB(uri) {
  mongoose.set('strictQuery', true);
  await mongoose.connect(uri);
  console.log(`MongoDB ulandi: ${mongoose.connection.host}/${mongoose.connection.name}`);
}
