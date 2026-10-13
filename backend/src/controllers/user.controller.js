const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const { collection } = require('../db');
const {
  getUpdatedDocument,
  isDuplicateKeyError,
  normalizeEmail,
  stripMongoId
} = require('../utils/mongo');

const DEAN_CONFLICT_MESSAGE = 'This department already has a Dean. Please remove or reassign the existing Dean before assigning a new Dean.';
const REVIEW_STATUSES = ['approved', 'rejected'];

const normalizeText = (value) => String(value || '').trim();

const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const validatePassword = (password) => (
  typeof password === 'string'
  && password.length >= 8
  && /\d/.test(password)
  && /[a-zA-Z]/.test(password)
);

const normalizeStatus = (user) => user.status || (user.is_active === false ? 'rejected' : 'approved');

const sanitizeUser = (user) => {
  const safeUser = stripMongoId(user);
  delete safeUser.password_hash;
  safeUser.status = normalizeStatus(user);
  return safeUser;
};

const withDepartmentNames = async (users) => {
  const departmentIds = [...new Set(users.map((user) => user.department_id).filter(Boolean))];
  const departments = departmentIds.length
    ? await collection('departments').find({ id: { $in: departmentIds } }).toArray()
    : [];
  const departmentById = new Map(departments.map((department) => [department.id, department]));

  return users.map((user) => ({
    ...sanitizeUser(user),
    department_name: departmentById.get(user.department_id)?.name || user.student_profile?.department_name || user.teacher_profile?.department_name || null
  }));
};

const parseStatusFilter = (status, fallback = undefined) => {
  if (!status && fallback) return fallback;
  if (!status || status === 'all') return undefined;
  return status;
};

const duplicateUserMessage = (error) => {
  const key = error?.keyPattern || {};
  if (key.email) return { status: 409, error: { code: 'DUPLICATE_EMAIL', message: 'An account with this email already exists' } };
  if (key['teacher_profile.employee_id']) return { status: 409, error: { code: 'DUPLICATE_EMPLOYEE_ID', message: 'Teacher/Employee ID must be unique' } };
  if (key.department_id) return { status: 409, error: { code: 'DEPARTMENT_HAS_DEAN', message: DEAN_CONFLICT_MESSAGE } };
  return { status: 409, error: { code: 'DUPLICATE_VALUE', message: 'A matching record already exists' } };
};

const getUsers = async (req, res) => {
  try {
    const { role, status, department_id } = req.query;
    const filter = {};

    if (role) filter.role = role;
    const statusFilter = parseStatusFilter(status);
    if (statusFilter) filter.status = statusFilter;
    if (department_id) filter.department_id = department_id;

    const users = await collection('users')
      .find(filter, { projection: { password_hash: 0 } })
      .sort({ created_at: -1 })
      .toArray();

    res.json(await withDepartmentNames(users));
  } catch (error) {
    console.error('getUsers error:', error);
    res.status(500).json({ error: { message: 'Internal server error' } });
  }
};

const updateUserStatus = async (req, res) => {
  const { id } = req.params;
  const { is_active } = req.body;

  if (typeof is_active !== 'boolean') {
    return res.status(400).json({ error: { message: 'is_active must be true or false' } });
  }

  try {
    const result = await collection('users').findOneAndUpdate(
      { id },
      { $set: { is_active, updated_at: new Date() } },
      {
        returnDocument: 'after',
        projection: { password_hash: 0 }
      }
    );
    const user = getUpdatedDocument(result);

    if (!user) {
      return res.status(404).json({ error: { message: 'User not found' } });
    }

    res.json((await withDepartmentNames([user]))[0]);
  } catch (error) {
    console.error('updateUserStatus error:', error);
    res.status(500).json({ error: { message: 'Internal server error' } });
  }
};

