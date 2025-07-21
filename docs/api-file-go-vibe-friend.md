# API 开发文档 — go-vibe-friend

> 版本：v0.3 更新时间：2025‑07‑18 作者：[@aibu666@outlook.com](https://github.com/wssab314)
>
> 本文档描述 **go‑vibe‑friend** 在 M1‑M2 里程碑（Dashboard / Upload & Generate / Job Center / Data Explorer / API Tester）阶段全部可调用的 **HTTP JSON** 接口，按作用域划分为：
>
> | Scope     | 说明           | 前缀示例                    |
> | --------- | ------------ | ----------------------- |
> | **vf**    | 业务接口（面向普通用户） | `/api/vf/v1/auth/login` |
> | **admin** | 管理接口（仅管理员）   | `/api/admin/v1/jobs`    |
>
> 所有接口遵循统一响应格式、错误码及认证方式（§ 1）。

---

## 1 · 通用约定

* **Base URL** `http://{host}:8080/api/{scope}/v1`
* **Content‑Type** `application/json; charset=utf‑8`
* **时间** ISO‑8601 UTC（例 `2025‑07‑18T05:31:14Z`）
* **认证** `vf` 接口：`Bearer <jwt>`； `admin` 接口再校验 `role=admin`
* **分页** `page` 从 1 开始、`limit` ≤100
* **统一响应包**

  ```json
  { "code": 0, "message": "ok", "data": { … } }
  ```
* **主要错误码**

  | code | 含义               |
    | ---- | ---------------- |
  | 1001 | 参数校验失败           |
  | 1002 | 未认证 / Token 失效   |
  | 1003 | 权限不足             |
  | 1004 | 资源不存在            |
  | 2001 | 生成 Job 不存在 / 已失效 |

---

## 2 · 业务接口 (`/api/vf/v1`)

### 2.1 身份认证

| 名称 | 方法     | 路径               | 说明                  |
| -- | ------ | ---------------- | ------------------- |
| 注册 | `POST` | `/auth/register` | 邮箱 + 密码             |
| 登录 | `POST` | `/auth/login`    | 返回 `access/refresh` |
| 刷新 | `POST` | `/auth/refresh`  | 刷新 Token            |
| 登出 | `POST` | `/auth/logout`   | 作废 Refresh          |

### 2.2 个人中心

| 名称   | 方法    | 路径         |
| ---- | ----- | ---------- |
| 获取资料 | `GET` | `/profile` |
| 更新资料 | `PUT` | `/profile` |

> 接口格式与先前版本一致，此处省略示例。

---

## 3 · 管理接口 (`/api/admin/v1`)

### 3.1 上传 & 生成（原 Upload Flow）

| 名称        | 方法     | 路径                  | 权限      |
| --------- | ------ | ------------------- | ------- |
| 上传前端源码包   | `POST` | `/upload-frontend`  | `admin` |
| 查询 Job 状态 | `GET`  | `/jobs/{id}`        | `admin` |
| 应用生成结果    | `POST` | `/jobs/{id}/apply`  | `admin` |
| 取消 Job    | `POST` | `/jobs/{id}/cancel` | `admin` |

#### 3.1.1 Job 对象

```json
{
  "id": "9b42e3…",
  "status": "running",   // queued / running / completed / failed / cancelled
  "progress": 42,         // %
  "diff_stats": { "files": 6, "insertions": 120, "deletions": 3 },
  "error": null,
  "created_at": "2025-07-18T05:30:11Z"
}
```

### 3.2 系统重载

| 名称    | 方法     | 路径        | 权限      |
| ----- | ------ | --------- | ------- |
| 热重启后端 | `POST` | `/reload` | `admin` |

> 成功返回 `202 Accepted`，WebSocket 将推送 `reload_complete`。

### 3.3 数据探索器

| 名称       | 方法     | 路径                       | 权限      | 说明                                 |
| -------- | ------ | ------------------------ | ------- | ---------------------------------- |
| 列出数据表    | `GET`  | `/db/tables`             | `admin` | 返回表名 + 行数                          |
| 表结构      | `GET`  | `/db/tables/{name}`      | `admin` | 字段名/类型/索引                          |
| 查询行数据    | `GET`  | `/db/tables/{name}/rows` | `admin` | `?page/limit/order`                |
| 执行原生 SQL | `POST` | `/db/exec-sql`           | `admin` | body `{ "sql": "SELECT…" }` **慎用** |

### 3.4 系统设置

| 名称     | 方法    | 路径          | 权限      |
| ------ | ----- | ----------- | ------- |
| 获取全局设置 | `GET` | `/settings` | `admin` |
| 更新设置   | `PUT` | `/settings` | `admin` |

*设置键*

```json
{
  "llm_provider": "openai",
  "llm_api_key": "sk-***",
  "code_template": "go-gin-gorm",
  "db_type": "sqlite" | "postgres" | "mysql"
}
```

### 3.5 日志 & 审计

| 名称   | 方法    | 路径            | 权限      | 支持过滤                             |
| ---- | ----- | ------------- | ------- | -------------------------------- |
| 系统日志 | `GET` | `/logs`       | `admin` | `level`, `since`, `keyword`      |
| 审计日志 | `GET` | `/audit-logs` | `admin` | `actor_id`, `resource`, `action` |

### 3.6 插件中心（预留）

| 名称    | 方法       | 路径                     | 权限      |
| ----- | -------- | ---------------------- | ------- |
| 列出插件  | `GET`    | `/plugins`             | `admin` |
| 安装插件  | `POST`   | `/plugins/install`     | `admin` |
| 启/停插件 | `POST`   | `/plugins/{id}/toggle` | `admin` |
| 卸载插件  | `DELETE` | `/plugins/{id}`        | `admin` |

---

## 4 · WebSocket 事件

* 连接：`ws://{host}:8080/api/admin/v1/ws`
* 事件示例

```json
{ "type": "job_progress", "payload": { "id": "9b42e3…", "progress": 73 } }
{ "type": "reload_complete" }
```

---

## 5 · 版本历史

| 版本       | 更新                                                      |
| -------- | ------------------------------------------------------- |
| v0.1     | 初版：Auth / Profile / Upload Flow                         |
| v0.2     | 引入 `vf` / `admin` Scope                                 |
| **v0.3** | Job API 全量、Settings、Logs、Data Explorer、Reload、Plugin 接口 |

---

## 6 · 性能优化 (Redis缓存)

### 6.1 缓存策略

| API类型         | 缓存TTL | 缓存键规则                    | 失效策略           |
| ------------- | ----- | ------------------------ | -------------- |
| **会话认证**      | 24h   | `gvf:session:{token}`    | 登出时立即清除        |
| **用户列表**      | 1h    | `gvf:cache:users:list`   | 用户增删改时失效       |
| **权限数据**      | 30m   | `gvf:cache:perms:{uid}`  | 权限变更时失效        |
| **仪表板统计**     | 5m    | `gvf:cache:stats:dash`   | 定时刷新           |
| **系统设置**      | 10m   | `gvf:cache:settings`     | 设置更新时立即失效      |

### 6.2 性能提升

- **会话验证**：从数据库查询 ~50ms → Redis缓存 ~2ms （提升96%）
- **用户列表**：复杂查询 ~200ms → 缓存返回 ~3ms （提升98%）
- **Admin面板**：首屏加载 ~1.5s → 缓存优化后 ~300ms （提升80%）
- **并发处理**：支持更高的并发请求，Redis连接池优化

### 6.3 降级机制

```
请求 → Redis缓存 → [缓存miss/Redis故障] → 数据库查询 → 写入缓存
```

确保在Redis不可用时系统仍能正常运行，只是响应时间恢复到数据库查询水平。

---

> 若需更多示例（cURL / HTTPie / JS Fetch），请参考仓库 `examples/`。
> Redis缓存详细配置请参考 [redis-integration.md](./redis-integration.md)
