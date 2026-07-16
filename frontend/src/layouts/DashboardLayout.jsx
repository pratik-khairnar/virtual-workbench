import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import './DashboardLayout.css';

function DashboardLayout({ user, onLogout }) {
  return (
    <div className="layout-container">
      <header className="layout-header">
        <div className="logo-container">
          <div className="logo-icon"></div>
          <span className="logo-text">Management Console Portal</span>
        </div>
        <div className="header-actions">
          <span className="user-profile">Console Session: <strong>{user?.username}</strong></span>
          <button className="btn-logout" onClick={onLogout}>Sign Out</button>
        </div>
      </header>
      
      <div className="layout-body">
        <Sidebar user={user} />
        <main className="layout-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;

