import React from 'react';
import { Link, Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import './DashboardLayout.css';

function DashboardLayout() {
  return (
    <div className="layout-container">
      <header className="layout-header">
        <div className="logo-container">
          <div className="logo-icon"></div>
          <span className="logo-text">AWS Workbench</span>
        </div>
        <div className="header-actions">
          <span className="user-profile">👤 admin@cloudbench.io</span>
        </div>
      </header>
      
      <div className="layout-body">
        <Sidebar />
        <main className="layout-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;
