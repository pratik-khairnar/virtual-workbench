import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { register } from '../services/workspaceService';
import './Register.css';

function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'DEVELOPER',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { username, email, password, confirmPassword, role } = formData;

    if (!username || !email || !password) {
      setError('Please fill in all required fields.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await register(username, email, password, role);
      setSuccess('Account created successfully! Redirecting to sign in page...');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      console.error('Registration error:', err);
      setError(err.response?.data?.detail || 'Registration failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="register-container">
      <div className="register-box">
        <div className="register-header">
          <h2>Compute Console Portal</h2>
          <span className="register-subtitle">Create New User Account</span>
        </div>

        <form onSubmit={handleSubmit} className="register-form">
          {error && <div className="error-box">{error}</div>}
          {success && <div className="success-box">{success}</div>}

          <div className="form-group">
            <label htmlFor="username">Username <span className="required-star">*</span></label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="e.g. dev_user"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email Address <span className="required-star">*</span></label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="e.g. user@cloudbench.io"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password <span className="required-star">*</span></label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Min 8 characters"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password <span className="required-star">*</span></label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Re-type password"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="role">User Profile Role <span className="required-star">*</span></label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="form-select"
              required
              disabled={loading}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid var(--portal-border-color)',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                color: 'var(--portal-text-dark)',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="DEVELOPER" style={{ backgroundColor: 'var(--portal-navy)', color: '#fff' }}>Developer (Assigned Workbench Access)</option>
              <option value="ADMIN" style={{ backgroundColor: 'var(--portal-navy)', color: '#fff' }}>Administrator (Provision & Manage)</option>
            </select>
          </div>

          <button type="submit" className="btn-register-submit" disabled={loading}>
            {loading ? 'Creating Account...' : 'Register Account'}
          </button>
        </form>

        <div className="register-footer">
          Already have an account? <Link to="/login">Sign In instead</Link>
        </div>
      </div>
    </div>
  );
}

export default Register;
