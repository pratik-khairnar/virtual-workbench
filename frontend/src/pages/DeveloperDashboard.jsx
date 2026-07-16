import React, { useState, useEffect } from 'react';
import { getWorkspaces, startWorkspace, stopWorkspace } from '../services/workspaceService';
import './DeveloperDashboard.css';

function DeveloperDashboard({ user }) {
  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // SSH modal state
  const [showSshModal, setShowSshModal] = useState(false);
  const [selectedWs, setSelectedWs] = useState(null);

  const fetchWorkspaces = async () => {
    try {
      const data = await getWorkspaces();
      // Filter workspaces assigned to this developer
      const assigned = data.filter(
        ws => ws.developer_id.toLowerCase() === user.email.toLowerCase()
      );
      setWorkspaces(assigned);
      setError('');
    } catch (err) {
      console.error('Failed to fetch assigned workspaces:', err);
      setError('Could not establish connection to the management server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.email) {
      fetchWorkspaces();
    }
  }, [user]);

  const handleLaunch = async (id) => {
    try {
      await startWorkspace(id);
      fetchWorkspaces();
    } catch (err) {
      alert('Launch command failed. Verify server connection.');
    }
  };

  const handleStop = async (id) => {
    try {
      await stopWorkspace(id);
      fetchWorkspaces();
    } catch (err) {
      alert('Stop command failed.');
    }
  };

  const openSsh = (ws) => {
    setSelectedWs(ws);
    setShowSshModal(true);
  };

  const closeSsh = () => {
    setShowSshModal(false);
    setSelectedWs(null);
  };

  return (
    <div className="dev-dashboard">
      <div className="dev-header">
        <h1 className="dev-title">My Developer Workstation</h1>
        <p className="dev-subtitle">Manage your cloud-provisioned sandbox environment, launch tools, and retrieve terminal parameters.</p>
      </div>

      {error && <div className="dev-error-box">{error}</div>}

      {loading ? (
        <div className="dev-loading">Retrieving sandbox configurations...</div>
      ) : workspaces.length === 0 ? (
        <div className="no-assignment-box">
          <h3>No Environment Assigned</h3>
          <p>No active sandbox workstation has been provisioned or assigned to your developer profile (<strong>{user.email}</strong>).</p>
          <p className="contact-admin-notice">Please contact your system administrator to provision a workstation with your desired profile tools.</p>
        </div>
      ) : (
        <div className="dev-workspace-list">
          {workspaces.map(ws => (
            <div className="dev-workspace-card" key={ws.id}>
              <div className="card-header">
                <div className="header-info">
                  <h2 className="card-name">{ws.name}</h2>
                  <span className="card-id">ID: {ws.id}</span>
                </div>
                <div className="header-status">
                  <span className={`status-badge status-${ws.status.toLowerCase()}`}>
                    STATUS: {ws.status}
                  </span>
                </div>
              </div>

              <div className="card-body">
                {/* Main Action Banner */}
                <div className="action-panel">
                  {ws.status === 'STOPPED' && (
                    <div className="action-prompt stopped">
                      <p className="action-text">Your workstation server is currently powered down. Launch the server to activate the Web IDE and SSH shell.</p>
                      <button onClick={() => handleLaunch(ws.id)} className="btn-dev-action btn-launch">
                        Launch Workbench
                      </button>
                    </div>
                  )}

                  {ws.status === 'RUNNING' && (
                    <div className="action-prompt running">
                      <p className="action-text">Your workstation server is active and running in the cloud. Select an entry option below.</p>
                      <div className="active-options">
                        {ws.workspace_url && (
                          <a href={ws.workspace_url} target="_blank" rel="noopener noreferrer" className="btn-dev-action btn-ide">
                            Launch Web IDE (VS Code)
                          </a>
                        )}
                        <button onClick={() => openSsh(ws)} className="btn-dev-action btn-ssh">
                          Retrieve SSH Parameters
                        </button>
                        <button onClick={() => handleStop(ws.id)} className="btn-dev-action btn-stop-dev">
                          Stop Workbench
                        </button>
                      </div>
                    </div>
                  )}

                  {ws.status === 'CREATING' && (
                    <div className="action-prompt pending">
                      <p className="action-text">Your workstation sandbox is currently being provisioned on the cloud hypervisor. This takes 1-2 minutes. Please standby...</p>
                      <button className="btn-dev-action btn-disabled" disabled>
                        Provisioning...
                      </button>
                    </div>
                  )}
                </div>

                {/* Environment details */}
                <div className="details-grid">
                  <div className="detail-column">
                    <h3 className="section-title">Machine Configuration</h3>
                    <table className="dev-table-specs">
                      <tbody>
                        <tr>
                          <th>Cloud Provider:</th>
                          <td className="text-uppercase">{ws.provider}</td>
                        </tr>
                        <tr>
                          <th>Compute Profile:</th>
                          <td>{ws.specs}</td>
                        </tr>
                        <tr>
                          <th>Operating System:</th>
                          <td>{ws.image_id === '11111111-1111-1111-1111-111111111111' ? 'Standard Ubuntu 24.04 LTS' : ws.image_id === '22222222-2222-2222-2222-222222222222' ? 'Enterprise Cloud Linux 2023' : ws.image_id === '33333333-3333-3333-3333-333333333333' ? 'Minimal Debian 12' : 'Custom Base OS'}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="detail-column">
                    <h3 className="section-title">Pre-Installed Software</h3>
                    <div className="dev-tools-chips">
                      {ws.tools && ws.tools.map((t, idx) => (
                        <span className="dev-tool-chip" key={idx}>{t}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* SSH Connection Modal */}
      {showSshModal && selectedWs && (
        <div className="ssh-modal-overlay">
          <div className="ssh-modal">
            <div className="ssh-modal-header">
              <h3>Secure Shell (SSH) Connection Parameters</h3>
              <button className="btn-close-modal" onClick={closeSsh}>&times;</button>
            </div>
            <div className="ssh-modal-body">
              <p>Execute the following command in your terminal client to establish a secure interactive shell session:</p>
              
              <div className="code-block-container">
                <code>
                  ssh -i secure_key.pem root@ssh-{selectedWs.id.substring(0, 8)}.cloudbench.net -p 2222
                </code>
              </div>

              <div className="modal-instructions">
                <h4>Connection Prerequisites:</h4>
                <ol>
                  <li>Ensure your private key file (<code>secure_key.pem</code>) has correct file permissions (e.g. <code>chmod 400 secure_key.pem</code>).</li>
                  <li>Ensure port <code>2222</code> is allowed egress through your organization firewall.</li>
                </ol>
              </div>
            </div>
            <div className="ssh-modal-footer">
              <button className="btn-modal-done" onClick={closeSsh}>Done</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DeveloperDashboard;
