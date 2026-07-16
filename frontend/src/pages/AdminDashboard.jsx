import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getWorkspaces, startWorkspace, stopWorkspace, deleteWorkspace } from '../services/workspaceService';
import './AdminDashboard.css';

function AdminDashboard({ user }) {
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filtering & search states
  const [searchTerm, setSearchTerm] = useState('');
  const [providerFilter, setProviderFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchWorkspaces = async () => {
    try {
      const data = await getWorkspaces();
      setWorkspaces(data);
      setError('');
    } catch (err) {
      console.error('Failed to load workspaces:', err);
      setError('Failed to load active workspaces from server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkspaces();
  }, []);

  const handleStart = async (id) => {
    try {
      await startWorkspace(id);
      fetchWorkspaces();
    } catch (err) {
      alert('Failed to start instance');
    }
  };

  const handleStop = async (id) => {
    try {
      await stopWorkspace(id);
      fetchWorkspaces();
    } catch (err) {
      alert('Failed to stop instance');
    }
  };

  const handleTerminate = async (id) => {
    if (window.confirm('Are you sure you want to terminate this workbench instance? This action is permanent.')) {
      try {
        await deleteWorkspace(id);
        fetchWorkspaces();
      } catch (err) {
        alert('Failed to terminate instance');
      }
    }
  };

  // Metrics computation
  const totalCount = workspaces.length;
  const runningCount = workspaces.filter(w => w.status === 'RUNNING').length;
  const stoppedCount = workspaces.filter(w => w.status === 'STOPPED').length;

  // Filter workspaces
  const filteredWorkspaces = workspaces.filter(ws => {
    const matchesSearch = 
      ws.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (ws.developer_id || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesProvider = providerFilter === '' || ws.provider === providerFilter;
    const matchesStatus = statusFilter === '' || ws.status === statusFilter;
    return matchesSearch && matchesProvider && matchesStatus;
  });

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <div>
          <h1 className="admin-title">Admin Management Console</h1>
          <p className="admin-subtitle">Monitor developer workstations, provision new sandbox instances, and manage server resources.</p>
        </div>
        <Link to="/workspaces/new" className="btn-provision-nav">
          + Provision Workbench
        </Link>
      </div>

      {error && <div className="admin-error-box">{error}</div>}

      {/* Metrics Row - Simple old school boxes */}
      <div className="metrics-row">
        <div className="metric-box">
          <span className="metric-label">Total Provisioned Workbenches</span>
          <span className="metric-value">{totalCount}</span>
        </div>
        <div className="metric-box running">
          <span className="metric-label">Running Instances</span>
          <span className="metric-value">{runningCount}</span>
        </div>
        <div className="metric-box stopped">
          <span className="metric-label">Stopped / Inactive</span>
          <span className="metric-value">{stoppedCount}</span>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="filter-toolbar">
        <div className="filter-group">
          <label htmlFor="search">Search Workstations:</label>
          <input
            type="text"
            id="search"
            placeholder="Search by name or developer email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="filter-input"
          />
        </div>

        <div className="filter-group">
          <label htmlFor="provider">Cloud Provider:</label>
          <select
            id="provider"
            value={providerFilter}
            onChange={(e) => setProviderFilter(e.target.value)}
            className="filter-select"
          >
            <option value="">-- All Providers --</option>
            <option value="aws">AWS (Alpha)</option>
            <option value="azure">Azure (Beta)</option>
            <option value="gcp">Google Cloud (Gamma)</option>
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="status">Status:</label>
          <select
            id="status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="filter-select"
          >
            <option value="">-- All Statuses --</option>
            <option value="RUNNING">RUNNING</option>
            <option value="STOPPED">STOPPED</option>
            <option value="CREATING">CREATING</option>
          </select>
        </div>
      </div>

      {/* Grid of workbenches */}
      {loading ? (
        <div className="admin-loading">Loading workstation configurations...</div>
      ) : filteredWorkspaces.length === 0 ? (
        <div className="no-workspaces-box">
          No sandbox workstations found matching the selected filters.
        </div>
      ) : (
        <div className="workspaces-grid">
          {filteredWorkspaces.map(ws => (
            <div className="workspace-panel-card" key={ws.id}>
              <div className="panel-header">
                <h3 className="panel-title">{ws.name}</h3>
                <span className={`status-tag status-${ws.status.toLowerCase()}`}>
                  {ws.status}
                </span>
              </div>
              <div className="panel-body">
                <div className="spec-item">
                  <span className="spec-label">Assigned User:</span>
                  <span className="spec-val font-bold">{ws.developer_id}</span>
                </div>
                <div className="spec-item">
                  <span className="spec-label">Hardware Profile:</span>
                  <span className="spec-val">{ws.specs}</span>
                </div>
                <div className="spec-item">
                  <span className="spec-label">Base OS Image:</span>
                  <span className="spec-val">{ws.image_id === '11111111-1111-1111-1111-111111111111' ? 'Standard Ubuntu 24.04 LTS' : ws.image_id === '22222222-2222-2222-2222-222222222222' ? 'Enterprise Cloud Linux 2023' : ws.image_id === '33333333-3333-3333-3333-333333333333' ? 'Minimal Debian 12' : 'Custom Base Image'}</span>
                </div>
                <div className="spec-item">
                  <span className="spec-label">Cloud Infrastructure:</span>
                  <span className="spec-val text-uppercase">{ws.provider}</span>
                </div>
                <div className="spec-item tools-item">
                  <span className="spec-label">Configured Software:</span>
                  <div className="tools-list">
                    {ws.tools && ws.tools.map((t, idx) => (
                      <span className="tool-tag" key={idx}>{t}</span>
                    ))}
                    {(!ws.tools || ws.tools.length === 0) && (
                      <span className="spec-val" style={{color:'#888'}}>None configured</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="panel-footer">
                <div className="control-group">
                  {ws.status === 'STOPPED' && (
                    <button onClick={() => handleStart(ws.id)} className="btn-control btn-start">
                      Start Server
                    </button>
                  )}
                  {ws.status === 'RUNNING' && (
                    <button onClick={() => handleStop(ws.id)} className="btn-control btn-stop">
                      Stop Server
                    </button>
                  )}
                  <button onClick={() => handleTerminate(ws.id)} className="btn-control btn-terminate">
                    Terminate Instance
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
