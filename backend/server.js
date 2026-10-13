require('dotenv').config();
const app = require('./src/app');
const { closeDb, connectDb } = require('./src/db');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDb();

    const server = app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });

    const shutdown = async () => {
      server.close(async () => {
        await closeDb();
        process.exit(0);
      });
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();
