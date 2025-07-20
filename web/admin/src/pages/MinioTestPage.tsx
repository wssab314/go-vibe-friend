import React, { useState, useEffect } from 'react';
import Button from '../components/ui/Button';
import { Card } from '../components/ui/Card';

interface MinioObject {
  key: string;
  size: number;
  last_modified: string;
  content_type: string;
  url: string;
}

interface FileUploadResult {
  code: number;
  message: string;
  data?: {
    file_id: number;
    file_name: string;
    original_name: string;
    file_size: number;
    category: string;
    mime_type: string;
    created_at: string;
  };
}

interface FileItem {
  key: string;
  name: string;
  size: number;
  lastModified: string;
  contentType: string;
  isFolder: boolean;
  path: string;
}

// 图标组件
const FolderIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={`${className} text-blue-500`} fill="currentColor" viewBox="0 0 20 20">
    <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
  </svg>
);

const FolderOpenIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={`${className} text-blue-600`} fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1H8a3 3 0 00-3 3v1.5a1.5 1.5 0 01-3 0V6z" clipRule="evenodd" />
    <path d="M6 12a2 2 0 012-2h8a2 2 0 012 2v2a2 2 0 01-2 2H2h2a2 2 0 002-2v-2z" />
  </svg>
);

const FileIcon = ({ contentType, className = "w-5 h-5" }: { contentType: string; className?: string }) => {
  if (contentType?.includes('image')) {
    return (
      <svg className={`${className} text-green-500`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    );
  }
  if (contentType?.includes('video')) {
    return (
      <svg className={`${className} text-purple-500`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
    );
  }
  if (contentType?.includes('audio')) {
    return (
      <svg className={`${className} text-red-500`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
      </svg>
    );
  }
  if (contentType?.includes('pdf')) {
    return (
      <svg className={`${className} text-red-600`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    );
  }
  return (
    <svg className={`${className} text-gray-500`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
};

const UploadIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
  </svg>
);

const DownloadIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3" />
  </svg>
);

const DeleteIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const EditIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

const SearchIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const HomeIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a1 1 0 00-1-1H6a1 1 0 00-1-1V7a1 1 0 011-1h14a1 1 0 011 1v2" />
  </svg>
);

const ViewListIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
  </svg>
);

const ViewGridIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
  </svg>
);

const FileManagerPage: React.FC = () => {
  const [objects, setObjects] = useState<MinioObject[]>([]);
  const [currentPath, setCurrentPath] = useState<string>('');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [uploadResult, setUploadResult] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [showNewFolderInput, setShowNewFolderInput] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);

  useEffect(() => {
    loadObjects();
  }, [currentPath]);

  const loadObjects = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:8080/api/admin/storage/objects', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setObjects(data.data || []);
      }
    } catch (error) {
      console.error('Error loading objects:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 处理文件结构，转换为文件夹和文件的层次结构
  const processFileStructure = (): FileItem[] => {
    const items: FileItem[] = [];
    const folders = new Set<string>();

    // 收集所有文件和文件夹
    objects.forEach(obj => {
      // 处理根目录情况
      if (!currentPath) {
        // 在根目录，显示第一级文件夹和根目录文件
        const pathParts = obj.key.split('/');
        if (pathParts.length > 1) {
          // 这是文件夹中的文件，显示文件夹
          const folderName = pathParts[0];
          if (!folders.has(folderName)) {
            folders.add(folderName);
            items.push({
              key: folderName,
              name: folderName,
              size: 0,
              lastModified: '',
              contentType: '',
              isFolder: true,
              path: folderName
            });
          }
        } else {
          // 这是根目录的文件
          items.push({
            key: obj.key,
            name: obj.key,
            size: obj.size,
            lastModified: obj.last_modified,
            contentType: obj.content_type,
            isFolder: false,
            path: obj.key
          });
        }
      } else {
        // 在子目录中
        if (obj.key.startsWith(currentPath + '/')) {
          const relativePath = obj.key.substring(currentPath.length + 1);
          const pathParts = relativePath.split('/');
          
          if (pathParts.length > 1) {
            // 这是子文件夹中的文件
            const folderName = pathParts[0];
            if (!folders.has(folderName)) {
              folders.add(folderName);
              items.push({
                key: `${currentPath}/${folderName}`,
                name: folderName,
                size: 0,
                lastModified: '',
                contentType: '',
                isFolder: true,
                path: `${currentPath}/${folderName}`
              });
            }
          } else {
            // 这是当前目录的文件
            items.push({
              key: obj.key,
              name: relativePath,
              size: obj.size,
              lastModified: obj.last_modified,
              contentType: obj.content_type,
              isFolder: false,
              path: obj.key
            });
          }
        }
      }
    });

    return items.filter(item => {
      if (searchQuery) {
        return item.name.toLowerCase().includes(searchQuery.toLowerCase());
      }
      return true;
    });
  };

  const navigateToFolder = (folderPath: string) => {
    setCurrentPath(folderPath);
    setSelectedItems(new Set());
  };

  const navigateUp = () => {
    const parentPath = currentPath.split('/').slice(0, -1).join('/');
    setCurrentPath(parentPath);
  };

  const createFolder = async () => {
    if (!newFolderName.trim()) return;

    const folderPath = currentPath ? `${currentPath}/${newFolderName}/.gitkeep` : `${newFolderName}/.gitkeep`;
    
    try {
      // 创建一个空文件来表示文件夹
      const formData = new FormData();
      const emptyFile = new File([''], '.gitkeep', { type: 'text/plain' });
      formData.append('file', emptyFile);
      formData.append('category', 'folder');

      const response = await fetch('http://localhost:8080/api/vf/v1/files/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (response.ok) {
        setUploadResult(`文件夹创建成功: ${newFolderName}`);
        setNewFolderName('');
        setShowNewFolderInput(false);
        loadObjects();
      }
    } catch (error) {
      setUploadResult(`创建文件夹失败: ${error}`);
    }
  };

  const uploadFile = async () => {
    if (!selectedFile) return;

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('category', 'general');

      const response = await fetch('http://localhost:8080/api/vf/v1/files/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (response.ok) {
        setUploadResult(`上传成功: ${selectedFile.name}`);
        setSelectedFile(null);
        const input = document.getElementById('file-upload') as HTMLInputElement;
        if (input) input.value = '';
        loadObjects();
      }
    } catch (error) {
      setUploadResult(`上传失败: ${error}`);
    }
  };

  const downloadFile = async (item: FileItem) => {
    if (item.isFolder) return;

    try {
      const response = await fetch(`http://localhost:8080/api/admin/storage/objects/download/${encodeURIComponent(item.key)}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = item.name;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        setUploadResult(`下载成功: ${item.name}`);
      }
    } catch (error) {
      setUploadResult(`下载失败: ${error}`);
    }
  };

  const handleItemSelect = (itemKey: string, isSelected: boolean) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (isSelected) {
        newSet.add(itemKey);
      } else {
        newSet.delete(itemKey);
      }
      return newSet;
    });
  };

  const formatFileSize = (bytes: number): string => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    if (!dateString) return '';
    try {
      return new Date(dateString).toLocaleDateString('zh-CN');
    } catch (error) {
      return '';
    }
  };

  const getBreadcrumbPaths = () => {
    if (!currentPath) return [{ name: '根目录', path: '' }];
    
    const paths = [{ name: '根目录', path: '' }];
    const parts = currentPath.split('/');
    let buildPath = '';
    
    parts.forEach(part => {
      buildPath = buildPath ? `${buildPath}/${part}` : part;
      paths.push({ name: part, path: buildPath });
    });
    
    return paths;
  };

  const fileItems = processFileStructure();

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* 顶部工具栏 */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">文件管理器</h1>
            
            {/* 面包屑导航 */}
            <nav className="flex items-center space-x-2 text-sm">
              {getBreadcrumbPaths().map((path, index) => (
                <React.Fragment key={path.path}>
                  {index > 0 && <span className="text-gray-400">/</span>}
                  <button
                    onClick={() => navigateToFolder(path.path)}
                    className="text-blue-600 hover:text-blue-800 dark:text-blue-400"
                  >
                    {path.name}
                  </button>
                </React.Fragment>
              ))}
            </nav>
          </div>

          {/* 搜索和视图切换 */}
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <SearchIcon />
              </div>
              <input
                type="text"
                placeholder="搜索文件..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            
            <div className="flex border border-gray-300 rounded-md dark:border-gray-600">
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-500'} dark:${viewMode === 'list' ? 'bg-blue-900 text-blue-300' : 'text-gray-400'}`}
              >
                <ViewListIcon />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-500'} dark:${viewMode === 'grid' ? 'bg-blue-900 text-blue-300' : 'text-gray-400'}`}
              >
                <ViewGridIcon />
              </button>
            </div>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center space-x-3">
            <input
              id="file-upload"
              type="file"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              className="hidden"
            />
            <Button
              onClick={() => document.getElementById('file-upload')?.click()}
              size="sm"
            >
              <UploadIcon />
              上传文件
            </Button>
            
            <Button
              onClick={() => setShowNewFolderInput(true)}
              variant="secondary"
              size="sm"
            >
              <FolderIcon className="w-4 h-4" />
              新建文件夹
            </Button>

            {currentPath && (
              <Button
                onClick={navigateUp}
                variant="secondary"
                size="sm"
              >
                <HomeIcon />
                返回上级
              </Button>
            )}

            {selectedItems.size > 0 && (
              <span className="text-sm text-gray-600 dark:text-gray-400">
                已选择 {selectedItems.size} 项
              </span>
            )}
          </div>

          {selectedFile && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                准备上传: {selectedFile.name}
              </span>
              <Button onClick={uploadFile} size="sm">上传</Button>
              <Button onClick={() => setSelectedFile(null)} variant="secondary" size="sm">取消</Button>
            </div>
          )}
        </div>

        {/* 新建文件夹输入 */}
        {showNewFolderInput && (
          <div className="flex items-center space-x-2 mt-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-md">
            <input
              type="text"
              placeholder="文件夹名称"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-600 dark:border-gray-500 dark:text-white"
              onKeyPress={(e) => e.key === 'Enter' && createFolder()}
            />
            <Button onClick={createFolder} size="sm">创建</Button>
            <Button 
              onClick={() => {
                setShowNewFolderInput(false);
                setNewFolderName('');
              }} 
              variant="secondary" 
              size="sm"
            >
              取消
            </Button>
          </div>
        )}

        {/* 状态消息 */}
        {uploadResult && (
          <div className={`mt-3 p-3 rounded-md text-sm ${
            uploadResult.includes('成功') 
              ? 'bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/20 dark:text-green-300'
              : 'bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/20 dark:text-red-300'
          }`}>
            {uploadResult}
          </div>
        )}
      </div>

      {/* 文件列表区域 */}
      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : fileItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500 dark:text-gray-400">
            <FolderIcon className="w-16 h-16 mb-4" />
            <p>此文件夹为空</p>
          </div>
        ) : viewMode === 'list' ? (
          /* 列表视图 */
          <div className="bg-white dark:bg-gray-800">
            <table className="min-w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedItems(new Set(fileItems.map(item => item.key)));
                        } else {
                          setSelectedItems(new Set());
                        }
                      }}
                      className="rounded border-gray-300"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">名称</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">大小</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">修改时间</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">操作</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {fileItems.map((item) => (
                  <tr 
                    key={item.key} 
                    className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                    onDoubleClick={() => item.isFolder ? navigateToFolder(item.path) : setPreviewFile(item)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedItems.has(item.key)}
                        onChange={(e) => handleItemSelect(item.key, e.target.checked)}
                        className="rounded border-gray-300"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-3">
                        {item.isFolder ? (
                          <FolderIcon />
                        ) : (
                          <FileIcon contentType={item.contentType} />
                        )}
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {item.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {item.isFolder ? '--' : formatFileSize(item.size)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(item.lastModified)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        {!item.isFolder && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              downloadFile(item);
                            }}
                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400"
                          >
                            <DownloadIcon />
                          </button>
                        )}
                        <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                          <EditIcon />
                        </button>
                        <button className="text-red-400 hover:text-red-600">
                          <DeleteIcon />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          /* 网格视图 */
          <div className="p-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
              {fileItems.map((item) => (
                <div
                  key={item.key}
                  className="group relative bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md cursor-pointer"
                  onDoubleClick={() => item.isFolder ? navigateToFolder(item.path) : setPreviewFile(item)}
                >
                  <div className="absolute top-2 left-2">
                    <input
                      type="checkbox"
                      checked={selectedItems.has(item.key)}
                      onChange={(e) => handleItemSelect(item.key, e.target.checked)}
                      className="rounded border-gray-300"
                    />
                  </div>
                  
                  <div className="flex flex-col items-center text-center">
                    <div className="mb-2">
                      {item.isFolder ? (
                        <FolderIcon className="w-12 h-12" />
                      ) : (
                        <FileIcon contentType={item.contentType} className="w-12 h-12" />
                      )}
                    </div>
                    <p className="text-xs font-medium text-gray-900 dark:text-white truncate w-full" title={item.name}>
                      {item.name}
                    </p>
                    {!item.isFolder && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {formatFileSize(item.size)}
                      </p>
                    )}
                  </div>
                  
                  {/* 操作按钮 */}
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="flex space-x-1">
                      {!item.isFolder && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            downloadFile(item);
                          }}
                          className="p-1 bg-white dark:bg-gray-700 rounded shadow-sm text-blue-600 hover:text-blue-800"
                        >
                          <DownloadIcon />
                        </button>
                      )}
                      <button className="p-1 bg-white dark:bg-gray-700 rounded shadow-sm text-red-400 hover:text-red-600">
                        <DeleteIcon />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 文件预览模态框 */}
      {previewFile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl max-h-[90vh] overflow-auto">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                {previewFile.name}
              </h3>
              <button
                onClick={() => setPreviewFile(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4">
              {previewFile.contentType?.includes('image') || previewFile.name.toLowerCase().match(/\.(jpg|jpeg|png|gif|bmp|webp|svg)$/) ? (
                <div className="text-center">
                  <img 
                    src={`http://localhost:8080/api/admin/storage/preview/${previewFile.key}`}
                    alt={previewFile.name}
                    className="max-w-full max-h-96 object-contain mx-auto"
                    onLoad={() => console.log('Image loaded successfully')}
                    onError={(e) => {
                      console.error('Image load error for:', previewFile.key);
                      console.error('Image URL:', `http://localhost:8080/api/admin/storage/preview/${previewFile.key}`);
                    }}
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    URL: /api/admin/storage/objects/download/{previewFile.key}
                  </p>
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileIcon contentType={previewFile.contentType} className="w-24 h-24 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">无法预览此文件类型</p>
                  <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                    文件类型: {previewFile.contentType || '未知'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    文件路径: {previewFile.key}
                  </p>
                  <Button
                    onClick={() => downloadFile(previewFile)}
                    className="mt-4"
                  >
                    <DownloadIcon />
                    下载文件
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileManagerPage;