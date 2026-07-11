import React from 'react';
import { Link } from 'react-router-dom';
import './Dashboard.css';

function Dashboard() {
  // Static mock data representing cloud workspaces
  const mockWorkspaces = [
    { id: 'ws-1', name: 'Dev-Sandbox-US', provider: 'AWS', region: 'us-east-1', status: 'Running', type: 't3.medium' },
    { id: 'ws-2', name: 'ML-Training-GPU', provider: 'GCP', region: 'us-central1', status: 'Stopped', type: 'n1-standard-4' },
  ];

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Cloud Workspaces</h1>
          <p className="page-subtitle">Manage, monitor, and connect to your cloud development environments.</p>
        </div>
        <Link to="/workspaces/new" className="btn-primary">
          + New Workspace
        </Link>
      </div>

      <div className="workspace-grid">
        {mockWorkspaces.map((ws) => (
          <div key={ws.id} className="workspace-card">
            <div className="card-header">
              <span className={`provider-badge ${ws.provider.toLowerCase()}`}>
                {ws.provider}
              </span>
              <span className={`status-indicator ${ws.status.toLowerCase()}`}>
                {ws.status}
              </span>
            </div>
            <h3 className="workspace-name">{ws.name}</h3>
            <div className="workspace-details">
              <div className="detail-item">
                <span className="detail-label">Region</span>
                <span className="detail-value">{ws.region}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Instance Type</span>
                <span className="detail-value">{ws.type}</span>
              </div>
            </div>
            <div className="card-actions">
              <button className="btn-secondary" disabled={ws.status !== 'Running'}>
                Connect SSH
              </button>
              <button className="btn-icon">
                ⚙️
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Dashboard;
