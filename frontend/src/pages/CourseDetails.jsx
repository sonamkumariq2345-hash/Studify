import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchWithAuth } from '../api/api';
import { useAuth } from '../context/AuthContext';

const CourseDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [course, setCourse] = useState(null);
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [enrollError, setEnrollError] = useState('');
  const [enrolling, setEnrolling] = useState(false);
  
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    const loadCourseData = async () => {
      try {
        const [courseData, resourcesData] = await Promise.all([
          fetchWithAuth(`/courses/${id}`),
          fetchWithAuth(`/courses/${id}/resources`).catch(() => []) // if it fails, just empty array
        ]);
        setCourse(courseData);
        setResources(resourcesData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    loadCourseData();
  }, [id]);

  const handleEnroll = async () => {
    setEnrollError('');
    setEnrolling(true);
    try {
      await fetchWithAuth(`/courses/${id}/enroll`, { method: 'POST' });
      navigate('/student/dashboard'); 
    } catch (err) {
      setEnrollError(err.message);
      setEnrolling(false);
    }
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    const file = fileInputRef.current?.files[0];
    const instruction = e.target.elements.instructionInput?.value.trim();
    
    if (!file && !instruction) return;

    setUploading(true);
    setUploadError('');

    const formData = new FormData();
    if (file) {
      formData.append('file', file);
      formData.append('title', file.name);
    }
    if (instruction) formData.append('instruction', instruction);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL}/courses/${id}/resources`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error?.message || 'Upload failed');
      }

      await response.json();
      // We refetch all to get the signed URLs, or just append without it (but then download fails). Let's just refetch.
      const updatedResources = await fetchWithAuth(`/courses/${id}/resources`);
      setResources(updatedResources);
    } catch (err) {
      setUploadError(err.message);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeleteResource = async (resId) => {
    if (!window.confirm('Are you sure you want to delete this resource?')) return;
    try {
      await fetchWithAuth(`/courses/${id}/resources/${resId}`, { method: 'DELETE' });
      setResources(prev => prev.filter(r => r.id !== resId));
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <div className="p-8 text-center text-academic-muted">Loading course details...</div>;
  if (error) return <div className="p-8 text-academic-error text-center">{error}</div>;
  if (!course) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <button 
        onClick={() => navigate('/student/courses')}
        className="text-academic-primary hover:text-academic-primary-light font-medium text-sm mb-6 inline-flex items-center"
      >
        &larr; Back to Catalog
      </button>

      <div className="card shadow-md">
        <div className="card-header bg-academic-primary">
          <div className="uppercase tracking-wide text-xs font-semibold mb-2" style={{ color: '#D1B182' }}>
            {course.category || 'General'}
          </div>
          <h1 className="text-3xl font-bold mb-1 border-none" style={{ color: '#FFFFFF' }}>{course.title}</h1>
        </div>
        
        <div className="card-body p-8">
          {enrollError && (
            <div className="bg-red-50 border-l-4 border-academic-error p-4 mb-6">
              <p className="text-sm text-academic-error">{enrollError}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div className="md:col-span-2 space-y-8">
              <div>
                <h3 className="text-lg font-bold text-academic-heading mb-3">About this course</h3>
                <p className="text-academic-text whitespace-pre-wrap leading-relaxed">{course.description}</p>
              </div>

              {/* Course Resources Section */}
              <div className="border-t border-academic-border pt-8">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-academic-heading">Course Materials</h3>
                  {user?.role === 'admin' && (
                    <form onSubmit={handleFileUpload} className="flex gap-2">
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept=".pdf,.doc,.docx,.png,.jpg"
                      />
                      <input 
                        type="text" 
                        name="instructionInput" 
                        placeholder="Instruction/Message" 
                        className="form-input text-xs py-1 px-2 w-48"
                      />
                      <button 
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="btn btn-secondary text-xs whitespace-nowrap"
                      >
                        Choose File
                      </button>
                      <button 
                        type="submit"
                        disabled={uploading}
                        className="btn btn-primary text-xs whitespace-nowrap"
                      >
                        {uploading ? 'Uploading...' : 'Upload'}
                      </button>
                    </form>
                  )}
                </div>
                
                {uploadError && <p className="text-xs text-academic-error mb-3">{uploadError}</p>}
                
                {resources.length === 0 ? (
                  <div className="p-6 bg-[#FBFBFA] border border-academic-border border-dashed text-center">
                    <p className="text-sm text-academic-muted">No materials have been uploaded for this course yet.</p>
                  </div>
                ) : (
                  <ul className="divide-y divide-academic-border border border-academic-border rounded-sm">
                    {resources.map(res => (
                      <li key={res.id} className="p-4 hover:bg-gray-50 flex justify-between items-center transition-colors">
                        <div className="flex items-start gap-3">
                          {res.title && (
                            <svg className="w-5 h-5 text-academic-primary mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
                            </svg>
                          )}
                          {!res.title && (
                            <svg className="w-5 h-5 text-academic-muted mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path>
                            </svg>
                          )}
                          <div>
                            {res.title && (
                              <a href={res.download_url} target="_blank" rel="noreferrer" className="text-sm font-medium text-academic-heading hover:text-academic-primary block">
                                {res.title}
                              </a>
                            )}
                            {res.instruction && (
                              <p className={`text-xs text-academic-text bg-white p-2 border border-academic-border rounded-sm ${res.title ? 'mt-1' : ''}`}>
                                <span className="font-semibold mr-1">Message:</span>{res.instruction}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0 ml-4">
                          {res.size_bytes && <span className="text-xs text-academic-muted">{(res.size_bytes / 1024 / 1024).toFixed(2)} MB</span>}
                          {user?.role === 'admin' && (
                            <button 
                              onClick={() => handleDeleteResource(res.id)}
                              className="text-academic-error hover:underline text-xs"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            
            <div className="bg-[#FBFBFA] p-6 border border-academic-border self-start card-accent shadow-sm hover-lift">
              <h3 className="text-sm font-bold text-academic-heading uppercase tracking-wider mb-4 border-b border-academic-border pb-2">
                Course Info
              </h3>
              <div className="space-y-4">
                <div>
                  <span className="block text-xs text-academic-muted">Instructor</span>
                  <span className="font-medium text-academic-text">{course.instructor_name || 'TBA'}</span>
                </div>
                <div>
                  <span className="block text-xs text-academic-muted">Capacity</span>
                  <span className="font-medium text-academic-text">
                    {course.capacity ? `${course.capacity} students max` : 'Open Enrollment'}
                  </span>
                </div>
                {user?.role === 'student' && (
                  <div className="pt-4 border-t border-academic-border">
                    <button 
                      onClick={handleEnroll}
                      disabled={enrolling}
                      className="w-full btn btn-primary py-3"
                    >
                      {enrolling ? 'Enrolling...' : 'Enroll Now'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseDetails;
