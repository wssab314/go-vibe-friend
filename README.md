# go-vibe-friend

> **go-vibe-friend** 是一个开箱即用的本地化 Admin & API 工具箱，聚焦于“**AI‑Vibe Coding**” 场景：
>
> 1. 一键启动即可获得 **用户注册 / 登录 / 个人中心** 等常用 CRUD 功能；
> 2. 内嵌 React Admin 前端，零配置打开浏览器即可管理；
> 3. 支持上传由 Bolt / v0 等低代码平台生成的前端源码 + 对话日志，自动解析并借助 **LLM** 生成数据库表结构与后端接口；
> 4. 默认集成 SQLite，生产可无缝切换 PostgreSQL / MySQL；
> 5. 完全开源，插件化架构，方便二次开发。

---

## ✨ 主要特性

* **零环境依赖**：单条命令 `make dev` 立即启动完整开发栈（后端 + 前端 + DB）。
* **基础 Auth**：JWT / Session 双模式；用户注册、登录、个人资料 CRUD 开箱即用。
* **LLM 驱动的代码生成**：上传前端源码 → 解析 API 需求 → LLM 输出 SQL & Go 代码 → 一键写入项目并热重载。
* **前端内置**：基于 React 18 + Tailwind + shadcn/ui，UI 轻量美观；支持 `pnpm dev` 独立调试。
* **可扩展架构**：Cobra CLI + 插件系统，轻松接入更多低代码平台或自定义模板。
* **现代工程实践**：GitHub Actions CI、GolangCI‑Lint、Docker 化部署、Mermaid 架构图、代码覆盖率报告。

---

## 🛠️ 技术栈

### Backend

| 技术                | 用途         |
| ----------------- | ---------- |
| **Go 1.22+**      | 主语言        |
| **Gin**           | HTTP 框架    |
| **GORM**          | ORM & 自动迁移 |
| **Cobra / Viper** | CLI & 配置管理 |
| **OpenAI‑Go SDK** | LLM 调用客户端  |
| **Air**           | 热重载        |

### Frontend (Admin UI)

| 技术                           | 用途         |
| ---------------------------- | ---------- |
| **React 18**                 | UI 框架      |
| **Vite + pnpm + TypeScript** | 构建工具 & 包管理 |
| **Tailwind CSS**             | 样式         |
| **shadcn/ui**                | 组件库        |
| **react‑diff‑viewer**        | 代码 Diff 展示 |

### Infrastructure

| 技术                     | 用途                       |
| ---------------------- | ------------------------ |
| **PostgreSQL**         | 默认主数据库                   |
| **SQLite / MySQL**     | 可选替代数据库                  |
| **Docker & Compose**   | 本地和生产容器化                 |
| **GitHub Actions**     | CI / Lint / Test / Build |

---

## 📂 项目结构

```text
go-vibe-friend/
├── cmd/                    # 可执行入口
│   └── server/             # main.go / flags / embed.FS
├── internal/               # 领域包（按 Clean Architecture 可再细分）
│   ├── api/                # Gin/Fiber Handler + Router
│   │   ├── admin/          # /api/admin/…
│   │   └── vf/             # /api/vf/…
│   ├── config/             # Viper / env 解析
│   ├── models/             # GORM/Ent 实体 (User, GenerationJob…)
│   ├── service/            # 业务逻辑 (AuthService, JobService…)
│   ├── store/              # DB ↔ Repo（可放 DAO / Query）
│   ├── jobs/               # LLM 生成 Worker & 队列
│   └── utils/              # 公共库 (hash, jwt, logger…)
├── migrations/             # *.sql 或 Atlas / golang-migrate 文件
│   └── 20250718_initial.sql
├── web/                    # 前端
│   └── admin/              # React + Vite + Tailwind 源码
│       ├── src/
│       ├── index.html
│       └── vite.config.ts
├── scripts/                # 本地或 CI 辅助脚本 (seed_db.sh, gen.sh…)
├── docs/                   # 技术/产品文档
│   ├── api-file-go-vibe-friend.md
│   ├── data-model-go-vibe-friend.md
│   └── ...
├── .github/                # GitHub Actions workflows / ISSUE_TEMPLATE
│   └── workflows/ci.yml
├── tests/                  # Go 单元/集成测试
│   └── api_test.go
├── Dockerfile              # 后端容器
├── docker-compose.yml      # 本地编排 (app + postgres)
├── Makefile                # make dev / build / lint / migrate
├── .env.example            # 默认环境变量
├── .gitignore
├── LICENSE
└── README.md               # 项目总览（Canvas README 已同步）

```