const getAdminStats = async (req, res) => {
  try {
    const [
      totalStudents,
      pendingStudents,
      totalTeachers,
      pendingTeachers,
      totalDeans,
      totalDepartments,
      totalCourses,
      totalEnrollments,
      totalFiles
    ] = await Promise.all([
      collection('users').countDocuments({ role: 'student' }),
      collection('users').countDocuments({ role: 'student', status: 'pending' }),
      collection('users').countDocuments({ role: { $in: ['teacher', 'dean'] } }),
      collection('users').countDocuments({ role: 'teacher', status: 'pending' }),
      collection('users').countDocuments({ role: 'dean', status: 'approved' }),
      collection('departments').countDocuments({ is_active: { $ne: false } }),
      collection('courses').countDocuments(),
      collection('enrollments').countDocuments(),
      collection('files').countDocuments()
    ]);

    res.json({
      total_students: totalStudents,
      pending_students: pendingStudents,
      total_teachers: totalTeachers,
      pending_teachers: pendingTeachers,
      total_deans: totalDeans,
      total_departments: totalDepartments,
      total_courses: totalCourses,
      total_enrollments: totalEnrollments,
      total_files: totalFiles
    });
  } catch (error) {
    console.error('getAdminStats error:', error);
    res.status(500).json({ error: { message: 'Internal server error' } });
  }
};

const getTeacherRequests = async (req, res) => {
  try {
    const status = parseStatusFilter(req.query.status, 'pending');
    const filter = { role: 'teacher' };
    if (status) filter.status = status;

    const teachers = await collection('users')
      .find(filter, { projection: { password_hash: 0 } })
      .sort({ created_at: -1 })
      .toArray();

    res.json(await withDepartmentNames(teachers));
  } catch (error) {
    console.error('getTeacherRequests error:', error);
    res.status(500).json({ error: { message: 'Internal server error' } });
  }
};

const getStudentRequests = async (req, res) => {
  try {
    const status = parseStatusFilter(req.query.status, 'pending');
    const filter = { role: 'student' };
    if (status) filter.status = status;
    if (req.query.department_id) filter.department_id = req.query.department_id;

    const students = await collection('users')
      .find(filter, { projection: { password_hash: 0 } })
      .sort({ created_at: -1 })
      .toArray();

    res.json(await withDepartmentNames(students));
  } catch (error) {
    console.error('getStudentRequests error:', error);
    res.status(500).json({ error: { message: 'Internal server error' } });
  }
};

const reviewTeacherRegistration = async (req, res) => {
  const { id } = req.params;
  const status = normalizeText(req.body.status).toLowerCase();

  if (!REVIEW_STATUSES.includes(status)) {
    return res.status(400).json({ error: { message: 'Status must be approved or rejected' } });
  }

  try {
    const result = await collection('users').findOneAndUpdate(
      { id, role: 'teacher' },
      {
        $set: {
          status,
          reviewed_by: req.user.id,
          reviewed_at: new Date(),
          updated_at: new Date()
        }
      },
      {
        returnDocument: 'after',
        projection: { password_hash: 0 }
      }
    );
    const teacher = getUpdatedDocument(result);

    if (!teacher) {
      return res.status(404).json({ error: { message: 'Teacher request not found' } });
    }

    res.json((await withDepartmentNames([teacher]))[0]);
  } catch (error) {
    console.error('reviewTeacherRegistration error:', error);
    res.status(500).json({ error: { message: 'Internal server error' } });
  }
};

const reviewStudentRegistration = async (req, res) => {
  const { id } = req.params;
  const status = normalizeText(req.body.status).toLowerCase();

  if (!REVIEW_STATUSES.includes(status)) {
    return res.status(400).json({ error: { message: 'Status must be approved or rejected' } });
  }

  try {
    const result = await collection('users').findOneAndUpdate(
      { id, role: 'student' },
      {
        $set: {
          status,
          reviewed_by: req.user.id,
          reviewed_at: new Date(),
          updated_at: new Date()
        }
      },
      {
        returnDocument: 'after',
        projection: { password_hash: 0 }
      }
    );
    const student = getUpdatedDocument(result);

    if (!student) {
      return res.status(404).json({ error: { message: 'Student request not found' } });
    }

    res.json((await withDepartmentNames([student]))[0]);
  } catch (error) {
    console.error('reviewStudentRegistration error:', error);
    res.status(500).json({ error: { message: 'Internal server error' } });
  }
};

