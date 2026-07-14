import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getImages, createWorkspace } from '../services/workspaceService';
import './WorkspaceCreate.css';

function WorkspaceCreate() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    provider: '',
    baseImage: '', // Will hold image_id UUID
    instanceSize: 'medium', // Default
  });

  const [images, setImages] = useState([]);
  const [loadingImages, setLoadingImages] = useState(true);
  const [formErrors, setFormErrors] = useState({ name: '' });
  const [isFormValid, setIsFormValid] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Fetch available images on mount
  useEffect(() => {
    const fetchImages = async () => {
      try {
        const data = await getImages();
        setImages(data);
      } catch (err) {
        console.error('Failed to load images:', err);
      } finally {
        setLoadingImages(false);
      }
    };
    fetchImages();
  }, []);

  // Validate form
  useEffect(() => {
    const isNameValid = formData.name.trim().length >= 3 && /^[a-zA-Z0-9-]+$/.test(formData.name);
    const hasProvider = formData.provider !== '';
    const hasImage = formData.baseImage !== '';
    const hasInstance = formData.instanceSize !== '';

    setIsFormValid(isNameValid && hasProvider && hasImage && hasInstance && !submitting);
  }, [formData, submitting]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'name') {
      if (value.trim().length > 0 && value.trim().length < 3) {
        setFormErrors((prev) => ({ ...prev, name: 'Workspace name must be at least 3 characters.' }));
      } else if (value.trim().length > 0 && !/^[a-zA-Z0-9-]+$/.test(value)) {
        setFormErrors((prev) => ({ ...prev, name: 'Name must only contain alphanumeric characters and hyphens.' }));
      } else {
        setFormErrors((prev) => ({ ...prev, name: '' }));
      }
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isFormValid) return;

    try {
      setSubmitting(true);
      const payload = {
        name: formData.name,
        image_id: formData.baseImage,
        provider: formData.provider
      };

      console.log('Sending create workspace request:', payload);
      await createWorkspace(payload);
      
      alert('Workspace provisioning request submitted successfully!');
      navigate('/');
    } catch (err) {
      console.error('Error creating workspace:', err);
      alert(err.response?.data?.detail || 'Failed to provision workspace. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="create-page">
      <div className="page-breadcrumbs">
        <Link to="/" className="breadcrumb-link">Workspaces</Link>
        <span className="breadcrumb-separator">/</span>
        <span className="breadcrumb-current">New</span>
      </div>

      <div className="page-header">
        <h1 className="page-title">Provision Workspace</h1>
        <p className="page-subtitle">Configure and launch a secure, dedicated virtual machine on cloud architecture.</p>
      </div>

      <form className="create-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name" className="form-label">
            Workspace Name <span className="required-star">*</span>
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="e.g. dev-environment"
            className={`form-input ${formErrors.name ? 'input-error' : ''}`}
            required
            maxLength={30}
            disabled={submitting}
          />
          {formErrors.name ? (
            <span className="error-text">{formErrors.name}</span>
          ) : (
            <span className="helper-text">Alphanumeric characters and hyphens only. Min 3, max 30 characters.</span>
          )}
        </div>

        <div className="form-group">
          <label htmlFor="provider" className="form-label">
            Cloud Provider <span className="required-star">*</span>
          </label>
          <select
            id="provider"
            name="provider"
            value={formData.provider}
            onChange={handleChange}
            className="form-select"
            required
            disabled={submitting}
          >
            <option value="" disabled>-- Select cloud infrastructure provider --</option>
            <option value="aws">Cloud Provider Alpha</option>
            <option value="azure">Cloud Provider Beta</option>
            <option value="gcp">Cloud Provider Gamma</option>
          </select>
        </div>

        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="baseImage" className="form-label">
              Base Environment OS / Image <span className="required-star">*</span>
            </label>
            <select
              id="baseImage"
              name="baseImage"
              value={formData.baseImage}
              onChange={handleChange}
              className="form-select"
              required
              disabled={loadingImages || submitting}
            >
              <option value="" disabled>
                {loadingImages ? 'Loading images...' : '-- Select base system image --'}
              </option>
              {images.map((img) => (
                <option key={img.id} value={img.id}>
                  {img.name} ({img.os} v{img.version})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="instanceSize" className="form-label">
              Instance Size / Hardware <span className="required-star">*</span>
            </label>
            <select
              id="instanceSize"
              name="instanceSize"
              value={formData.instanceSize}
              onChange={handleChange}
              className="form-select"
              required
              disabled={submitting}
            >
              <option value="small">Micro Sandbox (1 vCPU, 2GB RAM)</option>
              <option value="medium">Standard Workspace (2 vCPU, 4GB RAM)</option>
              <option value="large">Compute Heavy (4 vCPU, 16GB RAM)</option>
              <option value="gpu">GPU Optimized Sandbox (8 vCPU, 32GB RAM + GPU)</option>
            </select>
          </div>
        </div>

        <div className="form-actions">
          <Link to="/" className="btn-cancel">
            Cancel
          </Link>
          <button 
            type="submit" 
            className="btn-submit" 
            disabled={!isFormValid || submitting}
          >
            {submitting ? 'Provisioning...' : 'Provision Machine'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default WorkspaceCreate;
