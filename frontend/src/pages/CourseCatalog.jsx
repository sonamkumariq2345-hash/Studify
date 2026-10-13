import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchWithAuth } from '../api/api';

const CourseCatalog = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
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
    
    loadCourses();
  }, []);

  if (loading) return <div className="p-8 text-center text-academic-muted">Loading course catalogue...</div>;
  if (error) return <div className="p-8 text-academic-error text-center">{error}</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8 border-b border-academic-border pb-4">
        <h1 className="text-3xl font-bold text-academic-heading">Course Catalogue</h1>
        <p className="text-academic-muted mb-0">Browse and enroll in available courses for the current term.</p>
      </div>

      {courses.length === 0 ? (
        <div className="text-center py-12 text-academic-muted border-2 border-dashed border-academic-border">
          No courses are available at this time.
        </div>
      ) : (
        <div className="space-y-4">
          {courses.map((course) => (
            <div
              key={course.id}
              className="card card-accent hover-lift bg-[#FBFBFA]"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-6 py-6">
                {/* Left: course details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2 flex-wrap">
                    <span className="text-xs font-bold uppercase tracking-widest text-academic-primary">
                      {course.category || 'General'}
                    </span>
                    {!course.is_active && (
                      <span className="status-inactive">Inactive</span>
                    )}
                  </div>
                  <h3 className="text-xl font-bold text-academic-heading font-serif mb-2 truncate">
                    {course.title}
                  </h3>
                  <p className="text-sm text-academic-text mb-0 line-clamp-2 leading-relaxed">
                    {course.description}
                  </p>
                </div>

                {/* Right: metadata + action */}
                <div className="flex flex-col sm:items-end gap-3 flex-shrink-0 sm:min-w-[180px] border-t sm:border-t-0 sm:border-l border-academic-border pt-4 sm:pt-0 sm:pl-6">
                  <div className="text-sm text-academic-heading font-medium">
                    {course.instructor_name || 'TBA'}
                  </div>
                  <div className="text-xs text-academic-muted">
                    {course.capacity ? `Capacity: ${course.capacity} students` : 'Open Enrollment'}
                  </div>
                  <Link
                    to={`/student/courses/${course.id}`}
                    className="btn btn-primary text-sm px-5 py-2 mt-2 w-full sm:w-auto text-center"
                  >
                    View Details &rarr;
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CourseCatalog;