const getDepartments = async (req, res) => {
  try {
    const departments = await collection('departments')
      .aggregate([
        { $match: {} },
        {
          $lookup: {
            from: 'users',
            localField: 'dean_user_id',
            foreignField: 'id',
            as: 'dean'
          }
        },
        { $unwind: { path: '$dean', preserveNullAndEmptyArrays: true } },
        { $sort: { name: 1 } },
        {
          $project: {
            _id: 0,
            id: 1,
            name: 1,
            code: 1,
            description: 1,
            is_active: 1,
            dean_user_id: 1,
            dean_name: '$dean.name',
            created_at: 1,
            updated_at: 1
          }
        }
      ])
      .toArray();

    res.json(departments);
  } catch (error) {
    console.error('getDepartments error:', error);
    res.status(500).json({ error: { message: 'Internal server error' } });
  }
};

const createDepartment = async (req, res) => {
  const name = normalizeText(req.body.name);
  const code = normalizeText(req.body.code).toUpperCase();
  const description = normalizeText(req.body.description);

  if (!name) {
    return res.status(400).json({ error: { message: 'Department name is required' } });
  }

  try {
    const now = new Date();
    const department = {
      id: uuidv4(),
      name,
      code: code || null,
      description: description || null,
      dean_user_id: null,
      is_active: true,
      created_at: now,
      updated_at: now
    };

    await collection('departments').insertOne(department);

    res.status(201).json(stripMongoId(department));
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      return res.status(409).json({ error: { message: 'Department name must be unique' } });
    }

    console.error('createDepartment error:', error);
    res.status(500).json({ error: { message: 'Internal server error' } });
  }
};

const updateDepartment = async (req, res) => {
  const { id } = req.params;
  const updates = {};

  if (req.body.name !== undefined) updates.name = normalizeText(req.body.name);
  if (req.body.code !== undefined) updates.code = normalizeText(req.body.code).toUpperCase() || null;
  if (req.body.description !== undefined) updates.description = normalizeText(req.body.description) || null;
  if (typeof req.body.is_active === 'boolean') updates.is_active = req.body.is_active;

  if (updates.name === '') {
    return res.status(400).json({ error: { message: 'Department name is required' } });
  }

  try {
    const result = await collection('departments').findOneAndUpdate(
      { id },
      { $set: { ...updates, updated_at: new Date() } },
      { returnDocument: 'after' }
    );
    const department = getUpdatedDocument(result);

    if (!department) {
      return res.status(404).json({ error: { message: 'Department not found' } });
    }

    res.json(stripMongoId(department));
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      return res.status(409).json({ error: { message: 'Department name must be unique' } });
    }

    console.error('updateDepartment error:', error);
    res.status(500).json({ error: { message: 'Internal server error' } });
  }
};

const getDeans = async (req, res) => {
  try {
    const deans = await collection('users')
      .find({ role: 'dean' }, { projection: { password_hash: 0 } })
      .sort({ name: 1 })
      .toArray();

    res.json(await withDepartmentNames(deans));
  } catch (error) {
    console.error('getDeans error:', error);
    res.status(500).json({ error: { message: 'Internal server error' } });
  }
};

const getApprovedTeachers = async (req, res) => {
  try {
    const filter = { role: 'teacher', status: 'approved', is_active: { $ne: false } };
    if (req.query.department_id) filter.department_id = req.query.department_id;

    const teachers = await collection('users')
      .find(filter, { projection: { password_hash: 0 } })
      .sort({ name: 1 })
      .toArray();

    res.json(await withDepartmentNames(teachers));
  } catch (error) {
    console.error('getApprovedTeachers error:', error);
    res.status(500).json({ error: { message: 'Internal server error' } });
  }
};

