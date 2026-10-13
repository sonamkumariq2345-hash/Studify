const bcrypt = require('bcrypt');
const { closeDb, collection, connectDb } = require('./src/db');

async function fixLogin() {
  try {
    await connectDb();

    const newHash = await bcrypt.hash('admin123', 10);
    const result = await collection('users').updateOne(
      { email: 'admin@edutrack.edu' },
      { $set: { password_hash: newHash, updated_at: new Date() } }
    );

    if (result.matchedCount === 0) {
      console.log('Admin user was not found. Run npm run db:init first.');
      return;
    }

    console.log('Successfully updated password to admin123.');
  } catch (error) {
    console.error(error);
  } finally {
    await closeDb();
  }
}

fixLogin();
