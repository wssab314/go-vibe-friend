import React, { useState } from 'react';
import { Play, Copy, ChevronDown, ChevronRight } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface APIEndpoint {
  name: string;
  method: string;
  path: string;
  description: string;
  needsAuth: boolean;
  authType?: string;
  body?: any;
}

const APITestInterfacePage: React.FC = () => {
  const { isDark } = useTheme();
  const [selectedAPI, setSelectedAPI] = useState<APIEndpoint | null>(null);
  const [testResult, setTestResult] = useState('');
  const [testLoading, setTestLoading] = useState(false);
  const [testError, setTestError] = useState('');
  const [requestBody, setRequestBody] = useState('');
  const [responseTime, setResponseTime] = useState<number | null>(null);
  const [userToken, setUserToken] = useState('');
  const [adminToken, setAdminToken] = useState('');
  const [, setTestUserInfo] = useState<any>(null);
  const [, setTestHistory] = useState<any[]>([]);
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());

  // 定义API接口分类
  const apiCategories = {
    admin: {
      name: '管理员接口',
      icon: '🔧',
      categories: {
        auth: {
          name: '认证管理',
          icon: '🔐',
          endpoints: [
            {
              name: '管理员登录',
              method: 'POST',
              path: '/api/admin/login',
              description: '管理员登录获取token',
              needsAuth: false,
              body: { email: 'admin@example.com', password: 'admin123' }
            },
            {
              name: '获取管理员资料',
              method: 'GET',
              path: '/api/admin/profile',
              description: '获取当前管理员的个人资料',
              needsAuth: true,
              authType: 'admin'
            }
          ]
        },
        users: {
          name: '用户管理',
          icon: '👥',
          endpoints: [
            {
              name: '获取用户列表',
              method: 'GET',
              path: '/api/admin/users',
              description: '获取所有用户列表',
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
          ]
        },
        dashboard: {
          name: '仪表板',
          icon: '📊',
          endpoints: [
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
            }
          ]
        },
        jobs: {
          name: '任务管理',
          icon: '⚡',
          endpoints: [
            {
              name: '获取任务列表',
              method: 'GET',
              path: '/api/admin/jobs',
              description: '获取所有生成任务',
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
              name: '创建示例任务',
              method: 'POST',
              path: '/api/admin/jobs/sample',
              description: '创建示例生成任务',
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
              body: { status: 'completed', output_data: 'Generated code here' }
            },
            {
              name: '删除任务',
              method: 'DELETE',
              path: '/api/admin/jobs/1',
              description: '删除指定任务',
              needsAuth: true,
              authType: 'admin'
            }
          ]
        },
        permissions: {
          name: '权限管理',
          icon: '🛡️',
          endpoints: [
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
              body: { name: 'test.permission', description: '测试权限', resource: 'test', action: 'read' }
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
            }
          ]
        },
        export: {
          name: '数据导出',
          icon: '📤',
          endpoints: [
            {
              name: '导出用户数据',
              method: 'POST',
              path: '/api/admin/export',
              description: '导出用户数据',
              needsAuth: true,
              authType: 'admin',
              body: { data_type: 'users', format: 'json' }
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
            }
          ]
        }
      }
    },
    user: {
      name: '用户接口',
      icon: '👤',
      categories: {
        auth: {
          name: '用户认证',
          icon: '🔑',
          endpoints: [
            {
              name: '用户注册',
              method: 'POST',
              path: '/api/vf/v1/auth/register',
              description: '用户注册',
              needsAuth: false,
              body: { username: 'testuser', email: 'testuser@example.com', password: 'password123' }
            },
            {
              name: '用户登录',
              method: 'POST',
              path: '/api/vf/v1/auth/login',
              description: '用户登录获取token',
              needsAuth: false,
              body: { email: 'testuser@example.com', password: 'password123' }
            },
            {
              name: '刷新令牌',
              method: 'POST',
              path: '/api/vf/v1/auth/refresh',
              description: '使用刷新令牌获取新的访问令牌',
              needsAuth: false,
              body: { refresh_token: 'your-refresh-token-here' }
            },
            {
              name: '用户登出',
              method: 'POST',
              path: '/api/vf/v1/auth/logout',
              description: '用户登出',
              needsAuth: true,
              authType: 'user'
            }
          ]
        },
        profile: {
          name: '个人资料',
          icon: '👤',
          endpoints: [
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
              body: { display_name: 'Test User', bio: 'This is a test user', location: 'Test City', website: 'https://example.com' }
            },
            {
              name: '查看用户资料',
              method: 'GET',
              path: '/api/vf/v1/users/1/profile',
              description: '查看指定用户的公开资料',
              needsAuth: true,
              authType: 'user'
            }
          ]
        },
        files: {
          name: '文件管理',
          icon: '📁',
          endpoints: [
            {
              name: '文件上传',
              method: 'POST',
              path: '/api/vf/v1/files/upload',
              description: '上传文件（需要使用form-data格式）',
              needsAuth: true,
              authType: 'user',
              body: { category: 'general' }
            },
            {
              name: '头像上传',
              method: 'POST',
              path: '/api/vf/v1/files/avatar',
              description: '上传用户头像（需要使用form-data格式）',
              needsAuth: true,
              authType: 'user'
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
            }
          ]
        },
        email: {
          name: '邮件系统',
          icon: '📧',
          endpoints: [
            {
              name: '发送验证邮件',
              method: 'POST',
              path: '/api/vf/v1/email/send-verification',
              description: '发送邮箱验证邮件',
              needsAuth: true,
              authType: 'user',
              body: { email: 'test@example.com' }
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
              body: { email: 'test@example.com' }
            },
            {
              name: '重置密码',
              method: 'POST',
              path: '/api/vf/v1/email/reset-password',
              description: '使用令牌重置密码',
              needsAuth: false,
              body: { token: 'reset-token-here', new_password: 'newpassword123' }
            }
          ]
        },
        misc: {
          name: '其他功能',
          icon: '🔧',
          endpoints: [
            {
              name: 'Ping测试',
              method: 'GET',
              path: '/api/vf/v1/ping',
              description: '测试用户API连通性',
              needsAuth: false
            }
          ]
        }
      }
    }
  };

  const testAPI = async (api: APIEndpoint) => {
    setTestLoading(true);
    setTestError('');
    setTestResult('');
    setResponseTime(null);

    const startTime = Date.now();

    try {
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
    } finally {
      setTestLoading(false);
    }
  };

  const handleAPISelect = (api: APIEndpoint) => {
    setSelectedAPI(api);
    setRequestBody(api.body ? JSON.stringify(api.body, null, 2) : '');
    setTestResult('');
    setTestError('');
    setResponseTime(null);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  // 切换分类折叠状态
  const toggleCategory = (categoryKey: string) => {
    const newCollapsed = new Set(collapsedCategories);
    if (newCollapsed.has(categoryKey)) {
      newCollapsed.delete(categoryKey);
    } else {
      newCollapsed.add(categoryKey);
    }
    setCollapsedCategories(newCollapsed);
  };

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex justify-between items-center flex-shrink-0">
        <h2 className={`text-2xl font-bold transition-colors duration-200 ${
          isDark ? 'text-white' : 'text-gray-900 dark:text-white'
        }`}>API 测试界面</h2>
        <div className="flex space-x-2">
          <div className={`px-3 py-1 rounded-full text-sm transition-colors duration-200 ${
            isDark ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-800'
          }`}>
            服务器: localhost:8080
          </div>
        </div>
      </div>

      {/* Token 管理区域 */}
      <div className={`p-4 rounded-lg border transition-colors duration-200 flex-shrink-0 ${
        isDark ? 'bg-gray-800 border-gray-700' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
      }`}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className={`text-sm font-medium mb-2 transition-colors duration-200 ${
              isDark ? 'text-gray-300' : 'text-gray-700'
            }`}>管理员 Token</h3>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={adminToken}
                onChange={(e) => setAdminToken(e.target.value)}
                placeholder="管理员Token"
                className={`flex-1 px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200 ${
                  isDark 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                }`}
              />
              <button
                onClick={() => {
                  const loginAPI = apiCategories.admin.categories.auth.endpoints.find(api => api.path === '/api/admin/login');
                  if (loginAPI) testAPI(loginAPI);
                }}
                className="px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
              >
                快速登录
              </button>
            </div>
          </div>
          <div>
            <h3 className={`text-sm font-medium mb-2 transition-colors duration-200 ${
              isDark ? 'text-gray-300' : 'text-gray-700'
            }`}>用户 Token</h3>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={userToken}
                onChange={(e) => setUserToken(e.target.value)}
                placeholder="用户Token"
                className={`flex-1 px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors duration-200 ${
                  isDark 
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                }`}
              />
              <button
                onClick={() => {
                  const loginAPI = apiCategories.user.categories.auth.endpoints.find(api => api.path === '/api/vf/v1/auth/login');
                  if (loginAPI) testAPI(loginAPI);
                }}
                className="px-3 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200"
              >
                快速登录
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
        {/* API列表 */}
        <div className={`rounded-lg border transition-colors duration-200 flex flex-col h-full ${
          isDark ? 'bg-gray-800 border-gray-700' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
        }`}>
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
            <h3 className={`text-lg font-semibold transition-colors duration-200 ${
              isDark ? 'text-white' : 'text-gray-900 dark:text-white'
            }`}>API 接口</h3>
          </div>
          <div className="p-4 space-y-4 flex-1 overflow-y-auto">
            {Object.entries(apiCategories).map(([mainCategory, categoryData]) => (
              <div key={mainCategory} className="space-y-3">
                {/* 主分类标题 */}
                <div 
                  className={`flex items-center space-x-2 p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                    isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                  onClick={() => toggleCategory(mainCategory)}
                >
                  <span className="text-lg">{categoryData.icon}</span>
                  <h4 className={`font-medium flex-1 transition-colors duration-200 ${
                    isDark ? 'text-white' : 'text-gray-900'
                  }`}>{categoryData.name}</h4>
                  {collapsedCategories.has(mainCategory) ? (
                    <ChevronRight className={`w-4 h-4 transition-colors duration-200 ${
                      isDark ? 'text-gray-400' : 'text-gray-600'
                    }`} />
                  ) : (
                    <ChevronDown className={`w-4 h-4 transition-colors duration-200 ${
                      isDark ? 'text-gray-400' : 'text-gray-600'
                    }`} />
                  )}
                </div>

                {/* 子分类和接口 */}
                {!collapsedCategories.has(mainCategory) && (
                  <div className="ml-4 space-y-3">
                    {Object.entries(categoryData.categories).map(([subCategory, subCategoryData]) => (
                      <div key={subCategory} className="space-y-2">
                        {/* 子分类标题 */}
                        <div 
                          className={`flex items-center space-x-2 p-2 rounded cursor-pointer transition-all duration-200 ${
                            isDark ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-50 hover:bg-gray-100'
                          }`}
                          onClick={() => toggleCategory(`${mainCategory}.${subCategory}`)}
                        >
                          <span className="text-sm">{subCategoryData.icon}</span>
                          <h5 className={`text-sm font-medium flex-1 transition-colors duration-200 ${
                            isDark ? 'text-gray-300' : 'text-gray-700'
                          }`}>{subCategoryData.name}</h5>
                          <span className={`text-xs px-2 py-1 rounded transition-colors duration-200 ${
                            isDark ? 'bg-gray-600 text-gray-400' : 'bg-gray-200 text-gray-600'
                          }`}>
                            {subCategoryData.endpoints.length}
                          </span>
                          {collapsedCategories.has(`${mainCategory}.${subCategory}`) ? (
                            <ChevronRight className={`w-3 h-3 transition-colors duration-200 ${
                              isDark ? 'text-gray-500' : 'text-gray-500'
                            }`} />
                          ) : (
                            <ChevronDown className={`w-3 h-3 transition-colors duration-200 ${
                              isDark ? 'text-gray-500' : 'text-gray-500'
                            }`} />
                          )}
                        </div>

                        {/* 接口列表 */}
                        {!collapsedCategories.has(`${mainCategory}.${subCategory}`) && (
                          <div className="ml-4 space-y-1">
                            {subCategoryData.endpoints.map((api, index) => (
                              <div
                                key={index}
                                onClick={() => handleAPISelect(api)}
                                className={`p-2 rounded border cursor-pointer transition-all duration-200 ${
                                  selectedAPI === api
                                    ? (isDark ? 'bg-blue-600 border-blue-500' : 'bg-blue-50 border-blue-200')
                                    : (isDark ? 'bg-gray-700 border-gray-600 hover:bg-gray-600' : 'bg-white border-gray-200 hover:bg-gray-50')
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex-1 min-w-0">
                                    <p className={`text-sm font-medium truncate transition-colors duration-200 ${
                                      selectedAPI === api
                                        ? (isDark ? 'text-white' : 'text-blue-900')
                                        : (isDark ? 'text-white' : 'text-gray-900')
                                    }`}>{api.name}</p>
                                    <p className={`text-xs truncate transition-colors duration-200 ${
                                      selectedAPI === api
                                        ? (isDark ? 'text-blue-200' : 'text-blue-700')
                                        : (isDark ? 'text-gray-400' : 'text-gray-600')
                                    }`}>{api.method} {api.path}</p>
                                  </div>
                                  <div className="flex items-center space-x-2 ml-2">
                                    {api.needsAuth && (
                                      <span className="text-xs">🔐</span>
                                    )}
                                    <span className={`px-1.5 py-0.5 text-xs rounded transition-colors duration-200 ${
                                      api.method === 'GET' ? 'bg-green-100 text-green-800' :
                                      api.method === 'POST' ? 'bg-blue-100 text-blue-800' :
                                      api.method === 'PUT' ? 'bg-yellow-100 text-yellow-800' :
                                      'bg-red-100 text-red-800'
                                    }`}>
                                      {api.method}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 测试区域 */}
        <div className={`lg:col-span-2 rounded-lg border transition-colors duration-200 flex flex-col h-full ${
          isDark ? 'bg-gray-800 border-gray-700' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
        }`}>
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
            <h3 className={`text-lg font-semibold transition-colors duration-200 ${
              isDark ? 'text-white' : 'text-gray-900 dark:text-white'
            }`}>
              {selectedAPI ? `测试: ${selectedAPI.name}` : '选择一个API进行测试'}
            </h3>
          </div>
          
          <div className="p-4 flex-1 overflow-y-auto">
            {!selectedAPI ? (
              <div className="text-center py-12 flex-1 flex items-center justify-center">
                <p className={`text-lg transition-colors duration-200 ${
                  isDark ? 'text-gray-400' : 'text-gray-600'
                }`}>从左侧选择一个API开始测试</p>
              </div>
            ) : (
              <div className="space-y-4 h-full flex flex-col">
                {/* 表单区域 - 固定在上方 */}
                <div className="flex-shrink-0 space-y-4">
                  {/* API信息 */}
                  <div className={`p-3 rounded-lg transition-colors duration-200 ${
                    isDark ? 'bg-gray-700' : 'bg-gray-50'
                  }`}>
                    <p className={`text-sm font-medium transition-colors duration-200 ${
                      isDark ? 'text-white' : 'text-gray-900'
                    }`}>{selectedAPI.description}</p>
                    <p className={`text-xs mt-1 transition-colors duration-200 ${
                      isDark ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      {selectedAPI.method} http://localhost:8080{selectedAPI.path}
                    </p>
                    {selectedAPI.needsAuth && (
                      <p className={`text-xs mt-1 transition-colors duration-200 ${
                        isDark ? 'text-yellow-400' : 'text-yellow-600'
                      }`}>
                        🔐 需要认证: {selectedAPI.authType}
                      </p>
                    )}
                  </div>

                  {/* 请求体 */}
                  {selectedAPI.body && (
                    <div>
                      <label className={`block text-sm font-medium mb-2 transition-colors duration-200 ${
                        isDark ? 'text-gray-300' : 'text-gray-700'
                      }`}>
                        请求体 (JSON):
                      </label>
                      <textarea
                        value={requestBody}
                        onChange={(e) => setRequestBody(e.target.value)}
                        className={`w-full h-32 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm transition-colors duration-200 ${
                          isDark 
                            ? 'bg-gray-700 border-gray-600 text-white' 
                            : 'bg-white border-gray-300 text-gray-900'
                        }`}
                      />
                    </div>
                  )}

                  {/* 测试按钮 */}
                  <button
                    onClick={() => testAPI(selectedAPI)}
                    disabled={testLoading}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    <Play className="w-4 h-4" />
                    <span>{testLoading ? '测试中...' : '发送请求'}</span>
                  </button>

                  {/* 响应时间 */}
                  {responseTime !== null && (
                    <div className={`text-sm transition-colors duration-200 ${
                      isDark ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      响应时间: {responseTime}ms
                    </div>
                  )}
                </div>

                {/* 响应结果区域 - 可滚动 */}
                <div className="flex-1 min-h-0 overflow-y-auto">
                  <div className="space-y-4">
                    {/* 错误信息 */}
                    {testError && (
                      <div className={`p-3 rounded-lg border transition-colors duration-200 ${
                        isDark ? 'bg-red-900/20 border-red-800 text-red-300' : 'bg-red-50 border-red-200 text-red-800'
                      }`}>
                        <div className="flex items-center justify-between">
                          <span className="text-sm">错误:</span>
                          <button
                            onClick={() => copyToClipboard(testError)}
                            className="p-1 hover:bg-red-800 rounded"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        </div>
                        <pre className="text-sm mt-2 whitespace-pre-wrap">{testError}</pre>
                      </div>
                    )}

                    {/* 成功响应 */}
                    {testResult && (
                      <div className={`p-3 rounded-lg border transition-colors duration-200 ${
                        isDark ? 'bg-green-900/20 border-green-800 text-green-300' : 'bg-green-50 border-green-200 text-green-800'
                      }`}>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">响应:</span>
                          <button
                            onClick={() => copyToClipboard(testResult)}
                            className="p-1 hover:bg-green-800 rounded"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                        </div>
                        <pre className="text-sm mt-2 whitespace-pre-wrap">{testResult}</pre>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default APITestInterfacePage;