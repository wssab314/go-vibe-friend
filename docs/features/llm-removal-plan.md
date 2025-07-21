# LLM和代码生成功能拆除方案
**优先级**: 高 | **工期**: 3天 | **负责人**: 全栈团队

## 目标
将项目从AI代码生成工具转型为通用的Go+PostgreSQL+Redis后端Admin工程模板

## 拆除范围分析

### 🗂️ 需要完全删除的模块

#### 后端模块
```
internal/
├── llm/                    # 完整删除LLM客户端
├── analyzer/               # 完整删除代码分析
├── generator/              # 完整删除代码生成  
├── filemanager/            # 完整删除文件管理
├── models/generation.go    # 删除生成任务模型
├── store/generation_store.go # 删除生成数据存储
├── api/admin/llm_handler.go # 删除LLM处理器
└── api/admin/generation_handler.go # 删除生成处理器
```

#### 前端模块
```
web/admin/src/
├── pages/LLMInterfacePage.tsx
├── pages/CodeGenerationPage.tsx  
├── pages/CodeGenerationPageTest.tsx
├── services/generationApi.ts
├── components/FileUpload.tsx
├── components/FileUploadWorking.tsx
└── components/GenerationProgress.tsx
```

#### 测试模块
```
testkit/
├── api/llm_test.go
├── e2e/llm-workflow.spec.ts
└── 其他LLM相关测试文件
```

### 🔧 需要修改的文件

#### 后端修改
1. **internal/api/router.go**
   - 删除LLM相关导入：`"go-vibe-friend/internal/llm"`
   - 删除服务初始化：`llmService := llm.NewService(...)`
   - 删除处理器初始化：`llmHandler、generationHandler`
   - 删除路由：`/api/admin/llm/*` 和 `/api/admin/generation/*`

2. **internal/store/store.go**
   - 删除Generation字段和相关初始化

3. **go.mod**
   - 清理未使用的LLM相关依赖包

#### 前端修改
1. **web/admin/src/App.tsx**
   - 删除LLM和CodeGeneration页面导入
   - 删除对应的路由case

2. **web/admin/src/components/layout/Sidebar.tsx**
   - 删除'代码生成'和'LLM'导航项

3. **package.json**
   - 清理未使用的依赖包

### 📊 数据库清理
```sql
-- 删除代码生成相关表（如果存在）
DROP TABLE IF EXISTS generation_jobs;
DROP TABLE IF EXISTS llm_configs;
```

## 实施步骤

### 第1天：后端清理
1. **备份当前代码** - 创建分支备份
2. **删除LLM模块** - 删除internal/llm/整个目录
3. **删除生成相关模块** - analyzer/、generator/、filemanager/
4. **清理models和store** - 删除generation相关文件
5. **修改router.go** - 移除所有LLM和generation路由
6. **编译测试** - 确保后端可正常编译启动

### 第2天：前端清理  
1. **删除LLM相关页面** - 删除所有LLM和代码生成页面
2. **修改路由和导航** - 更新App.tsx和Sidebar.tsx
3. **清理API服务** - 删除generationApi.ts
4. **清理组件** - 删除文件上传等专用组件
5. **依赖清理** - 运行`pnpm prune`清理无用依赖
6. **前端测试** - 确保Admin界面正常运行

### 第3天：测试和文档
1. **删除测试文件** - 清理testkit中的LLM测试
2. **数据库清理** - 删除相关表结构
3. **更新README** - 重新定位项目描述
4. **更新文档** - 修改项目文档和API文档
5. **全面测试** - 确保核心功能正常

## 保留的核心功能

### ✅ 继续保留
- **用户认证系统** (JWT/Session双模式)
- **权限管理** (RBAC角色权限)
- **文件管理** (MinIO对象存储)
- **Redis缓存** (缓存/会话/队列)
- **数据导出** (多格式导出功能)
- **系统监控** (仪表板/健康检查)
- **任务管理** (通用任务系统)
- **Admin前端** (React管理界面)

### 📋 重新定位后的价值
- **开箱即用的Admin模板** - 完整的后台管理系统
- **现代技术栈** - Go+Gin+GORM+PostgreSQL+Redis
- **前后端分离** - React+TypeScript前端
- **生产就绪** - Docker部署、测试覆盖、CI/CD
- **可扩展架构** - 插件化设计、清晰分层

## ⚠️ 注意事项

### 风险控制
- **数据备份** - 操作前备份数据库和代码
- **分支管理** - 在专门分支进行清理工作
- **渐进式删除** - 先注释再删除，确保稳定性
- **回滚准备** - 保留完整的回滚方案

### 配置更新
- **.env配置** - 删除LLM相关环境变量
- **Docker配置** - 更新docker-compose.yml
- **CI/CD更新** - 修改构建脚本
- **依赖管理** - 更新go.mod和package.json

## 验收标准
- [ ] 后端可正常编译启动，无LLM相关代码
- [ ] 前端可正常运行，移除所有LLM界面
- [ ] 核心Admin功能完全正常
- [ ] 测试通过，无遗留错误
- [ ] 文档更新完整，定位清晰