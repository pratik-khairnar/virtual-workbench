import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import './DashboardLayout.css';

function DashboardLayout() {
  const location = useLocation();

  return (
    <div className="layout-container">
      <header className="layout-header">
        <div className="logo-container">
          <div className="logo-icon"></div>
          <span className="logo-text">AWS Workbench</span>
        </div>
        <nav className="layout-nav">
          <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>Dashboard</Link>
          <Link to="/workspaces/new" className="nav-link btn-provision">+ Provision Workspace</Link>
        </nav>
      </header>
      <main className="layout-content">
        <Outlet />
      </main>
    </div>
  );
}

export default DashboardLayout;
