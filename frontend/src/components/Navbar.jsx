import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchWithAuth } from '../api/api';
import { getDashboardPath } from '../utils/authPaths';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await fetchWithAuth('/auth/logout', { method: 'POST' });
    } catch {
      // ignore, local logout is more important
    }
    logout();
    navigate('/login');
  };

  if (!user) return null; // Don't show navbar on login/register

  const isAdmin = user.role === 'admin';
  const isDean = user.role === 'dean';
  const isTeacher = user.role === 'teacher';
  const isStudent = user.role === 'student';
  const dashboardPath = getDashboardPath(user);

  return (
    <nav className="bg-academic-surface border-b border-academic-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to={dashboardPath} className="flex-shrink-0 flex items-center gap-3 border-r border-academic-border pr-6 mr-6">
              {/* ET monogram — 2px bordered square, no rounding */}
              <span
                aria-hidden="true"
                className="inline-flex items-center justify-center w-7 h-7 border-2 border-academic-primary text-academic-primary font-serif font-bold text-xs select-none flex-shrink-0"
                style={{ letterSpacing: '-0.04em' }}
              >
                S
              </span>
              <span className="font-serif font-bold text-xl tracking-tight text-academic-heading">
                Studify
              </span>
            </Link>
            <div className="hidden sm:flex sm:space-x-1">
              {isAdmin ? (
                <>
                  <Link to="/admin/dashboard" className="text-academic-text hover:text-academic-primary hover:bg-gray-50 px-3 py-2 text-sm font-medium rounded-sm transition-colors">Dashboard</Link>
                  <Link to="/admin/users" className="text-academic-text hover:text-academic-primary hover:bg-gray-50 px-3 py-2 text-sm font-medium rounded-sm transition-colors">Users</Link>
                  <Link to="/admin/teacher-requests" className="text-academic-text hover:text-academic-primary hover:bg-gray-50 px-3 py-2 text-sm font-medium rounded-sm transition-colors">Teacher Requests</Link>
                  <Link to="/admin/deans" className="text-academic-text hover:text-academic-primary hover:bg-gray-50 px-3 py-2 text-sm font-medium rounded-sm transition-colors">Deans</Link>
                  <Link to="/admin/departments" className="text-academic-text hover:text-academic-primary hover:bg-gray-50 px-3 py-2 text-sm font-medium rounded-sm transition-colors">Departments</Link>
                  <Link to="/admin/courses" className="text-academic-text hover:text-academic-primary hover:bg-gray-50 px-3 py-2 text-sm font-medium rounded-sm transition-colors">Courses</Link>
                </>
              ) : isDean ? (
                <>
                  <Link to="/dean/dashboard" className="text-academic-text hover:text-academic-primary hover:bg-gray-50 px-3 py-2 text-sm font-medium rounded-sm transition-colors">Dashboard</Link>
                  <Link to="/dean/dashboard#students" className="text-academic-text hover:text-academic-primary hover:bg-gray-50 px-3 py-2 text-sm font-medium rounded-sm transition-colors">Students</Link>
                  <Link to="/dean/dashboard#student-registration-requests" className="text-academic-text hover:text-academic-primary hover:bg-gray-50 px-3 py-2 text-sm font-medium rounded-sm transition-colors">Requests</Link>
                  <Link to="/dean/dashboard#teachers" className="text-academic-text hover:text-academic-primary hover:bg-gray-50 px-3 py-2 text-sm font-medium rounded-sm transition-colors">Teachers</Link>
                </>
              ) : isTeacher ? (
                <>
                  <Link to="/teacher/dashboard" className="text-academic-text hover:text-academic-primary hover:bg-gray-50 px-3 py-2 text-sm font-medium rounded-sm transition-colors">Dashboard</Link>
                </>
              ) : isStudent ? (
                <>
                  <Link to="/student/dashboard" className="text-academic-text hover:text-academic-primary hover:bg-gray-50 px-3 py-2 text-sm font-medium rounded-sm transition-colors">Dashboard</Link>
                  <Link to="/student/courses" className="text-academic-text hover:text-academic-primary hover:bg-gray-50 px-3 py-2 text-sm font-medium rounded-sm transition-colors">Course Catalogue</Link>
                  <Link to="/student/files" className="text-academic-text hover:text-academic-primary hover:bg-gray-50 px-3 py-2 text-sm font-medium rounded-sm transition-colors">My Documents</Link>
                </>
              ) : null}
            </div>
          </div>
          <div className="flex items-center space-x-6">
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-sm font-medium text-academic-heading">{user.name}</span>
              <span className="text-xs text-academic-muted capitalize">{user.role}</span>
            </div>
            <button 
              onClick={handleLogout}
              className="text-sm font-medium text-academic-primary hover:text-academic-primary-dark transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
