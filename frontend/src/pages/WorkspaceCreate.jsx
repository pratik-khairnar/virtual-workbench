import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getImages, createWorkspace } from '../services/workspaceService';
import './WorkspaceCreate.css';

const PRESETS = {
  frontend: {
    name: 'Frontend Developer',
    specs: 'Standard Sandbox (2 vCPU, 4GB RAM)',
    tools: ['VS Code', 'Node.js', 'React DevTools', 'Chrome Sandbox']
  },
  backend: {
    name: 'Backend Developer',
    specs: 'Compute Standard (4 vCPU, 8GB RAM)',
    tools: ['Docker', 'Python', 'PostgreSQL', 'Postman', 'Go', 'Git']
  },
  data_science: {
    name: 'Data Scientist',
    specs: 'GPU Optimized Sandbox (8 vCPU, 32GB RAM + GPU)',
    tools: ['JupyterLab', 'Anaconda', 'PyTorch', 'TensorFlow']
  },
  devops: {
    name: 'DevOps Engineer',
    specs: 'Standard Sandbox (2 vCPU, 4GB RAM)',
    tools: ['Kubernetes', 'Terraform', 'AWS CLI', 'Ansible', 'Git']
  }
};

const ALL_TOOLS = [
  'VS Code', 'Node.js', 'React DevTools', 'Chrome Sandbox',
  'Docker', 'Python', 'PostgreSQL', 'Postman', 'Go', 'Git',
  'JupyterLab', 'Anaconda', 'PyTorch', 'TensorFlow',
  'Kubernetes', 'Terraform', 'AWS CLI', 'Ansible',
  'Redis', 'MongoDB', 'Java (JDK)', 'Rust', 'DBeaver'
];

