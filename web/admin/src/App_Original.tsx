import React, { useState, useEffect, createContext, useContext } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Briefcase, 
  Database, 
  Settings, 
  LogOut, 
  Menu, 
  X, 
  Sun, 
  Moon,
  Activity,
  Server,
  HardDrive,
  // TrendingUp,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  // Eye,
  // ChevronLeft,
  // ChevronRight,
  Shield,
  // UserCheck,
  TestTubeDiagonal,
  RefreshCcw,
  Play,
  Copy,
  History,
  AlertCircle,
  CheckCircle2,
  Eye
} from 'lucide-react';

import MinioTestPage from './pages/MinioTestPage';

// Theme Context
const ThemeContext = createContext<{
  isDark: boolean;
  toggleTheme: () => void;
}>({ isDark: true, toggleTheme: () => {} });

const useTheme = () => useContext(ThemeContext);

// Sidebar Context
const SidebarContext = createContext<{
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
}>({ 
  isCollapsed: false, 
  setIsCollapsed: () => {},
  isMobileOpen: false, 
  setIsMobileOpen: () => {} 
});

const useSidebar = () => useContext(SidebarContext);

// Login Page Component
const LoginPage = ({ onLogin }: { onLogin: () => void }) => {
  const { isDark } = useTheme();
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Check for admin credentials
    if (credentials.username === 'admin' && credentials.password === 'admin123') {
      try {
        // Try to authenticate with backend
        const response = await fetch('http://localhost:8080/api/admin/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: 'admin@example.com',
            password: 'admin123'
          }),
        });

        if (response.ok) {
          const data = await response.json();
          localStorage.setItem('token', data.token);
          localStorage.setItem('authenticated', 'true');
          onLogin();
        } else {
          const errorData = await response.json();
          setError('Backend authentication failed: ' + errorData.error);
        }
      } catch (error) {
        setError('Cannot connect to backend server. Please ensure the server is running.');
      }
    } else {
      setError('Invalid credentials. Please use admin/admin123');
    }
    
    setIsLoading(false);
  };

  return (
    <div className={`min-h-screen flex items-center justify-center transition-colors duration-200 ${
      isDark 
        ? 'bg-gradient-to-br from-gray-900 to-gray-800' 
        : 'bg-gradient-to-br from-blue-50 to-indigo-100'
    }`}>
      <div className={`max-w-md w-full p-8 rounded-xl shadow-lg transition-colors duration-200 ${
        isDark ? 'bg-gray-800 shadow-gray-900/50' : 'bg-white dark:bg-gray-800'
      }`}>
        <div className="text-center mb-8">
          <h1 className={`text-3xl font-bold mb-2 transition-colors duration-200 ${
            isDark ? 'text-white' : 'text-gray-900 dark:text-white'
          }`}>Go Vibe Friend</h1>
          <p className={`transition-colors duration-200 ${
            isDark ? 'text-gray-300' : 'text-gray-600'
          }`}>Admin Dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className={`block text-sm font-medium mb-2 transition-colors duration-200 ${
              isDark ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Username
            </label>
            <input
              type="text"
              value={credentials.username}
              onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 ${
                isDark 
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                  : 'bg-white dark:bg-gray-800 border-gray-300 text-gray-900 dark:text-white placeholder-gray-500'
              }`}
              placeholder="Enter username"
              required
            />
          </div>

          <div>
            <label className={`block text-sm font-medium mb-2 transition-colors duration-200 ${
              isDark ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Password
            </label>
            <input
              type="password"
              value={credentials.password}
              onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
              className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors duration-200 ${
                isDark 
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                  : 'bg-white dark:bg-gray-800 border-gray-300 text-gray-900 dark:text-white placeholder-gray-500'
              }`}
              placeholder="Enter password"
              required
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Demo credentials: admin / admin123
          </p>
        </div>
      </div>
    </div>
  );
};

// Admin Dashboard Layout Component
const AdminDashboard = ({ onLogout }: { onLogout: () => void }) => {
  const { isDark, toggleTheme } = useTheme();
  const { isCollapsed, setIsCollapsed, isMobileOpen, setIsMobileOpen } = useSidebar();
  const [currentView, setCurrentView] = useState<'dashboard' | 'users' | 'jobs' | 'llm' | 'api-test' | 'permissions' | 'data-explorer' | 'minio-test'>('dashboard');

  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'jobs', label: 'Jobs', icon: Briefcase },
    { id: 'data-explorer', label: 'Data Explorer', icon: Database },
    { id: 'llm', label: 'LLM', icon: Activity },
    { id: 'api-test', label: 'API测试', icon: TestTubeDiagonal },
    { id: 'permissions', label: '权限管理', icon: Shield },
    { id: 'minio-test', label: 'MinIO测试', icon: HardDrive },
  ];

  return (
    <div className={`min-h-screen flex transition-colors duration-200 ${
      isDark ? 'bg-gray-900' : 'bg-gray-50 dark:bg-gray-700'
    }`}>
      {/* Mobile overlay */}
      {isMobileOpen && (
        <div 
          className="lg:hidden fixed inset-0 z-20 bg-black bg-opacity-50" 
          onClick={() => setIsMobileOpen(false)} 
        />
      )}
      
      {/* Left Sidebar */}
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
                  onClick={() => {
                    setCurrentView(item.id as any);
                    setIsMobileOpen(false);
                  }}
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
                  title={isDark ? '切换到亮色主题' : '切换到暗色主题'}
                >
                  {isDark ? (
                    <Sun className="w-5 h-5" />
                  ) : (
                    <Moon className="w-5 h-5" />
                  )}
                </button>
                {/* Logout button */}
                <button
                  onClick={onLogout}
                  className={`${isCollapsed ? 'p-2' : 'flex items-center px-3 py-2'} rounded-lg transition-colors duration-200 ${
                    isDark 
                      ? 'text-gray-300 hover:text-white hover:bg-gray-700' 
                      : 'text-gray-600 hover:text-gray-900 dark:text-white hover:bg-gray-100'
                  }`}
                  title={isCollapsed ? 'Logout' : ''}
                >
                  <LogOut className={`w-5 h-5 flex-shrink-0 ${isCollapsed ? '' : 'mr-2'}`} />
                  {!isCollapsed && 'Logout'}
                </button>
              </div>
              
              {/* Collapse button for desktop - moved to bottom */}
              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className={`hidden lg:flex p-2 rounded-lg transition-colors duration-200 ${
                  isDark 
                    ? 'text-gray-300 hover:text-white hover:bg-gray-700' 
                    : 'text-gray-600 hover:text-gray-900 dark:text-white hover:bg-gray-100'
                }`}
                title={isCollapsed ? '展开侧边栏' : '折叠侧边栏'}
              >
                <Menu className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out ${
        isCollapsed ? 'lg:ml-16' : 'lg:ml-64'
      }`}>
        {/* Top Header for Mobile */}
        <header className={`lg:hidden flex items-center justify-between p-4 border-b transition-colors duration-200 ${
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
            <Menu className="w-6 h-6" />
          </button>
          <h1 className={`text-xl font-semibold transition-colors duration-200 ${
            isDark ? 'text-white' : 'text-gray-900 dark:text-white'
          }`}>
            Go Vibe Friend
          </h1>
          <div className="w-10" /> {/* Spacer for centering */}
        </header>

        {/* Main Content */}
        <main className="flex-1 p-6 min-h-screen">
          <div className={`rounded-lg shadow-sm p-6 transition-colors duration-200 ${
            isDark ? 'bg-gray-800' : 'bg-white dark:bg-gray-800'
          }`}>
            {currentView === 'dashboard' && <Dashboard />}
            {currentView === 'users' && <UsersList />}
            {currentView === 'jobs' && <JobsManagement />}
            {currentView === 'data-explorer' && <DataExplorer />}
            {currentView === 'llm' && <LLMInterface />}
            {currentView === 'api-test' && <APITestInterface />}
            {currentView === 'permissions' && <PermissionsManagement />}
            {currentView === 'minio-test' && <MinioTestPage />}
          </div>
        </main>
      </div>
    </div>
  );
};

