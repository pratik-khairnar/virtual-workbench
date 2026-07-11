import React from 'react';
import './WorkspaceCard.css';

function WorkspaceCard({ workspace, onDelete }) {
  const { id, name, status, cloudProvider, createdAt } = workspace;

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="workspace-card">
      <div className="card-header">
        <span className={`provider-badge ${cloudProvider.toLowerCase()}`}>
          {cloudProvider}
        </span>
        <span className={`status-badge ${status.toLowerCase()}`}>
          <span className="status-dot"></span>
          {status}
        </span>
      </div>

      <h3 className="workspace-name">{name}</h3>

      <div className="workspace-metadata">
        <div className="metadata-row">
          <span className="metadata-label">Workspace ID</span>
          <span className="metadata-value code-text">{id}</span>
        </div>
        <div className="metadata-row">
          <span className="metadata-label">Created At</span>
          <span className="metadata-value">{formatDate(createdAt)}</span>
        </div>
      </div>

      <div className="card-actions">
        <button 
          className="btn-connect" 
          disabled={status.toLowerCase() !== 'running'}
          onClick={() => alert(`Connecting to ${name}...`)}
        >
          Connect SSH
        </button>
        <button 
          className="btn-terminate" 
          onClick={() => onDelete(id)}
          title="Terminate Workspace"
        >
          🗑️
        </button>
      </div>
    </div>
  );
}

export default WorkspaceCard;
