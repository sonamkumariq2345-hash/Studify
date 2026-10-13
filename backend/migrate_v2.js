const { initDB } = require('./init_db');

// MongoDB collections and indexes are managed during app startup.
// This legacy entry point now runs the idempotent MongoDB seed.
initDB();
