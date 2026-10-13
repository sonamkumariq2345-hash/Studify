const { v4: uuidv4 } = require('uuid');
const { collection } = require('../db');
const { getUpdatedDocument, stripMongoId } = require('../utils/mongo');

const getMyProgress = async (req, res) => {
  const userId = req.user.id;

  try {
    const progress = await collection('enrollments').aggregate([
      { $match: { user_id: userId } },
      {
        $lookup: {
          from: 'progress',
          localField: 'id',
          foreignField: 'enrollment_id',
          as: 'progress'
        }
      },
      { $unwind: { path: '$progress', preserveNullAndEmptyArrays: true } },
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
        $project: {
          _id: 0,
          progress_id: '$progress.id',
          percent_complete: { $ifNull: ['$progress.percent_complete', 0] },
          status: { $ifNull: ['$progress.status', 'not_started'] },
          updated_at: '$progress.updated_at',
          course_id: 1,
          course_title: '$course.title'
        }
      }
    ]).toArray();

    res.json(progress);
  } catch (error) {
    console.error('getMyProgress error:', error);
    res.status(500).json({ error: { message: 'Internal server error' } });
  }
};

const updateProgress = async (req, res) => {
  const { courseId } = req.params;
  const { percent_complete } = req.body;
  const userId = req.user.id;
  const percentComplete = Number(percent_complete);

  if (!Number.isInteger(percentComplete) || percentComplete < 0 || percentComplete > 100) {
    return res.status(400).json({ error: { message: 'percent_complete must be a whole number between 0 and 100' } });
  }

  try {
    // Determine the enrollment id for this user and course
    const enrollment = await collection('enrollments').findOne({ user_id: userId, course_id: courseId });

    if (!enrollment) {
      return res.status(404).json({ error: { message: 'Enrollment not found' } });
    }

    let status = 'in_progress';
    if (percentComplete === 0) status = 'not_started';
    if (percentComplete === 100) status = 'completed';

    const result = await collection('progress').findOneAndUpdate(
      { enrollment_id: enrollment.id },
      {
        $set: {
          percent_complete: percentComplete,
          status,
          updated_at: new Date()
        },
        $setOnInsert: {
          id: uuidv4(),
          enrollment_id: enrollment.id
        }
      },
      {
        returnDocument: 'after',
        upsert: true
      }
    );

    res.json(stripMongoId(getUpdatedDocument(result)));
  } catch (error) {
    console.error('updateProgress error:', error);
    res.status(500).json({ error: { message: 'Internal server error' } });
  }
};

module.exports = {
  getMyProgress,
  updateProgress
};
