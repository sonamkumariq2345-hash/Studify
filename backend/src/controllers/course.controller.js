const { v4: uuidv4 } = require('uuid');
const path = require('path');
const { collection } = require('../db');
const supabase = require('../storage/supabase');
const {
  getUpdatedDocument,
  removeUndefined,
  stripMongoId,
  stripMongoIds
} = require('../utils/mongo');

const escapeRegExp = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const parsePagination = ({ page = 1, limit = 10 }) => {
  const pageNumber = Math.max(parseInt(page, 10) || 1, 1);
  const limitNumber = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 100);

  return {
    limitNumber,
    pageNumber,
    offset: (pageNumber - 1) * limitNumber
  };
};

const parseCapacity = (capacity) => {
  if (capacity === undefined) return undefined;
  if (capacity === null || capacity === '') return null;

  const parsed = Number(capacity);
  if (!Number.isInteger(parsed) || parsed < 1) return NaN;

  return parsed;
};

const getCourses = async (req, res) => {
  const { search, category } = req.query;
  const { pageNumber, limitNumber, offset } = parsePagination(req.query);

  try {
    const courses = collection('courses');
    const filter = req.user?.role === 'admin' ? {} : { is_active: true };

    if (search) {
      const searchRegex = new RegExp(escapeRegExp(search), 'i');
      filter.$or = [
        { title: searchRegex },
        { description: searchRegex }
      ];
    }

    if (category) {
      filter.category = category;
    }

    const [total, items] = await Promise.all([
      courses.countDocuments(filter),
      courses.find(filter)
        .sort({ created_at: -1 })
        .skip(offset)
        .limit(limitNumber)
        .toArray()
    ]);

    res.json({
      items: stripMongoIds(items),
      total,
      page: pageNumber,
      limit: limitNumber
    });
  } catch (error) {
    console.error('getCourses error:', error);
    res.status(500).json({ error: { message: 'Internal server error' } });
  }
};

const getCourseById = async (req, res) => {
  const { id } = req.params;

  try {
    const course = await collection('courses').findOne({ id });

    if (!course || (!course.is_active && req.user?.role !== 'admin')) {
      return res.status(404).json({ error: { message: 'Course not found' } });
    }

    res.json(stripMongoId(course));
  } catch (error) {
    console.error('getCourseById error:', error);
    res.status(500).json({ error: { message: 'Internal server error' } });
  }
};

const createCourse = async (req, res) => {
  const { title, description, category, instructor_name, capacity } = req.body;
  const trimmedTitle = String(title || '').trim();

  if (!trimmedTitle) return res.status(400).json({ error: { message: 'Title is required' } });

  const parsedCapacity = parseCapacity(capacity);
  if (Number.isNaN(parsedCapacity)) {
    return res.status(400).json({ error: { message: 'Capacity must be a positive whole number' } });
  }

  try {
    const now = new Date();
    const course = {
      id: uuidv4(),
      title: trimmedTitle,
      description: description || null,
      category: category || null,
      instructor_name: instructor_name || null,
      capacity: parsedCapacity === undefined ? null : parsedCapacity,
      is_active: true,
      created_by: req.user.id,
      created_at: now,
      updated_at: now
    };

    await collection('courses').insertOne(course);

    res.status(201).json(stripMongoId(course));
  } catch (error) {
    console.error('createCourse error:', error);
    res.status(500).json({ error: { message: 'Internal server error' } });
  }
};

const updateCourse = async (req, res) => {
  const { id } = req.params;
  const { title, description, category, instructor_name, capacity, is_active } = req.body;
  const trimmedTitle = title === undefined ? undefined : String(title).trim();

  if (title !== undefined && !trimmedTitle) {
    return res.status(400).json({ error: { message: 'Title is required' } });
  }

  const parsedCapacity = parseCapacity(capacity);
  if (Number.isNaN(parsedCapacity)) {
    return res.status(400).json({ error: { message: 'Capacity must be a positive whole number' } });
  }

  try {
    const updateFields = removeUndefined({
      title: trimmedTitle,
      description,
      category,
      instructor_name,
      capacity: parsedCapacity,
      is_active: typeof is_active === 'boolean' ? is_active : undefined,
      updated_at: new Date()
    });

    const result = await collection('courses').findOneAndUpdate(
      { id },
      { $set: updateFields },
      { returnDocument: 'after' }
    );
    const course = getUpdatedDocument(result);

    if (!course) {
      return res.status(404).json({ error: { message: 'Course not found' } });
    }

    res.json(stripMongoId(course));
  } catch (error) {
    console.error('updateCourse error:', error);
    res.status(500).json({ error: { message: 'Internal server error' } });
  }
};

