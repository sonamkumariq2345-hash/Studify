const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const { collection } = require('../db');
const { stripMongoId, stripMongoIds } = require('../utils/mongo');

const uploadFile = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: { message: 'No file uploaded' } });
  }

  const file = req.file;
  const userId = req.user.id;

  // Validate file type
  const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/png', 'image/jpeg'];
  if (!allowedTypes.includes(file.mimetype)) {
    if (file.path && fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
  }
    return res.status(400).json({ error: { message: 'Unsupported file type. Allowed: PDF, DOCX, PNG, JPG' } });
  }

  // Validate size (5MB max)
  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    if (file.path && fs.existsSync(file.path)) {
      fs.unlinkSync(file.path);
    }
    return res.status(400).json({ error: { message: 'File exceeds the 5MB limit' } });
  }

   try {
    const fileRecord = {
      id: uuidv4(),
      user_id: userId,
      original_name: file.originalname,
      storage_path: path.relative(
        path.join(__dirname, '../../'),
        file.path
      ).replace(/\\/g, '/'),
      filename: file.filename,
      mime_type: file.mimetype,
      size_bytes: file.size,
      uploaded_at: new Date()
    };

    await collection('files').insertOne(fileRecord);

    res.status(201).json(stripMongoId(fileRecord));
  } catch (error) {
    console.error('uploadFile error:', error);
    if (file.path && fs.existsSync(file.path)) {
      try {
      fs.unlinkSync(file.path);
    } catch (deleteError) {
      console.error('Error deleting file after upload failure:', deleteError);
    }
  }
  
    res.status(500).json({ error: { message: 'Internal server error' } });
  }
};

const getFiles = async (req, res) => {
  const { user_id } = req.query;

  try {
    const filter = {};

    // Admin can query any user's files
    if (req.user.role === 'admin') {
      if (user_id) filter.user_id = user_id;
    } else {
      filter.user_id = req.user.id;
    }

    const files = await collection('files')
      .find(filter)
      .sort({ uploaded_at: -1 })
      .toArray();

    // Attach signed URLs for download
    const filesWithUrls = stripMongoIds(files).map((file) => {
      return {
        ...file,
        download_url: `/${file.storage_path}`
      };
    });

    res.json(filesWithUrls);
  } catch (error) {
    console.error('getFiles error:', error);
    res.status(500).json({ error: { message: 'Internal server error' } });
  }
};

const deleteFile = async (req, res) => {
  const { id } = req.params;
  

  try {
    const file = await collection('files').findOne({ id });

    if (!file) {
      return res.status(404).json({ error: { message: 'File not found' } });
    }

    if (file.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: { message: 'You don\'t have permission to perform this action' } });
    }

    // delete physical file from storage if it exists
    if (file.storage_path) {
      const filePath = path.join(
        __dirname,
        '../../',
        file.storage_path
      );

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    // Delete from Database
    await collection('files').deleteOne({ id });

    res.status(204).send();
  } catch (error) {
    console.error('deleteFile error:', error);
    res.status(500).json({ error: { message: 'Internal server error' } });
  }
};

module.exports = {
  uploadFile,
  getFiles,
  deleteFile
};
