import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout';
import Dashboard from '../pages/Dashboard';
import WorkspaceCreate from '../pages/WorkspaceCreate';
import Login from '../pages/Login';
import Register from '../pages/Register';
import { getCurrentUser } from '../services/workspaceService';

function AppRoutes() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = async () => {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const userData = JSON.parse(userStr);
      setUser(userData);
    } catch (err) {
      console.error('Session validation failed:', err);
      localStorage.removeItem('user');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('simulated_statuses'); // Clear any simulated statuses as well
    setUser(null);
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        fontFamily: 'Tahoma, sans-serif',
        fontSize: '0.9rem',
        backgroundColor: '#f7fafc',
        color: '#4a5568'
      }}>
        Initializing session console...
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Guest Routes */}
        <Route 
          path="/login" 
          element={user ? <Navigate to="/" replace /> : <Login onLoginSuccess={fetchUser} />} 
        />
        <Route 
          path="/register" 
          element={user ? <Navigate to="/" replace /> : <Register />} 
        />

        {/* Protected Console Routes */}
        <Route 
          element={
            user ? (
              <DashboardLayout user={user} onLogout={handleLogout} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        >
          <Route path="/" element={<Dashboard user={user} />} />
          <Route path="/workspaces/new" element={<WorkspaceCreate user={user} />} />
        </Route>

        {/* Fallback redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;

