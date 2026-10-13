import React, { useEffect, useState } from 'react';
import { fetchWithAuth } from '../../api/api';
import { useAuth } from '../../context/AuthContext';

const formatDate = (value) => value ? new Date(value).toLocaleDateString() : '-';

const DeanDashboard = () => {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [requests, setRequests] = useState([]);
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionError, setActionError] = useState('');

  const loadDashboard = async () => {
    try {
      const [dashboardData, requestData, studentData, teacherData] = await Promise.all([
        fetchWithAuth('/dean/dashboard'),
        fetchWithAuth('/dean/student-requests'),
        fetchWithAuth('/dean/students?status=approved'),
        fetchWithAuth('/dean/teachers')
      ]);
      setDashboard(dashboardData);
      setRequests(requestData);
      setStudents(studentData);
      setTeachers(teacherData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const handleReview = async (id, status) => {
    setActionError('');
    try {
      const updatedStudent = await fetchWithAuth(`/dean/student-requests/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });
      setRequests((prev) => prev.filter((request) => request.id !== id));
      if (status === 'approved') setStudents((prev) => [updatedStudent, ...prev]);
      if (selectedStudent?.id === id) setSelectedStudent(updatedStudent);
      await loadDashboard();
    } catch (err) {
      setActionError(err.message);
    }
  };

  if (loading) return <div className="p-8 text-center text-academic-muted">Loading dashboard...</div>;
  if (error) return <div className="p-8 text-academic-error text-center">{error}</div>;

  const counts = dashboard?.counts || {};
  const department = dashboard?.department;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8 border-b border-academic-border pb-4">
        <h1 className="text-3xl font-bold text-academic-heading">Dean Dashboard</h1>
        <p className="text-academic-muted mt-1">
          {department?.name || user?.teacher_profile?.department_name || 'Department'} · {user?.name}
        </p>
      </div>

      {actionError && <div className="bg-red-50 border-l-4 border-academic-error p-4 mb-6 text-academic-error text-sm">{actionError}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <aside className="lg:col-span-1">
          <div className="card card-accent">
            <div className="card-header bg-[#FBFBFA]">
              <h2 className="text-sm font-bold text-academic-heading uppercase tracking-widest m-0">Dean Dashboard</h2>
            </div>
            <nav className="p-0 divide-y divide-academic-border text-sm">
              {['Dashboard', 'Students', 'Student Registration Requests', 'Teachers', 'Department', 'Reports', 'Profile', 'Settings', 'Logout'].map((item) => (
                <a key={item} href={`#${item.toLowerCase().replaceAll(' ', '-')}`} className="block px-5 py-3 text-academic-text hover:text-academic-primary hover:bg-gray-50">
                  {item}
                </a>
              ))}
            </nav>
          </div>
        </aside>

        <div className="lg:col-span-3 space-y-8">
          <section id="dashboard" className="border-y border-academic-border py-6 flex flex-wrap md:flex-nowrap divide-y md:divide-y-0 md:divide-x divide-academic-border bg-[#FBFBFA]">
            <div className="w-full md:w-1/4 px-6 py-2">
              <div className="text-sm uppercase tracking-wider font-bold text-academic-muted mb-1">Approved Students</div>
              <div className="text-3xl font-serif text-academic-primary">{counts.approved_students || 0}</div>
            </div>
            <div className="w-full md:w-1/4 px-6 py-2">
              <div className="text-sm uppercase tracking-wider font-bold text-academic-muted mb-1">Pending Requests</div>
              <div className="text-3xl font-serif text-academic-primary">{counts.pending_students || 0}</div>
            </div>
            <div className="w-full md:w-1/4 px-6 py-2">
              <div className="text-sm uppercase tracking-wider font-bold text-academic-muted mb-1">Teachers</div>
              <div className="text-3xl font-serif text-academic-primary">{counts.teachers || 0}</div>
            </div>
            <div className="w-full md:w-1/4 px-6 py-2">
              <div className="text-sm uppercase tracking-wider font-bold text-academic-muted mb-1">Rejected</div>
              <div className="text-3xl font-serif text-academic-primary">{counts.rejected_students || 0}</div>
            </div>
          </section>

          <section id="student-registration-requests" className="card card-accent">
            <div className="card-header bg-[#FBFBFA]">
              <h2 className="text-lg font-bold text-academic-heading m-0">Student Registration Requests</h2>
            </div>
            <div className="table-container border-0 rounded-none">
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
                  {requests.length === 0 ? (
                    <tr><td colSpan="9" className="text-center py-6 text-academic-muted">No pending student requests.</td></tr>
                  ) : (
                    requests.map((student) => (
                      <tr key={student.id}>
                        <td className="font-medium text-academic-text">{student.name}</td>
                        <td>{student.student_profile?.roll_number || '-'}</td>
                        <td>{student.student_profile?.registration_number || '-'}</td>
                        <td>{student.student_profile?.session || '-'}</td>
                        <td>{student.department_name || '-'}</td>
                        <td>{student.student_profile?.semester || '-'}</td>
                        <td>{formatDate(student.created_at)}</td>
                        <td><span className="status-badge">{student.status}</span></td>
                        <td>
                          <div className="flex gap-3">
                            <button onClick={() => setSelectedStudent(student)} className="text-academic-primary hover:underline text-sm">View</button>
                            <button onClick={() => handleReview(student.id, 'approved')} className="text-academic-success hover:underline text-sm">Approve</button>
                            <button onClick={() => handleReview(student.id, 'rejected')} className="text-academic-error hover:underline text-sm">Reject</button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {selectedStudent && (
            <section className="card">
              <div className="card-header bg-[#FBFBFA] flex justify-between items-center">
                <h2 className="text-lg font-bold text-academic-heading m-0">{selectedStudent.name}</h2>
                <button onClick={() => setSelectedStudent(null)} className="text-sm text-academic-primary hover:underline">Close</button>
              </div>
              <div className="card-body grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div><span className="block text-xs uppercase tracking-widest text-academic-muted">Email</span>{selectedStudent.email}</div>
                <div><span className="block text-xs uppercase tracking-widest text-academic-muted">Phone</span>{selectedStudent.student_profile?.phone_number || '-'}</div>
                <div><span className="block text-xs uppercase tracking-widest text-academic-muted">Program</span>{selectedStudent.student_profile?.course_program || '-'}</div>
                <div><span className="block text-xs uppercase tracking-widest text-academic-muted">Father</span>{selectedStudent.student_profile?.father_name || '-'}</div>
                <div><span className="block text-xs uppercase tracking-widest text-academic-muted">Mother</span>{selectedStudent.student_profile?.mother_name || '-'}</div>
                <div><span className="block text-xs uppercase tracking-widest text-academic-muted">Guardian</span>{selectedStudent.student_profile?.guardian_name || '-'}</div>
                <div className="md:col-span-3"><span className="block text-xs uppercase tracking-widest text-academic-muted">Address</span>{selectedStudent.student_profile?.address || '-'}</div>
              </div>
            </section>
          )}

          <section id="students" className="card">
            <div className="card-header bg-[#FBFBFA]">
              <h2 className="text-lg font-bold text-academic-heading m-0">Students</h2>
            </div>
            <div className="table-container border-0 rounded-none">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Roll Number</th>
                    <th>Program</th>
                    <th>Semester</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {students.length === 0 ? (
                    <tr><td colSpan="5" className="text-center py-6 text-academic-muted">No approved students yet.</td></tr>
                  ) : (
                    students.map((student) => (
                      <tr key={student.id}>
                        <td className="font-medium text-academic-text">{student.name}</td>
                        <td>{student.student_profile?.roll_number || '-'}</td>
                        <td>{student.student_profile?.course_program || '-'}</td>
                        <td>{student.student_profile?.semester || '-'}</td>
                        <td><span className="status-active">{student.status}</span></td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section id="teachers" className="card">
            <div className="card-header bg-[#FBFBFA]">
              <h2 className="text-lg font-bold text-academic-heading m-0">Teachers</h2>
            </div>
            <div className="table-container border-0 rounded-none">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Employee ID</th>
                    <th>Email</th>
                    <th>Qualification</th>
                    <th>Role</th>
                  </tr>
                </thead>
                <tbody>
                  {teachers.length === 0 ? (
                    <tr><td colSpan="5" className="text-center py-6 text-academic-muted">No teachers found.</td></tr>
                  ) : (
                    teachers.map((teacher) => (
                      <tr key={teacher.id}>
                        <td className="font-medium text-academic-text">{teacher.name}</td>
                        <td>{teacher.teacher_profile?.employee_id || '-'}</td>
                        <td>{teacher.email}</td>
                        <td>{teacher.teacher_profile?.qualification || '-'}</td>
                        <td className="uppercase text-xs tracking-wider font-semibold text-academic-muted">{teacher.role}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section id="department" className="card card-accent">
            <div className="card-header bg-[#FBFBFA]">
              <h2 className="text-lg font-bold text-academic-heading m-0">Department</h2>
            </div>
            <div className="card-body grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="block text-xs uppercase tracking-widest text-academic-muted">Name</span>
                <span className="font-medium text-academic-text">{department?.name || '-'}</span>
              </div>
              <div>
                <span className="block text-xs uppercase tracking-widest text-academic-muted">Code</span>
                <span className="font-medium text-academic-text">{department?.code || '-'}</span>
              </div>
              <div className="md:col-span-2">
                <span className="block text-xs uppercase tracking-widest text-academic-muted">Dean</span>
                <span className="font-medium text-academic-text">{user?.name}</span>
              </div>
            </div>
          </section>

          <section id="reports" className="card bg-[#FBFBFA] p-6">
            <h2 className="text-lg font-bold text-academic-heading mb-4">Reports</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div><span className="block text-xs uppercase tracking-widest text-academic-muted">Approved</span>{counts.approved_students || 0}</div>
              <div><span className="block text-xs uppercase tracking-widest text-academic-muted">Pending</span>{counts.pending_students || 0}</div>
              <div><span className="block text-xs uppercase tracking-widest text-academic-muted">Rejected</span>{counts.rejected_students || 0}</div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default DeanDashboard;
