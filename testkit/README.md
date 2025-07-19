## 0. 目录与文件树（最终形态）

```text
go-vibe-friend/
└── testkit/
    ├── README.md
    ├── Makefile                # testkit 专用命令
    ├── data/
    │   ├── seed.sql
    │   └── files/              # 头像、附件示例
    ├── env/
    │   ├── .env.test.unit
    │   ├── .env.test.api
    │   └── .env.test.e2e
    ├── api/                    # Go HTTP 合约测试
    │   ├── common_test.go
    │   ├── auth_test.go
    │   ├── profile_test.go
    │   ├── job_test.go
    │   └── table/              # golden files
    ├── e2e/                    # Playwright 端到端
    │   ├── playwright.config.ts
    │   ├── dashboard.spec.ts
    │   ├── upload_flow.spec.ts
    │   └── fixtures/
    │       └── bolt-demo.zip
    ├── tools/
    │   ├── mock_smtp.go
    │   ├── recorder.go
    │   └── README.md
    └── reports/                # CI 产物 (html, junit)
```

---

## 1. 三层测试栈

| 层级          | 目录                     | 目标                 | 核心依赖                              |
| ----------- | ---------------------- | ------------------ | --------------------------------- |
| **单元**      | `internal/...` (主项目现有) | 函数级逻辑              | Go `testing`, `testify`           |
| **HTTP 合约** | `/testkit/api`         | API 行为、JSON 字段、状态码 | Go `httptest`, `gjson`, `testify` |
| **端到端**     | `/testkit/e2e`         | UI 流程、上传生成、Diff 交互 | `playwright` + HTML 报告            |

> **原则**：单元测试仍放业务代码旁；`/testkit` 仅存“跨模块”与“黑盒端到端”。

---

## 2. 详细文件说明

### 2.1 `/testkit/README.md`

* **安装**：`go 1.24` `node 20` `pnpm 9`
* **一键执行**：`make testkit`
* **查看报告**：`open reports/playwright/index.html`
* **添加用例**：`go test -run TestXxx` / `npx playwright codegen http://localhost:5173`

### 2.2 `/testkit/Makefile`

```Makefile
testkit: test-api test-e2e

test-api:
	@echo "▶ API Contract Tests"
	go test ./testkit/api/... -v -count=1 -coverprofile=reports/api.cover

test-e2e:
	@echo "▶ E2E Tests"
	cd testkit/e2e && pnpm test

reports-clean:
	rm -rf testkit/reports/*

.PHONY: testkit test-api test-e2e reports-clean
```

### 2.3 `/testkit/data/seed.sql`

* 插入：

    * 1 名 `admin@demo.dev / Pa$$`
    * 2 篇示例 `posts`
* CI 容器启动后执行 `psql -f seed.sql`。

### 2.4 `/testkit/api/common_test.go`

```go
var (
	baseURL = os.Getenv("API_BASE_URL") // http://localhost:8080
	adminJWT string
)

func TestMain(m *testing.M) {
	// 登录获取 Token
	adminJWT = loginAsAdmin()
	os.Exit(m.Run())
}

func doReq(method, path string, body io.Reader, jwt string) *http.Response {
	req, _ := http.NewRequest(method, baseURL+path, body)
	if jwt != "" {
		req.Header.Set("Authorization", "Bearer "+jwt)
	}
	req.Header.Set("Content-Type", "application/json")
	resp, _ := http.DefaultClient.Do(req)
	return resp
}
```

### 2.5 `/testkit/api/auth_test.go`

```go
func TestRegisterAndLogin(t *testing.T) {
	// register
	payload := `{"email":"demo@test.dev","password":"123456"}`
	resp := doReq("POST", "/api/vf/v1/auth/register", strings.NewReader(payload), "")
	assert.Equal(t, 200, resp.StatusCode)

	// email verify mock
	verifyToken := gjson.Get(readBody(resp), "data.verify_token").String()
	_ = doReq("POST", "/api/vf/v1/auth/verify-email",
	          bytes.NewBufferString(`{"token":"`+verifyToken+`"}`), "")

	// login
	resp = doReq("POST", "/api/vf/v1/auth/login",
	             strings.NewReader(`{"email":"demo@test.dev","password":"123456"}`), "")
	assert.JSONEq(t, `{"code":0}`, readBody(resp))
}
```

