import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './WorkspaceCreate.css';

function WorkspaceCreate() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    provider: '',
    baseImage: '',
    instanceSize: '',
  });

  const [formErrors, setFormErrors] = useState({
    name: '',
  });

  const [isFormValid, setIsFormValid] = useState(false);

  // Validate form entries on state updates
  useEffect(() => {
    const isNameValid = formData.name.trim().length >= 3 && /^[a-zA-Z0-9-]+$/.test(formData.name);
    const hasProvider = formData.provider !== '';
    const hasImage = formData.baseImage !== '';
    const hasInstance = formData.instanceSize !== '';

    setIsFormValid(isNameValid && hasProvider && hasImage && hasInstance);
  }, [formData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Add validation feedback on typing
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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isFormValid) return;

    // Log the created payload
    console.log('Provisioning new cloud workspace payload:', formData);
    
    alert(
      `Workspace provisioning request submitted!\n\n` +
      `Name: ${formData.name}\n` +
      `Provider: ${formData.provider.toUpperCase()}\n` +
      `Image: ${formData.baseImage}\n` +
      `Instance: ${formData.instanceSize}`
    );

    // Redirect to dashboard page
    navigate('/');
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
            placeholder="e.g. frontend-sandbox"
            className={`form-input ${formErrors.name ? 'input-error' : ''}`}
            required
            maxLength={30}
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
          >
            <option value="" disabled>-- Select a cloud partner --</option>
            <option value="aws">Amazon Web Services (AWS)</option>
            <option value="azure">Microsoft Azure</option>
            <option value="gcp">Google Cloud Platform (GCP)</option>
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
            >
              <option value="" disabled>-- Select base system image --</option>
              <option value="ubuntu-22.04">Ubuntu Server 22.04 LTS (Node/Python pre-configured)</option>
              <option value="amazon-linux-2023">Amazon Linux 2023 (AWS-CLI optimized)</option>
              <option value="debian-12">Debian 12 Bookworm (Minimal clean environment)</option>
              <option value="windows-server-2022">Windows Server 2022 (IIS/PowerShell base)</option>
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
            >
              <option value="" disabled>-- Select machine footprint --</option>
              <option value="small">Micro Sandbox (1 vCPU, 2GB RAM)</option>
              <option value="medium">Standard Workspace (2 vCPU, 4GB RAM)</option>
              <option value="large">Compute Heavy (4 vCPU, 16GB RAM)</option>
              <option value="gpu">GPU Optimized Sandbox (8 vCPU, 32GB RAM + NVIDIA T4)</option>
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
            disabled={!isFormValid}
          >
            Provision Machine
          </button>
        </div>
      </form>
    </div>
  );
}

export default WorkspaceCreate;
