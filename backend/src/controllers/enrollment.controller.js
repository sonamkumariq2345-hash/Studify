const { v4: uuidv4 } = require('uuid');
const { collection } = require('../db');
const { isDuplicateKeyError } = require('../utils/mongo');

const enrollInCourse = async (req, res) => {
  const { id: courseId } = req.params;
  const userId = req.user.id;

  try {
    // 1. Check if course exists and is active
    const course = await collection('courses').findOne({ id: courseId, is_active: true });
    if (!course) {
      return res.status(404).json({ error: { message: 'Course not found or inactive' } });
    }

    // Optional: capacity check
    if (course.capacity !== null && course.capacity !== undefined) {
      const currentEnrollments = await collection('enrollments').countDocuments({ course_id: courseId });
      if (currentEnrollments >= course.capacity) {
        return res.status(400).json({ error: { message: 'Course is at capacity' } });
      }
    }

    const now = new Date();
    const enrollment = {
      id: uuidv4(),
      user_id: userId,
      course_id: courseId,
      enrolled_at: now
    };

    await collection('enrollments').insertOne(enrollment);

    try {
      await collection('progress').insertOne({
        id: uuidv4(),
        enrollment_id: enrollment.id,
        percent_complete: 0,
        status: 'not_started',
        updated_at: now
      });
    } catch (error) {
      await collection('enrollments').deleteOne({ id: enrollment.id });
      throw error;
    }

    res.status(201).json({ enrollment_id: enrollment.id });
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      return res.status(409).json({ error: { message: 'Already enrolled in this course' } });
    }

    console.error('enrollInCourse error:', error);
    res.status(500).json({ error: { message: 'Internal server error' } });
  }
};

const getMyEnrollments = async (req, res) => {
  const userId = req.user.id;

  try {
    const enrollments = await collection('enrollments').aggregate([
      { $match: { user_id: userId } },
      {
        $lookup: {
          from: 'courses',
          localField: 'course_id',
          foreignField: 'id',
          as: 'course'
        }
      },
      { $unwind: '$course' },
      {
        $lookup: {
          from: 'progress',
          localField: 'id',
          foreignField: 'enrollment_id',
          as: 'progress'
        }
      },
      { $unwind: { path: '$progress', preserveNullAndEmptyArrays: true } },
      { $sort: { enrolled_at: -1 } },
      {
        $project: {
          _id: 0,
          enrollment_id: '$id',
          enrolled_at: 1,
          course_id: 1,
          title: '$course.title',
          description: '$course.description',
          instructor_name: '$course.instructor_name',
          percent_complete: { $ifNull: ['$progress.percent_complete', 0] },
          status: { $ifNull: ['$progress.status', 'not_started'] }
        }
      }
    ]).toArray();

    res.json(enrollments);
  } catch (error) {
    console.error('getMyEnrollments error:', error);
    res.status(500).json({ error: { message: 'Internal server error' } });
  }
};

const getAllEnrollments = async (req, res) => {
  const { course_id, user_id } = req.query;

  try {
    const match = {};
    if (course_id) match.course_id = course_id;
    if (user_id) match.user_id = user_id;

    const enrollments = await collection('enrollments').aggregate([
      { $match: match },
      {
        $lookup: {
          from: 'users',
          localField: 'user_id',
          foreignField: 'id',
          as: 'user'
        }
      },
      { $unwind: '$user' },
      {
        $lookup: {
          from: 'courses',
          localField: 'course_id',
          foreignField: 'id',
          as: 'course'
        }
      },
      { $unwind: '$course' },
      {
        $lookup: {
          from: 'progress',
          localField: 'id',
          foreignField: 'enrollment_id',
          as: 'progress'
        }
      },
      { $unwind: { path: '$progress', preserveNullAndEmptyArrays: true } },
      { $sort: { enrolled_at: -1 } },
      {
        $project: {
          _id: 0,
          enrollment_id: '$id',
          enrolled_at: 1,
          user_id: 1,
          student_name: '$user.name',
          student_email: '$user.email',
          course_id: 1,
          course_title: '$course.title',
          percent_complete: { $ifNull: ['$progress.percent_complete', 0] },
          status: { $ifNull: ['$progress.status', 'not_started'] }
        }
      }
    ]).toArray();

    res.json(enrollments);
  } catch (error) {
    console.error('getAllEnrollments error:', error);
    res.status(500).json({ error: { message: 'Internal server error' } });
  }
};

module.exports = {
  enrollInCourse,
  getMyEnrollments,
  getAllEnrollments
};
