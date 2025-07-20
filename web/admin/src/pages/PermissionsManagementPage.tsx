import React, { useState, useEffect } from 'react';
import { Settings, Users, Shield } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const PermissionsManagementPage: React.FC = () => {
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
                      ? 'bg-gray-600 text-gray-300 hover:bg-gray-500' 
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

export default PermissionsManagementPage;