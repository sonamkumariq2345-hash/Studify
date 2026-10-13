import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchWithAuth } from '../../api/api';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');

  const loadUsers = async () => {
    try {
      const data = await fetchWithAuth('/users');
      setUsers(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleToggleStatus = async (id, currentStatus) => {
    setActionError('');
    try {
      await fetchWithAuth(`/users/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ is_active: !currentStatus })
      });
      setUsers(users.map(u => u.id === id ? { ...u, is_active: !currentStatus } : u));
    } catch (err) {
      // Show error inline — not in a browser alert dialog
      setActionError(err.message);
    }
  };

  if (loading) return <div className="p-8 text-center text-academic-muted">Loading users...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6 flex justify-between items-center border-b border-academic-border pb-4">
        <div>
          <h1 className="text-2xl font-bold text-academic-heading mb-1">User Management</h1>
          <Link to="/admin/dashboard" className="text-academic-primary hover:underline text-sm">&larr; Back to Dashboard</Link>
        </div>
      </div>

      {error && <div className="bg-red-50 border-l-4 border-academic-error p-4 mb-6 text-academic-error text-sm">{error}</div>}
      {actionError && <div className="bg-red-50 border-l-4 border-academic-error p-4 mb-6 text-academic-error text-sm">{actionError}</div>}

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Department</th>
              <th>Approval</th>
              <th>Access</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td className="font-medium text-academic-text">{user.name}</td>
                <td>{user.email}</td>
                <td className="uppercase text-xs tracking-wider font-semibold text-academic-muted">{user.role}</td>
                <td>{user.department_name || '-'}</td>
                <td>
                  {user.status === 'approved'
                    ? <span className="status-active">Approved</span>
                    : user.status === 'rejected'
                      ? <span className="status-inactive">Rejected</span>
                      : <span className="status-badge">Pending</span>
                  }
                </td>
                <td>
                  {user.is_active
                    ? <span className="status-active">Active</span>
                    : <span className="status-inactive">Disabled</span>
                  }
                </td>
                <td>
                  {user.role !== 'admin' && (
                    <button
                      onClick={() => handleToggleStatus(user.id, user.is_active)}
                      className={`text-sm font-medium transition-colors ${user.is_active ? 'text-academic-warning hover:text-orange-700' : 'text-academic-success hover:text-green-700'}`}
                    >
                      {user.is_active ? 'Disable' : 'Enable'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminUsers;
