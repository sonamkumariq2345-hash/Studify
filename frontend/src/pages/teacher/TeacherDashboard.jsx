import React, { useEffect, useState } from 'react';
import { fetchWithAuth } from '../../api/api';
import { useAuth } from '../../context/AuthContext';

const TeacherDashboard = () => {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        const data = await fetchWithAuth('/announcements');
        setAnnouncements(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, []);

  if (loading) return <div className="p-8 text-center text-academic-muted">Loading dashboard...</div>;
  if (error) return <div className="p-8 text-academic-error text-center">{error}</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4 border-b border-academic-border pb-4">
        <div>
          <h1 className="text-3xl font-bold text-academic-heading">Teacher Dashboard</h1>
          <p className="text-academic-muted mt-1">Welcome back, {user?.name}</p>
        </div>
        <div className="text-sm text-academic-muted">
          {user?.teacher_profile?.department_name || 'Department assignment pending'}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="card card-accent">
            <div className="card-header bg-[#FBFBFA]">
              <h2 className="text-lg font-bold text-academic-heading m-0">Profile</h2>
            </div>
            <div className="card-body grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="block text-xs uppercase tracking-widest text-academic-muted">Employee ID</span>
                <span className="font-medium text-academic-text">{user?.teacher_profile?.employee_id || '-'}</span>
              </div>
              <div>
                <span className="block text-xs uppercase tracking-widest text-academic-muted">Qualification</span>
                <span className="font-medium text-academic-text">{user?.teacher_profile?.qualification || '-'}</span>
              </div>
              <div>
                <span className="block text-xs uppercase tracking-widest text-academic-muted">Email</span>
                <span className="font-medium text-academic-text">{user?.email}</span>
              </div>
              <div>
                <span className="block text-xs uppercase tracking-widest text-academic-muted">Phone</span>
                <span className="font-medium text-academic-text">{user?.teacher_profile?.phone_number || '-'}</span>
              </div>
            </div>
          </div>

          <div className="card card-accent bg-[#FBFBFA] p-6">
            <h3 className="text-md font-bold text-academic-heading uppercase tracking-wide mb-3 text-sm border-b border-academic-border pb-2">
              Teacher Workspace
            </h3>
            <p className="text-sm text-academic-muted mb-0">
              Your approved teacher account is active. Course and classroom tools can be connected here as the existing system expands.
            </p>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="card">
            <div className="card-header bg-academic-surface">
              <h3 className="text-md font-bold text-academic-heading m-0">Recent Announcements</h3>
            </div>
            <div className="p-0 divide-y divide-academic-border">
              {announcements.length === 0 ? (
                <div className="p-6 text-center text-sm text-academic-muted">No recent announcements.</div>
              ) : (
                announcements.slice(0, 4).map((announcement) => (
                  <div key={announcement.id} className="p-4">
                    <h4 className="font-bold text-academic-heading text-sm mb-1">{announcement.title}</h4>
                    <p className="text-xs text-academic-text mb-2 line-clamp-3">{announcement.content}</p>
                    <div className="text-[10px] text-academic-muted uppercase tracking-wider">
                      {new Date(announcement.created_at).toLocaleDateString()}
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

export default TeacherDashboard;
