# 功能: 智能代码生成系统
**优先级**: 高 | **工期**: 15天 | **负责人**: 全栈团队

## 功能概述
- 核心价值: 上传前端代码自动生成对应后端API和数据模型
- 使用场景: 低代码平台生成的前端代码需要配套后端服务

## 用户流程
1. **上传压缩包** → 解压并分析前端代码结构
2. **智能解析** → LLM提取API需求和数据模型
3. **代码生成** → 生成Go后端代码和SQL迁移
4. **预览确认** → 用户查看并确认生成内容
5. **应用代码** → 自动写入文件并重启服务
6. **测试验证** → 在Admin界面测试新功能

## 技术要求  
- 健壮性: 支持多种前端框架，错误时可回滚
- 可维护性: 模块化设计，代码生成可配置化
- 性能: 单次处理<30秒，支持大型项目(>100文件)

## 核心技术设计

### 1. 文件解析引擎 (internal/analyzer/)
```go
type CodeAnalyzer struct {
    Framework  string          // react/vue/angular
    APIList    []APIEndpoint   // 提取的API列表
    DataModels []DataModel     // 推断的数据结构
}

type APIEndpoint struct {
    Method string   // GET/POST/PUT/DELETE
    Path   string   // /api/users
    Params []Field  // 请求参数
    Response []Field // 响应字段
}
```

### 2. LLM代码生成 (internal/generator/)
```go
type CodeGenerator struct {
    llmClient  LLMClient
    templates  map[string]Template
}

func (g *CodeGenerator) GenerateBackend(analysis CodeAnalysis) (*GeneratedCode, error)
```

### 3. 文件管理 (internal/filemanager/)
```go
type FileManager struct {
    backupDir  string
    targetDirs map[string]string // models->internal/models/
}

func (fm *FileManager) ApplyGenerated(code *GeneratedCode) error
func (fm *FileManager) Rollback(backupID string) error
```

## 开发任务

### 后端工程师 (internal/)
- [ ] **models/generation_job.go** - 代码生成任务模型
- [ ] **analyzer/** - 前端代码解析模块  
- [ ] **generator/** - LLM代码生成服务
- [ ] **filemanager/** - 文件操作和版本管理
- [ ] **api/admin/generation_handler.go** - 代码生成接口

### 前端工程师 (web/admin/src/)
- [ ] **pages/CodeGenerationPage.tsx** - 主要工作界面
- [ ] **components/FileUpload.tsx** - 文件上传组件
- [ ] **components/CodePreview.tsx** - 代码预览组件  
- [ ] **components/GenerationProgress.tsx** - 进度显示
- [ ] **services/generationApi.ts** - 后端API调用

### 测试工程师 (testkit/)
- [ ] **api/generation_test.go** - 代码生成接口测试
- [ ] **tools/sample_frontend_projects/** - 测试用前端项目
- [ ] **e2e/code-generation.spec.ts** - 端到端流程测试

## 数据库设计

### generation_jobs 表
```sql
CREATE TABLE generation_jobs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'pending', -- pending/analyzing/generating/completed/failed
    uploaded_file_path VARCHAR(255),
    analysis_result JSONB,
    generated_code JSONB,
    backup_id VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP
);
```

## API设计

### 核心接口
```
POST /api/admin/generation/upload
- 上传前端代码压缩包
- 返回: job_id

GET /api/admin/generation/jobs/{id}/status  
- 查询生成进度
- 返回: status, progress, result

POST /api/admin/generation/jobs/{id}/apply
- 应用生成的代码
- 返回: success, backup_id

POST /api/admin/generation/jobs/{id}/rollback
- 回滚到生成前状态  
- 返回: success
```

## ⚠️ 关键注意事项

### 安全考虑
- 上传文件类型限制: .zip, .tar.gz
- 文件大小限制: 50MB
- 恶意代码扫描: 禁止可执行文件

### 技术风险
- LLM解析准确率: 需要多轮优化prompt
- 代码冲突处理: 同名函数/结构体的合并策略
- 项目重启影响: 生成代码后的服务稳定性

### 配置变更
- 数据库迁移: 新增generation_jobs表
- 环境变量: LLM_GENERATION_ENABLED=true
- 文件权限: uploads/generated/ 目录写入权限

### 依赖更新
- 新增: github.com/go-git/go-git (版本管理)
- 新增: archive/zip (压缩包处理)
- 增强: internal/llm/ (支持代码生成场景)

## 开发里程碑
- **第1-3天**: 文件上传和解析基础框架
- **第4-8天**: LLM分析和代码生成核心逻辑  
- **第9-12天**: 前端界面和预览功能
- **第13-15天**: 测试、调优和文档完善