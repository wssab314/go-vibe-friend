import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';

interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  created_at: string;
}

const UserManagementPage: React.FC = () => {
  const { isDark } = useTheme();
  const [users, setUsers] = useState<User[]>([]);
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

export default UserManagementPage;