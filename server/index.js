import 'dotenv/config';
import mongoose from 'mongoose';
import { app } from './app.js';
try {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/application_tracker', {serverSelectionTimeoutMS:5000});
  const server = app.listen(process.env.PORT || 3001, process.env.HOST || '127.0.0.1', () => console.log(`API ready at http://localhost:${process.env.PORT || 3001}`));
  for (const signal of ['SIGINT','SIGTERM']) process.on(signal, () => server.close(async () => { await mongoose.disconnect(); process.exit(0); }));
} catch(error) {
  console.error('MongoDB connection failed. Start MongoDB or set MONGODB_URI in .env.');
  console.error(error.message);
  process.exit(1);
}
