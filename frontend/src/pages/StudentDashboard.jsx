import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchWithAuth } from '../api/api';
import { useAuth } from '../context/AuthContext';

const StudentDashboard = () => {
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [progressError, setProgressError] = useState('');

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const [enrollData, annData] = await Promise.all([
          fetchWithAuth('/enrollments/me'),
          fetchWithAuth('/announcements')
        ]);
        setEnrollments(enrollData);
        setAnnouncements(annData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    loadDashboard();
  }, []);

  const handleProgressUpdate = async (courseId, newProgress) => {
    setProgressError('');
    try {
      await fetchWithAuth(`/progress/${courseId}`, {
        method: 'PUT',
        body: JSON.stringify({ percent_complete: newProgress }),
      });
      setEnrollments(prev => prev.map(e =>
        e.course_id === courseId
          ? { ...e, percent_complete: newProgress, status: newProgress === 100 ? 'completed' : (newProgress === 0 ? 'not_started' : 'in_progress') }
          : e
      ));
    } catch (err) {
      setProgressError(err.message);
    }
  };

  if (loading) return <div className="p-8 text-center text-academic-muted">Loading dashboard...</div>;
  if (error) return <div className="p-8 text-academic-error text-center">{error}</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {progressError && <div className="mb-4 bg-red-50 border-l-4 border-academic-error p-4 text-sm text-academic-error">{progressError}</div>}

      <div className="mb-8 flex justify-between items-end border-b border-academic-border pb-4">
        <div>
          <h1 className="text-3xl font-bold text-academic-heading">Student Dashboard</h1>
          <p className="text-academic-muted mt-1">Welcome back, {user?.name}</p>
        </div>
        <div>
          <Link to="/student/courses" className="btn btn-secondary hover-lift">Browse Course Catalogue</Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Courses */}
        <div className="lg:col-span-2">
          <h2 className="text-xl font-bold text-academic-heading mb-4">My Enrolled Courses</h2>
          
          {enrollments.length === 0 ? (
            <div className="border border-academic-border border-dashed p-12 text-center bg-white rounded-sm hover-lift">
              <p className="text-academic-muted mb-4">You are not enrolled in any courses for the current term.</p>
              <Link to="/student/courses" className="btn btn-primary">Browse Catalogue</Link>
            </div>
          ) : (
            <div className="space-y-4">
              {enrollments.map((enrollment) => (
                <div 
                  key={enrollment.enrollment_id} 
                  className="card card-accent hover-lift"
                >
                  <div className="p-6">
                    <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="text-lg font-bold text-academic-heading font-serif">
                            <Link to={`/student/courses/${enrollment.course_id}`} className="hover:text-academic-primary transition-colors">
                              {enrollment.title}
                            </Link>
                          </h3>
                          <span className="text-[10px] font-bold px-2 py-0.5 text-academic-muted uppercase tracking-wider status-badge">
                            {enrollment.status.replace('_', ' ')}
                          </span>
                        </div>
                        <p className="text-sm text-academic-muted">Instructor: {enrollment.instructor_name || 'TBA'}</p>
                      </div>
                      
                      <div className="flex-1 max-w-sm w-full">
                        {/* Square-cornered 4px progress track */}
                        <div className="mb-1.5 flex justify-between items-center text-xs">
                          <span className="font-semibold text-academic-text uppercase tracking-wide">Academic Progress</span>
                          <span className="font-serif font-bold text-academic-primary tabular-nums">{enrollment.percent_complete}%</span>
                        </div>
                        <div className="progress-track mb-3">
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

                        <div className="flex items-center justify-between">
                          <span className="text-xs text-academic-muted">Update record:</span>
                          <div className="flex gap-1">
                            {[0, 25, 50, 75, 100].map(val => (
                              <button
                                key={val}
                                onClick={() => handleProgressUpdate(enrollment.course_id, val)}
                                className={`px-2 py-0.5 text-xs border transition-colors ${
                                  enrollment.percent_complete === val 
                                    ? 'bg-academic-primary text-white border-academic-primary'
                                    : 'bg-white text-academic-text border-academic-border hover:bg-gray-50'
                                }`}
                              >
                                {val}%
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Announcements & Documents */}
        <div className="lg:col-span-1 space-y-8">
          
          <div className="card card-accent hover-lift">
            <div className="card-header bg-[#FBFBFA]">
              <h3 className="text-md font-bold text-academic-heading m-0">Institutional Announcements</h3>
            </div>
            <div className="p-0 divide-y divide-academic-border">
              {announcements.length === 0 ? (
                <div className="p-6 text-center text-sm text-academic-muted">No recent announcements.</div>
              ) : (
                announcements.slice(0, 4).map(ann => (
                  <div key={ann.id} className="p-4">
                    <h4 className="font-bold text-academic-heading text-sm mb-1">{ann.title}</h4>
                    <p className="text-xs text-academic-text mb-2 line-clamp-3">{ann.content}</p>
                    <div className="text-[10px] text-academic-muted uppercase tracking-wider">
                      {new Date(ann.created_at).toLocaleDateString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="card bg-[#FBFBFA] hover-lift">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <svg className="w-6 h-6 text-academic-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
                </svg>
                <h3 className="text-md font-bold text-academic-heading m-0">My Documents</h3>
              </div>
              <p className="text-sm text-academic-muted mb-4">
                Access your uploaded assignments, records, and identification documents.
              </p>
              <Link to="/student/files" className="btn btn-secondary w-full text-sm">
                Manage Files
              </Link>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};

export default StudentDashboard;
