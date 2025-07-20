import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Briefcase, 
  Database,
  PanelRightClose,
  LogOut, 
  X, 
  Sun, 
  Moon,
  Activity,
  HardDrive,
  Shield,
  TestTubeDiagonal
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useSidebar } from '../../contexts/SidebarContext';

interface SidebarProps {
  currentView: string;
  onViewChange: (view: string) => void;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onViewChange, onLogout }) => {
  const { isDark, toggleTheme } = useTheme();
  const { isCollapsed, setIsCollapsed, isMobileOpen, setIsMobileOpen } = useSidebar();

  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'users', label: '用户管理', icon: Users },
    { id: 'jobs', label: '任务管理', icon: Briefcase },
    { id: 'data-explorer', label: '数据浏览', icon: Database },
    { id: 'llm', label: 'LLM', icon: Activity },
    { id: 'api-test', label: 'API测试', icon: TestTubeDiagonal },
    { id: 'permissions', label: '权限管理', icon: Shield },
    { id: 'minio-test', label: 'MinIO测试', icon: HardDrive },
  ];

  const handleViewChange = (viewId: string) => {
    onViewChange(viewId);
    setIsMobileOpen(false);
  };

  return (
    <>
      {/* Mobile overlay */}
      {isMobileOpen && (
        <div 
          className="lg:hidden fixed inset-0 z-20 bg-black bg-opacity-50" 
          onClick={() => setIsMobileOpen(false)} 
        />
      )}
      
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-30 lg:fixed lg:z-auto flex flex-col transition-transform duration-300 ease-in-out ${
        isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      } ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}>
        <div className={`flex flex-col h-screen transition-colors duration-200 ${
          isDark ? 'bg-gray-800 border-gray-700' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
        } border-r`}>
          {/* Sidebar Header */}
          <div className={`flex items-center p-4 border-b transition-colors duration-200 ${
            isDark ? 'border-gray-700' : 'border-gray-200 dark:border-gray-700'
          } ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
            <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'}`}>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors duration-200 ${
                isDark ? 'bg-blue-600' : 'bg-blue-500'
              }`}>
                <Activity className="w-5 h-5 text-white" />
              </div>
              {!isCollapsed && (
                <h1 className={`text-xl font-semibold transition-colors duration-200 ${
                  isDark ? 'text-white' : 'text-gray-900 dark:text-white'
                }`}>
                  Admin
                </h1>
              )}
            </div>
            {/* Close button for mobile only */}
            {!isCollapsed && (
              <button
                onClick={() => setIsMobileOpen(false)}
                className={`lg:hidden p-2 rounded-lg transition-colors duration-200 ${
                  isDark 
                    ? 'text-gray-300 hover:text-white hover:bg-gray-700' 
                    : 'text-gray-600 hover:text-gray-900 dark:text-white hover:bg-gray-100'
                }`}
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              
              return (
                <button
                  key={item.id}
                  onClick={() => handleViewChange(item.id)}
                  className={`w-full flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                    isActive
                      ? (isDark ? 'bg-blue-600 text-white' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700')
                      : (isDark ? 'text-gray-300 hover:text-white hover:bg-gray-700' : 'text-gray-600 hover:text-gray-900 dark:text-white hover:bg-gray-100')
                  } ${isCollapsed ? 'justify-center' : ''}`}
                  title={isCollapsed ? item.label : ''}
                >
                  <Icon className={`w-5 h-5 flex-shrink-0 ${isCollapsed ? '' : 'mr-3'}`} />
                  {!isCollapsed && item.label}
                </button>
              );
            })}
          </nav>

          {/* Sidebar Footer */}
          <div className={`p-4 border-t transition-colors duration-200 ${
            isDark ? 'border-gray-700' : 'border-gray-200 dark:border-gray-700'
          }`}>
            <div className={`${isCollapsed ? 'flex flex-col space-y-2' : 'flex items-center justify-between'}`}>
              <div className={`flex items-center ${isCollapsed ? 'flex-col space-y-2' : 'space-x-2'}`}>
                {/* Theme toggle */}
                <button
                  onClick={toggleTheme}
                  className={`p-2 rounded-lg transition-colors duration-200 ${
                    isDark 
                      ? 'text-yellow-400 hover:text-yellow-300 hover:bg-gray-700' 
                      : 'text-gray-600 hover:text-gray-900 dark:text-white hover:bg-gray-100'
                  }`}
                  title={isCollapsed ? (isDark ? '切换到亮色主题' : '切换到暗色主题') : ''}
                >
                  {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </button>

                {/* Collapse toggle (desktop only) */}
                <button
                  onClick={() => setIsCollapsed(!isCollapsed)}
                  className={`hidden lg:block p-2 rounded-lg transition-colors duration-200 ${
                    isDark 
                      ? 'text-gray-400 hover:text-white hover:bg-gray-700' 
                      : 'text-gray-600 hover:text-gray-900 dark:text-white hover:bg-gray-100'
                  }`}
                  title={isCollapsed ? '展开侧边栏' : '收起侧边栏'}
                >
                  <PanelRightClose className="w-4 h-4" />
                </button>
              </div>

              {/* Logout button */}
              <button
                  onClick={onLogout}
                  className={`flex items-center justify-center rounded-lg text-sm font-medium transition-colors duration-200 min-w-[2.5rem] h-10 ${
                      isDark
                          ? 'text-red-400 hover:text-red-300 hover:bg-red-900/20'
                          : 'text-red-600 hover:text-red-700 hover:bg-red-50'
                  } ${isCollapsed ? 'w-10' : 'px-3'}`}
                  title="退出登录"
              >
                <LogOut className="w-4 h-4 flex-shrink-0" />
                {!isCollapsed && <span className="ml-2 whitespace-nowrap">退出</span>}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;