# MinIO API 测试示例

本文档提供了测试go-vibe-friend项目中MinIO集成功能的API示例。

## 准备工作

### 1. 启动服务
```bash
# 启动MinIO服务
make minio-start

# 启动应用服务器
make dev
```

### 2. 获取认证Token
```bash
# 登录获取token
curl -X POST http://localhost:8080/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "admin123"
  }'

# 保存返回的token
export TOKEN="your-jwt-token-here"
```

## 文件管理API测试

### 1. 文件上传测试

#### 上传普通文件
```bash
curl -X POST http://localhost:8080/api/vf/v1/files/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@/path/to/test-document.pdf" \
  -F "category=document"
```

#### 上传头像
```bash
curl -X POST http://localhost:8080/api/vf/v1/files/avatar \
  -H "Authorization: Bearer $TOKEN" \
  -F "avatar=@/path/to/profile-image.jpg"
```

#### 上传图片
```bash
curl -X POST http://localhost:8080/api/vf/v1/files/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@/path/to/image.png" \
  -F "category=image"
```

### 2. 文件查询

#### 获取用户文件列表
```bash
curl -X GET "http://localhost:8080/api/vf/v1/files?limit=10&offset=0" \
  -H "Authorization: Bearer $TOKEN"
```

#### 按类型筛选文件
```bash
curl -X GET "http://localhost:8080/api/vf/v1/files?category=avatar" \
  -H "Authorization: Bearer $TOKEN"
```

#### 获取文件统计信息
```bash
curl -X GET http://localhost:8080/api/vf/v1/files/stats \
  -H "Authorization: Bearer $TOKEN"
```

### 3. 文件下载

#### 下载文件（替换123为实际文件ID）
```bash
curl -X GET http://localhost:8080/api/vf/v1/files/123/download \
  -H "Authorization: Bearer $TOKEN" \
  -o downloaded-file.pdf
```

#### 公开文件下载（头像等）
```bash
curl -X GET http://localhost:8080/api/vf/v1/files/123/download \
  -o avatar.jpg
```

### 4. 文件删除

#### 删除文件（软删除）
```bash
curl -X DELETE http://localhost:8080/api/vf/v1/files/123 \
  -H "Authorization: Bearer $TOKEN"
```

## 存储管理API测试（管理员功能）

### 1. 列出存储对象

#### 列出所有对象
```bash
curl -X GET http://localhost:8080/api/admin/storage/objects \
  -H "Authorization: Bearer $TOKEN"
```

#### 按前缀筛选
```bash
curl -X GET "http://localhost:8080/api/admin/storage/objects?prefix=avatar/" \
  -H "Authorization: Bearer $TOKEN"
```

#### 递归列出所有子目录
```bash
curl -X GET "http://localhost:8080/api/admin/storage/objects?prefix=document/&recursive=true" \
  -H "Authorization: Bearer $TOKEN"
```

## MinIO Console 操作

### 1. 访问Web界面
- URL: http://localhost:9001
- 用户名: minioadmin
- 密码: minioadmin123

### 2. 常用操作
1. **查看Buckets**: 在左侧菜单选择 "Buckets"
2. **浏览文件**: 点击 "go-vibe-friend" bucket
3. **上传文件**: 使用 "Upload" 按钮
4. **设置权限**: 在 "Access" 标签页配置bucket策略
5. **监控**: 在 "Monitoring" 查看使用统计

## 直接MinIO API测试

### 1. 使用AWS CLI风格API

#### 安装MinIO Client
```bash
# macOS
brew install minio/stable/mc

# Linux
wget https://dl.min.io/client/mc/release/linux-amd64/mc
chmod +x mc
```

#### 配置连接
```bash
mc alias set local http://localhost:9000 minioadmin minioadmin123
```

#### 基本操作
```bash
# 列出buckets
mc ls local

# 列出bucket内容
mc ls local/go-vibe-friend

# 上传文件
mc cp test-file.pdf local/go-vibe-friend/test/

# 下载文件
mc cp local/go-vibe-friend/test/test-file.pdf ./downloaded.pdf

# 删除文件
mc rm local/go-vibe-friend/test/test-file.pdf
```

## 测试数据准备

### 创建测试文件
```bash
# 创建测试目录
mkdir -p test-files

# 创建不同类型的测试文件
echo "Hello World" > test-files/test.txt
echo '{"name": "test", "type": "json"}' > test-files/test.json

# 如果有图片文件，复制到测试目录
# cp /path/to/image.jpg test-files/
# cp /path/to/document.pdf test-files/
```

### 批量上传测试
```bash
#!/bin/bash
# 批量上传测试脚本

for file in test-files/*; do
    if [ -f "$file" ]; then
        echo "上传文件: $file"
        curl -X POST http://localhost:8080/api/vf/v1/files/upload \
          -H "Authorization: Bearer $TOKEN" \
          -F "file=@$file" \
          -F "category=general"
        echo ""
    fi
done
```

## 性能测试

### 并发上传测试
```bash
#!/bin/bash
# 并发上传性能测试

CONCURRENT=5
FILE_COUNT=20

for i in $(seq 1 $FILE_COUNT); do
    (
        echo "上传测试文件 $i"
        curl -X POST http://localhost:8080/api/vf/v1/files/upload \
          -H "Authorization: Bearer $TOKEN" \
          -F "file=@test-files/test.txt" \
          -F "category=test" \
          -s -o /dev/null -w "File $i: %{time_total}s\n"
    ) &
    
    # 限制并发数
    if (( i % CONCURRENT == 0 )); then
        wait
    fi
done
wait
```

## 故障排查

### 1. 检查服务状态
```bash
# 检查MinIO服务
docker-compose -f docker-compose.minio.yml ps

# 检查应用服务
curl http://localhost:8080/health

# 查看日志
make minio-logs
```

### 2. 常见错误解决

#### 文件上传失败
- 检查文件大小是否超过限制
- 验证文件类型是否被允许
- 确认MinIO服务正常运行

#### 连接失败
- 检查MinIO endpoint配置
- 验证AccessKey和SecretKey
- 确认网络连接正常

#### 权限错误
- 验证JWT token有效性
- 检查用户权限配置
- 确认文件所有权

这些测试示例覆盖了MinIO集成的主要功能，可以帮助验证系统的正常工作状态。