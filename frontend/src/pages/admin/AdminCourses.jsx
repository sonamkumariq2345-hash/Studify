import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchWithAuth } from '../../api/api';

const AdminCourses = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  
  // Form State
  const [formData, setFormData] = useState({
    title: '', description: '', category: '', instructor_name: '', capacity: '', is_active: true
  });

  const loadCourses = async () => {
    try {
      const data = await fetchWithAuth('/courses');
      setCourses(data.items);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCourses();
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleEdit = (course) => {
    setEditingCourse(course);
    setFormData({
      title: course.title,
      description: course.description,
      category: course.category || '',
      instructor_name: course.instructor_name || '',
      capacity: course.capacity || '',
      is_active: course.is_active
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this course? It will be marked inactive.')) return;
    try {
      await fetchWithAuth(`/courses/${id}`, { method: 'DELETE' });
      loadCourses();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    try {
      const payload = {
        ...formData,
        capacity: formData.capacity ? parseInt(formData.capacity, 10) : null
      };

      if (editingCourse) {
        await fetchWithAuth(`/courses/${editingCourse.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
      } else {
        await fetchWithAuth('/courses', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
      }
      setShowForm(false);
      setEditingCourse(null);
      setFormData({ title: '', description: '', category: '', instructor_name: '', capacity: '', is_active: true });
      loadCourses();
    } catch (err) {
      // Show inline — never via alert()
      setFormError(err.message);
    }
  };

  if (loading && !showForm) return <div className="p-8 text-center text-academic-muted">Loading courses...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6 flex justify-between items-center border-b border-academic-border pb-4">
        <div>
          <h1 className="text-2xl font-bold text-academic-heading mb-1">Course Management</h1>
          <Link to="/admin/dashboard" className="text-academic-primary hover:underline text-sm">&larr; Back to Dashboard</Link>
        </div>
        {!showForm && (
          <button onClick={() => { setEditingCourse(null); setShowForm(true); }} className="btn btn-primary">
            Create New Course
          </button>
        )}
      </div>

      {error && <div className="bg-red-50 border-l-4 border-academic-error p-4 mb-6 text-academic-error text-sm">{error}</div>}

      {showForm ? (
        <div className="card max-w-3xl mx-auto">
          <div className="card-header border-b border-academic-border bg-[#FBFBFA]">
            <h2 className="text-lg font-bold text-academic-heading">{editingCourse ? 'Edit Course' : 'New Course'}</h2>
          </div>
          {formError && <div className="mx-5 mt-4 bg-red-50 border-l-4 border-academic-error p-3 text-academic-error text-sm">{formError}</div>}
          <div className="card-body">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="form-group">
                <label className="form-label">Course Title *</label>
                <input type="text" name="title" required value={formData.title} onChange={handleInputChange} className="form-input" />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea name="description" rows="4" value={formData.description} onChange={handleInputChange} className="form-input"></textarea>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <input type="text" name="category" value={formData.category} onChange={handleInputChange} className="form-input" />
                </div>
                <div className="form-group">
                  <label className="form-label">Instructor Name</label>
                  <input type="text" name="instructor_name" value={formData.instructor_name} onChange={handleInputChange} className="form-input" />
                </div>
                <div className="form-group">
                  <label className="form-label">Capacity (optional)</label>
                  <input type="number" name="capacity" min="1" value={formData.capacity} onChange={handleInputChange} className="form-input" />
                </div>
                {editingCourse && (
                  <div className="form-group flex items-center mt-8">
                    <input type="checkbox" id="is_active" name="is_active" checked={formData.is_active} onChange={handleInputChange} className="h-4 w-4 text-academic-primary border-gray-300 rounded" />
                    <label htmlFor="is_active" className="ml-2 block text-sm text-academic-text">Active (visible to students)</label>
                  </div>
                )}
              </div>
              <div className="pt-4 flex justify-end gap-4 border-t border-academic-border">
                <button type="button" onClick={() => setShowForm(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">{editingCourse ? 'Save Changes' : 'Create Course'}</button>
              </div>
            </form>

            {editingCourse && (
              <div className="mt-10 pt-8 border-t-2 border-academic-border border-dashed">
                <h3 className="text-lg font-bold text-academic-heading mb-4">Course Resources & Instructions</h3>
                
                <form 
                  className="bg-[#FCFCFB] p-4 border border-academic-border mb-6 rounded-sm"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const fileInput = e.target.elements.resourceFile;
                    const instructionInput = e.target.elements.resourceInstruction;
                    const file = fileInput.files[0];
                    const instruction = instructionInput.value.trim();

                    if (!file && !instruction) {
                      return alert('Please select a file or provide an instruction message');
                    }

                    const formData = new FormData();
                    if (file) formData.append('file', file);
                    if (instruction) formData.append('instruction', instruction);

                    try {
                      const response = await fetch(`${import.meta.env.VITE_API_URL}/courses/${editingCourse.id}/resources`, {
                        method: 'POST',
                        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
                        body: formData
                      });
                      if (!response.ok) throw new Error(await response.text());
                      alert('Added successfully!');
                      fileInput.value = '';
                      instructionInput.value = '';
                    } catch (err) {
                      alert('Failed: ' + err.message);
                    }
                  }}
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="form-group">
                      <label className="form-label">Upload File (Optional)</label>
                      <input type="file" name="resourceFile" className="form-input text-sm p-1.5" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Instruction / Message to Students (Optional)</label>
                      <input type="text" name="resourceInstruction" className="form-input" placeholder="e.g. Please read before Chapter 1" />
                    </div>
                  </div>
                  <button type="submit" className="btn btn-secondary text-sm py-1.5">Add Resource/Message</button>
                </form>
                <p className="text-xs text-academic-muted">Note: To view or delete existing resources for this course, please visit the Course Details page.</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Category</th>
                <th>Instructor</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {courses.map(course => (
                <tr key={course.id}>
                  <td className="font-medium text-academic-text">{course.title}</td>
                  <td className="uppercase text-xs tracking-wider text-academic-muted">{course.category || '-'}</td>
                  <td>{course.instructor_name || '-'}</td>
                  <td>
                    {/* Square-dot indicator — no pill */}
                    {course.is_active
                      ? <span className="status-active">Active</span>
                      : <span className="status-inactive">Inactive</span>
                    }
                  </td>
                  <td className="text-right">
                    <button onClick={() => handleEdit(course)} className="text-academic-primary hover:underline text-sm mr-4">Edit</button>
                    {course.is_active && (
                      <button onClick={() => handleDelete(course.id)} className="text-academic-error hover:underline text-sm">Delete</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminCourses;
