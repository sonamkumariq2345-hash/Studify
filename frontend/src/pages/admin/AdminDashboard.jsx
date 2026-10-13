import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchWithAuth } from '../../api/api';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Announcement form state
  const [annTitle, setAnnTitle] = useState('');
  const [annContent, setAnnContent] = useState('');
  const [annPosting, setAnnPosting] = useState(false);
  const [annError, setAnnError] = useState('');

  useEffect(() => {
    const loadData = async () => {
      try {
        const [statsData, annData] = await Promise.all([
          fetchWithAuth('/users/stats'),
          fetchWithAuth('/announcements')
        ]);
        setStats(statsData);
        setAnnouncements(annData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, []);

  const handlePostAnnouncement = async (e) => {
    e.preventDefault();
    setAnnError('');
    setAnnPosting(true);
    
    try {
      const newAnn = await fetchWithAuth('/announcements', {
        method: 'POST',
        body: JSON.stringify({ title: annTitle, content: annContent })
      });
      // We need to add author_name manually for the local state since it comes from join in DB
      setAnnouncements([{ ...newAnn, author_name: 'You (Admin)' }, ...announcements]);
      setAnnTitle('');
      setAnnContent('');
    } catch (err) {
      setAnnError(err.message);
    } finally {
      setAnnPosting(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-academic-muted">Loading dashboard...</div>;
  if (error) return <div className="p-8 text-academic-error text-center">{error}</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-academic-heading">Administration Console</h1>
        <p className="text-academic-muted">Manage system data, users, and course offerings.</p>
      </div>

      <div className="border-y border-academic-border py-6 mb-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-academic-border bg-[#FBFBFA]">
        <div className="px-6 py-2 text-center md:text-left hover-lift">
          <div className="text-sm uppercase tracking-wider font-bold text-academic-muted mb-1">Students</div>
          <div className="text-3xl font-serif text-academic-primary">{stats.total_students}</div>
          <div className="text-xs text-academic-muted">{stats.pending_students} pending</div>
        </div>
        <div className="px-6 py-2 text-center md:text-left hover-lift">
          <div className="text-sm uppercase tracking-wider font-bold text-academic-muted mb-1">Teachers</div>
          <div className="text-3xl font-serif text-academic-primary">{stats.total_teachers}</div>
          <div className="text-xs text-academic-muted">{stats.pending_teachers} pending</div>
        </div>
        <div className="px-6 py-2 text-center md:text-left hover-lift">
          <div className="text-sm uppercase tracking-wider font-bold text-academic-muted mb-1">Deans</div>
          <div className="text-3xl font-serif text-academic-primary">{stats.total_deans}</div>
          <div className="text-xs text-academic-muted">{stats.total_departments} departments</div>
        </div>
        <div className="px-6 py-2 text-center md:text-left hover-lift">
          <div className="text-sm uppercase tracking-wider font-bold text-academic-muted mb-1">Courses</div>
          <div className="text-3xl font-serif text-academic-primary">{stats.total_courses}</div>
          <div className="text-xs text-academic-muted">{stats.total_enrollments} enrollments</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Management */}
        <div className="lg:col-span-2 space-y-8">
          <div className="card card-accent hover-lift">
            <div className="px-6 py-4 border-b border-academic-border bg-[#FBFBFA]">
              <h2 className="text-lg font-bold text-academic-heading m-0 border-none pb-0">System Management</h2>
            </div>
            <div className="p-0">
              <Link to="/admin/users" className="block px-6 py-4 border-b border-academic-border hover:bg-gray-50 transition-colors">
                <h3 className="text-md font-bold text-academic-primary mb-1">User Management</h3>
                <p className="text-sm text-academic-muted mb-0">View students, teachers, deans, and account status.</p>
              </Link>
              <Link to="/admin/teacher-requests" className="block px-6 py-4 border-b border-academic-border hover:bg-gray-50 transition-colors">
                <h3 className="text-md font-bold text-academic-primary mb-1">Teacher Registration Requests</h3>
                <p className="text-sm text-academic-muted mb-0">Review teacher applications before dashboard access is granted.</p>
              </Link>
              <Link to="/admin/student-requests" className="block px-6 py-4 border-b border-academic-border hover:bg-gray-50 transition-colors">
                <h3 className="text-md font-bold text-academic-primary mb-1">Student Management</h3>
                <p className="text-sm text-academic-muted mb-0">Audit student requests across departments.</p>
              </Link>
              <Link to="/admin/deans" className="block px-6 py-4 border-b border-academic-border hover:bg-gray-50 transition-colors">
                <h3 className="text-md font-bold text-academic-primary mb-1">Deans</h3>
                <p className="text-sm text-academic-muted mb-0">Assign approved teachers as department deans.</p>
              </Link>
              <Link to="/admin/departments" className="block px-6 py-4 border-b border-academic-border hover:bg-gray-50 transition-colors">
                <h3 className="text-md font-bold text-academic-primary mb-1">Departments</h3>
                <p className="text-sm text-academic-muted mb-0">Create departments and review dean assignments.</p>
              </Link>
              <Link to="/admin/courses" className="block px-6 py-4 border-b border-academic-border hover:bg-gray-50 transition-colors">
                <h3 className="text-md font-bold text-academic-primary mb-1">Course Curriculum</h3>
                <p className="text-sm text-academic-muted mb-0">Create new offerings, update capacities, and manage details.</p>
              </Link>
              <Link to="/admin/enrollments" className="block px-6 py-4 hover:bg-gray-50 transition-colors">
                <h3 className="text-md font-bold text-academic-primary mb-1">Academic Records</h3>
                <p className="text-sm text-academic-muted mb-0">Track student progress and manage global enrollments.</p>
              </Link>
            </div>
          </div>
          
          <div className="card card-accent bg-[#FBFBFA] p-6 hover-lift">
            <h3 className="text-md font-bold text-academic-heading uppercase tracking-wide mb-4 text-sm border-b border-academic-border pb-2">Quick Actions</h3>
            <ul className="space-y-3 flex gap-6">
              <li><Link to="/admin/teacher-requests" className="text-sm text-academic-primary hover:underline font-medium">Review Teachers</Link></li>
              <li><Link to="/admin/deans" className="text-sm text-academic-primary hover:underline font-medium">Assign Dean</Link></li>
              <li><Link to="/admin/departments" className="text-sm text-academic-primary hover:underline font-medium">Create Department</Link></li>
            </ul>
          </div>
        </div>

        {/* Right Column: Announcements */}
        <div className="lg:col-span-1 space-y-8">
          <div className="card card-accent">
            <div className="card-header bg-[#FBFBFA]">
              <h2 className="text-lg font-bold text-academic-heading m-0">Post Announcement</h2>
            </div>
            <div className="card-body">
              {annError && <div className="mb-4 bg-red-50 border-l-4 border-academic-error p-3 text-sm text-academic-error">{annError}</div>}
              <form onSubmit={handlePostAnnouncement}>
                <div className="form-group mb-3">
                  <input
                    type="text"
                    placeholder="Announcement Title"
                    value={annTitle}
                    onChange={e => setAnnTitle(e.target.value)}
                    className="form-input"
                    required
                  />
                </div>
                <div className="form-group mb-3">
                  <textarea
                    placeholder="Write your announcement..."
                    value={annContent}
                    onChange={e => setAnnContent(e.target.value)}
                    className="form-input min-h-[100px]"
                    required
                  />
                </div>
                <button type="submit" disabled={annPosting} className="btn btn-primary w-full py-2 text-sm">
                  {annPosting ? 'Posting...' : 'Publish Announcement'}
                </button>
              </form>
            </div>
          </div>
          
          <div className="card">
            <div className="card-header bg-academic-surface">
              <h3 className="text-md font-bold text-academic-heading m-0">Recent Announcements</h3>
            </div>
            <div className="p-0 divide-y divide-academic-border">
              {announcements.length === 0 ? (
                <div className="p-6 text-center text-sm text-academic-muted">No announcements posted yet.</div>
              ) : (
                announcements.slice(0, 3).map(ann => (
                  <div key={ann.id} className="p-4">
                    <h4 className="font-bold text-academic-heading text-sm mb-1">{ann.title}</h4>
                    <p className="text-xs text-academic-text mb-2 line-clamp-2">{ann.content}</p>
                    <div className="text-[10px] text-academic-muted uppercase tracking-wider">
                      {new Date(ann.created_at).toLocaleDateString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminDashboard;