const registerDean = async (req, res) => {
  const name = normalizeText(req.body.name);
  const email = normalizeEmail(req.body.email);
  const password = req.body.password;
  const confirmPassword = req.body.confirm_password ?? req.body.confirmPassword;
  const departmentId = normalizeText(req.body.department_id || req.body.departmentId);
  const employeeId = normalizeText(req.body.employee_id || req.body.employeeId).toUpperCase();

  if (!name || !email || !password || !departmentId || !employeeId) {
    return res.status(400).json({ error: { message: 'Name, email, password, employee ID, and department are required' } });
  }

  if (!validateEmail(email)) {
    return res.status(400).json({ error: { message: 'Email must be valid' } });
  }

  if (!validatePassword(password)) {
    return res.status(400).json({ error: { message: 'Password must be at least 8 characters long and contain both letters and numbers' } });
  }

  if (confirmPassword !== undefined && confirmPassword !== password) {
    return res.status(400).json({ error: { message: 'Password and Confirm Password must match' } });
  }

  try {
    const [department, existingDean] = await Promise.all([
      collection('departments').findOne({ id: departmentId, is_active: { $ne: false } }),
      collection('users').findOne({ role: 'dean', status: 'approved', department_id: departmentId }, { projection: { id: 1, name: 1 } })
    ]);

    if (!department) {
      return res.status(404).json({ error: { message: 'Department not found' } });
    }

    if (existingDean || department.dean_user_id) {
      return res.status(409).json({ error: { code: 'DEPARTMENT_HAS_DEAN', message: DEAN_CONFLICT_MESSAGE } });
    }

    const now = new Date();
    const dean = {
      id: uuidv4(),
      name,
      email,
      password_hash: await bcrypt.hash(password, 10),
      role: 'dean',
      status: 'approved',
      department_id: departmentId,
      is_active: true,
      teacher_profile: {
        phone_number: normalizeText(req.body.phone_number),
        employee_id: employeeId,
        department_name: department.name,
        qualification: normalizeText(req.body.qualification),
        date_of_birth: normalizeText(req.body.date_of_birth),
        address: normalizeText(req.body.address),
        professional_info: normalizeText(req.body.professional_info || req.body.professionalInformation)
      },
      dean_assigned_by: req.user.id,
      dean_assigned_at: now,
      created_by: req.user.id,
      created_at: now,
      updated_at: now
    };

    await collection('users').insertOne(dean);

    const departmentResult = await collection('departments').findOneAndUpdate(
      {
        id: departmentId,
        $or: [
          { dean_user_id: null },
          { dean_user_id: { $exists: false } }
        ]
      },
      {
        $set: {
          dean_user_id: dean.id,
          dean_assigned_at: now,
          updated_at: now
        }
      },
      { returnDocument: 'after' }
    );

    if (!getUpdatedDocument(departmentResult)) {
      await collection('users').deleteOne({ id: dean.id });
      return res.status(409).json({ error: { code: 'DEPARTMENT_HAS_DEAN', message: DEAN_CONFLICT_MESSAGE } });
    }

    res.status(201).json((await withDepartmentNames([dean]))[0]);
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      const duplicate = duplicateUserMessage(error);
      return res.status(duplicate.status).json({ error: duplicate.error });
    }

    console.error('registerDean error:', error);
    res.status(500).json({ error: { message: 'Internal server error' } });
  }
};

