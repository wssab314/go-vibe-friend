# 数据库设置指南

## 📋 概述

本应用使用 **PostgreSQL** 作为主数据库，通过 Docker Compose 进行管理。

## 🚀 快速开始

### 1. 首次设置（推荐）

```bash
make setup
```

这个命令会：
- 检查并安装必要的工具（air, docker-compose）
- 安装前端依赖
- 启动PostgreSQL数据库
- 等待数据库就绪

### 2. 启动开发环境

```bash
make dev
```

这个命令会：
- 自动检查PostgreSQL是否运行
- 如果没有运行，会自动启动数据库
- 启动后端服务器（热重载）
- 启动前端开发服务器

## 🗄️ 数据库管理

### 启动数据库

```bash
make db-start
```

### 停止数据库

```bash
make db-stop
```

### 查看数据库日志

```bash
make db-logs
```

## 📝 数据库配置

### 默认配置

- **数据库类型**: PostgreSQL 15
- **主机**: localhost
- **端口**: 5432
- **用户名**: postgres
- **密码**: postgres
- **数据库名**: go_vibe_friend
- **SSL模式**: disable

### 自定义配置

复制并编辑环境变量文件：

```bash
cp .env.example .env
```

编辑 `.env` 文件中的数据库配置：

```env
DB_DRIVER=postgres
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=go_vibe_friend
DB_SSLMODE=disable
```

## 🔧 数据库连接

### 使用 psql 连接

```bash
psql -h localhost -p 5432 -U postgres -d go_vibe_friend
```

### 使用其他客户端

可以使用任何支持PostgreSQL的客户端工具，如：
- pgAdmin
- DBeaver
- TablePlus
- DataGrip

连接参数：
- Host: `localhost`
- Port: `5432`
- Username: `postgres`
- Password: `postgres`
- Database: `go_vibe_friend`

## 📊 数据库迁移

应用启动时会自动运行数据库迁移（使用GORM的AutoMigrate）。

### 主要表结构

1. **users**: 用户表
   - id, username, email, password, role, created_at, updated_at

2. **generation_jobs**: 生成任务表
   - id, user_id, status, job_type, input_data, output_data, error_msg, created_at, updated_at

## 🐳 Docker 配置

数据库通过 `docker-compose.yml` 配置：

```yaml
db:
  image: postgres:15-alpine
  ports:
    - "5432:5432"
  environment:
    - POSTGRES_USER=postgres
    - POSTGRES_PASSWORD=postgres
    - POSTGRES_DB=go_vibe_friend
  volumes:
    - postgres_data:/var/lib/postgresql/data
```

## 🔄 切换回 SQLite（可选）

如果你想切换回SQLite，可以设置环境变量：

```env
DB_DRIVER=sqlite
DB_NAME=data/dev.db
```

## 🚨 常见问题

### 1. 端口冲突

如果端口5432被占用，可以修改 `docker-compose.yml` 中的端口映射：

```yaml
ports:
  - "5433:5432"  # 使用5433作为外部端口
```

同时修改 `.env` 文件中的端口：

```env
DB_PORT=5433
```

### 2. 数据库连接失败

检查数据库是否正在运行：

```bash
docker-compose ps db
```

查看数据库日志：

```bash
make db-logs
```

### 3. 数据持久化

数据库数据存储在Docker卷中，即使容器重启数据也不会丢失。

要完全清除数据：

```bash
make db-stop
docker-compose down -v  # 删除卷
```

## 🔧 开发工作流

1. **首次设置**: `make setup`
2. **日常开发**: `make dev`
3. **查看数据**: 使用psql或其他客户端工具
4. **停止开发**: `Ctrl+C` 停止服务，`make db-stop` 停止数据库

## 📚 相关文档

- [PostgreSQL官方文档](https://www.postgresql.org/docs/)
- [GORM文档](https://gorm.io/docs/)
- [Docker Compose文档](https://docs.docker.com/compose/)