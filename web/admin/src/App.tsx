import React, { useState } from 'react';
import AppProviders from './contexts/AppProviders';
import AdminLayout from './components/layout/AdminLayout';
import LoginPage from './pages/LoginPage';
import DashboardOverviewPage from './pages/DashboardOverviewPage';
import UserManagementPage from './pages/UserManagementPage';
import JobsManagementPage from './pages/JobsManagementPage';
import DataExplorerPage from './pages/DataExplorerPage';
import APITestInterfacePage from './pages/APITestInterfacePage';
import PermissionsManagementPage from './pages/PermissionsManagementPage';
import MinioTestPage from './pages/MinioTestPage';
import { useAuth } from './contexts/AuthContext';

const AppContent: React.FC = () => {
  const { isAuthenticated, logout } = useAuth();
  const [currentView, setCurrentView] = useState('dashboard');

  const handleViewChange = (view: string) => {
    setCurrentView(view);
  };

  const handleLogout = () => {
    logout();
    setCurrentView('dashboard');
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

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <AdminLayout
      currentView={currentView}
      onViewChange={handleViewChange}
      onLogout={handleLogout}
    >
      {renderCurrentPage()}
    </AdminLayout>
  );
};

function App() {
  return (
    <AppProviders>
      <AppContent />
    </AppProviders>
  );
}

export default App;