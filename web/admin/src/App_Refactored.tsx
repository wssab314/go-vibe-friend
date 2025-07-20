import React, { useState, useEffect } from 'react';
import AppProviders from './contexts/AppProviders';
import AdminLayout from './components/layout/AdminLayout';
import LoginPage from './pages/LoginPage';
import DashboardOverviewPage from './pages/DashboardOverviewPage';
import UserManagementPage from './pages/UserManagementPage';
import MinioTestPage from './pages/MinioTestPage';

// Placeholder components for other pages (to be created later)
const JobsManagementPage = () => <div>Jobs Management - To be implemented</div>;
const DataExplorerPage = () => <div>Data Explorer - To be implemented</div>;
const LLMInterfacePage = () => <div>LLM Interface - To be implemented</div>;
const APITestInterfacePage = () => <div>API Test Interface - To be implemented</div>;
const PermissionsManagementPage = () => <div>Permissions Management - To be implemented</div>;

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentView, setCurrentView] = useState('dashboard');

  useEffect(() => {
    // Check if user is already authenticated
    const authenticated = localStorage.getItem('authenticated');
    if (authenticated === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('authenticated');
    setIsAuthenticated(false);
    setCurrentView('dashboard');
  };

  const handleViewChange = (view: string) => {
    setCurrentView(view);
  };

  const renderCurrentPage = () => {
    switch (currentView) {
      case 'dashboard':
        return <DashboardOverviewPage />;
      case 'users':
        return <UserManagementPage />;
      case 'jobs':
        return <JobsManagementPage />;
      case 'data-explorer':
        return <DataExplorerPage />;
      case 'llm':
        return <LLMInterfacePage />;
      case 'api-test':
        return <APITestInterfacePage />;
      case 'permissions':
        return <PermissionsManagementPage />;
      case 'minio-test':
        return <MinioTestPage />;
      default:
        return <DashboardOverviewPage />;
    }
  };

  return (
    <AppProviders>
      {!isAuthenticated ? (
        <LoginPage onLogin={handleLogin} />
      ) : (
        <AdminLayout
          currentView={currentView}
          onViewChange={handleViewChange}
          onLogout={handleLogout}
        >
          {renderCurrentPage()}
        </AdminLayout>
      )}
    </AppProviders>
  );
}

export default App;