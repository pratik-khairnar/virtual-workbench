import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  getWorkspaces, 
  deleteWorkspace, 
  startWorkspace, 
  stopWorkspace 
} from '../services/workspaceService';
import './Dashboard.css';

function Dashboard({ user }) {
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedWorkspace, setSelectedWorkspace] = useState(null);
  const [detailTab, setDetailTab] = useState('details'); // details, connection, specs

  const fetchWorkspaces = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getWorkspaces();
      setWorkspaces(data);
      
      // Update selected workspace reference if it still exists
      if (selectedWorkspace) {
        const updatedSelected = data.find(w => w.id === selectedWorkspace.id);
        if (updatedSelected) {
          setSelectedWorkspace(updatedSelected);
        } else {
          setSelectedWorkspace(null);
        }
      }
    } catch (err) {
      console.error('Error fetching workspaces:', err);
      setError('Could not connect to the workspace manager service.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkspaces();
  }, []);

  // Compute metrics
  const totalCount = workspaces.length;
  const runningCount = workspaces.filter(w => w.status === 'RUNNING').length;
  const stoppedCount = workspaces.filter(w => w.status === 'STOPPED').length;
  const pendingCount = workspaces.filter(w => 
    w.status === 'CREATING' || w.status === 'STARTING' || w.status === 'STOPPING'
  ).length;

  const handleStart = async () => {
    if (!selectedWorkspace) return;
    const wsId = selectedWorkspace.id;
    try {
      // Optimistic local state update
      setWorkspaces(prev => prev.map(w => w.id === wsId ? { ...w, status: 'STARTING' } : w));
      setSelectedWorkspace(prev => prev ? { ...prev, status: 'STARTING' } : null);

      await startWorkspace(wsId);
      await fetchWorkspaces();
    } catch (err) {
      console.error('Start error:', err);
      alert('Failed to start workspace: ' + (err.response?.data?.detail || err.message));
      await fetchWorkspaces();
    }
  };

  const handleStop = async () => {
    if (!selectedWorkspace) return;
    const wsId = selectedWorkspace.id;
    try {
      // Optimistic local state update
      setWorkspaces(prev => prev.map(w => w.id === wsId ? { ...w, status: 'STOPPING' } : w));
      setSelectedWorkspace(prev => prev ? { ...prev, status: 'STOPPING' } : null);

      await stopWorkspace(wsId);
      await fetchWorkspaces();
    } catch (err) {
      console.error('Stop error:', err);
      alert('Failed to stop workspace: ' + (err.response?.data?.detail || err.message));
      await fetchWorkspaces();
    }
  };

  const handleTerminate = async () => {
    if (!selectedWorkspace) return;
    const wsId = selectedWorkspace.id;
    const wsName = selectedWorkspace.name;
    if (window.confirm(`Are you sure you want to terminate workspace "${wsName}"? This action is permanent.`)) {
      try {
        setWorkspaces(prev => prev.map(w => w.id === wsId ? { ...w, status: 'DELETING' } : w));
        await deleteWorkspace(wsId);
        setSelectedWorkspace(null);
        await fetchWorkspaces();
      } catch (err) {
        console.error('Terminate error:', err);
        alert('Failed to terminate workspace: ' + (err.response?.data?.detail || err.message));
        await fetchWorkspaces();
      }
    }
  };

  const handleRowSelect = (ws) => {
    if (selectedWorkspace && selectedWorkspace.id === ws.id) {
      setSelectedWorkspace(null);
    } else {
      setSelectedWorkspace(ws);
    }
  };

  const formatProvider = (provider) => {
    if (!provider) return 'Generic Cloud';
    const lower = provider.toLowerCase();
    if (lower === 'aws') return 'Cloud Provider Alpha';
    if (lower === 'azure') return 'Cloud Provider Beta';
    if (lower === 'gcp') return 'Cloud Provider Gamma';
    return provider;
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="dashboard-page">
      <div className="page-header-console">
        <div className="title-section">
          <h1 className="page-title">Compute Workspaces</h1>
          <p className="page-subtitle">Standard cloud host instances allocated for your active session.</p>
        </div>
        <div className="header-actions-console">
          <button className="btn-refresh" onClick={fetchWorkspaces} disabled={loading}>
            Refresh Console
          </button>
          <Link to="/workspaces/new" className="btn-create-workspace">
            + Provision Workspace
          </Link>
        </div>
      </div>

      {/* Metrics Panel Grid */}
      <div className="metrics-grid">
        <div className="metric-box">
          <span className="metric-label">Total Allocated</span>
          <span className="metric-value">{totalCount}</span>
        </div>
        <div className="metric-box status-running-border">
          <span className="metric-label">Running Instances</span>
          <span className="metric-value running-color">{runningCount}</span>
        </div>
        <div className="metric-box status-stopped-border">
          <span className="metric-label">Stopped Instances</span>
          <span className="metric-value stopped-color">{stoppedCount}</span>
        </div>
        <div className="metric-box status-pending-border">
          <span className="metric-label">Transitioning / Pending</span>
          <span className="metric-value pending-color">{pendingCount}</span>
        </div>
      </div>

      {/* Instance Control Toolbar */}
      <div className="instance-toolbar">
        <button 
          className="btn-toolbar"
          disabled={!selectedWorkspace || selectedWorkspace.status !== 'STOPPED'}
          onClick={handleStart}
        >
          Start Instance
        </button>
        <button 
          className="btn-toolbar"
          disabled={!selectedWorkspace || selectedWorkspace.status !== 'RUNNING'}
          onClick={handleStop}
        >
          Stop Instance
        </button>
        <button 
          className="btn-toolbar btn-toolbar-connect"
          disabled={!selectedWorkspace || selectedWorkspace.status !== 'RUNNING'}
          onClick={() => setDetailTab('connection')}
        >
          Connect SSH
        </button>
        <button 
          className="btn-toolbar btn-toolbar-danger"
          disabled={!selectedWorkspace}
          onClick={handleTerminate}
        >
          Terminate Instance
        </button>
        {selectedWorkspace && (
          <span className="toolbar-selection-hint">
            Selected: <strong>{selectedWorkspace.name}</strong>
          </span>
        )}
      </div>

      {/* Main Workspaces Table */}
      <div className="table-container">
        {loading && workspaces.length === 0 ? (
          <div className="console-state-msg">
            <span className="spinner-icon"></span> Loading workspace records from secure catalog...
          </div>
        ) : error ? (
          <div className="console-state-msg error">
            <p>{error}</p>
            <button className="btn-create-workspace" onClick={fetchWorkspaces}>Retry Connection</button>
          </div>
        ) : workspaces.length === 0 ? (
          <div className="console-empty-state">
            <h3>No Active Workspaces Found</h3>
            <p>You currently do not have any virtual cloud hosts provisioned in this zone.</p>
            <Link to="/workspaces/new" className="btn-create-workspace">
              Provision First Machine
            </Link>
          </div>
        ) : (
          <table className="console-table">
            <thead>
              <tr>
                <th style={{ width: '40px', textAlign: 'center' }}></th>
                <th>Instance Name</th>
                <th>Status</th>
                <th>Infrastructure Provider</th>
                <th>System Image</th>
                <th>Allocated At</th>
              </tr>
            </thead>
            <tbody>
              {workspaces.map((ws) => {
                const isSelected = selectedWorkspace && selectedWorkspace.id === ws.id;
                return (
                  <tr 
                    key={ws.id} 
                    className={`table-row ${isSelected ? 'row-selected' : ''}`}
                    onClick={() => handleRowSelect(ws)}
                  >
                    <td style={{ textAlign: 'center' }} onClick={(e) => e.stopPropagation()}>
                      <input 
                        type="checkbox" 
                        checked={isSelected || false}
                        onChange={() => handleRowSelect(ws)}
                      />
                    </td>
                    <td><strong className="instance-name-text">{ws.name}</strong></td>
                    <td>
                      <span className={`status-badge-inline ${ws.status?.toLowerCase() || 'unknown'}`}>
                        <span className="status-badge-dot"></span>
                        {ws.status}
                      </span>
                    </td>
                    <td>{formatProvider(ws.provider)}</td>
                    <td>{ws.image_name}</td>
                    <td>{formatDate(ws.created_at)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Bottom Detail Panel Drawer */}
      <div className="details-panel-drawer">
        <div className="details-panel-header">
          {selectedWorkspace ? (
            <div className="details-header-info">
              <h3>Instance Details: {selectedWorkspace.name}</h3>
              <span className="details-id-text">ID: {selectedWorkspace.id}</span>
            </div>
          ) : (
            <h3>No Instance Selected</h3>
          )}
        </div>

        {selectedWorkspace ? (
          <div className="details-panel-content">
            <div className="details-tabs">
              <button 
                className={`tab-btn ${detailTab === 'details' ? 'active' : ''}`}
                onClick={() => setDetailTab('details')}
              >
                Configuration Specs
              </button>
              <button 
                className={`tab-btn ${detailTab === 'connection' ? 'active' : ''}`}
                onClick={() => setDetailTab('connection')}
              >
                SSH Connection
              </button>
              <button 
                className={`tab-btn ${detailTab === 'specs' ? 'active' : ''}`}
                onClick={() => setDetailTab('specs')}
              >
                Resource Metrics
              </button>
            </div>

            <div className="tab-pane-content">
              {detailTab === 'details' && (
                <div className="specs-grid">
                  <div className="specs-row">
                    <span className="specs-label">Host Status</span>
                    <span className="specs-value">
                      <strong className={`status-text-${selectedWorkspace.status?.toLowerCase()}`}>
                        {selectedWorkspace.status}
                      </strong>
                    </span>
                  </div>
                  <div className="specs-row">
                    <span className="specs-label">Provider Service</span>
                    <span className="specs-value">{formatProvider(selectedWorkspace.provider)}</span>
                  </div>
                  <div className="specs-row">
                    <span className="specs-label">OS System Image</span>
                    <span className="specs-value">{selectedWorkspace.image_name}</span>
                  </div>
                  <div className="specs-row">
                    <span className="specs-label">Creation Date</span>
                    <span className="specs-value">{formatDate(selectedWorkspace.created_at)}</span>
                  </div>
                  <div className="specs-row">
                    <span className="specs-label">Last Modified</span>
                    <span className="specs-value">{formatDate(selectedWorkspace.updated_at)}</span>
                  </div>
                  <div className="specs-row">
                    <span className="specs-label">Network URL</span>
                    <span className="specs-value code-text">
                      {selectedWorkspace.workspace_url || 'N/A (Stopped)'}
                    </span>
                  </div>
                </div>
              )}

              {detailTab === 'connection' && (
                <div className="connection-pane">
                  {selectedWorkspace.status === 'RUNNING' ? (
                    <div className="connection-info">
                      <p>Use the following details to connect to your secure virtual shell endpoint:</p>
                      <div className="ssh-command-box">
                        <code>
                          ssh -i secure_key.pem root@{selectedWorkspace.workspace_url ? selectedWorkspace.workspace_url.replace('https://', '') : '127.0.0.1'}
                        </code>
                      </div>
                      <span className="ssh-hint">Ensure you have generated the certificate and stored it locally with correct permission settings (chmod 400).</span>
                    </div>
                  ) : (
                    <div className="connection-offline">
                      <p className="warning-text">SSH connection endpoint is offline.</p>
                      <p>Please start the instance to provision a network URL and open firewall ports.</p>
                      <button 
                        className="btn-create-workspace"
                        disabled={selectedWorkspace.status !== 'STOPPED'}
                        onClick={handleStart}
                      >
                        Start Instance Now
                      </button>
                    </div>
                  )}
                </div>
              )}

              {detailTab === 'specs' && (
                <div className="metrics-pane">
                  <div className="metric-specs-grid">
                    <div className="metric-spec-item">
                      <span className="spec-label">Instance Size</span>
                      <span className="spec-value">Standard CPU Heavy</span>
                    </div>
                    <div className="metric-spec-item">
                      <span className="spec-label">CPU Cores</span>
                      <span className="spec-value">2 Cores (Intel Xeon vCPU)</span>
                    </div>
                    <div className="metric-spec-item">
                      <span className="spec-label">System RAM</span>
                      <span className="spec-value">4.00 GB RAM</span>
                    </div>
                    <div className="metric-spec-item">
                      <span className="spec-label">SSD Disk Block</span>
                      <span className="spec-value">30 GB (GP3 Volume)</span>
                    </div>
                  </div>
                  <div className="simulated-utilization">
                    <p>Current simulated utilization rates:</p>
                    <div className="util-bar-group">
                      <div className="util-label">CPU Load: <strong>14.5%</strong></div>
                      <div className="util-bar-bg"><div className="util-bar-fill" style={{ width: '14.5%' }}></div></div>
                    </div>
                    <div className="util-bar-group">
                      <div className="util-label">Memory Allocation: <strong>32.1%</strong></div>
                      <div className="util-bar-bg"><div className="util-bar-fill" style={{ width: '32.1%' }}></div></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="details-panel-empty">
            <p>Select a workspace instance from the table to review configuration details, access shell SSH keys, and trace metrics.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