// Users List Component
const UsersList = () => {
  const { isDark } = useTheme();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Autoload data when component mounts
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No token found. Please login first.');
        return;
      }

      const response = await fetch('http://localhost:8080/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      } else {
        if (response.status === 401) {
          setError('Authentication failed. Please login again.');
        } else {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
          setError('Failed to fetch users: ' + errorData.error);
        }
      }
    } catch (err) {
      setError('Cannot connect to backend server. Please ensure the server is running.');
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (userId: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8080/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        setUsers(users.filter(user => user.id !== userId));
      } else {
        const errorData = await response.json();
        setError('Failed to delete user: ' + errorData.error);
      }
    } catch (err) {
      setError('Error: ' + err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className={`text-2xl font-bold transition-colors duration-200 ${
          isDark ? 'text-white' : 'text-gray-900 dark:text-white'
        }`}>User Management</h2>
        <button
          onClick={fetchUsers}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {error && (
        <div className={`p-4 border rounded-lg transition-colors duration-200 ${
          isDark 
            ? 'bg-red-900/20 border-red-800 text-red-300' 
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {loading && users.length === 0 && (
        <div className="flex items-center justify-center py-12">
          <div className={`transition-colors duration-200 ${
            isDark ? 'text-gray-400' : 'text-gray-500 dark:text-gray-400'
          }`}>Loading users...</div>
        </div>
      )}

      {users.length === 0 && !loading && !error && (
        <div className={`p-8 rounded-lg text-center transition-colors duration-200 ${
          isDark ? 'bg-gray-700' : 'bg-gray-50 dark:bg-gray-700'
        }`}>
          <p className={`transition-colors duration-200 ${
            isDark ? 'text-gray-300' : 'text-gray-600'
          }`}>No users found.</p>
        </div>
      )}

      {users.length > 0 && (
        <div className="space-y-4">
          {users.map((user) => (
            <div key={user.id} className={`p-4 border rounded-lg hover:shadow-md transition-all duration-200 ${
              isDark 
                ? 'bg-gray-700 border-gray-600 hover:bg-gray-600' 
                : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-gray-700'
            }`}>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className={`font-medium transition-colors duration-200 ${
                      isDark ? 'text-gray-300' : 'text-gray-900 dark:text-white'
                    }`}>#{user.id}</span>
                    <span className="text-blue-500 font-medium">{user.username}</span>
                    <span className={`text-xs px-2 py-1 rounded-full transition-colors duration-200 ${
                      isDark ? 'bg-gray-600 text-gray-200' : 'bg-gray-100 text-gray-700'
                    }`}>{user.role}</span>
                  </div>
                  <p className={`text-sm mb-1 transition-colors duration-200 ${
                    isDark ? 'text-gray-400' : 'text-gray-600'
                  }`}>{user.email}</p>
                  <p className={`text-xs transition-colors duration-200 ${
                    isDark ? 'text-gray-500 dark:text-gray-400' : 'text-gray-500 dark:text-gray-400'
                  }`}>
                    Created: {new Date(user.created_at).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => deleteUser(user.id)}
                  className={`px-3 py-1 text-sm rounded hover:opacity-80 transition-all duration-200 ${
                    isDark 
                      ? 'bg-red-900/30 text-red-400 hover:bg-red-900/50' 
                      : 'bg-red-100 text-red-700 hover:bg-red-200'
                  }`}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
          <div className={`text-center text-sm pt-4 transition-colors duration-200 ${
            isDark ? 'text-gray-400' : 'text-gray-500 dark:text-gray-400'
          }`}>
            Total users: {users.length}
          </div>
        </div>
      )}
    </div>
  );
};

// Dashboard Component
const Dashboard = () => {
  const { isDark } = useTheme();
  const [stats, setStats] = useState<any>(null);
  const [systemInfo, setSystemInfo] = useState<any>(null);
  const [systemHealth, setSystemHealth] = useState<any>(null);
  const [jobSummary, setJobSummary] = useState<any>(null);
  const [dbCapacity, setDbCapacity] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Auto-load data when component mounts
  useEffect(() => {
    fetchDashboardData();
    // Refresh data every 30 seconds
    const interval = setInterval(fetchDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No token found. Please login first.');
        return;
      }

      // Try to fetch real data from APIs
      try {
        const [statsRes, systemRes, jobsRes] = await Promise.all([
          fetch('http://localhost:8080/api/admin/dashboard/stats', {
            headers: { 'Authorization': `Bearer ${token}` },
          }),
          fetch('http://localhost:8080/api/admin/dashboard/system', {
            headers: { 'Authorization': `Bearer ${token}` },
          }),
          fetch('http://localhost:8080/api/admin/jobs', {
            headers: { 'Authorization': `Bearer ${token}` },
          }),
        ]);

        // Handle stats response
        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats(statsData);
        }
        
        // Handle system response
        if (systemRes.ok) {
          const systemData = await systemRes.json();
          setSystemInfo(systemData);
        }

        // Handle jobs response and create summary
        if (jobsRes.ok) {
          const jobsData = await jobsRes.json();
          const jobs = jobsData.jobs || [];
          
          // Create job summary from real data
          const today = new Date().toDateString();
          const todayJobs = jobs.filter((job: any) => {
            const jobDate = new Date(job.created_at).toDateString();
            return jobDate === today;
          });

          const pending = todayJobs.filter((job: any) => job.status === 'pending').length;
          const running = todayJobs.filter((job: any) => job.status === 'in_progress' || job.status === 'running').length;
          const completed = todayJobs.filter((job: any) => job.status === 'completed').length;
          const failed = todayJobs.filter((job: any) => job.status === 'failed').length;

          // Create 24h chart data (simplified - you might want to group by hour)
          const chartData = [];
          for (let i = 0; i < 24; i += 4) {
            const hour = i.toString().padStart(2, '0') + ':00';
            const hourJobs = jobs.filter((job: any) => {
              const jobHour = new Date(job.created_at).getHours();
              return jobHour <= i;
            });
            
            chartData.push({
              time: hour,
              completed: hourJobs.filter((job: any) => job.status === 'completed').length,
              failed: hourJobs.filter((job: any) => job.status === 'failed').length
            });
          }

          setJobSummary({
            today: { pending, running, completed, failed },
            chart_data: chartData
          });
        } else {
          // No jobs or API error - show empty state
          setJobSummary({
            today: { pending: 0, running: 0, completed: 0, failed: 0 },
            chart_data: Array.from({ length: 6 }, (_, i) => ({
              time: (i * 4).toString().padStart(2, '0') + ':00',
              completed: 0,
              failed: 0
            }))
          });
        }

        // Try to fetch real system health data
        try {
          const healthRes = await fetch('http://localhost:8080/api/admin/health', {
            headers: { 'Authorization': `Bearer ${token}` },
          });
          
          if (healthRes.ok) {
            const healthData = await healthRes.json();
            setSystemHealth(healthData);
          } else {
            // Fallback to mock data with more realistic values for development
            setSystemHealth({
              uptime: '刚启动',
              cpu_usage: Number((Math.random() * 50 + 10).toFixed(2)), // 10-60% random
              memory_usage: Number((Math.random() * 40 + 30).toFixed(2)), // 30-70% random  
              memory_total: '8.0 GB',
              memory_used: '2.4 GB',
              db_connections: 1,
              db_max_connections: 100,
              queue_depth: 0
            });
          }
        } catch (err) {
          // Generate some dynamic mock data to show variation
          const now = Date.now();
          const variation = Math.sin(now / 60000) * 10; // 1-minute cycle variation
          
          setSystemHealth({
            uptime: '开发模式',
            cpu_usage: Math.max(5, Math.min(95, 25 + variation + Math.random() * 10)),
            memory_usage: Math.max(10, Math.min(90, 45 + variation + Math.random() * 15)),
            memory_total: '8.0 GB',
            memory_used: (45 + variation).toFixed(1) + '%',
            db_connections: Math.floor(Math.random() * 5) + 1,
            db_max_connections: 100,
            queue_depth: Math.floor(Math.random() * 3)
          });
        }

        // Try to fetch real database capacity data
        try {
          const dbRes = await fetch('http://localhost:8080/api/admin/database/capacity', {
            headers: { 'Authorization': `Bearer ${token}` },
          });
          
          if (dbRes.ok) {
            const dbData = await dbRes.json();
            setDbCapacity(dbData);
          } else {
            // Generate realistic mock data for development
            const tables = ['users', 'jobs', 'files', 'sessions', 'permissions', 'audit_logs'];
            const mockTables = tables.map((name, index) => {
              const baseSizes = [45, 23, 18, 12, 8, 15]; // MB
              const size = baseSizes[index] + Math.random() * 10;
              return {
                name,
                size_mb: Number(size.toFixed(1)),
                percentage: Number(((size / 121) * 100).toFixed(1))
              };
            });
            
            setDbCapacity({
              total_size: '121 MB',
              tables: mockTables
            });
          }
        } catch (err) {
          // Minimal realistic data for development
          setDbCapacity({
            total_size: '64 MB',
            tables: [
              { name: 'users', size_mb: 8.2, percentage: 45.1 },
              { name: 'sessions', size_mb: 4.3, percentage: 23.7 },
              { name: 'permissions', size_mb: 2.1, percentage: 11.6 },
              { name: 'jobs', size_mb: 1.8, percentage: 9.9 },
              { name: 'files', size_mb: 1.2, percentage: 6.6 },
              { name: 'audit_logs', size_mb: 0.6, percentage: 3.3 }
            ]
          });
        }

      } catch (err) {
        console.log('API not available, showing empty state');
        // Show empty state for job summary
        setJobSummary({
          today: { pending: 0, running: 0, completed: 0, failed: 0 },
          chart_data: Array.from({ length: 6 }, (_, i) => ({
            time: (i * 4).toString().padStart(2, '0') + ':00',
            completed: 0,
            failed: 0
          }))
        });
        
        // Still show mock data for system health and db capacity
        setSystemHealth({
          uptime: '系统刚启动',
          cpu_usage: 15.0,
          memory_usage: 32.5,
          memory_total: '8.0 GB',
          memory_used: '2.6 GB',
          db_connections: 1,
          db_max_connections: 100,
          queue_depth: 0
        });

        setDbCapacity({
          total_size: '128 MB',
          tables: [
            { name: 'users', size_mb: 12.4, percentage: 45.2 },
            { name: 'sessions', size_mb: 8.9, percentage: 32.3 },
            { name: 'permissions', size_mb: 4.1, percentage: 14.9 },
            { name: 'files', size_mb: 2.1, percentage: 7.6 }
          ]
        });
      }
    } catch (err) {
      setError('Cannot connect to backend server. Please ensure the server is running.');
    } finally {
      setLoading(false);
    }
  };

  const createSampleJobs = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8080/api/admin/jobs/sample', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        fetchDashboardData();
      }
    } catch (err) {
      setError('Error creating sample jobs: ' + err);
    }
  };

  // Function to navigate to jobs with filter
  const handleJobCardClick = (status: string) => {
    // This would typically set a filter in the jobs view
    console.log(`Navigate to jobs with status: ${status}`);
  };

  // Function to navigate to data explorer with table
  const handleTableClick = (tableName: string) => {
    // This would typically navigate to data explorer with selected table
    console.log(`Navigate to data explorer for table: ${tableName}`);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h2 className={`text-3xl font-bold transition-colors duration-200 ${
            isDark ? 'text-white' : 'text-gray-900 dark:text-white'
          }`}>Dashboard Overview</h2>
          <p className={`mt-1 text-sm transition-colors duration-200 ${
            isDark ? 'text-gray-400' : 'text-gray-600'
          }`}>
            实时监控您的系统状态和性能指标
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={fetchDashboardData}
            disabled={loading}
            className={`px-4 py-2 rounded-lg transition-colors duration-200 text-white ${
              loading 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {loading ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>刷新中...</span>
              </div>
            ) : (
              <>
                <RefreshCcw className="inline-block mr-1 w-4 h-4" />
                刷新数据
              </>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className={`p-4 border rounded-lg transition-colors duration-200 ${
          isDark 
            ? 'bg-red-900/50 border-red-700 text-red-300' 
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* System Health Status */}
      {systemHealth && (
        <div className="space-y-6">
          <div className="flex items-center space-x-2">
            <h3 className={`text-xl font-semibold transition-colors duration-200 ${
              isDark ? 'text-white' : 'text-gray-900 dark:text-white'
            }`}>系统健康状态</h3>
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          </div>
          
          {/* System Metrics Row 1: Core System */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
            {/* Uptime */}
            <div className={`group p-6 rounded-xl border transition-all duration-200 hover:shadow-lg ${
              isDark ? 'bg-gray-800/50 border-gray-700 hover:bg-gray-800' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <div className={`p-2 rounded-lg transition-colors duration-200 ${
                      isDark ? 'bg-green-500/20' : 'bg-green-100'
                    }`}>
                      <Clock className={`w-4 h-4 ${
                        isDark ? 'text-green-400' : 'text-green-600 dark:text-green-400'
                      }`} />
                    </div>
                    <p className={`text-sm font-medium transition-colors duration-200 ${
                      isDark ? 'text-gray-300' : 'text-gray-600'
                    }`}>系统运行时间</p>
                  </div>
                  <p className={`text-2xl font-bold transition-colors duration-200 ${
                    isDark ? 'text-white' : 'text-gray-900 dark:text-white'
                  }`}>{systemHealth.uptime}</p>
                  <div className={`mt-2 h-1 rounded-full ${
                    isDark ? 'bg-gray-700' : 'bg-gray-100'
                  }`}>
                    <div className="h-1 bg-green-500 rounded-full w-full transition-all duration-500"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* CPU Usage */}
            <div className={`group p-6 rounded-xl border transition-all duration-200 hover:shadow-lg ${
              isDark ? 'bg-gray-800/50 border-gray-700 hover:bg-gray-800' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300'
            }`}>
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <div className={`p-2 rounded-lg transition-colors duration-200 ${
                    isDark ? 'bg-blue-500/20' : 'bg-blue-100 dark:bg-blue-900/30'
                  }`}>
                    <Activity className={`w-4 h-4 ${
                      isDark ? 'text-blue-400' : 'text-blue-600 dark:text-blue-400'
                    }`} />
                  </div>
                  <p className={`text-sm font-medium transition-colors duration-200 ${
                    isDark ? 'text-gray-300' : 'text-gray-600'
                  }`}>CPU 使用率</p>
                </div>
                <div className="flex items-baseline space-x-2">
                  <p className={`text-2xl font-bold transition-colors duration-200 ${
                    isDark ? 'text-white' : 'text-gray-900 dark:text-white'
                  }`}>{systemHealth.cpu_usage.toFixed(1)}%</p>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    systemHealth.cpu_usage > 80 ? (isDark ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-600') :
                    systemHealth.cpu_usage > 60 ? (isDark ? 'bg-yellow-500/20 text-yellow-400' : 'bg-yellow-100 text-yellow-600') : 
                    (isDark ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-600 dark:text-green-400')
                  }`}>
                    {systemHealth.cpu_usage > 80 ? '高' : systemHealth.cpu_usage > 60 ? '中' : '低'}
                  </span>
                </div>
                <div className={`mt-3 w-full rounded-full h-2 ${
                  isDark ? 'bg-gray-700' : 'bg-gray-200'
                }`}>
                  <div 
                    className={`h-2 rounded-full transition-all duration-500 ${
                      systemHealth.cpu_usage > 80 ? 'bg-red-500' :
                      systemHealth.cpu_usage > 60 ? 'bg-yellow-500' : 'bg-blue-500'
                    }`}
                    style={{ width: `${Math.min(systemHealth.cpu_usage, 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Memory Usage */}
            <div className={`group p-6 rounded-xl border transition-all duration-200 hover:shadow-lg ${
              isDark ? 'bg-gray-800/50 border-gray-700 hover:bg-gray-800' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300'
            }`}>
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <div className={`p-2 rounded-lg transition-colors duration-200 ${
                    isDark ? 'bg-purple-500/20' : 'bg-purple-100 dark:bg-purple-900/30'
                  }`}>
                    <Server className={`w-4 h-4 ${
                      isDark ? 'text-purple-400' : 'text-purple-600 dark:text-purple-400'
                    }`} />
                  </div>
                  <p className={`text-sm font-medium transition-colors duration-200 ${
                    isDark ? 'text-gray-300' : 'text-gray-600'
                  }`}>内存使用</p>
                </div>
                <div className="flex items-baseline space-x-2">
                  <p className={`text-2xl font-bold transition-colors duration-200 ${
                    isDark ? 'text-white' : 'text-gray-900 dark:text-white'
                  }`}>{systemHealth.memory_usage.toFixed(1)}%</p>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    systemHealth.memory_usage > 80 ? (isDark ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-600') :
                    systemHealth.memory_usage > 60 ? (isDark ? 'bg-yellow-500/20 text-yellow-400' : 'bg-yellow-100 text-yellow-600') : 
                    (isDark ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-600 dark:text-green-400')
                  }`}>
                    {systemHealth.memory_usage > 80 ? '高' : systemHealth.memory_usage > 60 ? '中' : '低'}
                  </span>
                </div>
                <p className={`text-xs mt-1 transition-colors duration-200 ${
                  isDark ? 'text-gray-400' : 'text-gray-500 dark:text-gray-400'
                }`}>
                  {systemHealth.memory_used} / {systemHealth.memory_total}
                </p>
                <div className={`mt-3 w-full rounded-full h-2 ${
                  isDark ? 'bg-gray-700' : 'bg-gray-200'
                }`}>
                  <div 
                    className={`h-2 rounded-full transition-all duration-500 ${
                      systemHealth.memory_usage > 80 ? 'bg-red-500' :
                      systemHealth.memory_usage > 60 ? 'bg-yellow-500' : 'bg-purple-500'
                    }`}
                    style={{ width: `${Math.min(systemHealth.memory_usage, 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>

          {/* System Metrics Row 2: Services & Resources */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Queue Depth */}
            <div className={`group p-6 rounded-xl border transition-all duration-200 hover:shadow-lg ${
              isDark ? 'bg-gray-800/50 border-gray-700 hover:bg-gray-800' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300'
            }`}>
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <div className={`p-2 rounded-lg transition-colors duration-200 ${
                    isDark ? 'bg-indigo-500/20' : 'bg-indigo-100'
                  }`}>
                    <FileText className={`w-4 h-4 ${
                      isDark ? 'text-indigo-400' : 'text-indigo-600'
                    }`} />
                  </div>
                  <p className={`text-sm font-medium transition-colors duration-200 ${
                    isDark ? 'text-gray-300' : 'text-gray-600'
                  }`}>队列深度</p>
                </div>
                <div className="flex items-baseline space-x-2">
                  <p className={`text-2xl font-bold transition-colors duration-200 ${
                    isDark ? 'text-white' : 'text-gray-900 dark:text-white'
                  }`}>{systemHealth.queue_depth}</p>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    systemHealth.queue_depth > 10 ? (isDark ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-600') :
                    systemHealth.queue_depth > 5 ? (isDark ? 'bg-yellow-500/20 text-yellow-400' : 'bg-yellow-100 text-yellow-600') : 
                    (isDark ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-600 dark:text-green-400')
                  }`}>
                    {systemHealth.queue_depth > 10 ? '繁忙' : systemHealth.queue_depth > 5 ? '正常' : '空闲'}
                  </span>
                </div>
                <p className={`text-xs mt-1 transition-colors duration-200 ${
                  isDark ? 'text-gray-400' : 'text-gray-500 dark:text-gray-400'
                }`}>
                  待处理任务数量
                </p>
                <div className={`mt-3 w-full rounded-full h-2 ${
                  isDark ? 'bg-gray-700' : 'bg-gray-200'
                }`}>
                  <div 
                    className={`h-2 rounded-full transition-all duration-500 ${
                      systemHealth.queue_depth > 10 ? 'bg-red-500' :
                      systemHealth.queue_depth > 5 ? 'bg-yellow-500' : 'bg-indigo-500'
                    }`}
                    style={{ width: `${Math.min((systemHealth.queue_depth / 20) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Database Connections */}
            <div className={`group p-6 rounded-xl border transition-all duration-200 hover:shadow-lg ${
              isDark ? 'bg-gray-800/50 border-gray-700 hover:bg-gray-800' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-gray-300'
            }`}>
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <div className={`p-2 rounded-lg transition-colors duration-200 ${
                    isDark ? 'bg-orange-500/20' : 'bg-orange-100'
                  }`}>
                    <HardDrive className={`w-4 h-4 ${
                      isDark ? 'text-orange-400' : 'text-orange-600'
                    }`} />
                  </div>
                  <p className={`text-sm font-medium transition-colors duration-200 ${
                    isDark ? 'text-gray-300' : 'text-gray-600'
                  }`}>数据库连接</p>
                </div>
                <div className="flex items-baseline space-x-2">
                  <p className={`text-2xl font-bold transition-colors duration-200 ${
                    isDark ? 'text-white' : 'text-gray-900 dark:text-white'
                  }`}>{systemHealth.db_connections}</p>
                  <span className={`text-sm transition-colors duration-200 ${
                    isDark ? 'text-gray-400' : 'text-gray-500 dark:text-gray-400'
                  }`}>/ {systemHealth.db_max_connections}</span>
                </div>
                <p className={`text-xs mt-1 transition-colors duration-200 ${
                  isDark ? 'text-gray-400' : 'text-gray-500 dark:text-gray-400'
                }`}>
                  活跃连接池状态
                </p>
                <div className={`mt-3 w-full rounded-full h-2 ${
                  isDark ? 'bg-gray-700' : 'bg-gray-200'
                }`}>
                  <div 
                    className="h-2 bg-orange-500 rounded-full transition-all duration-500"
                    style={{ width: `${(systemHealth.db_connections / systemHealth.db_max_connections) * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Job Summary Section */}
      {jobSummary && (
        <div className="space-y-6">
          <h3 className={`text-xl font-semibold transition-colors duration-200 ${
            isDark ? 'text-white' : 'text-gray-900 dark:text-white'
          }`}>Job 摘要 & 24小时趋势</h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Job Status Cards */}
            <div className="grid grid-cols-2 gap-4">
              <div 
                className={`p-6 rounded-xl border cursor-pointer transition-all duration-200 hover:shadow-lg ${
                  isDark ? 'bg-gray-700 border-gray-600 hover:bg-gray-600' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-gray-700'
                }`}
                onClick={() => handleJobCardClick('pending')}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm font-medium transition-colors duration-200 ${
                      isDark ? 'text-gray-400' : 'text-gray-600'
                    }`}>待处理</p>
                    <p className={`text-3xl font-bold mt-1 transition-colors duration-200 ${
                      isDark ? 'text-white' : 'text-gray-900 dark:text-white'
                    }`}>{jobSummary.today.pending}</p>
                  </div>
                  <div className="p-3 bg-yellow-100 rounded-lg">
                    <Clock className="text-yellow-600 w-6 h-6" />
                  </div>
                </div>
              </div>

              <div 
                className={`p-6 rounded-xl border cursor-pointer transition-all duration-200 hover:shadow-lg ${
                  isDark ? 'bg-gray-700 border-gray-600 hover:bg-gray-600' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-gray-700'
                }`}
                onClick={() => handleJobCardClick('running')}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm font-medium transition-colors duration-200 ${
                      isDark ? 'text-gray-400' : 'text-gray-600'
                    }`}>运行中</p>
                    <p className={`text-3xl font-bold mt-1 transition-colors duration-200 ${
                      isDark ? 'text-white' : 'text-gray-900 dark:text-white'
                    }`}>{jobSummary.today.running}</p>
                  </div>
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <RefreshCcw className="text-blue-600 dark:text-blue-400 w-6 h-6" />
                  </div>
                </div>
              </div>

              <div 
                className={`p-6 rounded-xl border cursor-pointer transition-all duration-200 hover:shadow-lg ${
                  isDark ? 'bg-gray-700 border-gray-600 hover:bg-gray-600' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-gray-700'
                }`}
                onClick={() => handleJobCardClick('completed')}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm font-medium transition-colors duration-200 ${
                      isDark ? 'text-gray-400' : 'text-gray-600'
                    }`}>已完成</p>
                    <p className={`text-3xl font-bold mt-1 transition-colors duration-200 ${
                      isDark ? 'text-white' : 'text-gray-900 dark:text-white'
                    }`}>{jobSummary.today.completed}</p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-lg">
                    <CheckCircle className="text-green-600 dark:text-green-400 w-6 h-6" />
                  </div>
                </div>
              </div>

              <div 
                className={`p-6 rounded-xl border cursor-pointer transition-all duration-200 hover:shadow-lg ${
                  isDark ? 'bg-gray-700 border-gray-600 hover:bg-gray-600' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-gray-700'
                }`}
                onClick={() => handleJobCardClick('failed')}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm font-medium transition-colors duration-200 ${
                      isDark ? 'text-gray-400' : 'text-gray-600'
                    }`}>失败</p>
                    <p className={`text-3xl font-bold mt-1 transition-colors duration-200 ${
                      isDark ? 'text-white' : 'text-gray-900 dark:text-white'
                    }`}>{jobSummary.today.failed}</p>
                  </div>
                  <div className="p-3 bg-red-100 rounded-lg">
                    <XCircle className="text-red-600 w-6 h-6" />
                  </div>
                </div>
              </div>
            </div>

            {/* 24h Trend Chart (Mock) */}
            <div className={`p-6 rounded-xl border transition-colors duration-200 ${
              isDark ? 'bg-gray-700 border-gray-600' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
            }`}>
              <h4 className={`text-lg font-semibold mb-4 transition-colors duration-200 ${
                isDark ? 'text-white' : 'text-gray-900 dark:text-white'
              }`}>24小时趋势</h4>
              <div className="space-y-3">
                {jobSummary.chart_data.map((point: any, index: number) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className={`text-sm transition-colors duration-200 ${
                      isDark ? 'text-gray-400' : 'text-gray-600'
                    }`}>{point.time}</span>
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                        <span className={`text-sm transition-colors duration-200 ${
                          isDark ? 'text-white' : 'text-gray-900 dark:text-white'
                        }`}>{point.completed}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        <span className={`text-sm transition-colors duration-200 ${
                          isDark ? 'text-white' : 'text-gray-900 dark:text-white'
                        }`}>{point.failed}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Database Capacity Section */}
      {dbCapacity && (
        <div className="space-y-6">
          <h3 className={`text-xl font-semibold transition-colors duration-200 ${
            isDark ? 'text-white' : 'text-gray-900 dark:text-white'
          }`}>数据库容量分析</h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Pie Chart (Mock representation) */}
            <div className={`p-6 rounded-xl border transition-colors duration-200 ${
              isDark ? 'bg-gray-700 border-gray-600' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
            }`}>
              <div className="flex items-center justify-between mb-4">
                <h4 className={`text-lg font-semibold transition-colors duration-200 ${
                  isDark ? 'text-white' : 'text-gray-900 dark:text-white'
                }`}>表容量分布</h4>
                <span className={`text-sm transition-colors duration-200 ${
                  isDark ? 'text-gray-400' : 'text-gray-600'
                }`}>总计: {dbCapacity.total_size}</span>
              </div>
              
              {/* Mock pie chart representation */}
              <div className="space-y-3">
                {dbCapacity.tables.map((table: any, index: number) => {
                  const colors = ['bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500', 'bg-pink-500'];
                  return (
                    <div 
                      key={table.name}
                      className="cursor-pointer transition-transform hover:scale-105"
                      onClick={() => handleTableClick(table.name)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          <div className={`w-4 h-4 rounded ${colors[index % colors.length]}`}></div>
                          <span className={`text-sm font-medium transition-colors duration-200 ${
                            isDark ? 'text-white' : 'text-gray-900 dark:text-white'
                          }`}>{table.name}</span>
                        </div>
                        <span className={`text-sm transition-colors duration-200 ${
                          isDark ? 'text-gray-400' : 'text-gray-600'
                        }`}>{table.size_mb.toFixed(2)} MB</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${colors[index % colors.length]}`}
                          style={{ width: `${table.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Table Details */}
            <div className={`p-6 rounded-xl border transition-colors duration-200 ${
              isDark ? 'bg-gray-700 border-gray-600' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
            }`}>
              <h4 className={`text-lg font-semibold mb-4 transition-colors duration-200 ${
                isDark ? 'text-white' : 'text-gray-900 dark:text-white'
              }`}>表详情</h4>
              <div className="space-y-4">
                {dbCapacity.tables.map((table: any, index: number) => (
                  <div 
                    key={table.name}
                    className={`p-4 rounded-lg cursor-pointer transition-colors duration-200 hover:opacity-80 ${
                      isDark ? 'bg-gray-600' : 'bg-gray-50 dark:bg-gray-700'
                    }`}
                    onClick={() => handleTableClick(table.name)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={`font-medium transition-colors duration-200 ${
                          isDark ? 'text-white' : 'text-gray-900 dark:text-white'
                        }`}>{table.name}</p>
                        <p className={`text-sm transition-colors duration-200 ${
                          isDark ? 'text-gray-400' : 'text-gray-600'
                        }`}>占用: {table.percentage.toFixed(2)}%</p>
                      </div>
                      <div className="text-right">
                        <p className={`font-semibold transition-colors duration-200 ${
                          isDark ? 'text-white' : 'text-gray-900 dark:text-white'
                        }`}>{table.size_mb.toFixed(2)} MB</p>
                        <p className={`text-xs transition-colors duration-200 ${
                          isDark ? 'text-gray-500 dark:text-gray-400' : 'text-gray-500 dark:text-gray-400'
                        }`}>点击查看详情</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Data Explorer Component
const DataExplorer = () => {
  const { isDark } = useTheme();
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [tables, setTables] = useState<any[]>([]);
  const [tableData, setTableData] = useState<any[]>([]);
  const [tableColumns, setTableColumns] = useState<any[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRows, setTotalRows] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 获取表列表
  useEffect(() => {
    const fetchTables = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:8080/api/admin/data-explorer/tables', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setTables(data);
        } else {
          // Fallback to mock data if API fails
          setTables([
            { name: 'users', rows: 0, size_mb: 0.1, description: '用户账户信息' },
            { name: 'jobs', rows: 0, size_mb: 0.1, description: '任务处理记录' },
            { name: 'files', rows: 0, size_mb: 0.1, description: '文件上传记录' },
            { name: 'sessions', rows: 0, size_mb: 0.1, description: '用户会话数据' },
            { name: 'permissions', rows: 0, size_mb: 0.1, description: '权限配置信息' },
            { name: 'email_logs', rows: 0, size_mb: 0.1, description: '邮件发送日志' },
            { name: 'audit_logs', rows: 0, size_mb: 0.1, description: '系统审计日志' }
          ]);
        }
      } catch (err) {
        setError('无法获取表信息');
        // Fallback to mock data
        setTables([
          { name: 'users', rows: 0, size_mb: 0.1, description: '用户账户信息' },
          { name: 'jobs', rows: 0, size_mb: 0.1, description: '任务处理记录' },
          { name: 'files', rows: 0, size_mb: 0.1, description: '文件上传记录' },
          { name: 'sessions', rows: 0, size_mb: 0.1, description: '用户会话数据' },
          { name: 'permissions', rows: 0, size_mb: 0.1, description: '权限配置信息' },
          { name: 'email_logs', rows: 0, size_mb: 0.1, description: '邮件发送日志' },
          { name: 'audit_logs', rows: 0, size_mb: 0.1, description: '系统审计日志' }
        ]);
      }
    };

    fetchTables();
  }, []);

  // 获取表数据
  const fetchTableData = async (tableName: string, page: number = 1) => {
    setLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `http://localhost:8080/api/admin/data-explorer/tables/${tableName}/data?page=${page}&limit=20`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        setTableData(data.data || []);
        setTableColumns(data.columns || []);
        setCurrentPage(data.page || 1);
        setTotalPages(data.total_pages || 1);
        setTotalRows(data.total || 0);
      } else {
        setError('无法获取表数据');
        setTableData([]);
        setTableColumns([]);
      }
    } catch (err) {
      setError('获取表数据时发生错误');
      setTableData([]);
      setTableColumns([]);
    } finally {
      setLoading(false);
    }
  };

  const handleTableSelect = (tableName: string) => {
    setSelectedTable(tableName);
    setCurrentPage(1);
    fetchTableData(tableName, 1);
  };

  const handlePageChange = (page: number) => {
    if (selectedTable) {
      setCurrentPage(page);
      fetchTableData(selectedTable, page);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h2 className={`text-3xl font-bold transition-colors duration-200 ${
            isDark ? 'text-white' : 'text-gray-900 dark:text-white'
          }`}>Data Explorer</h2>
          <p className={`mt-1 text-sm transition-colors duration-200 ${
            isDark ? 'text-gray-400' : 'text-gray-600'
          }`}>
            浏览和管理数据库表结构与数据
          </p>
        </div>
      </div>

      {error && (
        <div className={`p-4 border rounded-lg transition-colors duration-200 ${
          isDark 
            ? 'bg-red-900/50 border-red-700 text-red-300' 
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <p className="text-sm">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Tables List */}
        <div className={`rounded-xl border transition-colors duration-200 ${
          isDark ? 'bg-gray-800 border-gray-700' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
        }`}>
          <div className="p-6 border-b border-gray-200 dark:border-gray-700 dark:border-gray-700">
            <h3 className={`text-lg font-semibold transition-colors duration-200 ${
              isDark ? 'text-white' : 'text-gray-900 dark:text-white'
            }`}>数据库表</h3>
            <p className={`text-sm mt-1 transition-colors duration-200 ${
              isDark ? 'text-gray-400' : 'text-gray-600'
            }`}>共 {tables.length} 个表</p>
          </div>
          
          <div className="p-6 space-y-3 max-h-96 overflow-y-auto">
            {tables.map((table) => (
              <div
                key={table.name}
                className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 ${
                  selectedTable === table.name
                    ? (isDark ? 'bg-blue-600 border-blue-500' : 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-600')
                    : (isDark ? 'bg-gray-700 border-gray-600 hover:bg-gray-600' : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-700 hover:bg-gray-100')
                }`}
                onClick={() => handleTableSelect(table.name)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className={`font-medium transition-colors duration-200 ${
                      selectedTable === table.name
                        ? (isDark ? 'text-white' : 'text-blue-900')
                        : (isDark ? 'text-white' : 'text-gray-900 dark:text-white')
                    }`}>{table.name}</h4>
                    <p className={`text-sm transition-colors duration-200 ${
                      selectedTable === table.name
                        ? (isDark ? 'text-blue-200' : 'text-blue-700')
                        : (isDark ? 'text-gray-400' : 'text-gray-600')
                    }`}>{table.description}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-medium transition-colors duration-200 ${
                      selectedTable === table.name
                        ? (isDark ? 'text-white' : 'text-blue-900')
                        : (isDark ? 'text-white' : 'text-gray-900 dark:text-white')
                    }`}>{table.rows} 行</p>
                    <p className={`text-xs transition-colors duration-200 ${
                      selectedTable === table.name
                        ? (isDark ? 'text-blue-200' : 'text-blue-700')
                        : (isDark ? 'text-gray-500 dark:text-gray-400' : 'text-gray-500 dark:text-gray-400')
                    }`}>{table.size_mb} MB</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Table Data */}
        <div className={`lg:col-span-2 rounded-xl border transition-colors duration-200 ${
          isDark ? 'bg-gray-800 border-gray-700' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
        }`}>
          <div className="p-6 border-b border-gray-200 dark:border-gray-700 dark:border-gray-700">
            <h3 className={`text-lg font-semibold transition-colors duration-200 ${
              isDark ? 'text-white' : 'text-gray-900 dark:text-white'
            }`}>
              {selectedTable ? `表数据: ${selectedTable}` : '选择一个表查看数据'}
            </h3>
          </div>
          
          <div className="p-6">
            {!selectedTable ? (
              <div className="text-center py-12">
                <Database className={`w-16 h-16 mb-4 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} />
                <p className={`text-lg transition-colors duration-200 ${
                  isDark ? 'text-gray-400' : 'text-gray-600'
                }`}>从左侧选择一个表开始浏览数据</p>
              </div>
            ) : loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <span className={`transition-colors duration-200 ${
                    isDark ? 'text-gray-400' : 'text-gray-600'
                  }`}>加载数据中...</span>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className={`text-sm transition-colors duration-200 ${
                    isDark ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    显示 {tableData.length} 条记录，共 {totalRows} 条 (第 {currentPage} 页，共 {totalPages} 页)
                  </span>
                  <div className="flex space-x-2">
                    <button className={`px-3 py-1 text-sm rounded-md transition-colors duration-200 ${
                      isDark 
                        ? 'bg-blue-600 text-white hover:bg-blue-700' 
                        : 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 hover:bg-blue-200'
                    }`}>
                      导出 CSV
                    </button>
                    <button className={`px-3 py-1 text-sm rounded-md transition-colors duration-200 ${
                      isDark 
                        ? 'bg-green-600 text-white hover:bg-green-700' 
                        : 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 hover:bg-green-200'
                    }`}>
                      查询编辑器
                    </button>
                  </div>
                </div>
                
                {tableData.length === 0 ? (
                  <div className="text-center py-8">
                    <p className={`text-lg transition-colors duration-200 ${
                      isDark ? 'text-gray-400' : 'text-gray-600'
                    }`}>该表暂无数据</p>
                  </div>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <table className="min-w-full">
                        <thead>
                          <tr className={`border-b transition-colors duration-200 ${
                            isDark ? 'border-gray-700' : 'border-gray-200 dark:border-gray-700'
                          }`}>
                            {tableColumns.map((column) => (
                              <th key={column.name} className={`text-left py-3 px-4 font-medium transition-colors duration-200 ${
                                isDark ? 'text-gray-300' : 'text-gray-700'
                              }`}>
                                <div className="flex items-center space-x-2">
                                  <span>{column.name}</span>
                                  <span className={`text-xs px-2 py-1 rounded transition-colors duration-200 ${
                                    isDark ? 'bg-gray-600 text-gray-300' : 'bg-gray-100 text-gray-600'
                                  }`}>
                                    {column.type}
                                  </span>
                                </div>
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {tableData.map((row, index) => (
                            <tr key={index} className={`border-b transition-colors duration-200 ${
                              isDark ? 'border-gray-700 hover:bg-gray-700' : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-gray-700'
                            }`}>
                              {tableColumns.map((column) => (
                                <td key={column.name} className={`py-3 px-4 transition-colors duration-200 ${
                                  isDark ? 'text-gray-300' : 'text-gray-700'
                                }`}>
                                  {row[column.name] !== null && row[column.name] !== undefined 
                                    ? String(row[column.name])
                                    : (
                                      <span className={`italic transition-colors duration-200 ${
                                        isDark ? 'text-gray-500 dark:text-gray-400' : 'text-gray-400'
                                      }`}>NULL</span>
                                    )
                                  }
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* 分页控件 */}
                    {totalPages > 1 && (
                      <div className="flex items-center justify-between">
                        <div className={`text-sm transition-colors duration-200 ${
                          isDark ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                          第 {currentPage} 页，共 {totalPages} 页
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage <= 1}
                            className={`px-3 py-2 text-sm rounded-md transition-colors duration-200 ${
                              currentPage <= 1
                                ? (isDark ? 'bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed' : 'bg-gray-100 text-gray-400 cursor-not-allowed')
                                : (isDark ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-white dark:bg-gray-800 border border-gray-300 text-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-gray-700')
                            }`}
                          >
                            上一页
                          </button>
                          
                          {/* 页码按钮 */}
                          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                            let pageNum;
                            if (totalPages <= 5) {
                              pageNum = i + 1;
                            } else {
                              const start = Math.max(1, currentPage - 2);
                              const end = Math.min(totalPages, start + 4);
                              pageNum = start + i;
                              if (pageNum > end) return null;
                            }
                            
                            return (
                              <button
                                key={pageNum}
                                onClick={() => handlePageChange(pageNum)}
                                className={`px-3 py-2 text-sm rounded-md transition-colors duration-200 ${
                                  currentPage === pageNum
                                    ? (isDark ? 'bg-blue-600 text-white' : 'bg-blue-600 text-white')
                                    : (isDark ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-white dark:bg-gray-800 border border-gray-300 text-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-gray-700')
                                }`}
                              >
                                {pageNum}
                              </button>
                            );
                          })}
                          
                          <button
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage >= totalPages}
                            className={`px-3 py-2 text-sm rounded-md transition-colors duration-200 ${
                              currentPage >= totalPages
                                ? (isDark ? 'bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed' : 'bg-gray-100 text-gray-400 cursor-not-allowed')
                                : (isDark ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-white dark:bg-gray-800 border border-gray-300 text-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-gray-700')
                            }`}
                          >
                            下一页
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Jobs Management Component
const JobsManagement = () => {
  const { isDark } = useTheme();
  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Auto-load data when component mounts
  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No token found. Please login first.');
        return;
      }

      const response = await fetch('http://localhost:8080/api/admin/jobs', {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setJobs(data.jobs || []);
      } else {
        if (response.status === 401) {
          setError('Authentication failed. Please login again.');
        } else {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
          setError('Failed to fetch jobs: ' + errorData.error);
        }
      }
    } catch (err) {
      setError('Cannot connect to backend server. Please ensure the server is running.');
    } finally {
      setLoading(false);
    }
  };

  const deleteJob = async (jobId: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8080/api/admin/jobs/${jobId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        setJobs(jobs.filter(job => job.id !== jobId));
      } else {
        setError('Failed to delete job');
      }
    } catch (err) {
      setError('Error: ' + err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className={`text-2xl font-bold transition-colors duration-200 ${
          isDark ? 'text-white' : 'text-gray-900 dark:text-white'
        }`}>Jobs Management</h2>
        <button
          onClick={fetchJobs}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {error && (
        <div className={`p-4 border rounded-lg transition-colors duration-200 ${
          isDark 
            ? 'bg-red-900/20 border-red-800 text-red-300' 
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {loading && jobs.length === 0 && (
        <div className="flex items-center justify-center py-12">
          <div className={`transition-colors duration-200 ${
            isDark ? 'text-gray-400' : 'text-gray-500 dark:text-gray-400'
          }`}>Loading jobs...</div>
        </div>
      )}

      {jobs.length === 0 && !loading && !error && (
        <div className={`p-8 rounded-lg text-center transition-colors duration-200 ${
          isDark ? 'bg-gray-700' : 'bg-gray-50 dark:bg-gray-700'
        }`}>
          <p className={`transition-colors duration-200 ${
            isDark ? 'text-gray-300' : 'text-gray-600'
          }`}>No jobs found.</p>
        </div>
      )}

      {jobs.length > 0 && (
        <div className="space-y-4">
          {jobs.map((job) => (
            <div key={job.id} className={`p-6 border rounded-lg hover:shadow-md transition-all duration-200 ${
              isDark 
                ? 'bg-gray-700 border-gray-600 hover:bg-gray-600' 
                : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-gray-700'
            }`}>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <span className={`font-medium transition-colors duration-200 ${
                      isDark ? 'text-gray-300' : 'text-gray-900 dark:text-white'
                    }`}>#{job.id}</span>
                    <span className="text-blue-500 font-medium">{job.job_type}</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium transition-colors duration-200 ${
                      job.status === 'completed' 
                        ? (isDark ? 'bg-green-900/30 text-green-400' : 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300')
                        : job.status === 'pending' 
                        ? (isDark ? 'bg-yellow-900/30 text-yellow-400' : 'bg-yellow-100 text-yellow-800')
                        : job.status === 'in_progress' 
                        ? (isDark ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-800')
                        : (isDark ? 'bg-red-900/30 text-red-400' : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300')
                    }`}>
                      {job.status}
                    </span>
                  </div>
                  <p className={`text-sm mb-2 transition-colors duration-200 ${
                    isDark ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    <span className={`font-medium ${
                      isDark ? 'text-gray-300' : 'text-gray-700'
                    }`}>User:</span> {job.user?.username || 'Unknown'}
                  </p>
                  {job.input_data && (
                    <p className={`text-sm mb-2 transition-colors duration-200 ${
                      isDark ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      <span className={`font-medium ${
                        isDark ? 'text-gray-300' : 'text-gray-700'
                      }`}>Input:</span> {job.input_data.substring(0, 100)}...
                    </p>
                  )}
                  {job.output_data && (
                    <p className={`text-sm mb-2 transition-colors duration-200 ${
                      isDark ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      <span className={`font-medium ${
                        isDark ? 'text-gray-300' : 'text-gray-700'
                      }`}>Output:</span> {job.output_data.substring(0, 100)}...
                    </p>
                  )}
                  {job.error_msg && (
                    <p className={`text-sm mb-2 transition-colors duration-200 ${
                      isDark ? 'text-red-400' : 'text-red-600'
                    }`}>
                      <span className={`font-medium ${
                        isDark ? 'text-red-300' : 'text-red-700'
                      }`}>Error:</span> {job.error_msg}
                    </p>
                  )}
                  <p className={`text-xs mt-3 transition-colors duration-200 ${
                    isDark ? 'text-gray-500 dark:text-gray-400' : 'text-gray-500 dark:text-gray-400'
                  }`}>
                    Created: {new Date(job.created_at).toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={() => deleteJob(job.id)}
                  className={`px-3 py-1 text-sm rounded hover:opacity-80 transition-all duration-200 ${
                    isDark 
                      ? 'bg-red-900/30 text-red-400 hover:bg-red-900/50' 
                      : 'bg-red-100 text-red-700 hover:bg-red-200'
                  }`}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
          <div className={`text-center text-sm pt-4 transition-colors duration-200 ${
            isDark ? 'text-gray-400' : 'text-gray-500 dark:text-gray-400'
          }`}>
            Total jobs: {jobs.length}
          </div>
        </div>
      )}
    </div>
  );
};

// LLM Interface Component
const LLMInterface = () => {
  const { isDark } = useTheme();
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Auto-load config when component mounts
  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('No token found. Please login first.');
        return;
      }

      const response = await fetch('http://localhost:8080/api/admin/llm/config', {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setConfig(data);
      } else {
        setError('Failed to fetch LLM configuration');
      }
    } catch (err) {
      setError('Cannot connect to backend server');
    } finally {
      setLoading(false);
    }
  };

  const testConnection = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8080/api/admin/llm/test', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setResult(`✅ ${data.message || 'Connection successful! API is working.'}`);
      } else {
        const errorData = await response.json();
        setError('Connection failed: ' + errorData.error);
      }
    } catch (err) {
      setError('Cannot connect to backend server');
    } finally {
      setLoading(false);
    }
  };

  const generateCode = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt');
      return;
    }

    setIsGenerating(true);
    setError('');
    setResult('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8080/api/admin/llm/simple', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });

      if (response.ok) {
        const data = await response.json();
        setResult(data.result);
      } else {
        const errorData = await response.json();
        setError('Generation failed: ' + errorData.error);
      }
    } catch (err) {
      setError('Cannot connect to backend server');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className={`text-2xl font-bold transition-colors duration-200 ${
          isDark ? 'text-white' : 'text-gray-900 dark:text-white'
        }`}>LLM Code Generator</h2>
        <button
          onClick={fetchConfig}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {error && (
        <div className={`p-4 border rounded-lg transition-colors duration-200 ${
          isDark 
            ? 'bg-red-900/20 border-red-800 text-red-300' 
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Configuration Status */}
      {config && (
        <div className={`p-4 rounded-lg border transition-colors duration-200 ${
          isDark ? 'bg-gray-700 border-gray-600' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
        }`}>
          <h3 className={`text-lg font-semibold mb-3 transition-colors duration-200 ${
            isDark ? 'text-white' : 'text-gray-900 dark:text-white'
          }`}>Configuration Status</h3>
          <div className="flex items-center space-x-4">
            <div className={`px-3 py-1 rounded-full text-sm font-medium transition-colors duration-200 ${
              config.configured 
                ? (isDark ? 'bg-green-900/30 text-green-400' : 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300')
                : (isDark ? 'bg-red-900/30 text-red-400' : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300')
            }`}>
              {config.configured ? `${config.provider} API Key Configured` : 'API Key Missing'}
            </div>
            <button
              onClick={testConnection}
              disabled={!config.configured || loading}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors duration-200"
            >
              Test Connection
            </button>
          </div>
        </div>
      )}

      {/* Simple Code Generation */}
      <div className={`p-4 rounded-lg border transition-colors duration-200 ${
        isDark ? 'bg-gray-700 border-gray-600' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
      }`}>
        <h3 className={`text-lg font-semibold mb-3 transition-colors duration-200 ${
          isDark ? 'text-white' : 'text-gray-900 dark:text-white'
        }`}>Simple Code Generation</h3>
        <div className="space-y-4">
          <div>
            <label className={`block text-sm font-medium mb-2 transition-colors duration-200 ${
              isDark ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Enter your prompt:
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200 ${
                isDark 
                  ? 'bg-gray-600 border-gray-500 text-white placeholder-gray-400' 
                  : 'bg-white dark:bg-gray-800 border-gray-300 text-gray-900 dark:text-white placeholder-gray-500'
              }`}
              rows={4}
              placeholder="Example: Create a Go struct for a User with ID, Name, Email and CreatedAt fields"
            />
          </div>
          <button
            onClick={generateCode}
            disabled={isGenerating || !config?.configured}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors duration-200"
          >
            {isGenerating ? 'Generating...' : 'Generate Code'}
          </button>
        </div>
      </div>

      {/* Results */}
      {result && (
        <div className={`p-4 rounded-lg border transition-colors duration-200 ${
          isDark ? 'bg-gray-700 border-gray-600' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
        }`}>
          <h3 className={`text-lg font-semibold mb-3 transition-colors duration-200 ${
            isDark ? 'text-white' : 'text-gray-900 dark:text-white'
          }`}>Generated Code</h3>
          <pre className={`p-4 rounded-lg overflow-x-auto text-sm transition-colors duration-200 ${
            isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-900 dark:text-white'
          }`}>
            <code>{result}</code>
          </pre>
        </div>
      )}

      {/* Coming Soon */}
      <div className={`p-4 rounded-lg border transition-colors duration-200 ${
        isDark ? 'bg-gray-700 border-gray-600' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
      }`}>
        <h3 className={`text-lg font-semibold mb-3 transition-colors duration-200 ${
          isDark ? 'text-white' : 'text-gray-900 dark:text-white'
        }`}>Coming Soon</h3>
        <div className={`space-y-2 text-sm transition-colors duration-200 ${
          isDark ? 'text-gray-400' : 'text-gray-600'
        }`}>
          <p>🚀 Frontend file upload (ZIP)</p>
          <p>💬 Chat history analysis</p>
          <p><RefreshCcw className="inline-block mr-1 w-4 h-4" /> Full project generation</p>
          <p>📊 Code diff visualization</p>
          <p>⚡ Real-time generation progress</p>
        </div>
      </div>
    </div>
  );
};

// API测试界面组件
const APITestInterface = () => {
  const { isDark } = useTheme();
  const [selectedAPI, setSelectedAPI] = useState<any>(null);
  const [testResult, setTestResult] = useState('');
  const [testLoading, setTestLoading] = useState(false);
  const [testError, setTestError] = useState('');
  const [requestBody, setRequestBody] = useState('');
  const [userToken, setUserToken] = useState('');
  const [adminToken, setAdminToken] = useState('');
  const [testUserInfo, setTestUserInfo] = useState<any>(null);
  const [showRequestBody, setShowRequestBody] = useState(false);
  const [responseTime, setResponseTime] = useState<number | null>(null);
  const [testHistory, setTestHistory] = useState<any[]>([]);

  // 定义所有API接口
  const apiEndpoints = {
    admin: [
      {
        name: '管理员登录',
        method: 'POST',
        path: '/api/admin/login',
        description: '管理员登录获取token',
        needsAuth: false,
        body: {
          email: 'admin@example.com',
          password: 'admin123'
        }
      },
      {
        name: '获取管理员资料',
        method: 'GET',
        path: '/api/admin/profile',
        description: '获取当前管理员的个人资料',
        needsAuth: true,
        authType: 'admin'
      },
      {
        name: '获取用户列表',
        method: 'GET',
        path: '/api/admin/users',
        description: '获取所有用户列表',
        needsAuth: true,
        authType: 'admin'
      },
      {
        name: '获取仪表板统计',
        method: 'GET',
        path: '/api/admin/dashboard/stats',
        description: '获取系统统计数据',
        needsAuth: true,
        authType: 'admin'
      },
      {
        name: '获取系统信息',
        method: 'GET',
        path: '/api/admin/dashboard/system',
        description: '获取系统信息',
        needsAuth: true,
        authType: 'admin'
      },
      {
        name: '获取任务列表',
        method: 'GET',
        path: '/api/admin/jobs',
        description: '获取所有生成任务',
        needsAuth: true,
        authType: 'admin'
      },
      {
        name: '获取LLM配置',
        method: 'GET',
        path: '/api/admin/llm/config',
        description: '获取LLM配置状态',
        needsAuth: true,
        authType: 'admin'
      },
      {
        name: '测试LLM连接',
        method: 'POST',
        path: '/api/admin/llm/test',
        description: '测试LLM API连接',
        needsAuth: true,
        authType: 'admin'
      },
      {
        name: '简单代码生成',
        method: 'POST',
        path: '/api/admin/llm/simple',
        description: '简单的代码生成测试',
        needsAuth: true,
        authType: 'admin',
        body: {
          prompt: 'Create a Go struct for a User with ID, Name, Email fields'
        }
      },
      {
        name: '获取权限列表',
        method: 'GET',
        path: '/api/admin/permissions',
        description: '获取系统权限列表',
        needsAuth: true,
        authType: 'admin'
      },
      {
        name: '创建权限',
        method: 'POST',
        path: '/api/admin/permissions',
        description: '创建新的权限',
        needsAuth: true,
        authType: 'admin',
        body: {
          name: 'test.permission',
          description: '测试权限',
          resource: 'test',
          action: 'read'
        }
      },
      {
        name: '获取用户权限',
        method: 'GET',
        path: '/api/admin/permissions/users/1',
        description: '获取指定用户的权限',
        needsAuth: true,
        authType: 'admin'
      },
      {
        name: '初始化默认权限',
        method: 'POST',
        path: '/api/admin/permissions/initialize',
        description: '初始化系统默认权限',
        needsAuth: true,
        authType: 'admin'
      },
      {
        name: '权限统计',
        method: 'GET',
        path: '/api/admin/permissions/stats',
        description: '获取权限统计信息',
        needsAuth: true,
        authType: 'admin'
      },
      {
        name: '导出用户数据',
        method: 'POST',
        path: '/api/admin/export',
        description: '导出用户数据',
        needsAuth: true,
        authType: 'admin',
        body: {
          data_type: 'users',
          format: 'json'
        }
      },
      {
        name: '导出系统报告',
        method: 'GET',
        path: '/api/admin/export/system-report',
        description: '导出系统统计报告',
        needsAuth: true,
        authType: 'admin'
      },
      {
        name: '获取导出类型',
        method: 'GET',
        path: '/api/admin/export/types',
        description: '获取支持的导出类型',
        needsAuth: true,
        authType: 'admin'
      },
      {
        name: '清理过期导出',
        method: 'POST',
        path: '/api/admin/export/cleanup',
        description: '清理过期的导出文件',
        needsAuth: true,
        authType: 'admin'
      },
      {
        name: '创建示例任务',
        method: 'POST',
        path: '/api/admin/jobs/sample',
        description: '创建示例生成任务',
        needsAuth: true,
        authType: 'admin'
      },
      {
        name: '获取任务详情',
        method: 'GET',
        path: '/api/admin/jobs/1',
        description: '获取指定任务的详细信息',
        needsAuth: true,
        authType: 'admin'
      },
      {
        name: '更新任务',
        method: 'PUT',
        path: '/api/admin/jobs/1',
        description: '更新指定任务',
        needsAuth: true,
        authType: 'admin',
        body: {
          status: 'completed',
          output_data: 'Generated code here'
        }
      },
      {
        name: '删除任务',
        method: 'DELETE',
        path: '/api/admin/jobs/1',
        description: '删除指定任务',
        needsAuth: true,
        authType: 'admin'
      },
      {
        name: '获取用户详情',
        method: 'GET',
        path: '/api/admin/users/1',
        description: '获取指定用户的详细信息',
        needsAuth: true,
        authType: 'admin'
      },
      {
        name: '删除用户',
        method: 'DELETE',
        path: '/api/admin/users/1',
        description: '删除指定用户',
        needsAuth: true,
        authType: 'admin'
      }
    ],
    user: [
      {
        name: '用户注册',
        method: 'POST',
        path: '/api/vf/v1/auth/register',
        description: '用户注册',
        needsAuth: false,
        body: {
          username: 'testuser',
          email: 'testuser@example.com',
          password: 'password123'
        }
      },
      {
        name: '用户登录',
        method: 'POST',
        path: '/api/vf/v1/auth/login',
        description: '用户登录获取token',
        needsAuth: false,
        body: {
          email: 'testuser@example.com',
          password: 'password123'
        }
      },
      {
        name: '刷新令牌',
        method: 'POST',
        path: '/api/vf/v1/auth/refresh',
        description: '使用刷新令牌获取新的访问令牌',
        needsAuth: false,
        body: {
          refresh_token: 'your-refresh-token-here'
        }
      },
      {
        name: '用户登出',
        method: 'POST',
        path: '/api/vf/v1/auth/logout',
        description: '用户登出',
        needsAuth: true,
        authType: 'user'
      },
      {
        name: '获取个人资料',
        method: 'GET',
        path: '/api/vf/v1/profile',
        description: '获取当前用户的个人资料',
        needsAuth: true,
        authType: 'user'
      },
      {
        name: '更新个人资料',
        method: 'PUT',
        path: '/api/vf/v1/profile',
        description: '更新当前用户的个人资料',
        needsAuth: true,
        authType: 'user',
        body: {
          display_name: 'Test User',
          bio: 'This is a test user',
          location: 'Test City',
          website: 'https://example.com'
        }
      },
      {
        name: '查看用户资料',
        method: 'GET',
        path: '/api/vf/v1/users/1/profile',
        description: '查看指定用户的公开资料',
        needsAuth: true,
        authType: 'user'
      },
      {
        name: 'Ping测试',
        method: 'GET',
        path: '/api/vf/v1/ping',
        description: '测试用户API连通性',
        needsAuth: false
      },
      {
        name: '文件上传',
        method: 'POST',
        path: '/api/vf/v1/files/upload',
        description: '上传文件（需要使用form-data格式）',
        needsAuth: true,
        authType: 'user',
        isFileUpload: true,
        body: {
          category: 'general'
        }
      },
      {
        name: '头像上传',
        method: 'POST',
        path: '/api/vf/v1/files/avatar',
        description: '上传用户头像（需要使用form-data格式）',
        needsAuth: true,
        authType: 'user',
        isFileUpload: true
      },
      {
        name: '获取文件列表',
        method: 'GET',
        path: '/api/vf/v1/files',
        description: '获取用户的文件列表',
        needsAuth: true,
        authType: 'user'
      },
      {
        name: '获取文件统计',
        method: 'GET',
        path: '/api/vf/v1/files/stats',
        description: '获取用户的文件统计信息',
        needsAuth: true,
        authType: 'user'
      },
      {
        name: '删除文件',
        method: 'DELETE',
        path: '/api/vf/v1/files/1',
        description: '删除指定文件',
        needsAuth: true,
        authType: 'user'
      },
      {
        name: '发送验证邮件',
        method: 'POST',
        path: '/api/vf/v1/email/send-verification',
        description: '发送邮箱验证邮件',
        needsAuth: true,
        authType: 'user',
        body: {
          email: 'test@example.com'
        }
      },
      {
        name: '获取邮箱状态',
        method: 'GET',
        path: '/api/vf/v1/email/status?email=test@example.com',
        description: '获取邮箱验证状态',
        needsAuth: true,
        authType: 'user'
      },
      {
        name: '获取邮件日志',
        method: 'GET',
        path: '/api/vf/v1/email/logs',
        description: '获取用户的邮件发送日志',
        needsAuth: true,
        authType: 'user'
      },
      {
        name: '验证邮箱',
        method: 'GET',
        path: '/api/vf/v1/email/verify?token=example-token',
        description: '验证邮箱（需要有效的验证令牌）',
        needsAuth: false
      },
      {
        name: '请求密码重置',
        method: 'POST',
        path: '/api/vf/v1/email/request-reset',
        description: '请求密码重置邮件',
        needsAuth: false,
        body: {
          email: 'test@example.com'
        }
      },
      {
        name: '重置密码',
        method: 'POST',
        path: '/api/vf/v1/email/reset-password',
        description: '使用令牌重置密码',
        needsAuth: false,
        body: {
          token: 'reset-token-here',
          new_password: 'newpassword123'
        }
      }
    ]
  };

  // 测试API
  const testAPI = async (api: any) => {
    setTestLoading(true);
    setTestError('');
    setTestResult('');
    const startTime = Date.now();

    try {
      // 处理文件上传
      if (api.isFileUpload) {
        setTestError('文件上传接口需要通过专门的工具测试，请使用Postman或curl命令测试文件上传功能。');
        return;
      }

      const headers: any = {
        'Content-Type': 'application/json',
      };

      // 添加认证头
      if (api.needsAuth) {
        const token = api.authType === 'admin' ? adminToken : userToken;
        if (!token) {
          throw new Error(`请先获取${api.authType === 'admin' ? '管理员' : '用户'}Token`);
        }
        headers['Authorization'] = `Bearer ${token}`;
      }

      const config: any = {
        method: api.method,
        headers,
      };

      // 添加请求体
      if (api.method !== 'GET' && (api.body || requestBody)) {
        const body = requestBody || JSON.stringify(api.body);
        config.body = typeof body === 'string' ? body : JSON.stringify(body);
      }

      const response = await fetch(`http://localhost:8080${api.path}`, config);
      const endTime = Date.now();
      const responseTimeMs = endTime - startTime;
      setResponseTime(responseTimeMs);

      const data = await response.json();

      // 如果是登录接口，自动保存token
      if (api.path.includes('/login') && response.ok) {
        if (api.path.includes('/admin/')) {
          setAdminToken(data.token);
        } else {
          setUserToken(data.data.access_token);
          setTestUserInfo(data.data);
        }
      }

      const resultText = JSON.stringify(data, null, 2);
      setTestResult(resultText);

      // 添加到测试历史
      const historyItem = {
        id: Date.now(),
        api,
        response: data,
        responseTime: responseTimeMs,
        status: response.status,
        success: response.ok,
        timestamp: new Date().toLocaleTimeString(),
        requestBody: config.body || null
      };
      setTestHistory(prev => [historyItem, ...prev.slice(0, 9)]); // 保留最近10条记录

    } catch (error: any) {
      const endTime = Date.now();
      setResponseTime(endTime - startTime);
      setTestError(error.message);
      
      // 添加错误到历史
      const historyItem = {
        id: Date.now(),
        api,
        error: error.message,
        responseTime: endTime - startTime,
        status: 0,
        success: false,
        timestamp: new Date().toLocaleTimeString(),
        requestBody: null
      };
      setTestHistory(prev => [historyItem, ...prev.slice(0, 9)]);
    } finally {
      setTestLoading(false);
    }
  };

  // 快速登录工具
  const quickLogin = async (type: 'admin' | 'user') => {
    const api = type === 'admin' 
      ? apiEndpoints.admin.find(a => a.path.includes('/login'))
      : apiEndpoints.user.find(a => a.path.includes('/login'));
    
    if (api) {
      await testAPI(api);
    }
  };

  // API搜索状态
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // 过滤API列表
  const filterAPIs = (apis: any[]) => {
    return apis.filter(api => {
      const matchesSearch = api.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           api.path.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           api.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      if (categoryFilter === 'all') return matchesSearch;
      
      // 根据路径分类
      if (categoryFilter === 'auth' && api.path.includes('/auth')) return matchesSearch;
      if (categoryFilter === 'files' && api.path.includes('/files')) return matchesSearch;
      if (categoryFilter === 'email' && api.path.includes('/email')) return matchesSearch;
      if (categoryFilter === 'permissions' && api.path.includes('/permissions')) return matchesSearch;
      if (categoryFilter === 'export' && api.path.includes('/export')) return matchesSearch;
      if (categoryFilter === 'jobs' && api.path.includes('/jobs')) return matchesSearch;
      if (categoryFilter === 'users' && api.path.includes('/users')) return matchesSearch;
      if (categoryFilter === 'dashboard' && api.path.includes('/dashboard')) return matchesSearch;
      if (categoryFilter === 'llm' && api.path.includes('/llm')) return matchesSearch;
      
      return false;
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h2 className={`text-3xl font-bold transition-colors duration-200 ${
            isDark ? 'text-white' : 'text-gray-900 dark:text-white'
          }`}>API接口测试</h2>
          <p className={`text-sm mt-1 transition-colors duration-200 ${
            isDark ? 'text-gray-400' : 'text-gray-600'
          }`}>
            测试和调试API接口，支持认证和请求体编辑
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => quickLogin('admin')}
            disabled={testLoading}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
              testLoading 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-700'
            } text-white flex items-center space-x-2`}
          >
            <Shield className="w-4 h-4" />
            <span>快速管理员登录</span>
          </button>
          <button
            onClick={() => quickLogin('user')}
            disabled={testLoading}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
              testLoading 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-green-600 hover:bg-green-700'
            } text-white flex items-center space-x-2`}
          >
            <Users className="w-4 h-4" />
            <span>快速用户登录</span>
          </button>
          {testHistory.length > 0 && (
            <button
              onClick={() => setTestHistory([])}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                isDark 
                  ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' 
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
              }`}
            >
              清空历史
            </button>
          )}
        </div>
      </div>

      {/* 搜索和过滤 */}
      <div className={`rounded-xl border p-6 transition-colors duration-200 ${
        isDark ? 'bg-gray-800 border-gray-700' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
      }`}>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Eye className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${
                isDark ? 'text-gray-400' : 'text-gray-500 dark:text-gray-400'
              }`} />
              <input
                type="text"
                placeholder="搜索API接口名称、路径或描述..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-10 pr-4 py-3 border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  isDark 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                    : 'bg-white dark:bg-gray-800 border-gray-300 text-gray-900 dark:text-white placeholder-gray-500'
                }`}
              />
            </div>
          </div>
          <div className="sm:w-48">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                isDark 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white dark:bg-gray-800 border-gray-300 text-gray-900 dark:text-white'
              }`}
            >
              <option value="all">所有分类 ({apiEndpoints.admin.length + apiEndpoints.user.length})</option>
              <option value="auth">身份认证</option>
              <option value="files">文件管理</option>
              <option value="email">邮件系统</option>
              <option value="permissions">权限管理</option>
              <option value="export">数据导出</option>
              <option value="jobs">任务管理</option>
              <option value="users">用户管理</option>
              <option value="dashboard">仪表板</option>
              <option value="llm">LLM服务</option>
            </select>
          </div>
        </div>
        
        {/* 统计信息 */}
        <div className="mt-4 flex flex-wrap gap-4 text-sm">
          <div className={`flex items-center space-x-2 ${
            isDark ? 'text-gray-400' : 'text-gray-600'
          }`}>
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span>管理员接口: {filterAPIs(apiEndpoints.admin).length}</span>
          </div>
          <div className={`flex items-center space-x-2 ${
            isDark ? 'text-gray-400' : 'text-gray-600'
          }`}>
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span>用户接口: {filterAPIs(apiEndpoints.user).length}</span>
          </div>
          {searchTerm && (
            <div className={`flex items-center space-x-2 ${
              isDark ? 'text-gray-400' : 'text-gray-600'
            }`}>
              <Eye className="w-3 h-3" />
              <span>搜索结果: {filterAPIs(apiEndpoints.admin).length + filterAPIs(apiEndpoints.user).length}</span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左侧：API列表 */}
        <div className="lg:col-span-1 space-y-6">
          {/* Token状态卡片 */}
          <div className={`rounded-xl border p-6 transition-colors duration-200 ${
            isDark ? 'bg-gray-800 border-gray-700' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
          }`}>
            <div className="flex items-center space-x-2 mb-4">
              <Shield className={`w-5 h-5 ${isDark ? 'text-blue-400' : 'text-blue-600 dark:text-blue-400'}`} />
              <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900 dark:text-white'}`}>认证状态</h3>
            </div>
            <div className="space-y-3">
              <div className={`p-3 rounded-lg ${
                adminToken 
                  ? (isDark ? 'bg-green-500/20 border border-green-500/30' : 'bg-green-50 border border-green-200')
                  : (isDark ? 'bg-red-500/20 border border-red-500/30' : 'bg-red-50 border border-red-200')
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${adminToken ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span className={`text-sm font-medium ${
                      adminToken 
                        ? (isDark ? 'text-green-400' : 'text-green-700')
                        : (isDark ? 'text-red-400' : 'text-red-700')
                    }`}>管理员Token</span>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    adminToken 
                      ? (isDark ? 'bg-green-600 text-green-100' : 'bg-green-600 text-white')
                      : (isDark ? 'bg-red-600 text-red-100' : 'bg-red-600 text-white')
                  }`}>
                    {adminToken ? '已获取' : '未获取'}
                  </span>
                </div>
              </div>
              
              <div className={`p-3 rounded-lg ${
                userToken 
                  ? (isDark ? 'bg-green-500/20 border border-green-500/30' : 'bg-green-50 border border-green-200')
                  : (isDark ? 'bg-red-500/20 border border-red-500/30' : 'bg-red-50 border border-red-200')
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${userToken ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span className={`text-sm font-medium ${
                      userToken 
                        ? (isDark ? 'text-green-400' : 'text-green-700')
                        : (isDark ? 'text-red-400' : 'text-red-700')
                    }`}>用户Token</span>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    userToken 
                      ? (isDark ? 'bg-green-600 text-green-100' : 'bg-green-600 text-white')
                      : (isDark ? 'bg-red-600 text-red-100' : 'bg-red-600 text-white')
                  }`}>
                    {userToken ? '已获取' : '未获取'}
                  </span>
                </div>
              </div>
            </div>
            
            {testUserInfo && (
              <div className={`mt-4 p-3 rounded-lg transition-colors duration-200 ${
                isDark ? 'bg-gray-600' : 'bg-gray-50 dark:bg-gray-700'
              }`}>
                <h4 className={`font-medium mb-2 transition-colors duration-200 ${
                  isDark ? 'text-white' : 'text-gray-900 dark:text-white'
                }`}>测试用户信息</h4>
                <div className={`text-sm space-y-1 transition-colors duration-200 ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  <p>用户名: {testUserInfo.user?.username}</p>
                  <p>邮箱: {testUserInfo.user?.email}</p>
                  <p>状态: {testUserInfo.user?.status}</p>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <h3 className={`font-semibold transition-colors duration-200 ${
                isDark ? 'text-white' : 'text-gray-900 dark:text-white'
              }`}>管理员接口 ({filterAPIs(apiEndpoints.admin).length})</h3>
              <div className="space-y-2">
                {filterAPIs(apiEndpoints.admin).map((api, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setSelectedAPI(api);
                      setRequestBody(api.body ? JSON.stringify(api.body, null, 2) : '');
                    }}
                    className={`w-full text-left p-3 rounded-lg border transition-colors duration-200 ${
                      selectedAPI === api
                        ? (isDark ? 'bg-blue-900/30 border-blue-600' : 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-600')
                        : (isDark ? 'bg-gray-700 border-gray-600 hover:bg-gray-600' : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-700 hover:bg-gray-100')
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium transition-colors duration-200 ${
                        api.method === 'GET' 
                          ? (isDark ? 'bg-green-900/30 text-green-400' : 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300')
                          : api.method === 'POST' 
                          ? (isDark ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-800')
                          : api.method === 'PUT' 
                          ? (isDark ? 'bg-yellow-900/30 text-yellow-400' : 'bg-yellow-100 text-yellow-800')
                          : (isDark ? 'bg-red-900/30 text-red-400' : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300')
                      }`}>
                        {api.method}
                      </span>
                      <span className={`text-sm font-medium transition-colors duration-200 ${
                        isDark ? 'text-gray-200' : 'text-gray-900 dark:text-white'
                      }`}>{api.name}</span>
                    </div>
                    <div className={`text-xs mt-1 transition-colors duration-200 ${
                      isDark ? 'text-gray-400' : 'text-gray-600'
                    }`}>{api.path}</div>
                  </button>
                ))}
              </div>

              <h3 className={`font-semibold transition-colors duration-200 ${
                isDark ? 'text-white' : 'text-gray-900 dark:text-white'
              }`}>用户接口 ({filterAPIs(apiEndpoints.user).length})</h3>
              <div className="space-y-2">
                {filterAPIs(apiEndpoints.user).map((api, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setSelectedAPI(api);
                      setRequestBody(api.body ? JSON.stringify(api.body, null, 2) : '');
                    }}
                    className={`w-full text-left p-3 rounded-lg border transition-colors duration-200 ${
                      selectedAPI === api
                        ? (isDark ? 'bg-blue-900/30 border-blue-600' : 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-600')
                        : (isDark ? 'bg-gray-700 border-gray-600 hover:bg-gray-600' : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-700 hover:bg-gray-100')
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium transition-colors duration-200 ${
                        api.method === 'GET' 
                          ? (isDark ? 'bg-green-900/30 text-green-400' : 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300')
                          : api.method === 'POST' 
                          ? (isDark ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-800')
                          : api.method === 'PUT' 
                          ? (isDark ? 'bg-yellow-900/30 text-yellow-400' : 'bg-yellow-100 text-yellow-800')
                          : (isDark ? 'bg-red-900/30 text-red-400' : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300')
                      }`}>
                        {api.method}
                      </span>
                      <span className={`text-sm font-medium transition-colors duration-200 ${
                        isDark ? 'text-gray-200' : 'text-gray-900 dark:text-white'
                      }`}>{api.name}</span>
                    </div>
                    <div className={`text-xs mt-1 transition-colors duration-200 ${
                      isDark ? 'text-gray-400' : 'text-gray-600'
                    }`}>{api.path}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 右侧：测试区域 */}
        <div className="lg:col-span-2 space-y-6">
          {selectedAPI && (
            <div className={`rounded-lg border p-6 transition-colors duration-200 ${
              isDark ? 'bg-gray-700 border-gray-600' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
            }`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-lg font-semibold transition-colors duration-200 ${
                  isDark ? 'text-white' : 'text-gray-900 dark:text-white'
                }`}>{selectedAPI.name}</h3>
                <button
                  onClick={() => testAPI(selectedAPI)}
                  disabled={testLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {testLoading ? '测试中...' : '测试接口'}
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium transition-colors duration-200 ${
                      selectedAPI.method === 'GET' 
                        ? (isDark ? 'bg-green-900/30 text-green-400' : 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300')
                        : selectedAPI.method === 'POST' 
                        ? (isDark ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-800')
                        : selectedAPI.method === 'PUT' 
                        ? (isDark ? 'bg-yellow-900/30 text-yellow-400' : 'bg-yellow-100 text-yellow-800')
                        : (isDark ? 'bg-red-900/30 text-red-400' : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300')
                    }`}>
                      {selectedAPI.method}
                    </span>
                    <code className={`text-sm font-mono px-2 py-1 rounded transition-colors duration-200 ${
                      isDark ? 'bg-gray-600 text-gray-200' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {selectedAPI.path}
                    </code>
                  </div>
                  <p className={`text-sm transition-colors duration-200 ${
                    isDark ? 'text-gray-400' : 'text-gray-600'
                  }`}>{selectedAPI.description}</p>
                </div>

                {selectedAPI.needsAuth && (
                  <div className={`p-3 border rounded-lg transition-colors duration-200 ${
                    isDark ? 'bg-yellow-900/20 border-yellow-800' : 'bg-yellow-50 border-yellow-200'
                  }`}>
                    <p className={`text-sm transition-colors duration-200 ${
                      isDark ? 'text-yellow-300' : 'text-yellow-800'
                    }`}>
                      🔐 此接口需要{selectedAPI.authType === 'admin' ? '管理员' : '用户'}认证
                    </p>
                  </div>
                )}

                {(selectedAPI.method !== 'GET' && selectedAPI.body) && (
                  <div>
                    <label className={`block text-sm font-medium mb-2 transition-colors duration-200 ${
                      isDark ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      请求体 (JSON)
                    </label>
                    <textarea
                      value={requestBody}
                      onChange={(e) => setRequestBody(e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm transition-colors duration-200 ${
                        isDark 
                          ? 'bg-gray-600 border-gray-500 text-white placeholder-gray-400' 
                          : 'bg-white dark:bg-gray-800 border-gray-300 text-gray-900 dark:text-white placeholder-gray-500'
                      }`}
                      rows={8}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 测试结果 */}
          {(testResult || testError) && (
            <div className={`rounded-lg border p-6 transition-colors duration-200 ${
              isDark ? 'bg-gray-700 border-gray-600' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
            }`}>
              <h3 className={`text-lg font-semibold mb-4 transition-colors duration-200 ${
                isDark ? 'text-white' : 'text-gray-900 dark:text-white'
              }`}>测试结果</h3>
              {testError ? (
                <div className={`p-4 border rounded-lg transition-colors duration-200 ${
                  isDark ? 'bg-red-900/20 border-red-800' : 'bg-red-50 border-red-200'
                }`}>
                  <p className={`font-medium transition-colors duration-200 ${
                    isDark ? 'text-red-300' : 'text-red-800'
                  }`}>错误:</p>
                  <p className={`transition-colors duration-200 ${
                    isDark ? 'text-red-400' : 'text-red-700'
                  }`}>{testError}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className={`p-4 border rounded-lg transition-colors duration-200 ${
                    isDark ? 'bg-green-900/20 border-green-800' : 'bg-green-50 border-green-200'
                  }`}>
                    <p className={`font-medium transition-colors duration-200 ${
                      isDark ? 'text-green-300' : 'text-green-800'
                    }`}>✅ 请求成功</p>
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-2 transition-colors duration-200 ${
                      isDark ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      响应内容
                    </label>
                    <pre className={`p-4 rounded-lg overflow-x-auto text-sm transition-colors duration-200 ${
                      isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-900 dark:text-white'
                    }`}>
                      {testResult}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 使用提示 */}
          {!selectedAPI && (
            <div className={`rounded-lg border p-6 transition-colors duration-200 ${
              isDark ? 'bg-gray-700 border-gray-600' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
            }`}>
              <div className="text-center mb-6">
                <div className={`transition-colors duration-200 ${
                  isDark ? 'text-gray-400' : 'text-gray-500 dark:text-gray-400'
                }`}>
                  <p className={`text-lg font-medium mb-2 transition-colors duration-200 ${
                    isDark ? 'text-gray-200' : 'text-gray-700'
                  }`}>选择一个API接口开始测试</p>
                  <p className="text-sm">
                    从左侧列表中选择要测试的API接口，然后点击"测试接口"按钮
                  </p>
                </div>
              </div>
              
              <div className="space-y-4">
                <h4 className={`font-medium transition-colors duration-200 ${
                  isDark ? 'text-white' : 'text-gray-900 dark:text-white'
                }`}>📚 使用说明</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2">
                    <h5 className={`font-medium transition-colors duration-200 ${
                      isDark ? 'text-gray-300' : 'text-gray-800'
                    }`}>🔑 认证说明</h5>
                    <ul className={`space-y-1 transition-colors duration-200 ${
                      isDark ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      <li>• 管理员接口需要管理员Token</li>
                      <li>• 用户接口需要用户Token</li>
                      <li>• 使用快速登录按钮获取Token</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <h5 className={`font-medium transition-colors duration-200 ${
                      isDark ? 'text-gray-300' : 'text-gray-800'
                    }`}>📁 文件上传</h5>
                    <ul className={`space-y-1 transition-colors duration-200 ${
                      isDark ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      <li>• 文件上传接口需要form-data格式</li>
                      <li>• 推荐使用Postman或curl测试</li>
                      <li>• 支持头像和普通文件上传</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <h5 className={`font-medium transition-colors duration-200 ${
                      isDark ? 'text-gray-300' : 'text-gray-800'
                    }`}>🔍 搜索功能</h5>
                    <ul className={`space-y-1 transition-colors duration-200 ${
                      isDark ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      <li>• 可按接口名称、路径搜索</li>
                      <li>• 支持按功能分类过滤</li>
                      <li>• 显示过滤后的接口数量</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <h5 className={`font-medium transition-colors duration-200 ${
                      isDark ? 'text-gray-300' : 'text-gray-800'
                    }`}>📊 新增功能</h5>
                    <ul className={`space-y-1 transition-colors duration-200 ${
                      isDark ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      <li>• 权限管理系统测试</li>
                      <li>• 数据导出功能测试</li>
                      <li>• 邮件系统功能测试</li>
                    </ul>
                  </div>
                </div>
                
                <div className={`mt-4 p-3 border rounded-lg transition-colors duration-200 ${
                  isDark ? 'bg-blue-900/20 border-blue-800' : 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-600'
                }`}>
                  <p className={`text-sm transition-colors duration-200 ${
                    isDark ? 'text-blue-300' : 'text-blue-800'
                  }`}>
                    💡 <strong>提示：</strong>总共提供了 {apiEndpoints.admin.length + apiEndpoints.user.length} 个API接口供测试，
                    包括 {apiEndpoints.admin.length} 个管理员接口和 {apiEndpoints.user.length} 个用户接口。
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// 权限管理组件
const PermissionsManagement = () => {
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState<'permissions' | 'user-permissions' | 'roles' | 'stats'>('permissions');
  const [permissions, setPermissions] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedUser, setSelectedUser] = useState<number | null>(null);
  const [userPermissions, setUserPermissions] = useState<any[]>([]);
  
  // 新建权限表单状态
  const [newPermission, setNewPermission] = useState({
    name: '',
    description: '',
    resource: '',
    action: ''
  });
  const [showAddForm, setShowAddForm] = useState(false);

  // 角色管理状态
  const [newRole, setNewRole] = useState({
    name: '',
    description: ''
  });
  const [showRoleForm, setShowRoleForm] = useState(false);
  const [editingRole, setEditingRole] = useState<any>(null);
  const [selectedRole, setSelectedRole] = useState<number | null>(null);
  const [rolePermissions, setRolePermissions] = useState<any[]>([]);

  // 获取权限列表
  const fetchPermissions = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8080/api/admin/permissions', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setPermissions(data.permissions || []);
      } else {
        setError('获取权限列表失败');
      }
    } catch (err) {
      setError('连接服务器失败');
    } finally {
      setLoading(false);
    }
  };

  // 获取用户列表
  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8080/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      }
    } catch (err) {
      console.error('获取用户列表失败:', err);
    }
  };

  // 获取权限统计
  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8080/api/admin/permissions/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (err) {
      console.error('获取统计信息失败:', err);
    }
  };

  // 获取用户权限
  const fetchUserPermissions = async (userId: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8080/api/admin/permissions/users/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUserPermissions(data.permissions || []);
      }
    } catch (err) {
      console.error('获取用户权限失败:', err);
    }
  };

  // 创建新权限
  const createPermission = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8080/api/admin/permissions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newPermission)
      });
      
      if (response.ok) {
        setNewPermission({ name: '', description: '', resource: '', action: '' });
        setShowAddForm(false);
        fetchPermissions();
      } else {
        setError('创建权限失败');
      }
    } catch (err) {
      setError('连接服务器失败');
    }
  };

  // 初始化默认权限
  const initializePermissions = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8080/api/admin/permissions/initialize', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        fetchPermissions();
        setError('');
      } else {
        setError('初始化权限失败');
      }
    } catch (err) {
      setError('连接服务器失败');
    }
  };

  // ===== 角色管理方法 =====
  
  // 获取角色列表
  const fetchRoles = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8080/api/admin/roles', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setRoles(data.roles || []);
      } else {
        setError('获取角色列表失败');
      }
    } catch (err) {
      setError('连接服务器失败');
    } finally {
      setLoading(false);
    }
  };

  // 创建角色
  const createRole = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8080/api/admin/roles', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newRole)
      });
      
      if (response.ok) {
        setNewRole({ name: '', description: '' });
        setShowRoleForm(false);
        fetchRoles();
        setError('');
      } else {
        const data = await response.json();
        setError(data.error || '创建角色失败');
      }
    } catch (err) {
      setError('连接服务器失败');
    }
  };

  // 更新角色
  const updateRole = async () => {
    if (!editingRole) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8080/api/admin/roles/${editingRole.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: editingRole.name,
          description: editingRole.description
        })
      });
      
      if (response.ok) {
        setEditingRole(null);
        fetchRoles();
        setError('');
      } else {
        const data = await response.json();
        setError(data.error || '更新角色失败');
      }
    } catch (err) {
      setError('连接服务器失败');
    }
  };

  // 删除角色
  const deleteRole = async (roleId: number) => {
    if (!confirm('确定要删除这个角色吗？')) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8080/api/admin/roles/${roleId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        fetchRoles();
        setError('');
      } else {
        const data = await response.json();
        setError(data.error || '删除角色失败');
      }
    } catch (err) {
      setError('连接服务器失败');
    }
  };

  // 获取角色权限
  const fetchRolePermissions = async (roleId: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8080/api/admin/permissions/roles/${roleId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setRolePermissions(data.permissions || []);
      }
    } catch (err) {
      console.error('获取角色权限失败:', err);
    }
  };

  // 组件挂载时获取数据
  useEffect(() => {
    if (activeTab === 'permissions') {
      fetchPermissions();
    } else if (activeTab === 'user-permissions') {
      fetchUsers();
    } else if (activeTab === 'roles') {
      fetchRoles();
    } else if (activeTab === 'stats') {
      fetchStats();
    }
  }, [activeTab]);

  // 当选择用户时获取用户权限
  useEffect(() => {
    if (selectedUser) {
      fetchUserPermissions(selectedUser);
    }
  }, [selectedUser]);

  // 当选择角色时获取角色权限
  useEffect(() => {
    if (selectedRole) {
      fetchRolePermissions(selectedRole);
    }
  }, [selectedRole]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className={`text-2xl font-bold transition-colors duration-200 ${
          isDark ? 'text-white' : 'text-gray-900 dark:text-white'
        }`}>权限管理</h2>
      </div>

      {/* 标签页导航 */}
      <div className={`border-b transition-colors duration-200 ${
        isDark ? 'border-gray-600' : 'border-gray-200 dark:border-gray-700'
      }`}>
        <nav className="-mb-px flex space-x-8">
          {[
            { key: 'permissions', label: '权限列表', icon: '🔐' },
            { key: 'user-permissions', label: '用户权限', icon: '👤' },
            { key: 'roles', label: '角色管理', icon: '👥' },
            { key: 'stats', label: '统计信息', icon: '📊' }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                activeTab === tab.key
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : (isDark 
                    ? 'border-transparent text-gray-400 hover:text-gray-200 hover:border-gray-500' 
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 hover:border-gray-300')
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {error && (
        <div className={`p-4 border rounded-lg transition-colors duration-200 ${
          isDark 
            ? 'bg-red-900/20 border-red-800 text-red-300' 
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <p>{error}</p>
        </div>
      )}

      {/* 权限列表标签页 */}
      {activeTab === 'permissions' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className={`text-lg font-medium transition-colors duration-200 ${
              isDark ? 'text-white' : 'text-gray-900 dark:text-white'
            }`}>系统权限</h3>
            <div className="space-x-2">
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
              >
                {showAddForm ? '取消' : '新建权限'}
              </button>
              <button
                onClick={initializePermissions}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200"
              >
                初始化默认权限
              </button>
              <button
                onClick={fetchPermissions}
                disabled={loading}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors duration-200"
              >
                {loading ? '加载中...' : '刷新'}
              </button>
            </div>
          </div>

          {/* 新建权限表单 */}
          {showAddForm && (
            <div className={`p-4 border rounded-lg transition-colors duration-200 ${
              isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-700'
            }`}>
              <h4 className={`text-md font-medium mb-3 transition-colors duration-200 ${
                isDark ? 'text-white' : 'text-gray-900 dark:text-white'
              }`}>新建权限</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 transition-colors duration-200 ${
                    isDark ? 'text-gray-300' : 'text-gray-700'
                  }`}>权限名称</label>
                  <input
                    type="text"
                    value={newPermission.name}
                    onChange={(e) => setNewPermission({ ...newPermission, name: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200 ${
                      isDark 
                        ? 'bg-gray-600 border-gray-500 text-white placeholder-gray-400' 
                        : 'bg-white dark:bg-gray-800 border-gray-300 text-gray-900 dark:text-white placeholder-gray-500'
                    }`}
                    placeholder="例: user.read"
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1 transition-colors duration-200 ${
                    isDark ? 'text-gray-300' : 'text-gray-700'
                  }`}>资源</label>
                  <input
                    type="text"
                    value={newPermission.resource}
                    onChange={(e) => setNewPermission({ ...newPermission, resource: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200 ${
                      isDark 
                        ? 'bg-gray-600 border-gray-500 text-white placeholder-gray-400' 
                        : 'bg-white dark:bg-gray-800 border-gray-300 text-gray-900 dark:text-white placeholder-gray-500'
                    }`}
                    placeholder="例: user"
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1 transition-colors duration-200 ${
                    isDark ? 'text-gray-300' : 'text-gray-700'
                  }`}>动作</label>
                  <select
                    value={newPermission.action}
                    onChange={(e) => setNewPermission({ ...newPermission, action: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200 ${
                      isDark 
                        ? 'bg-gray-600 border-gray-500 text-white' 
                        : 'bg-white dark:bg-gray-800 border-gray-300 text-gray-900 dark:text-white'
                    }`}
                  >
                    <option value="">选择动作</option>
                    <option value="read">读取</option>
                    <option value="create">创建</option>
                    <option value="update">更新</option>
                    <option value="delete">删除</option>
                    <option value="access">访问</option>
                  </select>
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1 transition-colors duration-200 ${
                    isDark ? 'text-gray-300' : 'text-gray-700'
                  }`}>描述</label>
                  <input
                    type="text"
                    value={newPermission.description}
                    onChange={(e) => setNewPermission({ ...newPermission, description: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200 ${
                      isDark 
                        ? 'bg-gray-600 border-gray-500 text-white placeholder-gray-400' 
                        : 'bg-white dark:bg-gray-800 border-gray-300 text-gray-900 dark:text-white placeholder-gray-500'
                    }`}
                    placeholder="权限描述"
                  />
                </div>
              </div>
              <div className="mt-4 flex space-x-2">
                <button
                  onClick={createPermission}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                >
                  创建
                </button>
                <button
                  onClick={() => setShowAddForm(false)}
                  className={`px-4 py-2 rounded-lg transition-colors duration-200 ${
                    isDark 
                      ? 'bg-gray-600 text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-gray-7000' 
                      : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
                  }`}
                >
                  取消
                </button>
              </div>
            </div>
          )}

          {/* 权限列表 */}
          <div className={`border rounded-lg overflow-hidden transition-colors duration-200 ${
            isDark ? 'bg-gray-700 border-gray-600' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
          }`}>
            <table className={`min-w-full transition-colors duration-200 ${
              isDark ? 'divide-y divide-gray-600' : 'divide-y divide-gray-200'
            }`}>
              <thead className={`transition-colors duration-200 ${
                isDark ? 'bg-gray-600' : 'bg-gray-50 dark:bg-gray-700'
              }`}>
                <tr>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider transition-colors duration-200 ${
                    isDark ? 'text-gray-300' : 'text-gray-500 dark:text-gray-400'
                  }`}>ID</th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider transition-colors duration-200 ${
                    isDark ? 'text-gray-300' : 'text-gray-500 dark:text-gray-400'
                  }`}>权限名称</th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider transition-colors duration-200 ${
                    isDark ? 'text-gray-300' : 'text-gray-500 dark:text-gray-400'
                  }`}>资源</th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider transition-colors duration-200 ${
                    isDark ? 'text-gray-300' : 'text-gray-500 dark:text-gray-400'
                  }`}>动作</th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider transition-colors duration-200 ${
                    isDark ? 'text-gray-300' : 'text-gray-500 dark:text-gray-400'
                  }`}>描述</th>
                  <th className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider transition-colors duration-200 ${
                    isDark ? 'text-gray-300' : 'text-gray-500 dark:text-gray-400'
                  }`}>创建时间</th>
                </tr>
              </thead>
              <tbody className={`transition-colors duration-200 ${
                isDark ? 'bg-gray-700 divide-y divide-gray-600' : 'bg-white dark:bg-gray-800 divide-y divide-gray-200'
              }`}>
                {permissions.map((permission) => (
                  <tr key={permission.id}>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm transition-colors duration-200 ${
                      isDark ? 'text-gray-300' : 'text-gray-900 dark:text-white'
                    }`}>{permission.id}</td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium transition-colors duration-200 ${
                      isDark ? 'text-white' : 'text-gray-900 dark:text-white'
                    }`}>{permission.name}</td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm transition-colors duration-200 ${
                      isDark ? 'text-gray-400' : 'text-gray-500 dark:text-gray-400'
                    }`}>{permission.resource}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 py-1 text-xs rounded-full transition-colors duration-200 ${
                        permission.action === 'read' 
                          ? (isDark ? 'bg-blue-900/30 text-blue-400' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-800')
                          : permission.action === 'create' 
                          ? (isDark ? 'bg-green-900/30 text-green-400' : 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300')
                          : permission.action === 'update' 
                          ? (isDark ? 'bg-yellow-900/30 text-yellow-400' : 'bg-yellow-100 text-yellow-800')
                          : permission.action === 'delete' 
                          ? (isDark ? 'bg-red-900/30 text-red-400' : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300')
                          : (isDark ? 'bg-gray-600 text-gray-300' : 'bg-gray-100 text-gray-800')
                      }`}>
                        {permission.action}
                      </span>
                    </td>
                    <td className={`px-6 py-4 text-sm transition-colors duration-200 ${
                      isDark ? 'text-gray-400' : 'text-gray-500 dark:text-gray-400'
                    }`}>{permission.description}</td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm transition-colors duration-200 ${
                      isDark ? 'text-gray-400' : 'text-gray-500 dark:text-gray-400'
                    }`}>
                      {permission.created_at ? new Date(permission.created_at).toLocaleDateString('zh-CN') : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {permissions.length === 0 && !loading && (
              <div className={`p-8 text-center transition-colors duration-200 ${
                isDark ? 'text-gray-400' : 'text-gray-500 dark:text-gray-400'
              }`}>
                暂无权限数据
              </div>
            )}
          </div>
        </div>
      )}

      {/* 用户权限标签页 */}
      {activeTab === 'user-permissions' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className={`text-lg font-medium transition-colors duration-200 ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>用户权限分配</h3>
            <button
              onClick={fetchUsers}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200"
            >
              刷新用户列表
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 用户列表 */}
            <div className={`border rounded-lg transition-colors duration-200 ${
              isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            }`}>
              <div className={`px-4 py-3 border-b transition-colors duration-200 ${
                isDark ? 'border-gray-700' : 'border-gray-200'
              }`}>
                <h4 className={`font-medium transition-colors duration-200 ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>用户列表</h4>
              </div>
              <div className="max-h-96 overflow-y-auto">
                {users.map((user) => (
                  <div
                    key={user.id}
                    onClick={() => setSelectedUser(user.id)}
                    className={`px-4 py-3 border-b cursor-pointer transition-colors duration-200 ${
                      isDark ? 'bg-gray-700 border-gray-600 hover:bg-gray-600' : 'border-gray-100 hover:bg-gray-50'
                    } ${
                      selectedUser === user.id 
                        ? isDark ? 'bg-blue-900/30 border-blue-600' : 'bg-blue-50 border-blue-200'
                        : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={`text-sm font-medium transition-colors duration-200 ${
                          isDark ? 'text-white' : 'text-gray-900'
                        }`}>{user.username}</p>
                        <p className={`text-sm transition-colors duration-200 ${
                          isDark ? 'text-gray-400' : 'text-gray-500'
                        }`}>{user.email}</p>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full transition-colors duration-200 ${
                        user.status === 'active' 
                          ? isDark ? 'bg-green-900/30 text-green-300' : 'bg-green-100 text-green-800'
                          : isDark ? 'bg-red-900/30 text-red-300' : 'bg-red-100 text-red-800'
                      }`}>
                        {user.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 用户权限详情 */}
            <div className={`border rounded-lg transition-colors duration-200 ${
              isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            }`}>
              <div className={`px-4 py-3 border-b transition-colors duration-200 ${
                isDark ? 'border-gray-700' : 'border-gray-200'
              }`}>
                <h4 className={`font-medium transition-colors duration-200 ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>
                  {selectedUser ? `用户权限 (ID: ${selectedUser})` : '选择用户查看权限'}
                </h4>
              </div>
              <div className="p-4">
                {selectedUser ? (
                  <div className="space-y-3">
                    {userPermissions.length > 0 ? (
                      userPermissions.map((permission, index) => (
                        <div key={index} className={`flex items-center justify-between p-3 rounded-lg transition-colors duration-200 ${
                          isDark ? 'bg-gray-700' : 'bg-gray-50'
                        }`}>
                          <div>
                            <p className={`text-sm font-medium transition-colors duration-200 ${
                              isDark ? 'text-white' : 'text-gray-900'
                            }`}>{permission.name}</p>
                            <p className={`text-sm transition-colors duration-200 ${
                              isDark ? 'text-gray-400' : 'text-gray-500'
                            }`}>{permission.resource}.{permission.action}</p>
                          </div>
                          <span className={`px-2 py-1 text-xs rounded-full transition-colors duration-200 ${
                            isDark ? 'bg-green-900/30 text-green-300' : 'bg-green-100 text-green-800'
                          }`}>
                            已授权
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className={`text-sm text-center py-4 transition-colors duration-200 ${
                        isDark ? 'text-gray-400' : 'text-gray-500'
                      }`}>该用户暂无权限</p>
                    )}
                  </div>
                ) : (
                  <p className={`text-sm text-center py-4 transition-colors duration-200 ${
                    isDark ? 'text-gray-400' : 'text-gray-500'
                  }`}>请从左侧选择一个用户</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 角色管理标签页 */}
      {activeTab === 'roles' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className={`text-lg font-medium transition-colors duration-200 ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>角色管理</h3>
            <button
              onClick={() => setShowRoleForm(!showRoleForm)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
            >
              {showRoleForm ? '取消' : '新建角色'}
            </button>
          </div>

          {/* 新建角色表单 */}
          {showRoleForm && (
            <div className={`p-4 border rounded-lg transition-colors duration-200 ${
              isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
            }`}>
              <h4 className={`text-md font-medium mb-3 transition-colors duration-200 ${
                isDark ? 'text-white' : 'text-gray-900'
              }`}>新建角色</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 transition-colors duration-200 ${
                    isDark ? 'text-gray-300' : 'text-gray-700'
                  }`}>角色名称</label>
                  <input
                    type="text"
                    value={newRole.name}
                    onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200 ${
                      isDark 
                        ? 'bg-gray-600 border-gray-500 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                    placeholder="例: admin, editor, viewer"
                  />
                </div>
                <div>
                  <label className={`block text-sm font-medium mb-1 transition-colors duration-200 ${
                    isDark ? 'text-gray-300' : 'text-gray-700'
                  }`}>角色描述</label>
                  <input
                    type="text"
                    value={newRole.description}
                    onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200 ${
                      isDark 
                        ? 'bg-gray-600 border-gray-500 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    }`}
                    placeholder="角色描述"
                  />
                </div>
              </div>
              <div className="mt-4 flex space-x-2">
                <button
                  onClick={createRole}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                >
                  创建
                </button>
                <button
                  onClick={() => setShowRoleForm(false)}
                  className={`px-4 py-2 rounded-lg transition-colors duration-200 ${
                    isDark 
                      ? 'bg-gray-600 text-gray-300 hover:bg-gray-500' 
                      : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
                  }`}
                >
                  取消
                </button>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 角色列表 */}
            <div className={`border rounded-lg transition-colors duration-200 ${
              isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            }`}>
              <div className={`px-4 py-3 border-b transition-colors duration-200 ${
                isDark ? 'border-gray-700' : 'border-gray-200'
              }`}>
                <h4 className={`font-medium transition-colors duration-200 ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>角色列表</h4>
              </div>
              <div className="max-h-96 overflow-y-auto">
                {roles.map((role) => (
                  <div key={role.id} className={`px-4 py-3 border-b cursor-pointer transition-colors duration-200 ${
                    isDark ? 'border-gray-600 hover:bg-gray-700' : 'border-gray-100 hover:bg-gray-50'
                  } ${selectedRole === role.id ? (isDark ? 'bg-blue-900/30' : 'bg-blue-50') : ''}`}>
                    <div className="flex items-center justify-between">
                      <div onClick={() => setSelectedRole(role.id)} className="flex-1">
                        <p className={`text-sm font-medium transition-colors duration-200 ${
                          isDark ? 'text-white' : 'text-gray-900'
                        }`}>{role.name}</p>
                        <p className={`text-sm transition-colors duration-200 ${
                          isDark ? 'text-gray-400' : 'text-gray-500'
                        }`}>{role.description || '无描述'}</p>
                        <p className={`text-xs transition-colors duration-200 ${
                          isDark ? 'text-gray-500' : 'text-gray-400'
                        }`}>ID: {role.id}</p>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingRole(role);
                          }}
                          className={`p-1 rounded hover:bg-gray-200 transition-colors duration-200 ${
                            isDark ? 'text-gray-400 hover:bg-gray-600' : 'text-gray-600'
                          }`}
                          title="编辑角色"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteRole(role.id);
                          }}
                          className={`p-1 rounded hover:bg-red-100 transition-colors duration-200 ${
                            isDark ? 'text-red-400 hover:bg-red-900/30' : 'text-red-600'
                          }`}
                          title="删除角色"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {roles.length === 0 && (
                  <div className="px-4 py-8 text-center">
                    <p className={`text-sm transition-colors duration-200 ${
                      isDark ? 'text-gray-400' : 'text-gray-500'
                    }`}>暂无角色</p>
                  </div>
                )}
              </div>
            </div>

            {/* 角色权限详情 */}
            <div className={`border rounded-lg transition-colors duration-200 ${
              isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            }`}>
              <div className={`px-4 py-3 border-b transition-colors duration-200 ${
                isDark ? 'border-gray-700' : 'border-gray-200'
              }`}>
                <div className="flex justify-between items-center">
                  <h4 className={`font-medium transition-colors duration-200 ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}>
                    {selectedRole ? `角色权限 (ID: ${selectedRole})` : '选择角色查看权限'}
                  </h4>
                  {selectedRole && (
                    <button
                      onClick={() => {
                        // 在这里可以添加权限分配功能
                        alert('权限分配功能正在开发中...');
                      }}
                      className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors duration-200"
                    >
                      分配权限
                    </button>
                  )}
                </div>
              </div>
              <div className="p-4">
                {selectedRole ? (
                  <div className="space-y-3">
                    {rolePermissions.length > 0 ? (
                      rolePermissions.map((permission, index) => (
                        <div key={index} className={`flex items-center justify-between p-3 rounded-lg transition-colors duration-200 ${
                          isDark ? 'bg-gray-700' : 'bg-gray-50'
                        }`}>
                          <div>
                            <p className={`text-sm font-medium transition-colors duration-200 ${
                              isDark ? 'text-white' : 'text-gray-900'
                            }`}>{permission.name}</p>
                            <p className={`text-sm transition-colors duration-200 ${
                              isDark ? 'text-gray-400' : 'text-gray-500'
                            }`}>{permission.resource}.{permission.action}</p>
                          </div>
                          <span className={`px-2 py-1 text-xs rounded-full transition-colors duration-200 ${
                            isDark ? 'bg-green-900/30 text-green-300' : 'bg-green-100 text-green-800'
                          }`}>
                            已授权
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className={`text-sm text-center py-4 transition-colors duration-200 ${
                        isDark ? 'text-gray-400' : 'text-gray-500'
                      }`}>该角色暂无权限</p>
                    )}
                  </div>
                ) : (
                  <p className={`text-sm text-center py-4 transition-colors duration-200 ${
                    isDark ? 'text-gray-400' : 'text-gray-500'
                  }`}>请从左侧选择一个角色</p>
                )}
              </div>
            </div>
          </div>

          {/* 编辑角色模态框 */}
          {editingRole && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className={`max-w-md w-full mx-4 p-6 rounded-lg transition-colors duration-200 ${
                isDark ? 'bg-gray-800' : 'bg-white'
              }`}>
                <h3 className={`text-lg font-medium mb-4 transition-colors duration-200 ${
                  isDark ? 'text-white' : 'text-gray-900'
                }`}>编辑角色</h3>
                <div className="space-y-4">
                  <div>
                    <label className={`block text-sm font-medium mb-1 transition-colors duration-200 ${
                      isDark ? 'text-gray-300' : 'text-gray-700'
                    }`}>角色名称</label>
                    <input
                      type="text"
                      value={editingRole.name}
                      onChange={(e) => setEditingRole({ ...editingRole, name: e.target.value })}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200 ${
                        isDark 
                          ? 'bg-gray-600 border-gray-500 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-1 transition-colors duration-200 ${
                      isDark ? 'text-gray-300' : 'text-gray-700'
                    }`}>角色描述</label>
                    <input
                      type="text"
                      value={editingRole.description}
                      onChange={(e) => setEditingRole({ ...editingRole, description: e.target.value })}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200 ${
                        isDark 
                          ? 'bg-gray-600 border-gray-500 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    />
                  </div>
                </div>
                <div className="mt-6 flex space-x-3">
                  <button
                    onClick={updateRole}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                  >
                    更新
                  </button>
                  <button
                    onClick={() => setEditingRole(null)}
                    className={`flex-1 px-4 py-2 rounded-lg transition-colors duration-200 ${
                      isDark 
                        ? 'bg-gray-600 text-gray-300 hover:bg-gray-500' 
                        : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
                    }`}
                  >
                    取消
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 统计信息标签页 */}
      {activeTab === 'stats' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className={`text-lg font-medium transition-colors duration-200 ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>权限统计</h3>
            <button
              onClick={fetchStats}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              刷新统计
            </button>
          </div>
          
          {stats ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className={`border rounded-lg p-6 transition-colors duration-200 ${
                isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
              }`}>
                <div className="flex items-center">
                  <div className={`p-2 rounded-lg transition-colors duration-200 ${
                    isDark ? 'bg-blue-900/30' : 'bg-blue-100'
                  }`}>
                    <Settings className={`w-6 h-6 transition-colors duration-200 ${
                      isDark ? 'text-blue-400' : 'text-blue-600'
                    }`} />
                  </div>
                  <div className="ml-4">
                    <p className={`text-sm font-medium transition-colors duration-200 ${
                      isDark ? 'text-gray-400' : 'text-gray-500'
                    }`}>总权限数</p>
                    <p className={`text-2xl font-semibold transition-colors duration-200 ${
                      isDark ? 'text-white' : 'text-gray-900'
                    }`}>{stats.total_permissions || 0}</p>
                  </div>
                </div>
              </div>
              <div className={`border rounded-lg p-6 transition-colors duration-200 ${
                isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
              }`}>
                <div className="flex items-center">
                  <div className={`p-2 rounded-lg transition-colors duration-200 ${
                    isDark ? 'bg-green-900/30' : 'bg-green-100'
                  }`}>
                    <Users className={`w-6 h-6 transition-colors duration-200 ${
                      isDark ? 'text-green-400' : 'text-green-600'
                    }`} />
                  </div>
                  <div className="ml-4">
                    <p className={`text-sm font-medium transition-colors duration-200 ${
                      isDark ? 'text-gray-400' : 'text-gray-500'
                    }`}>有权限用户</p>
                    <p className={`text-2xl font-semibold transition-colors duration-200 ${
                      isDark ? 'text-white' : 'text-gray-900'
                    }`}>{stats.users_with_permissions || 0}</p>
                  </div>
                </div>
              </div>
              <div className={`border rounded-lg p-6 transition-colors duration-200 ${
                isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
              }`}>
                <div className="flex items-center">
                  <div className={`p-2 rounded-lg transition-colors duration-200 ${
                    isDark ? 'bg-purple-900/30' : 'bg-purple-100'
                  }`}>
                    <Shield className={`w-6 h-6 transition-colors duration-200 ${
                      isDark ? 'text-purple-400' : 'text-purple-600'
                    }`} />
                  </div>
                  <div className="ml-4">
                    <p className={`text-sm font-medium transition-colors duration-200 ${
                      isDark ? 'text-gray-400' : 'text-gray-500'
                    }`}>角色数</p>
                    <p className={`text-2xl font-semibold transition-colors duration-200 ${
                      isDark ? 'text-white' : 'text-gray-900'
                    }`}>{stats.total_roles || 0}</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className={`border rounded-lg p-8 text-center transition-colors duration-200 ${
              isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            }`}>
              <p className={`transition-colors duration-200 ${
                isDark ? 'text-gray-400' : 'text-gray-500'
              }`}>点击刷新统计获取数据</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isDark, setIsDark] = useState(true); // 默认暗色主题
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    // Check if user is already authenticated
    const authenticated = localStorage.getItem('authenticated');
    if (authenticated === 'true') {
      setIsAuthenticated(true);
    }

    // Check theme preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      setIsDark(savedTheme === 'dark');
    }

    // Check sidebar collapsed preference
    const savedCollapsed = localStorage.getItem('sidebarCollapsed');
    if (savedCollapsed) {
      setIsCollapsed(savedCollapsed === 'true');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    localStorage.setItem('theme', newTheme ? 'dark' : 'light');
  };

  const handleSetIsCollapsed = (collapsed: boolean) => {
    setIsCollapsed(collapsed);
    localStorage.setItem('sidebarCollapsed', collapsed.toString());
  };

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('authenticated');
    setIsAuthenticated(false);
  };

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      <SidebarContext.Provider value={{ 
        isCollapsed, 
        setIsCollapsed: handleSetIsCollapsed, 
        isMobileOpen, 
        setIsMobileOpen 
      }}>
        {!isAuthenticated ? (
          <LoginPage onLogin={handleLogin} />
        ) : (
          <AdminDashboard onLogout={handleLogout} />
        )}
      </SidebarContext.Provider>
    </ThemeContext.Provider>
  );
}

export default App;
