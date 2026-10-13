const { MongoClient } = require('mongodb');
require('dotenv').config();

const DEFAULT_MONGODB_URI = 'mongodb://127.0.0.1:27017/edutrack';
const DEFAULT_DB_NAME = 'edutrack';

let client;
let db;

const getMongoUri = () => process.env.MONGODB_URI || process.env.MONGO_URI || DEFAULT_MONGODB_URI;

const resolveDatabaseName = () => {
  if (process.env.MONGODB_DB_NAME) {
     return process.env.MONGODB_DB_NAME;
}
  try {
    const parsed = new URL(getMongoUri());
    const dbName = decodeURIComponent(parsed.pathname.replace(/^\/+/, '').split('?')[0]);
    return dbName || DEFAULT_DB_NAME;
  } catch (error) {
    return DEFAULT_DB_NAME;
  }
};
  const ensureIndexes = async (database) => {
  const collections = [
    'users',
    'courses',
    'enrollments',
    'progress',
    'files',
    'announcements',
    'course_resources',
    'departments'
  ];

  await Promise.all(collections.map((name) =>
    database.collection(name).createIndex({ id: 1 }, { unique: true })
  ));

  await Promise.all([
    database.collection('users').createIndex({ email: 1 }, { unique: true }),
    database.collection('users').createIndex({ role: 1, status: 1, department_id: 1 }),
    database.collection('users').createIndex(
      { 'student_profile.roll_number': 1 },
      {
        unique: true,
        partialFilterExpression: { 'student_profile.roll_number': { $type: 'string' } }
      }
    ),
    database.collection('users').createIndex(
      { 'student_profile.registration_number': 1 },
      {
        unique: true,
        partialFilterExpression: { 'student_profile.registration_number': { $type: 'string' } }
      }
    ),
    database.collection('users').createIndex(
      { 'teacher_profile.employee_id': 1 },
      {
        unique: true,
        partialFilterExpression: { 'teacher_profile.employee_id': { $type: 'string' } }
      }
    ),
    database.collection('users').createIndex(
      { department_id: 1 },
      {
        unique: true,
        partialFilterExpression: {
          role: 'dean',
          status: 'approved',
          department_id: { $type: 'string' }
        }
      }
    ),
    database.collection('courses').createIndex({ is_active: 1, category: 1, created_at: -1 }),
    database.collection('courses').createIndex({ title: 1 }),
    database.collection('enrollments').createIndex({ user_id: 1, course_id: 1 }, { unique: true }),
    database.collection('enrollments').createIndex({ course_id: 1 }),
    database.collection('progress').createIndex({ enrollment_id: 1 }, { unique: true }),
    database.collection('files').createIndex({ user_id: 1, uploaded_at: -1 }),
    database.collection('announcements').createIndex({ created_at: -1 }),
    database.collection('course_resources').createIndex({ course_id: 1, uploaded_at: -1 }),
    database.collection('departments').createIndex({ name: 1 }, { unique: true }),
    database.collection('departments').createIndex({ dean_user_id: 1 })
  ]);
};

const connectDb = async () => {
  if (db) return db;

  client = new MongoClient(getMongoUri());
  await client.connect();

  db = client.db(resolveDatabaseName());
  await ensureIndexes(db);

  console.log(`Connected to MongoDB database "${db.databaseName}"`);
  return db;
};

const getDb = () => {
  if (!db) {
    throw new Error('MongoDB is not connected. Call connectDb() before accessing collections.');
  }
  return db;
};

const collection = (name) => getDb().collection(name);

const closeDb = async () => {
  if (!client) return;

  await client.close();
  client = undefined;
  db = undefined;
};

module.exports = {
  closeDb,
  collection,
  connectDb,
  ensureIndexes,
  getDb,
};
