import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import WorkspaceCard from '../components/WorkspaceCard';
import './Dashboard.css';

const INITIAL_WORKSPACES = [
  { id: 'ws-1', name: 'Dev-Sandbox-US', cloudProvider: 'AWS', status: 'Running', createdAt: '2026-07-10T10:00:00Z' },
  { id: 'ws-2', name: 'ML-Training-GPU', cloudProvider: 'GCP', status: 'Stopped', createdAt: '2026-07-09T14:30:00Z' },
  { id: 'ws-3', name: 'Web-Staging-EU', cloudProvider: 'Azure', status: 'Provisioning', createdAt: '2026-07-11T09:15:00Z' }
];

function Dashboard() {
  const [workspaces, setWorkspaces] = useState(INITIAL_WORKSPACES);

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to terminate this workspace?')) {
      setWorkspaces((prev) => prev.filter((ws) => ws.id !== id));
    }
  };

  const handleReset = () => {
    setWorkspaces(INITIAL_WORKSPACES);
  };

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">My Workspaces</h1>
          <p className="page-subtitle">View and manage your active cloud environments.</p>
        </div>
        <div className="header-buttons">
          {workspaces.length === 0 && (
            <button className="btn-reset" onClick={handleReset}>
              Reset List
            </button>
          )}
          <Link to="/workspaces/new" className="btn-primary">
            + Create Workspace
          </Link>
        </div>
      </div>

      {workspaces.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">☁️</div>
          <h2 className="empty-title">No Workspaces Found</h2>
          <p className="empty-description">
            You don't have any provisioned cloud workspaces in this region. 
            Get started by launching a new virtual workspace.
          </p>
          <Link to="/workspaces/new" className="btn-primary">
            Launch Workspace
          </Link>
        </div>
      ) : (
        <div className="workspace-grid">
          {workspaces.map((ws) => (
            <WorkspaceCard 
              key={ws.id} 
              workspace={ws} 
              onDelete={handleDelete} 
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default Dashboard;
