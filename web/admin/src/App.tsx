import React, { useState, useEffect } from 'react';

// Login Page Component
const LoginPage = ({ onLogin }: { onLogin: () => void }) => {
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Go Vibe Friend</h1>
          <p className="text-gray-600">Admin Dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Username
            </label>
            <input
              type="text"
              value={credentials.username}
              onChange={(e) => setCredentials({ ...credentials, username: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter username"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              value={credentials.password}
              onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
          <p className="text-xs text-gray-500">
            Demo credentials: admin / admin123
          </p>
        </div>
      </div>
    </div>
  );
};

// Admin Dashboard Layout Component
const AdminDashboard = ({ onLogout }: { onLogout: () => void }) => {
  const [currentView, setCurrentView] = useState<'dashboard' | 'users' | 'jobs' | 'llm'>('dashboard');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">Go Vibe Friend Admin</h1>
            </div>
            <button
              onClick={onLogout}
              className="text-gray-500 hover:text-gray-700 text-sm font-medium"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex space-x-8">
          {/* Sidebar Navigation */}
          <div className="w-64 flex-shrink-0">
            <nav className="bg-white rounded-lg shadow-sm p-4">
              <div className="space-y-2">
                <button
                  onClick={() => setCurrentView('dashboard')}
                  className={`w-full text-left px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    currentView === 'dashboard'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  📊 Dashboard
                </button>
                <button
                  onClick={() => setCurrentView('users')}
                  className={`w-full text-left px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    currentView === 'users'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  👥 Users
                </button>
                <button
                  onClick={() => setCurrentView('jobs')}
                  className={`w-full text-left px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    currentView === 'jobs'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  🔧 Jobs
                </button>
                <button
                  onClick={() => setCurrentView('llm')}
                  className={`w-full text-left px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    currentView === 'llm'
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  🤖 LLM
                </button>
              </div>
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <div className="bg-white rounded-lg shadow-sm p-6">
              {currentView === 'dashboard' && <Dashboard />}
              {currentView === 'users' && <UsersList />}
              {currentView === 'jobs' && <JobsManagement />}
              {currentView === 'llm' && <LLMInterface />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Users List Component
const UsersList = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Auto-load data when component mounts
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
        <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
        <button
          onClick={fetchUsers}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {loading && users.length === 0 && (
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-500">Loading users...</div>
        </div>
      )}

      {users.length === 0 && !loading && !error && (
        <div className="p-8 bg-gray-50 rounded-lg text-center">
          <p className="text-gray-600">No users found.</p>
        </div>
      )}

      {users.length > 0 && (
        <div className="space-y-4">
          {users.map((user) => (
            <div key={user.id} className="p-4 border rounded-lg bg-white hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className="font-medium text-gray-900">#{user.id}</span>
                    <span className="text-blue-600 font-medium">{user.username}</span>
                    <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">{user.role}</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">{user.email}</p>
                  <p className="text-xs text-gray-500">
                    Created: {new Date(user.created_at).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => deleteUser(user.id)}
                  className="text-red-600 hover:text-red-800 text-sm font-medium"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
          <div className="text-center text-sm text-gray-500 pt-4">
            Total users: {users.length}
          </div>
        </div>
      )}
    </div>
  );
};

// Dashboard Component
const Dashboard = () => {
  const [stats, setStats] = useState<any>(null);
  const [systemInfo, setSystemInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Auto-load data when component mounts
  useEffect(() => {
    fetchDashboardData();
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

      const [statsRes, systemRes] = await Promise.all([
        fetch('http://localhost:8080/api/admin/dashboard/stats', {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
        fetch('http://localhost:8080/api/admin/dashboard/system', {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
      ]);

      if (statsRes.ok && systemRes.ok) {
        const statsData = await statsRes.json();
        const systemData = await systemRes.json();
        setStats(statsData);
        setSystemInfo(systemData);
      } else {
        if (statsRes.status === 401 || systemRes.status === 401) {
          setError('Authentication failed. Please login again.');
        } else {
          const errorData = await statsRes.json().catch(() => ({ error: 'Unknown error' }));
          setError('Failed to fetch dashboard data: ' + errorData.error);
        }
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Dashboard Overview</h2>
        <div className="space-x-3">
          <button
            onClick={fetchDashboardData}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Refresh'}
          </button>
          <button
            onClick={createSampleJobs}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Create Sample Jobs
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {loading && !stats && (
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-500">Loading dashboard data...</div>
        </div>
      )}

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 rounded-lg text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Total Users</p>
                <p className="text-3xl font-bold">{stats.total_users}</p>
              </div>
              <div className="text-blue-200 text-2xl">👥</div>
            </div>
          </div>
          <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 rounded-lg text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Total Jobs</p>
                <p className="text-3xl font-bold">{stats.total_jobs}</p>
              </div>
              <div className="text-green-200 text-2xl">📋</div>
            </div>
          </div>
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6 rounded-lg text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm">Active Jobs</p>
                <p className="text-3xl font-bold">{stats.active_jobs}</p>
              </div>
              <div className="text-orange-200 text-2xl">🔄</div>
            </div>
          </div>
          <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-6 rounded-lg text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">Completed Jobs</p>
                <p className="text-3xl font-bold">{stats.completed_jobs}</p>
              </div>
              <div className="text-purple-200 text-2xl">✅</div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {stats?.recent_users && (
          <div className="bg-white p-6 rounded-lg border">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">Recent Users</h3>
            <div className="space-y-3">
              {stats.recent_users.map((user: any) => (
                <div key={user.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <span className="font-medium text-gray-900">{user.username}</span>
                    <span className="text-gray-600 ml-2 text-sm">{user.email}</span>
                  </div>
                  <span className="text-sm text-gray-500">
                    {new Date(user.created_at).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {stats?.recent_jobs && (
          <div className="bg-white p-6 rounded-lg border">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">Recent Jobs</h3>
            <div className="space-y-3">
              {stats.recent_jobs.map((job: any) => (
                <div key={job.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <span className="font-medium text-gray-900">{job.job_type}</span>
                    <span className="text-gray-600 ml-2 text-sm">by {job.username}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      job.status === 'completed' ? 'bg-green-100 text-green-800' :
                      job.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      job.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {job.status}
                    </span>
                    <span className="text-sm text-gray-500">
                      {new Date(job.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {systemInfo && (
        <div className="bg-white p-6 rounded-lg border">
          <h3 className="text-lg font-semibold mb-4 text-gray-900">System Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <p><span className="font-medium">Version:</span> {systemInfo.version}</p>
              <p><span className="font-medium">Environment:</span> {systemInfo.environment}</p>
              <p><span className="font-medium">Database:</span> {systemInfo.database}</p>
            </div>
            <div className="space-y-2">
              <p><span className="font-medium">Go Version:</span> {systemInfo.go_version}</p>
              <p><span className="font-medium">Features:</span></p>
              <ul className="ml-4 mt-1 space-y-1">
                {systemInfo.features?.map((feature: string, idx: number) => (
                  <li key={idx} className="text-sm text-gray-600">• {feature}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Jobs Management Component
const JobsManagement = () => {
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
        <h2 className="text-2xl font-bold text-gray-900">Jobs Management</h2>
        <button
          onClick={fetchJobs}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {loading && jobs.length === 0 && (
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-500">Loading jobs...</div>
        </div>
      )}

      {jobs.length === 0 && !loading && !error && (
        <div className="p-8 bg-gray-50 rounded-lg text-center">
          <p className="text-gray-600">No jobs found.</p>
        </div>
      )}

      {jobs.length > 0 && (
        <div className="space-y-4">
          {jobs.map((job) => (
            <div key={job.id} className="p-6 border rounded-lg bg-white hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <span className="font-medium text-gray-900">#{job.id}</span>
                    <span className="text-blue-600 font-medium">{job.job_type}</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      job.status === 'completed' ? 'bg-green-100 text-green-800' :
                      job.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      job.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {job.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    <span className="font-medium">User:</span> {job.user?.username || 'Unknown'}
                  </p>
                  {job.input_data && (
                    <p className="text-sm text-gray-600 mb-2">
                      <span className="font-medium">Input:</span> {job.input_data.substring(0, 100)}...
                    </p>
                  )}
                  {job.output_data && (
                    <p className="text-sm text-gray-600 mb-2">
                      <span className="font-medium">Output:</span> {job.output_data.substring(0, 100)}...
                    </p>
                  )}
                  {job.error_msg && (
                    <p className="text-sm text-red-600 mb-2">
                      <span className="font-medium">Error:</span> {job.error_msg}
                    </p>
                  )}
                  <p className="text-xs text-gray-500 mt-3">
                    Created: {new Date(job.created_at).toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={() => deleteJob(job.id)}
                  className="text-red-600 hover:text-red-800 text-sm font-medium"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
          <div className="text-center text-sm text-gray-500 pt-4">
            Total jobs: {jobs.length}
          </div>
        </div>
      )}
    </div>
  );
};

// LLM Interface Component
const LLMInterface = () => {
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
        setResult('✅ Connection successful! OpenAI API is working.');
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
        <h2 className="text-2xl font-bold text-gray-900">LLM Code Generator</h2>
        <button
          onClick={fetchConfig}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {/* Configuration Status */}
      {config && (
        <div className="bg-white p-4 rounded-lg border">
          <h3 className="text-lg font-semibold mb-3">Configuration Status</h3>
          <div className="flex items-center space-x-4">
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
              config.configured 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {config.configured ? 'API Key Configured' : 'API Key Missing'}
            </div>
            <button
              onClick={testConnection}
              disabled={!config.configured || loading}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              Test Connection
            </button>
          </div>
        </div>
      )}

      {/* Simple Code Generation */}
      <div className="bg-white p-4 rounded-lg border">
        <h3 className="text-lg font-semibold mb-3">Simple Code Generation</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Enter your prompt:
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={4}
              placeholder="Example: Create a Go struct for a User with ID, Name, Email and CreatedAt fields"
            />
          </div>
          <button
            onClick={generateCode}
            disabled={isGenerating || !config?.configured}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {isGenerating ? 'Generating...' : 'Generate Code'}
          </button>
        </div>
      </div>

      {/* Results */}
      {result && (
        <div className="bg-white p-4 rounded-lg border">
          <h3 className="text-lg font-semibold mb-3">Generated Code</h3>
          <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
            <code>{result}</code>
          </pre>
        </div>
      )}

      {/* Coming Soon */}
      <div className="bg-white p-4 rounded-lg border">
        <h3 className="text-lg font-semibold mb-3">Coming Soon</h3>
        <div className="space-y-2 text-sm text-gray-600">
          <p>🚀 Frontend file upload (ZIP)</p>
          <p>💬 Chat history analysis</p>
          <p>🔄 Full project generation</p>
          <p>📊 Code diff visualization</p>
          <p>⚡ Real-time generation progress</p>
        </div>
      </div>
    </div>
  );
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

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
  };

  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return <AdminDashboard onLogout={handleLogout} />;
}

export default App;
