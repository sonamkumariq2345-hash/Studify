const bcrypt = require('bcrypt');
const { closeDb, collection, connectDb } = require('./src/db');

const ADMIN_EMAIL = 'admin@edutrack.edu';
const ADMIN_PASSWORD = 'admin123';

const seededDepartments = [
  { id: 'dept-cse', name: 'Computer Science & Engineering', code: 'CSE' },
  { id: 'dept-me', name: 'Mechanical Engineering', code: 'ME' },
  { id: 'dept-ce', name: 'Civil Engineering', code: 'CE' },
  { id: 'dept-ee', name: 'Electrical Engineering', code: 'EE' },
  { id: 'dept-math', name: 'Mathematics', code: 'MATH' },
  { id: 'dept-humanities', name: 'Humanities', code: 'HUM' },
  { id: 'dept-business', name: 'Business', code: 'BUS' },
  { id: 'dept-ds', name: 'Data Science', code: 'DS' }
];

const seededCourses = [
  {
    id: 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
    title: 'Introduction to Computer Science',
    description: 'Learn the basics of programming and algorithms.',
    category: 'Computer Science',
    instructor_name: 'Dr. Alan Turing',
    capacity: 100
  },
  {
    id: 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33',
    title: 'Calculus I',
    description: 'Limits, derivatives, and integrals.',
    category: 'Mathematics',
    instructor_name: 'Prof. Isaac Newton',
    capacity: 50
  },
  {
    id: 'd3eebc99-9c0b-4ef8-bb6d-6bb9bd380a44',
    title: 'World History 101',
    description: 'A survey of global history from ancient times to the present.',
    category: 'History',
    instructor_name: 'Dr. Herodotus',
    capacity: 200
  },
  {
    id: 'e4eebc99-9c0b-4ef8-bb6d-6bb9bd380a55',
    title: 'Advanced Algorithms',
    description: 'Deep dive into graph algorithms, dynamic programming, and complexity theory.',
    category: 'Computer Science',
    instructor_name: 'Dr. Smith',
    capacity: 50
  },
  {
    id: 'f5eebc99-9c0b-4ef8-bb6d-6bb9bd380a66',
    title: 'Introduction to Philosophy',
    description: 'Exploring meaning, existence, and the fundamental nature of knowledge.',
    category: 'Humanities',
    instructor_name: 'Prof. Davis',
    capacity: null
  },
  {
    id: 'a6eebc99-9c0b-4ef8-bb6d-6bb9bd380a77',
    title: 'Data Science 101',
    description: 'Learn Python, pandas, and basic machine learning concepts for data analysis.',
    category: 'Data Science',
    instructor_name: 'Dr. Lee',
    capacity: 100
  },
  {
    id: 'a7eebc99-9c0b-4ef8-bb6d-6bb9bd380a88',
    title: 'Digital Marketing Strategies',
    description: 'Modern marketing in the digital age: SEO, SEM, and social media analytics.',
    category: 'Business',
    instructor_name: 'Prof. Miller',
    capacity: 75
  }
];

const seedAdmin = async () => {
  const users = collection('users');
  const existingAdmin = await users.findOne({ email: ADMIN_EMAIL });

  if (existingAdmin) {
    await users.updateOne(
      { id: existingAdmin.id },
      {
        $set: {
          role: 'admin',
          status: 'approved',
          is_active: true,
          updated_at: new Date()
        }
      }
    );
    return existingAdmin;
  }

  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
  const now = new Date();
  const admin = {
    id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    name: 'System Administrator',
    email: ADMIN_EMAIL,
    password_hash: passwordHash,
    role: 'admin',
    status: 'approved',
    is_active: true,
    created_at: now,
    updated_at: now
  };

  await users.insertOne(admin);
  return admin;
};

const seedDepartments = async () => {
  const departments = collection('departments');

  for (const department of seededDepartments) {
    const now = new Date();

    await departments.updateOne(
      { id: department.id },
      {
        $setOnInsert: {
          ...department,
          description: null,
          dean_user_id: null,
          is_active: true,
          created_at: now,
          updated_at: now
        }
      },
      { upsert: true }
    );
  }
};

const seedCourses = async (adminId) => {
  const courses = collection('courses');

  for (const course of seededCourses) {
    const now = new Date();

    await courses.updateOne(
      { id: course.id },
      {
        $setOnInsert: {
          ...course,
          created_by: adminId,
          is_active: true,
          created_at: now,
          updated_at: now
        }
      },
      { upsert: true }
    );
  }
};

const initDB = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await connectDb();

    const admin = await seedAdmin();
    await seedDepartments();
    await seedCourses(admin.id);

    console.log('MongoDB initialization complete.');
    console.log(`Admin login: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
  } catch (error) {
    console.error('Error initializing MongoDB:', error.message);
    process.exitCode = 1;
  } finally {
    await closeDb();
  }
};

if (require.main === module) {
  initDB();
}

module.exports = {
  initDB
};