---

## ⚡ 快速开始

### 1. 克隆仓库

```bash
git clone https://github.com/yourname/go-vibe-friend.git
cd go-vibe-friend
```

### 2. 环境准备

* **Go ≥ 1.22**
* **Node.js ≥ 20** & **pnpm ≥ 9**
* **Docker** & **Docker Compose** (可选，用于 PostgreSQL/MySQL)
* 拥有一个可用的 **OpenAI API Key** 并写入 `.env`

```bash
cp .env.example .env
# 编辑 .env，填入 OPENAI_API_KEY=your_key_here
```

### 3. 首次设置（推荐）

```bash
make setup
```

这会自动安装依赖并启动 PostgreSQL 数据库。

### 4. 启动开发环境

```bash
make dev
```

* 后端：`http://localhost:8080`
* Admin UI：`http://localhost:5173`
* 数据库：PostgreSQL (localhost:5432)，首次运行自动迁移基础表。

### 5. 上传前端并生成后端

1. 访问 Admin UI → **LLM Generate** 页面。
2. 上传 Bolt/v0 导出的前端 `.zip` 与 `chat-history.json`。
3. 系统解析 API 需求 → 显示 Diff → 点击 **Apply**。
4. 项目自动写入 `internal/api/…` `internal/models/…` 与 `migrations/…`，并自动热重启。

---

## 🏗️ 架构图

```mermaid
graph TD
    A[Admin UI / React] -->|REST / WebSocket| B(Go Server / Gin)
    B -->|GORM| C[(SQLite / PostgreSQL)]
    B --> D{{LLM Client}}
    CLI[Cobra CLI] --> C
    CLI --> B
```

---

## 🔧 常用脚本

| 命令             | 说明                     |
| -------------- | ---------------------- |
| `make setup`   | 首次设置开发环境（推荐）           |
| `make dev`     | 热重载启动后端 & 前端           |
| `make db-start`| 启动 PostgreSQL 数据库     |
| `make db-stop` | 停止 PostgreSQL 数据库     |
| `make migrate` | 执行所有数据库迁移              |
| `make test`    | 运行后端单元测试               |
| `make lint`    | GolangCI‑Lint + ESLint |
| `make build`   | 构建二进制与前端产物             |

> 完整脚本列表见 [`Makefile`](./Makefile)。

### 🗄️ 数据库管理

本项目使用 **PostgreSQL** 作为主数据库，通过 Docker Compose 管理。详细的数据库配置和使用说明请参考 [DATABASE.md](./DATABASE.md)。

主要命令：
- `make setup` - 首次设置，自动启动数据库
- `make dev` - 启动开发环境，自动检查并启动数据库
- `make db-start` - 单独启动数据库
- `make db-stop` - 停止数据库
- `make db-logs` - 查看数据库日志

数据库连接信息：
- **主机**: localhost:5432
- **用户**: postgres/postgres
- **数据库**: go_vibe_friend

---

## 🚀 生产部署

```bash
# 1. 构建容器镜像
make docker-build

# 2. 启动
docker compose -f docker-compose.prod.yml up -d
```

> 默认 `docker-compose.prod.yml` 使用 PostgreSQL 作为存储，并开启自动迁移。

---

## 🤝 贡献指南

1. Fork → 新建分支 (`feat/awesome-feature`)
2. 提交代码并确保 **Signed‑off‑by**
3. 提交 Pull Request，并关联 Issue
4. 通过 CI 检查与 Code Review 后合并

> 详细规范参见 [`CONTRIBUTING.md`](./CONTRIBUTING.md)。

---

## 🛡️ License

Distributed under the **MIT License**. See [`LICENSE`](./LICENSE) for more information.

---

## 🎯 Roadmap

*

---

## 🌟 致谢

* [Gin](https://github.com/gin-gonic/gin) – HTTP 新风格
* [GORM](https://gorm.io) – Go 优雅 ORM
* [Tailwind CSS](https://tailwindcss.com) – Utility‑first CSS
* [shadcn/ui](https://ui.shadcn.com/) – React Headless UI
* [OpenAI](https://openai.com) – Code Generation

> 如果本项目对你有帮助，请 **Star ⭐️** 支持！

---

## 📬 联系

创建者 — [@aibu666@outlook.com](https://github.com/wssab314)

> 有任何想法或问题，欢迎提 Issue 或 PR，一起让 AI‑Driven Backend 更简单！
