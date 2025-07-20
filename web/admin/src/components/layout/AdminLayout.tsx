import React from 'react';
import { Menu } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useSidebar } from '../../contexts/SidebarContext';
import Sidebar from './Sidebar';

interface AdminLayoutProps {
  children: React.ReactNode;
  currentView: string;
  onViewChange: (view: string) => void;
  onLogout: () => void;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ 
  children, 
  currentView, 
  onViewChange, 
  onLogout 
}) => {
  const { isDark } = useTheme();
  const { isCollapsed, setIsMobileOpen } = useSidebar();

  return (
    <div className={`min-h-screen flex transition-colors duration-200 ${
      isDark ? 'bg-gray-900' : 'bg-gray-50 dark:bg-gray-700'
    }`}>
      <Sidebar
        currentView={currentView}
        onViewChange={onViewChange}
        onLogout={onLogout}
      />
      
      {/* Main content */}
      <div className={`flex-1 transition-all duration-300 ease-in-out ${
        isCollapsed ? 'lg:ml-16' : 'lg:ml-64'
      }`}>
        {/* Mobile header */}
        <div className={`lg:hidden flex items-center justify-between p-4 border-b transition-colors duration-200 ${
          isDark ? 'bg-gray-800 border-gray-700' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
        }`}>
          <button
            onClick={() => setIsMobileOpen(true)}
            className={`p-2 rounded-lg transition-colors duration-200 ${
              isDark 
                ? 'text-gray-300 hover:text-white hover:bg-gray-700' 
                : 'text-gray-600 hover:text-gray-900 dark:text-white hover:bg-gray-100'
            }`}
          >
            <Menu className="w-5 h-5" />
          </button>
          <h1 className={`text-lg font-semibold transition-colors duration-200 ${
            isDark ? 'text-white' : 'text-gray-900 dark:text-white'
          }`}>
            Go Vibe Friend Admin
          </h1>
        </div>

        {/* Page content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;