import React, { useState, useEffect, useRef } from 'react';
import { fetchWithAuth } from '../api/api';

const FileManager = () => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const loadFiles = async () => {
    try {
      const data = await fetchWithAuth('/files');
      setFiles(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFiles();
  }, []);

  const handleUpload = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    setUploading(true);
    setError('');

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/files/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData, // fetch automatically sets the correct multipart/form-data content type
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || 'Upload failed');
      }

      await loadFiles();
      if (fileInputRef.current) {
        fileInputRef.current.value = ''; // Reset input
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this file?')) return;
    
    try {
      await fetchWithAuth(`/files/${id}`, { method: 'DELETE' });
      setFiles(files.filter(f => f.id !== id));
    } catch (err) {
      alert(err.message);
    }
  };

  const formatSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  if (loading) return <div className="p-8 text-center text-academic-muted">Loading files...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-academic-heading">Document Management</h1>
        <p className="text-academic-muted mt-1">Upload and manage your assignments and identity documents.</p>
      </div>

      <div className="card mb-8">
        <div className="card-body bg-gray-50 flex flex-col items-center justify-center p-8 border-2 border-dashed border-academic-border">
          <svg className="w-12 h-12 text-academic-muted mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
          </svg>
          <p className="mb-4 text-sm text-academic-text font-medium text-center">
            Select a document to upload (PDF, DOCX, PNG, JPG).<br />
            <span className="text-academic-muted font-normal">Max size: 5MB</span>
          </p>
          
          <div>
            <input 
              type="file" 
              id="file-upload" 
              className="hidden" 
              ref={fileInputRef}
              onChange={handleUpload}
              accept=".pdf,.docx,.png,.jpg,.jpeg,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/png,image/jpeg"
            />
            <label 
              htmlFor="file-upload"
              className={`btn btn-primary cursor-pointer ${uploading ? 'opacity-75 pointer-events-none' : ''}`}
            >
              {uploading ? 'Uploading...' : 'Choose File'}
            </label>
          </div>
          {error && <p className="mt-4 text-sm text-academic-error">{error}</p>}
        </div>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Filename</th>
              <th>Date Uploaded</th>
              <th>Size</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {files.length === 0 ? (
              <tr>
                <td colSpan="4" className="text-center py-8 text-academic-muted">
                  No files uploaded yet.
                </td>
              </tr>
            ) : (
              files.map((file) => (
                <tr key={file.id}>
                  <td className="font-medium">{file.original_name}</td>
                  <td className="text-academic-muted">{formatDate(file.uploaded_at)}</td>
                  <td className="text-academic-muted">{formatSize(file.size_bytes)}</td>
                  <td>
                    <div className="flex gap-3">
                      <a 
                        href={file.download_url} 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-academic-primary hover:text-academic-primary-light font-medium text-sm"
                      >
                        Download
                      </a>
                      <button 
                        onClick={() => handleDelete(file.id)}
                        className="text-academic-error hover:text-red-700 font-medium text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FileManager;
