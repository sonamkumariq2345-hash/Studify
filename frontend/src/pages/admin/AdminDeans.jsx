import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchWithAuth } from '../../api/api';
import PasswordField from '../../components/PasswordField';

const initialDeanForm = {
  name: '',
  email: '',
  password: '',
  confirm_password: '',
  phone_number: '',
  employee_id: '',
  department_id: '',
  qualification: '',
  date_of_birth: '',
  address: '',
  professional_info: ''
};

const AdminDeans = () => {
  const [deans, setDeans] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [teacherId, setTeacherId] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [deanForm, setDeanForm] = useState(initialDeanForm);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    try {
      const [deanData, teacherData, departmentData] = await Promise.all([
        fetchWithAuth('/users/deans'),
        fetchWithAuth('/users/teachers/approved'),
        fetchWithAuth('/users/departments')
      ]);
      setDeans(deanData);
      setTeachers(teacherData);
      setDepartments(departmentData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAssign = async (e) => {
    e.preventDefault();
    setActionError('');
    setSuccessMessage('');
    setSubmitting(true);
    try {
      await fetchWithAuth('/users/deans/assign', {
        method: 'POST',
        body: JSON.stringify({ teacher_id: teacherId, department_id: departmentId })
      });
      setTeacherId('');
      setDepartmentId('');
      setSuccessMessage('Dean assigned successfully.');
      await loadData();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeanInputChange = (e) => {
    const { name, value } = e.target;
    setDeanForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleRegisterDean = async (e) => {
    e.preventDefault();
    setActionError('');
    setSuccessMessage('');

    if (deanForm.password !== deanForm.confirm_password) {
      setActionError('Password and Confirm Password must match');
      return;
    }

    setSubmitting(true);
    try {
      await fetchWithAuth('/users/deans/register', {
        method: 'POST',
        body: JSON.stringify(deanForm)
      });
      setDeanForm(initialDeanForm);
      setSuccessMessage('Dean registered successfully.');
      await loadData();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemove = async (id) => {
    setActionError('');
    setSuccessMessage('');
    try {
      await fetchWithAuth(`/users/deans/${id}`, { method: 'DELETE' });
      setSuccessMessage('Dean removed successfully.');
      await loadData();
    } catch (err) {
      setActionError(err.message);
    }
  };

  if (loading) return <div className="p-8 text-center text-academic-muted">Loading deans...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6 flex justify-between items-center border-b border-academic-border pb-4">
        <div>
          <h1 className="text-2xl font-bold text-academic-heading mb-1">Deans</h1>
          <Link to="/admin/dashboard" className="text-academic-primary hover:underline text-sm">&larr; Back to Dashboard</Link>
        </div>
      </div>

      {error && <div className="bg-red-50 border-l-4 border-academic-error p-4 mb-6 text-academic-error text-sm">{error}</div>}
      {actionError && <div className="bg-red-50 border-l-4 border-academic-error p-4 mb-6 text-academic-error text-sm">{actionError}</div>}
      {successMessage && <div className="bg-green-50 border-l-4 border-academic-success p-4 mb-6 text-academic-success text-sm">{successMessage}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-8">
          <div className="card card-accent">
            <div className="card-header bg-[#FBFBFA]">
              <h2 className="text-lg font-bold text-academic-heading m-0">Dean Registration</h2>
            </div>
            <div className="card-body">
              <form onSubmit={handleRegisterDean} className="space-y-4">
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input name="name" className="form-input" required value={deanForm.name} onChange={handleDeanInputChange} />
                </div>
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input name="email" type="email" className="form-input" required value={deanForm.email} onChange={handleDeanInputChange} />
                </div>
                <PasswordField
                  label="Password"
                  name="password"
                  value={deanForm.password}
                  onChange={handleDeanInputChange}
                  autoComplete="new-password"
                />
                <PasswordField
                  label="Confirm Password"
                  name="confirm_password"
                  value={deanForm.confirm_password}
                  onChange={handleDeanInputChange}
                  autoComplete="new-password"
                  helpText="At least 8 characters with letters and numbers."
                />
                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <input name="phone_number" className="form-input" value={deanForm.phone_number} onChange={handleDeanInputChange} />
                </div>
                <div className="form-group">
                  <label className="form-label">Teacher/Employee ID</label>
                  <input name="employee_id" className="form-input" required value={deanForm.employee_id} onChange={handleDeanInputChange} />
                </div>
                <div className="form-group">
                  <label className="form-label">Department</label>
                  <select name="department_id" className="form-input" required value={deanForm.department_id} onChange={handleDeanInputChange}>
                    <option value="">Select department</option>
                    {departments.map((department) => (
                      <option key={department.id} value={department.id}>
                        {department.name}{department.dean_name ? ` · Dean: ${department.dean_name}` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Qualification</label>
                  <input name="qualification" className="form-input" value={deanForm.qualification} onChange={handleDeanInputChange} />
                </div>
                <div className="form-group">
                  <label className="form-label">Date of Birth</label>
                  <input name="date_of_birth" type="date" className="form-input" value={deanForm.date_of_birth} onChange={handleDeanInputChange} />
                </div>
                <div className="form-group">
                  <label className="form-label">Address</label>
                  <textarea name="address" rows="2" className="form-input" value={deanForm.address} onChange={handleDeanInputChange} />
                </div>
                <div className="form-group">
                  <label className="form-label">Professional Information</label>
                  <textarea name="professional_info" rows="2" className="form-input" value={deanForm.professional_info} onChange={handleDeanInputChange} />
                </div>
                <button type="submit" disabled={submitting} className="btn btn-primary w-full">
                  {submitting ? 'Registering...' : 'Register Dean'}
                </button>
              </form>
            </div>
          </div>

          <div className="card card-accent">
            <div className="card-header bg-[#FBFBFA]">
              <h2 className="text-lg font-bold text-academic-heading m-0">Assign Dean</h2>
            </div>
            <div className="card-body">
              <form onSubmit={handleAssign} className="space-y-4">
                <div className="form-group">
                  <label className="form-label">Approved Teacher</label>
                  <select className="form-input" required value={teacherId} onChange={(e) => setTeacherId(e.target.value)}>
                    <option value="">Select teacher</option>
                    {teachers.map((teacher) => (
                      <option key={teacher.id} value={teacher.id}>
                        {teacher.name} · {teacher.department_name || 'No department'}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Department</label>
                  <select className="form-input" required value={departmentId} onChange={(e) => setDepartmentId(e.target.value)}>
                    <option value="">Select department</option>
                    {departments.map((department) => (
                      <option key={department.id} value={department.id}>
                        {department.name}{department.dean_name ? ` · Dean: ${department.dean_name}` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <button type="submit" disabled={submitting} className="btn btn-primary w-full">
                  {submitting ? 'Assigning...' : 'Assign as Dean'}
                </button>
              </form>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Dean</th>
                  <th>Employee ID</th>
                  <th>Email</th>
                  <th>Department</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {deans.length === 0 ? (
                  <tr><td colSpan="6" className="text-center py-6 text-academic-muted">No deans assigned.</td></tr>
                ) : (
                  deans.map((dean) => (
                    <tr key={dean.id}>
                      <td className="font-medium text-academic-text">{dean.name}</td>
                      <td>{dean.teacher_profile?.employee_id || '-'}</td>
                      <td>{dean.email}</td>
                      <td>{dean.department_name || '-'}</td>
                      <td>{dean.status === 'approved' ? <span className="status-active">Approved</span> : <span className="status-badge">{dean.status}</span>}</td>
                      <td>
                        <button onClick={() => handleRemove(dean.id)} className="text-academic-error hover:underline text-sm">
                          Remove Dean
                        </button>
                      </td>
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

export default AdminDeans;
