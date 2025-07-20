import React, { useState, useEffect } from 'react';
import { RefreshCcw } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface LLMConfig {
  configured: boolean;
  provider: string;
}

const LLMInterfacePage: React.FC = () => {
  const { isDark } = useTheme();
  const [config, setConfig] = useState<LLMConfig | null>(null);
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

export default LLMInterfacePage;