const assignDean = async (req, res) => {
  const teacherId = normalizeText(req.body.teacher_id || req.body.teacherId);
  const departmentId = normalizeText(req.body.department_id || req.body.departmentId);

  if (!teacherId || !departmentId) {
    return res.status(400).json({ error: { message: 'Teacher and department are required' } });
  }

  try {
    const [department, existingDean] = await Promise.all([
      collection('departments').findOne({ id: departmentId, is_active: { $ne: false } }),
      collection('users').findOne({ role: 'dean', status: 'approved', department_id: departmentId }, { projection: { id: 1, name: 1 } })
    ]);

    if (!department) {
      return res.status(404).json({ error: { message: 'Department not found' } });
    }

    if (existingDean && existingDean.id !== teacherId) {
      return res.status(409).json({ error: { code: 'DEPARTMENT_HAS_DEAN', message: DEAN_CONFLICT_MESSAGE } });
    }

    if (department.dean_user_id && department.dean_user_id !== teacherId) {
      return res.status(409).json({ error: { code: 'DEPARTMENT_HAS_DEAN', message: DEAN_CONFLICT_MESSAGE } });
    }

    const now = new Date();
    const teacherResult = await collection('users').findOneAndUpdate(
      { id: teacherId, role: 'teacher', status: 'approved', is_active: { $ne: false } },
      {
        $set: {
          role: 'dean',
          department_id: departmentId,
          'teacher_profile.department_name': department.name,
          dean_assigned_by: req.user.id,
          dean_assigned_at: now,
          updated_at: now
        }
      },
      {
        returnDocument: 'after',
        projection: { password_hash: 0 }
      }
    );
    const dean = getUpdatedDocument(teacherResult);

    if (!dean) {
      return res.status(404).json({ error: { message: 'Approved teacher not found' } });
    }

    const departmentResult = await collection('departments').findOneAndUpdate(
      {
        id: departmentId,
        $or: [
          { dean_user_id: null },
          { dean_user_id: { $exists: false } },
          { dean_user_id: teacherId }
        ]
      },
      {
        $set: {
          dean_user_id: teacherId,
          dean_assigned_at: now,
          updated_at: now
        }
      },
      { returnDocument: 'after' }
    );

    if (!getUpdatedDocument(departmentResult)) {
      await collection('users').updateOne(
        { id: teacherId, role: 'dean' },
        { $set: { role: 'teacher', updated_at: new Date() }, $unset: { dean_assigned_by: '', dean_assigned_at: '' } }
      );
      return res.status(409).json({ error: { code: 'DEPARTMENT_HAS_DEAN', message: DEAN_CONFLICT_MESSAGE } });
    }

    res.json((await withDepartmentNames([dean]))[0]);
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      return res.status(409).json({ error: { code: 'DEPARTMENT_HAS_DEAN', message: DEAN_CONFLICT_MESSAGE } });
    }

    console.error('assignDean error:', error);
    res.status(500).json({ error: { message: 'Internal server error' } });
  }
};

const removeDean = async (req, res) => {
  const { id } = req.params;

  try {
    const existingDean = await collection('users').findOne({ id, role: 'dean' });
    if (!existingDean) {
      return res.status(404).json({ error: { message: 'Dean not found' } });
    }

    const result = await collection('users').findOneAndUpdate(
      { id, role: 'dean' },
      {
        $set: {
          role: 'teacher',
          updated_at: new Date()
        },
        $unset: {
          dean_assigned_by: '',
          dean_assigned_at: ''
        }
      },
      {
        returnDocument: 'after',
        projection: { password_hash: 0 }
      }
    );

    await collection('departments').updateOne(
      { id: existingDean.department_id, dean_user_id: id },
      {
        $set: { updated_at: new Date() },
        $unset: { dean_user_id: '', dean_assigned_at: '' }
      }
    );

    res.json((await withDepartmentNames([getUpdatedDocument(result)]))[0]);
  } catch (error) {
    console.error('removeDean error:', error);
    res.status(500).json({ error: { message: 'Internal server error' } });
  }
};

module.exports = {
  assignDean,
  createDepartment,
  getAdminStats,
  getApprovedTeachers,
  getDeans,
  getDepartments,
  getStudentRequests,
  getTeacherRequests,
  getUsers,
  registerDean,
  removeDean,
  reviewStudentRegistration,
  reviewTeacherRegistration,
  updateDepartment,
  updateUserStatus
};
