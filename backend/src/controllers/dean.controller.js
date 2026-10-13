const { collection } = require('../db');
const { getUpdatedDocument, stripMongoId } = require('../utils/mongo');

const REVIEW_STATUSES = ['approved', 'rejected'];

const normalizeText = (value) => String(value || '').trim();

const sanitizeUser = (user) => {
  const safeUser = stripMongoId(user);
  delete safeUser.password_hash;
  if (!safeUser.status) safeUser.status = safeUser.is_active === false ? 'rejected' : 'approved';
  return safeUser;
};

const requireDeanDepartment = (req, res) => {
  if (!req.user?.department_id) {
    res.status(403).json({ error: { code: 'DEAN_DEPARTMENT_REQUIRED', message: 'Dean department assignment is required' } });
    return null;
  }

  return req.user.department_id;
};

const addDepartmentName = async (users, departmentId) => {
  const department = await collection('departments').findOne({ id: departmentId });

  return users.map((user) => ({
    ...sanitizeUser(user),
    department_name: department?.name || user.student_profile?.department_name || user.teacher_profile?.department_name || null
  }));
};

const getDashboard = async (req, res) => {
  const departmentId = requireDeanDepartment(req, res);
  if (!departmentId) return;

  try {
    const [department, approvedStudents, pendingStudents, rejectedStudents, teachers] = await Promise.all([
      collection('departments').findOne({ id: departmentId }),
      collection('users').countDocuments({ role: 'student', status: 'approved', department_id: departmentId }),
      collection('users').countDocuments({ role: 'student', status: 'pending', department_id: departmentId }),
      collection('users').countDocuments({ role: 'student', status: 'rejected', department_id: departmentId }),
      collection('users').countDocuments({ role: { $in: ['teacher', 'dean'] }, status: 'approved', department_id: departmentId })
    ]);

    res.json({
      department: department ? stripMongoId(department) : null,
      counts: {
        approved_students: approvedStudents,
        pending_students: pendingStudents,
        rejected_students: rejectedStudents,
        teachers
      }
    });
  } catch (error) {
    console.error('getDeanDashboard error:', error);
    res.status(500).json({ error: { message: 'Internal server error' } });
  }
};

const getDepartment = async (req, res) => {
  const departmentId = requireDeanDepartment(req, res);
  if (!departmentId) return;

  try {
    const department = await collection('departments').findOne({ id: departmentId });
    if (!department) {
      return res.status(404).json({ error: { message: 'Department not found' } });
    }

    res.json(stripMongoId(department));
  } catch (error) {
    console.error('getDeanDepartment error:', error);
    res.status(500).json({ error: { message: 'Internal server error' } });
  }
};

const getStudents = async (req, res) => {
  const departmentId = requireDeanDepartment(req, res);
  if (!departmentId) return;

  try {
    const filter = { role: 'student', department_id: departmentId };
    if (req.query.status && req.query.status !== 'all') filter.status = req.query.status;

    const students = await collection('users')
      .find(filter, { projection: { password_hash: 0 } })
      .sort({ created_at: -1 })
      .toArray();

    res.json(await addDepartmentName(students, departmentId));
  } catch (error) {
    console.error('getDeanStudents error:', error);
    res.status(500).json({ error: { message: 'Internal server error' } });
  }
};

const getStudentRequests = async (req, res) => {
  const departmentId = requireDeanDepartment(req, res);
  if (!departmentId) return;

  try {
    const filter = { role: 'student', department_id: departmentId };
    const status = req.query.status || 'pending';
    if (status !== 'all') filter.status = status;

    const students = await collection('users')
      .find(filter, { projection: { password_hash: 0 } })
      .sort({ created_at: -1 })
      .toArray();

    res.json(await addDepartmentName(students, departmentId));
  } catch (error) {
    console.error('getDeanStudentRequests error:', error);
    res.status(500).json({ error: { message: 'Internal server error' } });
  }
};

const reviewStudentRegistration = async (req, res) => {
  const departmentId = requireDeanDepartment(req, res);
  if (!departmentId) return;

  const status = normalizeText(req.body.status).toLowerCase();
  if (!REVIEW_STATUSES.includes(status)) {
    return res.status(400).json({ error: { message: 'Status must be approved or rejected' } });
  }

  try {
    const result = await collection('users').findOneAndUpdate(
      { id: req.params.id, role: 'student', department_id: departmentId },
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
      return res.status(404).json({ error: { message: 'Student request not found in your department' } });
    }

    res.json((await addDepartmentName([student], departmentId))[0]);
  } catch (error) {
    console.error('reviewDeanStudentRegistration error:', error);
    res.status(500).json({ error: { message: 'Internal server error' } });
  }
};

const getTeachers = async (req, res) => {
  const departmentId = requireDeanDepartment(req, res);
  if (!departmentId) return;

  try {
    const teachers = await collection('users')
      .find(
        {
          role: { $in: ['teacher', 'dean'] },
          status: 'approved',
          department_id: departmentId,
          is_active: { $ne: false }
        },
        { projection: { password_hash: 0 } }
      )
      .sort({ role: 1, name: 1 })
      .toArray();

    res.json(await addDepartmentName(teachers, departmentId));
  } catch (error) {
    console.error('getDeanTeachers error:', error);
    res.status(500).json({ error: { message: 'Internal server error' } });
  }
};

const getReports = async (req, res) => {
  const departmentId = requireDeanDepartment(req, res);
  if (!departmentId) return;

  try {
    const [studentsByStatus, teachers] = await Promise.all([
      collection('users').aggregate([
        { $match: { role: 'student', department_id: departmentId } },
        { $group: { _id: '$status', total: { $sum: 1 } } }
      ]).toArray(),
      collection('users').countDocuments({ role: { $in: ['teacher', 'dean'] }, status: 'approved', department_id: departmentId })
    ]);

    res.json({
      students_by_status: studentsByStatus.reduce((acc, item) => {
        acc[item._id || 'approved'] = item.total;
        return acc;
      }, {}),
      approved_teachers: teachers
    });
  } catch (error) {
    console.error('getDeanReports error:', error);
    res.status(500).json({ error: { message: 'Internal server error' } });
  }
};

module.exports = {
  getDashboard,
  getDepartment,
  getReports,
  getStudentRequests,
  getStudents,
  getTeachers,
  reviewStudentRegistration
};
