import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { fetchWithAuth } from '../api/api';
import { useAuth } from '../context/AuthContext';
import { getDashboardPath } from '../utils/authPaths';
import PasswordField from '../components/PasswordField';

const initialStudentForm = {
  name: '',
  date_of_birth: '',
  gender: '',
  father_name: '',
  mother_name: '',
  guardian_name: '',
  phone_number: '',
  email: '',
  address: '',
  roll_number: '',
  registration_number: '',
  session: '',
  course_program: '',
  department_id: '',
  semester: '',
  enrollment_year: '',
  password: '',
  confirm_password: ''
};

const initialTeacherForm = {
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

const InputField = ({ label, name, type = 'text', value, onChange, required = true, children, ...props }) => (
  <div className="form-group">
    <label htmlFor={name} className="form-label">{label}</label>
    {children || (
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        className="form-input"
        value={value}
        onChange={onChange}
        {...props}
      />
    )}
  </div>
);

const Register = () => {
  const [registrationType, setRegistrationType] = useState('');
  const [studentForm, setStudentForm] = useState(initialStudentForm);
  const [teacherForm, setTeacherForm] = useState(initialTeacherForm);
  const [departments, setDepartments] = useState([]);
  const [loadingDepartments, setLoadingDepartments] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate(getDashboardPath(user));
  }, [user, navigate]);

  useEffect(() => {
    const loadDepartments = async () => {
      try {
        const data = await fetchWithAuth('/auth/departments');
        setDepartments(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoadingDepartments(false);
      }
    };

    loadDepartments();
  }, []);

  const selectedForm = registrationType === 'student' ? studentForm : teacherForm;
  const setSelectedForm = registrationType === 'student' ? setStudentForm : setTeacherForm;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSelectedForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleRegistrationType = (type) => {
    setRegistrationType(type);
    setError('');
    setSuccessMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (selectedForm.password !== selectedForm.confirm_password) {
      setError('Password and Confirm Password must match');
      return;
    }

    setSubmitting(true);
    try {
      const data = await fetchWithAuth('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ ...selectedForm, role: registrationType })
      });

      setSuccessMessage(data.message);
      if (registrationType === 'student') setStudentForm(initialStudentForm);
      if (registrationType === 'teacher') setTeacherForm(initialTeacherForm);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const departmentSelect = (
    <select
      id="department_id"
      name="department_id"
      required
      className="form-input"
      value={selectedForm.department_id}
      onChange={handleInputChange}
      disabled={loadingDepartments}
    >
      <option value="">Select department</option>
      {departments.map((department) => (
        <option key={department.id} value={department.id}>
          {department.name}
        </option>
      ))}
    </select>
  );

  return (
    <div className="min-h-screen py-12 sm:px-6 lg:px-8 bg-academic-background">
      <div className="sm:mx-auto sm:w-full sm:max-w-3xl text-center mb-8">
        <span className="font-serif font-bold text-4xl tracking-tight text-academic-primary mb-4 block">
          <span className="text-academic-heading mr-1">Studify</span>
        </span>
        <h2 className="text-2xl font-bold text-academic-heading tracking-tight border-none mb-1">
          Create an Account
        </h2>
        <p className="text-sm text-academic-muted">
          Submit your registration for institutional approval
        </p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-4xl">
        <div className="bg-academic-surface border border-academic-border p-6 sm:p-8 rounded-sm">
          {!registrationType && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => handleRegistrationType('student')}
                className="border border-academic-border bg-[#FBFBFA] p-6 text-left hover:border-academic-primary transition-colors"
              >
                <span className="block font-serif text-xl font-bold text-academic-heading mb-2">Student Registration</span>
                <span className="text-sm text-academic-muted">Personal, academic, and account information.</span>
              </button>
              <button
                type="button"
                onClick={() => handleRegistrationType('teacher')}
                className="border border-academic-border bg-[#FBFBFA] p-6 text-left hover:border-academic-primary transition-colors"
              >
                <span className="block font-serif text-xl font-bold text-academic-heading mb-2">Teacher Registration</span>
                <span className="text-sm text-academic-muted">Professional profile for administrator review.</span>
              </button>
            </div>
          )}

          {successMessage && (
            <div className="bg-green-50 border-l-4 border-academic-success p-4 mb-6">
              <p className="text-sm text-academic-success mb-3">{successMessage}</p>
              <Link to="/login" className="text-sm font-medium text-academic-primary hover:underline">Go to Login</Link>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border-l-4 border-academic-error p-4 mb-6">
              <p className="text-sm text-academic-error">{error}</p>
            </div>
          )}

          {registrationType && !successMessage && (
            <form className="space-y-8" onSubmit={handleSubmit}>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-academic-border pb-4">
                <div>
                  <h3 className="text-xl font-bold text-academic-heading mb-1">
                    {registrationType === 'student' ? 'Student Registration' : 'Teacher Registration'}
                  </h3>
                  <p className="text-sm text-academic-muted mb-0">All marked fields are required.</p>
                </div>
                <button type="button" onClick={() => handleRegistrationType('')} className="btn btn-secondary">
                  Change Type
                </button>
              </div>

              {registrationType === 'student' ? (
                <>
                  <section>
                    <h4 className="text-sm font-bold uppercase tracking-widest text-academic-muted border-b border-academic-border pb-2 mb-4">
                      Personal Information
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <InputField label="Full Name" name="name" value={studentForm.name} onChange={handleInputChange} />
                      <InputField label="Date of Birth" name="date_of_birth" type="date" value={studentForm.date_of_birth} onChange={handleInputChange} />
                      <InputField label="Gender" name="gender" value={studentForm.gender} onChange={handleInputChange}>
                        <select id="gender" name="gender" required className="form-input" value={studentForm.gender} onChange={handleInputChange}>
                          <option value="">Select gender</option>
                          <option value="female">Female</option>
                          <option value="male">Male</option>
                          <option value="non-binary">Non-binary</option>
                          <option value="prefer-not-to-say">Prefer not to say</option>
                        </select>
                      </InputField>
                      <InputField label="Phone Number" name="phone_number" value={studentForm.phone_number} onChange={handleInputChange} />
                      <InputField label="Father's Name" name="father_name" value={studentForm.father_name} onChange={handleInputChange} />
                      <InputField label="Mother's Name" name="mother_name" value={studentForm.mother_name} onChange={handleInputChange} />
                      <InputField label="Guardian Name" name="guardian_name" value={studentForm.guardian_name} onChange={handleInputChange} />
                      <InputField label="Email Address" name="email" type="email" value={studentForm.email} onChange={handleInputChange} />
                    </div>
                    <InputField label="Address" name="address" value={studentForm.address} onChange={handleInputChange}>
                      <textarea id="address" name="address" required rows="3" className="form-input" value={studentForm.address} onChange={handleInputChange} />
                    </InputField>
                  </section>

                  <section>
                    <h4 className="text-sm font-bold uppercase tracking-widest text-academic-muted border-b border-academic-border pb-2 mb-4">
                      Academic Information
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <InputField label="Roll Number" name="roll_number" value={studentForm.roll_number} onChange={handleInputChange} />
                      <InputField label="Registration/Admission Number" name="registration_number" value={studentForm.registration_number} onChange={handleInputChange} />
                      <InputField label="Session" name="session" value={studentForm.session} onChange={handleInputChange} placeholder="2026-2027" />
                      <InputField label="Course/Program" name="course_program" value={studentForm.course_program} onChange={handleInputChange} />
                      <InputField label="Department" name="department_id" value={studentForm.department_id} onChange={handleInputChange}>
                        {departmentSelect}
                      </InputField>
                      <InputField label="Semester" name="semester" value={studentForm.semester} onChange={handleInputChange} />
                      <InputField label="Enrollment Year" name="enrollment_year" type="number" min="1900" max="2100" value={studentForm.enrollment_year} onChange={handleInputChange} />
                    </div>
                  </section>

                  <section>
                    <h4 className="text-sm font-bold uppercase tracking-widest text-academic-muted border-b border-academic-border pb-2 mb-4">
                      Account Information
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <PasswordField label="Password" name="password" value={studentForm.password} onChange={handleInputChange} autoComplete="new-password" />
                      <PasswordField label="Confirm Password" name="confirm_password" value={studentForm.confirm_password} onChange={handleInputChange} autoComplete="new-password" />
                    </div>
                    <p className="text-xs text-academic-muted mb-0">Password must be at least 8 characters and contain letters and numbers.</p>
                  </section>
                </>
              ) : (
                <>
                  <section>
                    <h4 className="text-sm font-bold uppercase tracking-widest text-academic-muted border-b border-academic-border pb-2 mb-4">
                      Professional Information
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <InputField label="Full Name" name="name" value={teacherForm.name} onChange={handleInputChange} />
                      <InputField label="Email Address" name="email" type="email" value={teacherForm.email} onChange={handleInputChange} />
                      <InputField label="Phone Number" name="phone_number" value={teacherForm.phone_number} onChange={handleInputChange} />
                      <InputField label="Teacher/Employee ID" name="employee_id" value={teacherForm.employee_id} onChange={handleInputChange} />
                      <InputField label="Department" name="department_id" value={teacherForm.department_id} onChange={handleInputChange}>
                        {departmentSelect}
                      </InputField>
                      <InputField label="Qualification" name="qualification" value={teacherForm.qualification} onChange={handleInputChange} />
                      <InputField label="Date of Birth" name="date_of_birth" type="date" value={teacherForm.date_of_birth} onChange={handleInputChange} />
                    </div>
                    <InputField label="Address" name="address" value={teacherForm.address} onChange={handleInputChange}>
                      <textarea id="address" name="address" required rows="3" className="form-input" value={teacherForm.address} onChange={handleInputChange} />
                    </InputField>
                    <InputField label="Other Professional Information" name="professional_info" value={teacherForm.professional_info} onChange={handleInputChange} required={false}>
                      <textarea id="professional_info" name="professional_info" rows="3" className="form-input" value={teacherForm.professional_info} onChange={handleInputChange} />
                    </InputField>
                  </section>

                  <section>
                    <h4 className="text-sm font-bold uppercase tracking-widest text-academic-muted border-b border-academic-border pb-2 mb-4">
                      Account Information
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <PasswordField label="Password" name="password" value={teacherForm.password} onChange={handleInputChange} autoComplete="new-password" />
                      <PasswordField label="Confirm Password" name="confirm_password" value={teacherForm.confirm_password} onChange={handleInputChange} autoComplete="new-password" />
                    </div>
                    <p className="text-xs text-academic-muted mb-0">Password must be at least 8 characters and contain letters and numbers.</p>
                  </section>
                </>
              )}

              <div className="flex justify-end border-t border-academic-border pt-6">
                <button type="submit" disabled={submitting || loadingDepartments} className="btn btn-primary py-2 px-6">
                  {submitting ? 'Submitting...' : 'Submit Registration'}
                </button>
              </div>
            </form>
          )}

          <div className="mt-6 text-center">
            <p className="text-sm text-academic-muted">
              Already have an account?{' '}
              <Link to="/login" className="font-medium text-academic-primary hover:text-academic-primary-light">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