const deleteCourse = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await collection('courses').findOneAndUpdate(
      { id },
      { $set: { is_active: false, updated_at: new Date() } },
      { returnDocument: 'after' }
    );

    if (!getUpdatedDocument(result)) {
      return res.status(404).json({ error: { message: 'Course not found' } });
    }

    res.status(204).send();
  } catch (error) {
    console.error('deleteCourse error:', error);
    res.status(500).json({ error: { message: 'Internal server error' } });
  }
};

const getCourseResources = async (req, res) => {
  const { id } = req.params;
  const bucket = process.env.SUPABASE_STORAGE_BUCKET || 'student-files';

  try {
    const resources = await collection('course_resources')
      .find({ course_id: id })
      .sort({ uploaded_at: -1 })
      .toArray();

    const resourcesWithUrls = await Promise.all(resources.map(async (resource) => {
      const apiResource = stripMongoId(resource);
      if (!apiResource.storage_path) return { ...apiResource, download_url: null };

      const { data } = await supabase.storage.from(bucket).createSignedUrl(apiResource.storage_path, 3600);
      return { ...apiResource, download_url: data?.signedUrl || null };
    }));

    res.json(resourcesWithUrls);
  } catch (error) {
    console.error('getCourseResources error:', error);
    res.status(500).json({ error: { message: 'Internal server error' } });
  }
};

const uploadCourseResource = async (req, res) => {
  const { id } = req.params;
  const instruction = req.body.instruction || null;

  if (!req.file && !instruction) {
    return res.status(400).json({ error: { message: 'Must provide either a file or an instruction message' } });
  }

  const userId = req.user.id;
  const bucket = process.env.SUPABASE_STORAGE_BUCKET || 'student-files';

  try {
    const course = await collection('courses').findOne({ id }, { projection: { id: 1 } });
    if (!course) {
      return res.status(404).json({ error: { message: 'Course not found' } });
    }

    let storagePath = null;
    let sizeBytes = null;
    let title = req.body.title || null;

    if (req.file) {
      const file = req.file;
      const maxSize = 10 * 1024 * 1024;
      if (file.size > maxSize) {
        return res.status(400).json({ error: { message: 'File exceeds the 10MB limit' } });
      }

      const ext = path.extname(file.originalname);
      const uniqueFilename = `${uuidv4()}${ext}`;
      storagePath = `courses/${id}/${uniqueFilename}`;
      sizeBytes = file.size;
      title = title || file.originalname;

      const { data: storageData, error: storageError } = await supabase.storage
        .from(bucket)
        .upload(storagePath, file.buffer, {
          contentType: file.mimetype,
          upsert: false
        });

      if (storageError) throw storageError;
      storagePath = storageData.path;
    }

    const resource = {
      id: uuidv4(),
      course_id: id,
      title,
      storage_path: storagePath,
      size_bytes: sizeBytes,
      uploaded_by: userId,
      instruction,
      uploaded_at: new Date()
    };

    await collection('course_resources').insertOne(resource);

    res.status(201).json(stripMongoId(resource));
  } catch (error) {
    console.error('uploadCourseResource error:', error);
    res.status(500).json({ error: { message: 'Internal server error' } });
  }
};

const deleteCourseResource = async (req, res) => {
  const { id, resourceId } = req.params;
  const bucket = process.env.SUPABASE_STORAGE_BUCKET || 'student-files';

  try {
    const resource = await collection('course_resources').findOne({ id: resourceId, course_id: id });

    if (!resource) return res.status(404).json({ error: { message: 'Resource not found' } });

    if (resource.storage_path) {
      const { error: storageError } = await supabase.storage.from(bucket).remove([resource.storage_path]);
      if (storageError) throw storageError;
    }

    await collection('course_resources').deleteOne({ id: resourceId });

    res.status(204).send();
  } catch (error) {
    console.error('deleteCourseResource error:', error);
    res.status(500).json({ error: { message: 'Internal server error' } });
  }
};

module.exports = {
  getCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
  getCourseResources,
  uploadCourseResource,
  deleteCourseResource
};
