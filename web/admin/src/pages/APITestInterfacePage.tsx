import React, { useState } from 'react';
import { Play, Copy } from 'lucide-react';
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

  // 定义API接口
  const apiEndpoints: { [key: string]: APIEndpoint[] } = {
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
        name: '获取任务列表',
        method: 'GET',
        path: '/api/admin/jobs',
        description: '获取所有生成任务',
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
      }
    ],
    user: [
      {
        name: '用户注册',
        method: 'POST',
        path: '/api/vf/v1/register',
        description: '用户注册',
        needsAuth: false,
        body: {
          username: 'testuser',
          email: 'test@example.com',
          password: 'testpass123'
        }
      },
      {
        name: '用户登录',
        method: 'POST',
        path: '/api/vf/v1/login',
        description: '用户登录获取token',
        needsAuth: false,
        body: {
          email: 'test@example.com',
          password: 'testpass123'
        }
      },
      {
        name: '获取用户资料',
        method: 'GET',
        path: '/api/vf/v1/profile',
        description: '获取用户个人资料',
        needsAuth: true,
        authType: 'user'
      }
    ]
  };

  const testAPI = async (api: APIEndpoint) => {
    setTestLoading(true);
    setTestError('');
    setTestResult('');
    setResponseTime(null);

    const startTime = Date.now();

    try {
      const token = localStorage.getItem('token');
      const headers: any = {
        'Content-Type': 'application/json',
      };

      if (api.needsAuth && token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const config: any = {
        method: api.method,
        headers,
      };

      if (api.body && (api.method === 'POST' || api.method === 'PUT')) {
        config.body = requestBody || JSON.stringify(api.body, null, 2);
      }

      const response = await fetch(`http://localhost:8080${api.path}`, config);
      const endTime = Date.now();
      setResponseTime(endTime - startTime);

      const data = await response.text();
      
      if (response.ok) {
        try {
          const jsonData = JSON.parse(data);
          setTestResult(JSON.stringify(jsonData, null, 2));
        } catch {
          setTestResult(data);
        }
      } else {
        setTestError(`HTTP ${response.status}: ${data}`);
      }
    } catch (err) {
      setTestError('Network error: ' + String(err));
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* API列表 */}
        <div className={`rounded-lg border transition-colors duration-200 ${
          isDark ? 'bg-gray-800 border-gray-700' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
        }`}>
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className={`text-lg font-semibold transition-colors duration-200 ${
              isDark ? 'text-white' : 'text-gray-900 dark:text-white'
            }`}>API 接口</h3>
          </div>
          <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
            {Object.entries(apiEndpoints).map(([category, apis]) => (
              <div key={category}>
                <h4 className={`text-sm font-medium mb-2 transition-colors duration-200 ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>{category.toUpperCase()} API</h4>
                <div className="space-y-2">
                  {apis.map((api, index) => (
                    <div
                      key={index}
                      onClick={() => handleAPISelect(api)}
                      className={`p-3 rounded-lg border cursor-pointer transition-all duration-200 ${
                        selectedAPI === api
                          ? (isDark ? 'bg-blue-600 border-blue-500' : 'bg-blue-50 border-blue-200')
                          : (isDark ? 'bg-gray-700 border-gray-600 hover:bg-gray-600' : 'bg-gray-50 border-gray-200 hover:bg-gray-100')
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className={`text-sm font-medium transition-colors duration-200 ${
                            selectedAPI === api
                              ? (isDark ? 'text-white' : 'text-blue-900')
                              : (isDark ? 'text-white' : 'text-gray-900')
                          }`}>{api.name}</p>
                          <p className={`text-xs transition-colors duration-200 ${
                            selectedAPI === api
                              ? (isDark ? 'text-blue-200' : 'text-blue-700')
                              : (isDark ? 'text-gray-400' : 'text-gray-600')
                          }`}>{api.method} {api.path}</p>
                        </div>
                        <span className={`px-2 py-1 text-xs rounded transition-colors duration-200 ${
                          api.method === 'GET' ? 'bg-green-100 text-green-800' :
                          api.method === 'POST' ? 'bg-blue-100 text-blue-800' :
                          api.method === 'PUT' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {api.method}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 测试区域 */}
        <div className={`lg:col-span-2 rounded-lg border transition-colors duration-200 ${
          isDark ? 'bg-gray-800 border-gray-700' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
        }`}>
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className={`text-lg font-semibold transition-colors duration-200 ${
              isDark ? 'text-white' : 'text-gray-900 dark:text-white'
            }`}>
              {selectedAPI ? `测试: ${selectedAPI.name}` : '选择一个API进行测试'}
            </h3>
          </div>
          
          <div className="p-4">
            {!selectedAPI ? (
              <div className="text-center py-12">
                <p className={`text-lg transition-colors duration-200 ${
                  isDark ? 'text-gray-400' : 'text-gray-600'
                }`}>从左侧选择一个API开始测试</p>
              </div>
            ) : (
              <div className="space-y-4">
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
                    <pre className="text-sm mt-2 whitespace-pre-wrap max-h-64 overflow-y-auto">{testResult}</pre>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default APITestInterfacePage;