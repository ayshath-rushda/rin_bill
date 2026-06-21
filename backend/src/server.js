import app from './app.js';
import connectDB from './config/db.js';
import env from './config/env.js';

const start = async () => {
  await connectDB();

  app.listen(env.PORT, () => {
    console.log(`Server running in ${env.NODE_ENV} on port ${env.PORT}`);
  });
};

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});
