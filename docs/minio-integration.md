# MinIO 集成文档

## 概述

go-vibe-friend项目已成功集成MinIO对象存储服务，用于替代传统的本地文件存储。MinIO是一个高性能的分布式对象存储服务，兼容Amazon S3 API。

## 架构优势

### 🚀 **性能优势**
- **高并发支持**: 支持大量并发文件上传/下载
- **分布式存储**: 支持横向扩展
- **S3兼容**: 完全兼容AWS S3 API

### 🔒 **安全性**
- **访问控制**: 基于AccessKey和SecretKey的安全认证
- **数据加密**: 支持传输加密和存储加密
- **权限管理**: 细粒度的bucket和对象权限控制

### 📈 **可扩展性**
- **无限存储**: 理论上无存储容量限制
- **多地部署**: 支持多地域数据备份
- **云原生**: 容器化部署，适合微服务架构

## 技术实现

### **配置结构**
```go
type MinIOConfig struct {
    Endpoint        string `mapstructure:"endpoint"`
    AccessKeyID     string `mapstructure:"access_key_id"`
    SecretAccessKey string `mapstructure:"secret_access_key"`
    UseSSL          bool   `mapstructure:"use_ssl"`
    BucketName      string `mapstructure:"bucket_name"`
}
```

### **服务架构**
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Client App    │───▶│  File Service   │───▶│   MinIO Server  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │   Database      │
                       │  (File Metadata)│
                       └─────────────────┘
```

### **文件存储结构**
```
go-vibe-friend/           # Bucket名称
├── avatar/               # 头像文件
│   └── 2025/01/19/      # 按日期分组
│       └── 1_20250119_abc123.jpg
├── document/             # 文档文件
│   └── 2025/01/19/
│       └── 2_20250119_def456.pdf
├── image/               # 图片文件
│   └── 2025/01/19/
└── general/             # 通用文件
    └── 2025/01/19/
```

## 部署配置

### **1. MinIO服务器部署**

#### Docker Compose 部署
```yaml
# docker-compose.yml
version: '3.8'

services:
  minio:
    image: minio/minio:latest
    container_name: minio
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    ports:
      - "9000:9000"   # API端口
      - "9001:9001"   # Web Console端口
    volumes:
      - minio_data:/data
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9000/minio/health/live"]
      interval: 30s
      timeout: 20s
      retries: 3

volumes:
  minio_data:
```

#### 单机部署
```bash
# 下载MinIO
wget https://dl.min.io/server/minio/release/linux-amd64/minio
chmod +x minio

# 启动MinIO服务器
export MINIO_ROOT_USER=minioadmin
export MINIO_ROOT_PASSWORD=minioadmin
./minio server /data --console-address ":9001"
```

### **2. 应用配置**

#### 环境变量配置
```bash
# MinIO配置
export MINIO_ENDPOINT=localhost:9000
export MINIO_ACCESS_KEY_ID=minioadmin
export MINIO_SECRET_ACCESS_KEY=minioadmin
export MINIO_USE_SSL=false
export MINIO_BUCKET_NAME=go-vibe-friend
```

#### 配置文件
```yaml
# config.yaml
minio:
  endpoint: "localhost:9000"
  access_key_id: "minioadmin"
  secret_access_key: "minioadmin"
  use_ssl: false
  bucket_name: "go-vibe-friend"
```

### **3. 初始化设置**

启动应用前需要确保：
1. MinIO服务器正常运行
2. Bucket已创建（应用会自动创建）
3. 访问密钥配置正确

## API 使用指南

### **文件上传**
```bash
# 普通文件上传
curl -X POST http://localhost:8080/api/vf/v1/files/upload \
  -H "Authorization: Bearer <token>" \
  -F "file=@document.pdf" \
  -F "category=document"

# 头像上传
curl -X POST http://localhost:8080/api/vf/v1/files/avatar \
  -H "Authorization: Bearer <token>" \
  -F "avatar=@profile.jpg"
```

### **文件下载**
```bash
# 下载文件
curl -X GET http://localhost:8080/api/vf/v1/files/123/download \
  -H "Authorization: Bearer <token>" \
  -o downloaded_file.pdf
```

### **存储管理**
```bash
# 列出存储对象（管理员）
curl -X GET http://localhost:8080/api/admin/storage/objects?prefix=avatar/ \
  -H "Authorization: Bearer <admin_token>"
```

## 开发指南

### **文件服务使用**
```go
// 上传文件
fileModel, err := fileService.UploadFile(fileHeader, userID, "document")
if err != nil {
    return err
}

// 获取文件对象
obj, err := fileService.GetFileObject(fileModel)
if err != nil {
    return err
}
defer obj.Close()

// 删除文件（软删除）
err = fileService.DeleteFile(fileID, userID)
```

### **直接MinIO操作**
```go
// 上传对象
_, err = minioClient.PutObject(ctx, bucketName, objectName, reader, size, minio.PutObjectOptions{
    ContentType: "application/pdf",
})

// 获取对象
obj, err := minioClient.GetObject(ctx, bucketName, objectName, minio.GetObjectOptions{})

// 删除对象
err = minioClient.RemoveObject(ctx, bucketName, objectName, minio.RemoveObjectOptions{})
```

## 监控与维护

### **健康检查**
```bash
# 检查MinIO服务状态
curl http://localhost:9000/minio/health/live

# 检查应用连接状态
curl http://localhost:8080/api/admin/storage/objects
```

### **性能监控**
- MinIO Console: http://localhost:9001
- 存储使用量监控
- 请求响应时间监控
- 错误率监控

### **备份策略**
1. **数据备份**: 定期备份MinIO数据目录
2. **配置备份**: 备份MinIO配置文件
3. **灾难恢复**: 多地域部署和数据同步

## 故障排查

### **常见问题**

#### 1. 连接失败
```
Failed to initialize minio client: xxx
```
**解决方案**:
- 检查MinIO服务是否运行
- 验证endpoint配置
- 检查网络连接

#### 2. 认证失败
```
Access Denied
```
**解决方案**:
- 验证AccessKey和SecretKey
- 检查bucket权限设置
- 确认SSL配置匹配

#### 3. 文件上传失败
```
上传文件到 MinIO 失败
```
**解决方案**:
- 检查bucket是否存在
- 验证文件大小限制
- 检查磁盘空间

### **日志分析**
```bash
# 查看MinIO日志
docker logs minio

# 查看应用日志
grep "minio" /var/log/go-vibe-friend.log
```

## 安全最佳实践

### **1. 访问控制**
- 使用强密码的AccessKey和SecretKey
- 定期轮换访问密钥
- 限制bucket访问权限

### **2. 网络安全**
- 生产环境启用SSL/TLS
- 使用防火墙限制访问
- 配置VPC内网访问

### **3. 数据安全**
- 启用服务端加密
- 定期数据备份
- 监控异常访问

## 性能优化

### **1. 上传优化**
- 分片上传大文件
- 并发上传多个文件
- 压缩文件内容

### **2. 下载优化**
- 使用CDN加速
- 实现文件缓存
- 预签名URL直接下载

### **3. 存储优化**
- 生命周期管理
- 数据去重
- 冷热数据分层

这个MinIO集成为go-vibe-friend项目提供了企业级的文件存储解决方案，具备高性能、高可用性和强扩展性。