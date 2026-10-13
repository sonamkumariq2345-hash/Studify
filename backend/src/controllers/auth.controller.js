const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { collection } = require('../db');
const { isDuplicateKeyError, normalizeEmail, stripMongoId } = require('../utils/mongo');

const ALLOWED_PUBLIC_ROLES = ['student', 'teacher'];

const normalizeText = (value) => String(value || '').trim();

const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const validatePassword = (password) => (
  typeof password === 'string'
  && password.length >= 8
  && /\d/.test(password)
  && /[a-zA-Z]/.test(password)
);

const sanitizeUser = (user) => {
  const safeUser = stripMongoId(user);
  delete safeUser.password_hash;
  if (!safeUser.status) safeUser.status = safeUser.is_active === false ? 'rejected' : 'approved';
  return safeUser;
};

const resolveDepartment = async (departmentId) => {
  const id = normalizeText(departmentId);
  if (!id) return null;

  return collection('departments').findOne({ id, is_active: { $ne: false } });
};

const duplicateRegistrationMessage = (error) => {
  const key = error?.keyPattern || {};
  if (key.email) return { code: 'DUPLICATE_EMAIL', message: 'An account with this email already exists' };
  if (key['student_profile.roll_number']) return { code: 'DUPLICATE_ROLL_NUMBER', message: 'Roll Number must be unique' };
  if (key['student_profile.registration_number']) return { code: 'DUPLICATE_REGISTRATION_NUMBER', message: 'Registration/Admission Number must be unique' };
  if (key['teacher_profile.employee_id']) return { code: 'DUPLICATE_EMPLOYEE_ID', message: 'Teacher/Employee ID must be unique' };
  return { code: 'DUPLICATE_VALUE', message: 'A matching record already exists' };
};

const getDepartments = async (req, res) => {
  try {
    const departments = await collection('departments')
      .find({ is_active: { $ne: false } }, { projection: { _id: 0 } })
      .sort({ name: 1 })
      .toArray();

    res.json(departments);
  } catch (error) {
    console.error('getDepartments error:', error);
    res.status(500).json({ error: { message: 'Internal server error' } });
  }
};

const register = async (req, res) => {
  const requestedRole = normalizeText(req.body.role || 'student').toLowerCase();
  if (!ALLOWED_PUBLIC_ROLES.includes(requestedRole)) {
    return res.status(403).json({ error: { message: 'Public registration is only available for students and teachers' } });
  }

  const trimmedName = normalizeText(req.body.name || req.body.full_name);
  const normalizedEmail = normalizeEmail(req.body.email);
  const { password } = req.body;

  if (!trimmedName || !normalizedEmail || typeof password !== 'string') {
    return res.status(400).json({ error: { message: 'Name, email, and password are required' } });
  }

  if (!validateEmail(normalizedEmail)) {
    return res.status(400).json({ error: { message: 'Email must be valid' } });
  }

  if (!validatePassword(password)) {
    return res.status(400).json({ error: { message: 'Password must be at least 8 characters long and contain both letters and numbers' } });
  }

  if (req.body.confirm_password !== undefined && req.body.confirm_password !== password) {
    return res.status(400).json({ error: { message: 'Password and Confirm Password must match' } });
  }

  try {
    const users = collection('users');

    // Check if user already exists
    const existingUser = await users.findOne({ email: normalizedEmail }, { projection: { id: 1 } });
    if (existingUser) {
      return res.status(409).json({ error: { code: 'DUPLICATE_EMAIL', message: 'An account with this email already exists' } });
    }

    const department = await resolveDepartment(req.body.department_id || req.body.departmentId);
    if (!department) {
      return res.status(400).json({ error: { message: 'A valid department is required' } });
    }

    const requiredStudentFields = {
      date_of_birth: req.body.date_of_birth,
      gender: req.body.gender,
      father_name: req.body.father_name,
      mother_name: req.body.mother_name,
      guardian_name: req.body.guardian_name,
      phone_number: req.body.phone_number,
      address: req.body.address,
      roll_number: req.body.roll_number,
      registration_number: req.body.registration_number,
      session: req.body.session,
      course_program: req.body.course_program,
      semester: req.body.semester,
      enrollment_year: req.body.enrollment_year
    };
    const requiredTeacherFields = {
      phone_number: req.body.phone_number,
      employee_id: req.body.employee_id,
      qualification: req.body.qualification,
      date_of_birth: req.body.date_of_birth,
      address: req.body.address
    };

    const requiredFields = requestedRole === 'student' ? requiredStudentFields : requiredTeacherFields;
    const missingField = Object.entries(requiredFields).find(([, value]) => !normalizeText(value));
    if (missingField) {
      return res.status(400).json({ error: { message: 'Required fields cannot be empty' } });
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    const now = new Date();

    const newUser = {
      id: uuidv4(),
      name: trimmedName,
      email: normalizedEmail,
      password_hash: passwordHash,
      role: requestedRole,
      status: 'pending',
      department_id: department.id,
      is_active: true,
      created_at: now,
      updated_at: now
    };

    if (requestedRole === 'student') {
      newUser.student_profile = {
        date_of_birth: normalizeText(req.body.date_of_birth),
        gender: normalizeText(req.body.gender),
        father_name: normalizeText(req.body.father_name),
        mother_name: normalizeText(req.body.mother_name),
        guardian_name: normalizeText(req.body.guardian_name),
        phone_number: normalizeText(req.body.phone_number),
        address: normalizeText(req.body.address),
        roll_number: normalizeText(req.body.roll_number).toUpperCase(),
        registration_number: normalizeText(req.body.registration_number).toUpperCase(),
        session: normalizeText(req.body.session),
        course_program: normalizeText(req.body.course_program),
        department_name: department.name,
        semester: normalizeText(req.body.semester),
        enrollment_year: normalizeText(req.body.enrollment_year)
      };
    } else {
      newUser.teacher_profile = {
        phone_number: normalizeText(req.body.phone_number),
        employee_id: normalizeText(req.body.employee_id).toUpperCase(),
        department_name: department.name,
        qualification: normalizeText(req.body.qualification),
        date_of_birth: normalizeText(req.body.date_of_birth),
        address: normalizeText(req.body.address),
        professional_info: normalizeText(req.body.professional_info || req.body.professionalInformation)
      };
    }

    await users.insertOne(newUser);

    const safeUser = sanitizeUser(newUser);
    const message = requestedRole === 'student'
      ? 'Registration submitted successfully. Your account is currently pending approval from the authorized department authority. You will be able to access the Student Dashboard after approval.'
      : 'Registration submitted successfully. Your account is currently pending approval from an administrator. You will be able to access the Teacher Dashboard after approval.';

    res.status(201).json({ message, user: safeUser });
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      return res.status(409).json({ error: duplicateRegistrationMessage(error) });
    }

    console.error('Register error:', error);
    res.status(500).json({ error: { message: 'Internal server error' } });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: { message: 'Email and password are required' } });
  }

  try {
    const user = await collection('users').findOne({ email: normalizeEmail(email) });

    if (!user || !user.is_active) {
      return res.status(401).json({ error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' } });
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' } });
    }

    const accountStatus = user.status || (user.is_active === false ? 'rejected' : 'approved');
    if (accountStatus === 'pending') {
      return res.status(403).json({ error: { code: 'ACCOUNT_PENDING', message: 'Your account is still pending approval.' } });
    }

    if (accountStatus === 'rejected') {
      return res.status(403).json({ error: { code: 'ACCOUNT_REJECTED', message: 'Your registration has been rejected. Please contact the administrator/department authority.' } });
    }

    const payload = {
      id: user.id,
      role: user.role,
      status: accountStatus,
      department_id: user.department_id || null,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '24h' });

    const safeUser = sanitizeUser(user);

    res.json({ token, user: safeUser });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: { message: 'Internal server error' } });
  }
};

const logout = (req, res) => {
  // Since we use stateless JWTs, the client discards the token.
  // We can just return a 200 OK.
  res.json({ message: 'Logged out successfully' });
};

module.exports = {
  getDepartments,
  register,
  login,
  logout,
};