### 2.6 `/testkit/e2e/dashboard.spec.ts`

```ts
import { test, expect } from '@playwright/test'

test('admin dashboard shows job metrics', async ({ page }) => {
  await page.goto('http://localhost:5173/admin/login')
  await page.fill('#email', 'admin@demo.dev')
  await page.fill('#password', 'Pa$$')
  await page.click('button[type=submit]')

  await page.waitForSelector('text=System Health')
  const cpu = await page.locator('data-test=cpu').innerText()
  expect(Number(cpu)).toBeLessThan(80)
})
```

`playwright.config.ts` 指定：

```ts
webServer: {
  command: 'make dev',
  url: 'http://localhost:5173',
  reuseExistingServer: !process.env.CI,
  timeout: 120 * 1000
}
```

### 2.7 `/testkit/tools/mock_smtp.go`

* 监听 2525 端口；把邮件内容转储到 `reports/smtp/{uuid}.eml`；
* 提供搜索函数 `FindVerifyTokenByEmail(email)` 供 API 测试读取。

---

## 3. CI/CD 集成示例（`.github/workflows/ci.yml`）

```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    services:
      db:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: gvf_test
        ports: ["5432:5432"]
    steps:
      - uses: actions/checkout@v4

      - name: Set up Go
        uses: actions/setup-go@v5
        with:
          go-version: "1.22"

      - name: Set up Node
        uses: actions/setup-node@v4
        with:
          node-version: "20"

      - run: pnpm i -g pnpm && pnpm i --frozen-lockfile

      - name: Seed DB
        run: psql -h localhost -U postgres -d gvf_test -f testkit/data/seed.sql
        env:
          PGPASSWORD: postgres

      - name: Run application (background)
        run: make dev &
      
      - name: Run TestKit
        run: make testkit

      - name: Upload Playwright Report
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: testkit/e2e/playwright-report
```

---

## 4. 本地开发者“拿来即跑”指引

1. `docker compose up -d db`
2. `make dev`（启动 API+Admin）
3. `make testkit`
4. HTML 报告：`open testkit/reports/playwright/index.html`

---

## 5. 后续演进（Roadmap）

| 里程碑        | 目标        | 关键任务                                                 |
| ---------- | --------- | ---------------------------------------------------- |
| **T0 已交付** | 单机全跑通     | Unit + API + E2E                                     |
| **T1**     | 覆盖率 ≥ 70% | 生成 `go test -cover` badge；E2E mock 上传流程              |
| **T2**     | 并行矩阵      | GitHub Actions 拆 macOS/Ubuntu；数据库 MySQL/Postgres 两套  |
| **T3**     | 外部贡献友好    | `gvf test create api Auth` 脚手架；CI comment 出失败截图      |
| **T4**     | 性能基准      | 加 `/testkit/bench`，使用 `go test -bench`；生成 flameGraph |
| **T5**     | SaaS 灰度   | Playwright 连接远端 demo.gvf.ai，跑线上健康探针                  |

---

### 一键复制清单

1. 在仓库根执行：

   ```bash
   mkdir -p testkit/{data,api,e2e,tools,reports}
   ```
2. 将上面示例文件粘贴入对应位置。
3. 补 `.env.test.*` 文件（DB\_URL、API\_KEY 等）。
4. commit：`feat(testkit): add initial testkit with api and e2e`。

完成后，任何开发者只需：

```bash
git clone … && cd go-vibe-friend
make dev &     # 启动应用
make testkit   # 全栈验证，一次通过
```

这样，独立开发者即便 **没有测试开发工程师**，也能 5 分钟搞定端到端回归，安心做新功能。
