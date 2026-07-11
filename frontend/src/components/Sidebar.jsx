import React from 'react';
import { NavLink } from 'react-router-dom';
import './Sidebar.css';

function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-group">
        <h2 className="sidebar-group-title">Provisioning</h2>
        <ul className="sidebar-list">
          <li className="sidebar-item">
            <NavLink 
              to="/" 
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              end
            >
              <span className="sidebar-link-icon">📊</span>
              Dashboard
            </NavLink>
          </li>
          <li className="sidebar-item">
            <NavLink 
              to="/workspaces/new" 
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            >
              <span className="sidebar-link-icon">🚀</span>
              Create Workspace
            </NavLink>
          </li>
        </ul>
      </div>

      <div className="sidebar-group separator">
        <h2 className="sidebar-group-title">Documentation</h2>
        <ul className="sidebar-list">
          <li className="sidebar-item">
            <a href="https://docs.aws.amazon.com/" target="_blank" rel="noopener noreferrer" className="sidebar-link">
              <span className="sidebar-link-icon">📖</span>
              AWS Documentation
            </a>
          </li>
          <li className="sidebar-item">
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="sidebar-link">
              <span className="sidebar-link-icon">💻</span>
              GitHub Repo
            </a>
          </li>
        </ul>
      </div>
    </aside>
  );
}

export default Sidebar;
