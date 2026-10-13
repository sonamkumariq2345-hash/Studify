import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchWithAuth } from '../api/api';
import { getDashboardPath } from '../utils/authPaths';
import PasswordField from '../components/PasswordField';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login, user } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    if (user) {
      navigate(getDashboardPath(user));
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      const data = await fetchWithAuth('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      
      login(data.token, data.user);
      navigate(getDashboardPath(data.user));
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-academic-background">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-8">
        <span className="font-serif font-bold text-4xl tracking-tight text-academic-primary mb-4 block">
          <span className="text-academic-heading mr-1">Studify</span>
        </span>
        <h2 className="text-2xl font-bold text-academic-heading tracking-tight border-none mb-1">
          Institutional Access
        </h2>
        <p className="text-sm text-academic-muted">
          Please sign in with your academic credentials
        </p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-academic-surface border border-academic-border p-8 rounded-sm">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border-l-4 border-academic-error p-4 mb-4">
                <p className="text-sm text-academic-error">{error}</p>
              </div>
            )}
            
            <div className="form-group">
              <label htmlFor="email" className="form-label">
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="form-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <PasswordField
              label="Password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />

            <div>
              <button type="submit" className="w-full btn btn-primary py-2 px-4">
                Sign in
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-academic-muted">
              Don't have an account?{' '}
              <Link to="/register" className="font-medium text-academic-primary hover:text-academic-primary-light">
                Register here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
