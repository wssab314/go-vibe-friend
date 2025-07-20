import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';

interface Job {
  id: number;
  job_type: string;
  status: string;
  user?: {
    username: string;
  };
  input_data?: string;
  output_data?: string;
  error_msg?: string;
  created_at: string;
}

const JobsManagementPage: React.FC = () => {
  const { isDark } = useTheme();
  const [jobs, setJobs] = useState<Job[]>([]);
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

export default JobsManagementPage;