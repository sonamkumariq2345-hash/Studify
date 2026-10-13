import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchWithAuth } from '../../api/api';

const AdminEnrollments = () => {
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterCourse, setFilterCourse] = useState('');
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [enrollData, courseData] = await Promise.all([
          fetchWithAuth('/enrollments'),
          fetchWithAuth('/courses')
        ]);
        setEnrollments(enrollData);
        setCourses(courseData.items);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  const filteredEnrollments = filterCourse 
    ? enrollments.filter(e => e.course_id === filterCourse) 
    : enrollments;

  if (loading) return <div className="p-8 text-center text-academic-muted">Loading enrollments...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6 flex justify-between items-end border-b border-academic-border pb-4">
        <div>
          <h1 className="text-2xl font-bold text-academic-heading mb-1">Enrollment Oversight</h1>
          <Link to="/admin/dashboard" className="text-academic-primary hover:underline text-sm">&larr; Back to Dashboard</Link>
        </div>
        
        <div className="w-64">
          <label className="block text-xs font-bold text-academic-muted uppercase tracking-wider mb-1">Filter by Course</label>
          <select 
            className="form-input text-sm" 
            value={filterCourse} 
            onChange={(e) => setFilterCourse(e.target.value)}
          >
            <option value="">All Courses</option>
            {courses.map(c => (
              <option key={c.id} value={c.id}>{c.title}</option>
            ))}
          </select>
        </div>
      </div>

      {error && <div className="bg-red-50 border-l-4 border-academic-error p-4 mb-6 text-academic-error">{error}</div>}

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Student Name</th>
              <th>Student Email</th>
              <th>Course</th>
              <th>Enrolled Date</th>
              <th>Progress</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredEnrollments.length === 0 ? (
              <tr><td colSpan="6" className="text-center py-6 text-academic-muted">No enrollments found.</td></tr>
            ) : (
              filteredEnrollments.map(enrollment => (
                <tr key={enrollment.enrollment_id}>
                  <td className="font-medium text-academic-text">{enrollment.student_name}</td>
                  <td className="text-sm text-academic-muted">{enrollment.student_email}</td>
                  <td className="font-medium text-academic-text">{enrollment.course_title}</td>
                  <td className="text-sm text-academic-muted">{new Date(enrollment.enrolled_at).toLocaleDateString()}</td>
                  <td>
                    {/* Square-cornered 4px progress track — no rounded-full */}
                    <div className="flex items-center gap-2">
                      <div className="progress-track w-20 flex-shrink-0">
                        <div
                          className={`progress-fill${
                            enrollment.percent_complete >= 70 ? '' :
                            enrollment.percent_complete >= 30 ? '-warning' : '-danger'
                          }`}
                          style={{ width: `${enrollment.percent_complete}%` }}
                          role="progressbar"
                          aria-valuenow={enrollment.percent_complete}
                          aria-valuemin={0}
                          aria-valuemax={100}
                        />
                      </div>
                      <span className="font-serif text-xs font-bold text-academic-text tabular-nums">{enrollment.percent_complete}%</span>
                    </div>
                  </td>
                  <td>
                    {/* status-badge: square dot + text, no rounded pill */}
                    <span className="status-badge">{enrollment.status.replace('_', ' ')}</span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminEnrollments;
