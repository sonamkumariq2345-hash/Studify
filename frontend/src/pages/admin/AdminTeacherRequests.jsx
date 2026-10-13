import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchWithAuth } from '../../api/api';

const formatDate = (value) => value ? new Date(value).toLocaleDateString() : '-';

const AdminTeacherRequests = () => {
  const [teachers, setTeachers] = useState([]);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');

  const loadTeachers = async () => {
    try {
      const data = await fetchWithAuth('/users/requests/teachers?status=all');
      setTeachers(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTeachers();
  }, []);

  const handleReview = async (id, status) => {
    setActionError('');
    try {
      const updatedTeacher = await fetchWithAuth(`/users/requests/teachers/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });
      setTeachers((prev) => prev.map((teacher) => teacher.id === id ? updatedTeacher : teacher));
      if (selectedTeacher?.id === id) setSelectedTeacher(updatedTeacher);
    } catch (err) {
      setActionError(err.message);
    }
  };

  if (loading) return <div className="p-8 text-center text-academic-muted">Loading teacher requests...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6 flex justify-between items-center border-b border-academic-border pb-4">
        <div>
          <h1 className="text-2xl font-bold text-academic-heading mb-1">Teacher Registration Requests</h1>
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
              <th>Employee ID</th>
              <th>Email</th>
              <th>Department</th>
              <th>Date</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {teachers.length === 0 ? (
              <tr><td colSpan="7" className="text-center py-6 text-academic-muted">No teacher requests found.</td></tr>
            ) : (
              teachers.map((teacher) => (
                <tr key={teacher.id}>
                  <td className="font-medium text-academic-text">{teacher.name}</td>
                  <td>{teacher.teacher_profile?.employee_id || '-'}</td>
                  <td>{teacher.email}</td>
                  <td>{teacher.department_name || '-'}</td>
                  <td>{formatDate(teacher.created_at)}</td>
                  <td><span className={teacher.status === 'approved' ? 'status-active' : teacher.status === 'rejected' ? 'status-inactive' : 'status-badge'}>{teacher.status}</span></td>
                  <td>
                    <div className="flex gap-3">
                      <button onClick={() => setSelectedTeacher(teacher)} className="text-academic-primary hover:underline text-sm">View</button>
                      {teacher.status !== 'approved' && (
                        <button onClick={() => handleReview(teacher.id, 'approved')} className="text-academic-success hover:underline text-sm">Approve</button>
                      )}
                      {teacher.status !== 'rejected' && (
                        <button onClick={() => handleReview(teacher.id, 'rejected')} className="text-academic-error hover:underline text-sm">Reject</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selectedTeacher && (
        <div className="card mt-8">
          <div className="card-header bg-[#FBFBFA] flex justify-between items-center">
            <h2 className="text-lg font-bold text-academic-heading m-0">{selectedTeacher.name}</h2>
            <button onClick={() => setSelectedTeacher(null)} className="text-sm text-academic-primary hover:underline">Close</button>
          </div>
          <div className="card-body grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div><span className="block text-xs uppercase tracking-widest text-academic-muted">Email</span>{selectedTeacher.email}</div>
            <div><span className="block text-xs uppercase tracking-widest text-academic-muted">Phone</span>{selectedTeacher.teacher_profile?.phone_number || '-'}</div>
            <div><span className="block text-xs uppercase tracking-widest text-academic-muted">Qualification</span>{selectedTeacher.teacher_profile?.qualification || '-'}</div>
            <div><span className="block text-xs uppercase tracking-widest text-academic-muted">Date of Birth</span>{selectedTeacher.teacher_profile?.date_of_birth || '-'}</div>
            <div className="md:col-span-2"><span className="block text-xs uppercase tracking-widest text-academic-muted">Professional Information</span>{selectedTeacher.teacher_profile?.professional_info || '-'}</div>
            <div className="md:col-span-3"><span className="block text-xs uppercase tracking-widest text-academic-muted">Address</span>{selectedTeacher.teacher_profile?.address || '-'}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTeacherRequests;
