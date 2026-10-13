import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './routes/ProtectedRoute';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Login from './pages/Login';
import Register from './pages/Register';
import CourseCatalog from './pages/CourseCatalog';
import CourseDetails from './pages/CourseDetails';
import StudentDashboard from './pages/StudentDashboard';
import FileManager from './pages/FileManager';

import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminCourses from './pages/admin/AdminCourses';
import AdminEnrollments from './pages/admin/AdminEnrollments';
import AdminTeacherRequests from './pages/admin/AdminTeacherRequests';
import AdminStudentRequests from './pages/admin/AdminStudentRequests';
import AdminDepartments from './pages/admin/AdminDepartments';
import AdminDeans from './pages/admin/AdminDeans';
import TeacherDashboard from './pages/teacher/TeacherDashboard';
import DeanDashboard from './pages/dean/DeanDashboard';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-academic-background flex flex-col">
          <Navbar />
          <main className="flex-grow">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              
              {/* Student Routes */}
              <Route element={<ProtectedRoute allowedRoles={['student']} />}>
                <Route path="/student/dashboard" element={<StudentDashboard />} />
                <Route path="/student/courses" element={<CourseCatalog />} />
                <Route path="/student/courses/:id" element={<CourseDetails />} />
                <Route path="/student/files" element={<FileManager />} />
                <Route path="/dashboard" element={<Navigate to="/student/dashboard" replace />} />
                <Route path="/courses" element={<Navigate to="/student/courses" replace />} />
                <Route path="/courses/:id" element={<CourseDetails />} />
                <Route path="/files" element={<Navigate to="/student/files" replace />} />
              </Route>

              {/* Teacher Routes */}
              <Route element={<ProtectedRoute allowedRoles={['teacher']} />}>
                <Route path="/teacher/dashboard" element={<TeacherDashboard />} />
              </Route>

              {/* Dean Routes */}
              <Route element={<ProtectedRoute allowedRoles={['dean']} />}>
                <Route path="/dean/dashboard" element={<DeanDashboard />} />
              </Route>
              
              {/* Admin Routes */}
              <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
                <Route path="/admin/users" element={<AdminUsers />} />
                <Route path="/admin/courses" element={<AdminCourses />} />
                <Route path="/admin/enrollments" element={<AdminEnrollments />} />
                <Route path="/admin/teacher-requests" element={<AdminTeacherRequests />} />
                <Route path="/admin/student-requests" element={<AdminStudentRequests />} />
                <Route path="/admin/departments" element={<AdminDepartments />} />
                <Route path="/admin/deans" element={<AdminDeans />} />
              </Route>

              {/* Default Route */}
              <Route path="/" element={<Navigate to="/login" replace />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
