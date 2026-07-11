import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './WorkspaceCreate.css';

function WorkspaceCreate() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    provider: 'aws',
    region: 'us-east-1',
    instanceType: 't3.medium',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Provisioning workspace:', formData);
    // Day 1 dummy redirect
    alert(`Workspace Provisioning Initialized: ${formData.name}`);
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
        <p className="page-subtitle">Deploy a dedicated cloud development machine pre-configured with your resources.</p>
      </div>

      <form className="create-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name" className="form-label">Workspace Name</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="e.g. backend-dev-box"
            className="form-input"
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">Cloud Provider</label>
          <div className="provider-options">
            <label className={`provider-radio ${formData.provider === 'aws' ? 'active' : ''}`}>
              <input
                type="radio"
                name="provider"
                value="aws"
                checked={formData.provider === 'aws'}
                onChange={handleChange}
              />
              <span className="radio-label">Amazon Web Services</span>
            </label>
            <label className={`provider-radio ${formData.provider === 'gcp' ? 'active' : ''}`}>
              <input
                type="radio"
                name="provider"
                value="gcp"
                checked={formData.provider === 'gcp'}
                onChange={handleChange}
              />
              <span className="radio-label">Google Cloud Platform</span>
            </label>
          </div>
        </div>

        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="region" className="form-label">Region</label>
            <select
              id="region"
              name="region"
              value={formData.region}
              onChange={handleChange}
              className="form-select"
            >
              <option value="us-east-1">us-east-1 (N. Virginia)</option>
              <option value="us-west-2">us-west-2 (Oregon)</option>
              <option value="eu-west-1">eu-west-1 (Ireland)</option>
              <option value="ap-southeast-1">ap-southeast-1 (Singapore)</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="instanceType" className="form-label">Instance Type</label>
            <select
              id="instanceType"
              name="instanceType"
              value={formData.instanceType}
              onChange={handleChange}
              className="form-select"
            >
              <option value="t3.medium">t3.medium (2 vCPU, 4GB RAM)</option>
              <option value="t3.large">t3.large (2 vCPU, 8GB RAM)</option>
              <option value="c5.large">c5.large (2 vCPU, 4GB RAM - Compute)</option>
              <option value="g4dn.xlarge">g4dn.xlarge (4 vCPU, 16GB RAM - GPU)</option>
            </select>
          </div>
        </div>

        <div className="form-actions">
          <Link to="/" className="btn-cancel">
            Cancel
          </Link>
          <button type="submit" className="btn-submit">
            Provision Machine
          </button>
        </div>
      </form>
    </div>
  );
}

export default WorkspaceCreate;
