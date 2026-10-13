import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchWithAuth } from '../../api/api';

const AdminDepartments = () => {
  const [departments, setDepartments] = useState([]);
  const [formData, setFormData] = useState({ name: '', code: '', description: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');

  const loadDepartments = async () => {
    try {
      const data = await fetchWithAuth('/users/departments');
      setDepartments(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDepartments();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    try {
      await fetchWithAuth('/users/departments', {
        method: 'POST',
        body: JSON.stringify(formData)
      });
      setFormData({ name: '', code: '', description: '' });
      await loadDepartments();
    } catch (err) {
      setFormError(err.message);
    }
  };

  if (loading) return <div className="p-8 text-center text-academic-muted">Loading departments...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6 flex justify-between items-center border-b border-academic-border pb-4">
        <div>
          <h1 className="text-2xl font-bold text-academic-heading mb-1">Departments</h1>
          <Link to="/admin/dashboard" className="text-academic-primary hover:underline text-sm">&larr; Back to Dashboard</Link>
        </div>
      </div>

      {error && <div className="bg-red-50 border-l-4 border-academic-error p-4 mb-6 text-academic-error text-sm">{error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <div className="card card-accent">
            <div className="card-header bg-[#FBFBFA]">
              <h2 className="text-lg font-bold text-academic-heading m-0">Create Department</h2>
            </div>
            <div className="card-body">
              {formError && <div className="bg-red-50 border-l-4 border-academic-error p-3 mb-4 text-sm text-academic-error">{formError}</div>}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="form-group">
                  <label className="form-label">Department Name</label>
                  <input name="name" className="form-input" required value={formData.name} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label className="form-label">Code</label>
                  <input name="code" className="form-input" value={formData.code} onChange={handleChange} />
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea name="description" rows="3" className="form-input" value={formData.description} onChange={handleChange} />
                </div>
                <button type="submit" className="btn btn-primary w-full">Create Department</button>
              </form>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Code</th>
                  <th>Dean</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {departments.length === 0 ? (
                  <tr><td colSpan="4" className="text-center py-6 text-academic-muted">No departments found.</td></tr>
                ) : (
                  departments.map((department) => (
                    <tr key={department.id}>
                      <td className="font-medium text-academic-text">{department.name}</td>
                      <td>{department.code || '-'}</td>
                      <td>{department.dean_name || '-'}</td>
                      <td>{department.is_active === false ? <span className="status-inactive">Inactive</span> : <span className="status-active">Active</span>}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDepartments;
