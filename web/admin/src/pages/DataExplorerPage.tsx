import React, { useState, useEffect } from 'react';
import { Database } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface Table {
  name: string;
  rows: number;
  size_mb: number;
  description: string;
}

interface Column {
  name: string;
  type: string;
}

const DataExplorerPage: React.FC = () => {
  const { isDark } = useTheme();
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [tables, setTables] = useState<Table[]>([]);
  const [tableData, setTableData] = useState<any[]>([]);
  const [tableColumns, setTableColumns] = useState<Column[]>([]);
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
                <Database className={`w-16 h-16 mb-4 mx-auto ${isDark ? 'text-gray-600' : 'text-gray-300'}`} />
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

export default DataExplorerPage;