function WorkspaceCreate({ user }) {
  const navigate = useNavigate();

  // Redirect non-admin users trying to access this page directly
  useEffect(() => {
    if (user && user.role !== 'ADMIN') {
      navigate('/');
    }
  }, [user, navigate]);
  const [formData, setFormData] = useState({
    name: '',
    provider: 'aws',
    baseImage: '', // Will hold image_id UUID
    instanceSize: 'medium', // Default
    developer_id: '',
    preset: 'frontend',
  });

  const [selectedTools, setSelectedTools] = useState(PRESETS.frontend.tools);
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
        if (data.length > 0) {
          setFormData(prev => ({ ...prev, baseImage: data[0].id }));
        }
      } catch (err) {
        console.error('Failed to load images:', err);
      } finally {
        setLoadingImages(false);
      }
    };
    fetchImages();
  }, []);

  // Sync tools and default hardware size when preset changes
  const handlePresetChange = (presetKey) => {
    let size = 'medium';
    if (presetKey === 'backend') size = 'large';
    if (presetKey === 'data_science') size = 'gpu';
    if (presetKey === 'devops') size = 'medium';

    setFormData(prev => ({
      ...prev,
      preset: presetKey,
      instanceSize: size
    }));
    setSelectedTools(PRESETS[presetKey].tools);
  };

  // Toggle tools selection
  const handleToolToggle = (tool) => {
    setSelectedTools(prev => 
      prev.includes(tool) 
        ? prev.filter(t => t !== tool)
        : [...prev, tool]
    );
  };

  // Validate form
  useEffect(() => {
    const isNameValid = formData.name.trim().length >= 3 && /^[a-zA-Z0-9-]+$/.test(formData.name);
    const hasProvider = formData.provider !== '';
    const hasImage = formData.baseImage !== '';
    const hasDeveloper = formData.developer_id.trim().length > 0;

    setIsFormValid(isNameValid && hasProvider && hasImage && hasDeveloper && !submitting);
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
      
      // Determine specs display string based on hardware size
      let specsText = 'Standard Workspace (2 vCPU, 4GB RAM)';
      if (formData.instanceSize === 'small') specsText = 'Micro Sandbox (1 vCPU, 2GB RAM)';
      if (formData.instanceSize === 'large') specsText = 'Compute Heavy (4 vCPU, 16GB RAM)';
      if (formData.instanceSize === 'gpu') specsText = 'GPU Optimized Sandbox (8 vCPU, 32GB RAM + GPU)';

      const payload = {
        name: formData.name,
        image_id: formData.baseImage,
        provider: formData.provider,
        developer_id: formData.developer_id,
        preset: PRESETS[formData.preset].name,
        tools: selectedTools,
        specs: specsText
      };

      console.log('Sending provision workspace request:', payload);
      await createWorkspace(payload);
      
      alert('Workbench successfully provisioned and assigned!');
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
        <span className="breadcrumb-current">Provision</span>
      </div>

      <div className="page-header">
        <h1 className="page-title">Provision Workbench</h1>
        <p className="page-subtitle">Configure, assign, and deploy standard developer workbenches on high-capacity cloud providers.</p>
      </div>

      <form className="create-form" onSubmit={handleSubmit}>
        {/* Developer Assignment & Name */}
        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="developer_id" className="form-label">
              Assign to Developer (ID / Email) <span className="required-star">*</span>
            </label>
            <input
              type="text"
              id="developer_id"
              name="developer_id"
              value={formData.developer_id}
              onChange={handleChange}
              placeholder="e.g. dev1@kpit.com or pratik"
              className="form-input"
              required
              disabled={submitting}
            />
            <span className="helper-text">This developer will see this workbench on their dashboard.</span>
          </div>

          <div className="form-group">
            <label htmlFor="name" className="form-label">
              Workbench Name <span className="required-star">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g. adas-simulation-box"
              className={`form-input ${formErrors.name ? 'input-error' : ''}`}
              required
              maxLength={30}
              disabled={submitting}
            />
            {formErrors.name ? (
              <span className="error-text">{formErrors.name}</span>
            ) : (
              <span className="helper-text">Alphanumeric characters and hyphens only (min 3 characters).</span>
            )}
          </div>
        </div>

        {/* Cloud Configs */}
        <div className="form-grid">
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
              <option value="aws">Cloud Provider Alpha (AWS)</option>
              <option value="azure">Cloud Provider Beta (Azure)</option>
              <option value="gcp">Cloud Provider Gamma (GCP)</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="baseImage" className="form-label">
              Base OS System Image <span className="required-star">*</span>
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
                {loadingImages ? 'Loading images...' : '-- Select system image --'}
              </option>
              {images.map((img) => (
                <option key={img.id} value={img.id}>
                  {img.name} ({img.os})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Profile Presets Grid */}
        <div className="form-group">
          <label className="form-label">Select User Profile Preset</label>
          <span className="helper-text" style={{ marginBottom: '0.5rem' }}>Choosing a preset automatically checks default tools and hardware specs.</span>
          <div className="presets-grid">
            {Object.keys(PRESETS).map((key) => {
              const preset = PRESETS[key];
              const isSelected = formData.preset === key;
              return (
                <div 
                  key={key} 
                  className={`preset-card ${isSelected ? 'selected' : ''}`}
                  onClick={() => handlePresetChange(key)}
                >
                  <div className="preset-radio-indicator"></div>
                  <div className="preset-card-body">
                    <strong className="preset-name">{preset.name}</strong>
                    <span className="preset-specs">{preset.specs}</span>
                    <div className="preset-tools-preview">
                      {preset.tools.slice(0, 3).join(', ')}...
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Select & Customize Individual Tools */}
        <div className="form-group">
          <label className="form-label">Customize Installed Tools</label>
          <span className="helper-text" style={{ marginBottom: '0.75rem' }}>Select individual tools to install on the machine. Checked tools are highlighted.</span>
          <div className="tools-chips-grid">
            {ALL_TOOLS.map((tool) => {
              const isChecked = selectedTools.includes(tool);
              return (
                <button
                  type="button"
                  key={tool}
                  className={`tool-chip-btn ${isChecked ? 'active' : ''}`}
                  onClick={() => handleToolToggle(tool)}
                >
                  <span className="tool-chip-indicator">{isChecked ? '✓' : '+'}</span>
                  <span className="tool-chip-name">{tool}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Specific Hardware Selection Override */}
        <div className="form-group">
          <label htmlFor="instanceSize" className="form-label">
            Hardware Capacity Override
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
            <option value="medium">Standard Sandbox (2 vCPU, 4GB RAM)</option>
            <option value="large">Compute Heavy (4 vCPU, 16GB RAM)</option>
            <option value="gpu">GPU Optimized Sandbox (8 vCPU, 32GB RAM + GPU)</option>
          </select>
        </div>

        {/* Form Actions */}
        <div className="form-actions">
          <Link to="/" className="btn-cancel">
            Cancel
          </Link>
          <button 
            type="submit" 
            className="btn-submit" 
            disabled={!isFormValid || submitting}
          >
            {submitting ? 'Provisioning...' : 'Provision & Assign'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default WorkspaceCreate;
