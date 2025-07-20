import React, { useEffect, useState } from 'react';
import apiService from '../services/api';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

interface StorageObject {
  key: string;
  size: number;
  last_modified: string;
  content_type: string;
  url: string;
}

const StoragePage: React.FC = () => {
  const [objects, setObjects] = useState<StorageObject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchObjects = async () => {
    try {
      setLoading(true);
      const response = await apiService.getStorageObjects();
      // The actual data is in response.data
      setObjects(response.data || []);
      setError(null);
    } catch (err) {
      setError('Failed to fetch storage objects.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchObjects();
  }, []);

  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Storage Browser</h1>
        <Button onClick={fetchObjects} disabled={loading}>
          {loading ? 'Refreshing...' : 'Refresh'}
        </Button>
      </div>

      <Card>
        {error && <p className="text-red-500 bg-red-100 p-3 rounded">{error}</p>}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  File Key
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Size
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Modified
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Content Type
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-4">Loading...</td>
                </tr>
              ) : objects.length > 0 ? (
                objects.map((object) => (
                  <tr key={object.key}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{object.key}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatBytes(object.size)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{object.last_modified}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{object.content_type}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <a href={`http://${object.url}`} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-900">
                        Preview
                      </a>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="text-center py-4">No objects found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default StoragePage;
