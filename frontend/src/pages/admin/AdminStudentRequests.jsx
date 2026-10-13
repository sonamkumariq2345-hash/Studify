import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchWithAuth } from '../../api/api';

const formatDate = (value) => value ? new Date(value).toLocaleDateString() : '-';

const AdminStudentRequests = () => {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');

  const loadStudents = async () => {
    try {
      const data = await fetchWithAuth('/users/requests/students?status=all');
      setStudents(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, []);

  const handleReview = async (id, status) => {
    setActionError('');
    try {
      const updatedStudent = await fetchWithAuth(`/users/requests/students/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });
      setStudents((prev) => prev.map((student) => student.id === id ? updatedStudent : student));
      if (selectedStudent?.id === id) setSelectedStudent(updatedStudent);
    } catch (err) {
      setActionError(err.message);
    }
  };

  if (loading) return <div className="p-8 text-center text-academic-muted">Loading student requests...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6 flex justify-between items-center border-b border-academic-border pb-4">
        <div>
          <h1 className="text-2xl font-bold text-academic-heading mb-1">Student Registration Requests</h1>
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
              <th>Roll Number</th>
              <th>Registration Number</th>
              <th>Session</th>
              <th>Department</th>
              <th>Semester</th>
              <th>Date</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {students.length === 0 ? (
              <tr><td colSpan="9" className="text-center py-6 text-academic-muted">No student requests found.</td></tr>
            ) : (
              students.map((student) => (
                <tr key={student.id}>
                  <td className="font-medium text-academic-text">{student.name}</td>
                  <td>{student.student_profile?.roll_number || '-'}</td>
                  <td>{student.student_profile?.registration_number || '-'}</td>
                  <td>{student.student_profile?.session || '-'}</td>
                  <td>{student.department_name || '-'}</td>
                  <td>{student.student_profile?.semester || '-'}</td>
                  <td>{formatDate(student.created_at)}</td>
                  <td><span className={student.status === 'approved' ? 'status-active' : student.status === 'rejected' ? 'status-inactive' : 'status-badge'}>{student.status}</span></td>
                  <td>
                    <div className="flex gap-3">
                      <button onClick={() => setSelectedStudent(student)} className="text-academic-primary hover:underline text-sm">View</button>
                      {student.status !== 'approved' && (
                        <button onClick={() => handleReview(student.id, 'approved')} className="text-academic-success hover:underline text-sm">Approve</button>
                      )}
                      {student.status !== 'rejected' && (
                        <button onClick={() => handleReview(student.id, 'rejected')} className="text-academic-error hover:underline text-sm">Reject</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selectedStudent && (
        <div className="card mt-8">
          <div className="card-header bg-[#FBFBFA] flex justify-between items-center">
            <h2 className="text-lg font-bold text-academic-heading m-0">{selectedStudent.name}</h2>
            <button onClick={() => setSelectedStudent(null)} className="text-sm text-academic-primary hover:underline">Close</button>
          </div>
          <div className="card-body grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div><span className="block text-xs uppercase tracking-widest text-academic-muted">Email</span>{selectedStudent.email}</div>
            <div><span className="block text-xs uppercase tracking-widest text-academic-muted">Phone</span>{selectedStudent.student_profile?.phone_number || '-'}</div>
            <div><span className="block text-xs uppercase tracking-widest text-academic-muted">Program</span>{selectedStudent.student_profile?.course_program || '-'}</div>
            <div><span className="block text-xs uppercase tracking-widest text-academic-muted">Gender</span>{selectedStudent.student_profile?.gender || '-'}</div>
            <div><span className="block text-xs uppercase tracking-widest text-academic-muted">Father</span>{selectedStudent.student_profile?.father_name || '-'}</div>
            <div><span className="block text-xs uppercase tracking-widest text-academic-muted">Mother</span>{selectedStudent.student_profile?.mother_name || '-'}</div>
            <div><span className="block text-xs uppercase tracking-widest text-academic-muted">Guardian</span>{selectedStudent.student_profile?.guardian_name || '-'}</div>
            <div className="md:col-span-2"><span className="block text-xs uppercase tracking-widest text-academic-muted">Address</span>{selectedStudent.student_profile?.address || '-'}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminStudentRequests;
