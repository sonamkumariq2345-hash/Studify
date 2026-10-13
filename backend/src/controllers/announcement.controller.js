const { v4: uuidv4 } = require('uuid');
const { collection } = require('../db');
const { stripMongoId } = require('../utils/mongo');

// Get all announcements, ordered by newest first
const getAnnouncements = async (req, res) => {
  try {
    const announcements = await collection('announcements').aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'created_by',
          foreignField: 'id',
          as: 'author'
        }
      },
      { $unwind: { path: '$author', preserveNullAndEmptyArrays: true } },
      { $sort: { created_at: -1 } },
      { $limit: 10 },
      {
        $project: {
          _id: 0,
          id: 1,
          title: 1,
          content: 1,
          created_at: 1,
          created_by: 1,
          author_name: { $ifNull: ['$author.name', 'Unknown'] }
        }
      }
    ]).toArray();

    res.json(announcements);
  } catch (error) {
    console.error('getAnnouncements error:', error);
    res.status(500).json({ error: { message: 'Internal server error' } });
  }
};

// Create a new announcement (Admin only)
const createAnnouncement = async (req, res) => {
  const { title, content } = req.body;
  const trimmedTitle = String(title || '').trim();
  const trimmedContent = String(content || '').trim();

  if (!trimmedTitle || !trimmedContent) {
    return res.status(400).json({ error: { message: 'Title and content are required' } });
  }

  try {
    const announcement = {
      id: uuidv4(),
      title: trimmedTitle,
      content: trimmedContent,
      created_by: req.user.id,
      created_at: new Date()
    };

    await collection('announcements').insertOne(announcement);

    res.status(201).json(stripMongoId(announcement));
  } catch (error) {
    console.error('createAnnouncement error:', error);
    res.status(500).json({ error: { message: 'Internal server error' } });
  }
};

module.exports = {
  getAnnouncements,
  createAnnouncement
};
