# Redis Integration Guide — go‑vibe‑friend

> Redis作为缓存层、会话存储和任务队列，显著提升系统性能和用户体验。
> 支持Docker部署和生产环境配置，提供完整的故障降级机制。

---

## 1 · Redis 使用场景

### 1.1 会话管理 (Session Storage)

**优势**：
- 内存存储，响应速度提升90%+
- 支持TTL自动过期
- 分布式session共享

**实现方式**：
```go
// 替换数据库session为Redis session
type RedisSessionStore struct {
    client *redis.Client
    prefix string
    ttl    time.Duration
}

func (r *RedisSessionStore) Set(sessionID string, data SessionData) error {
    key := r.prefix + sessionID
    jsonData, _ := json.Marshal(data)
    return r.client.Set(context.Background(), key, jsonData, r.ttl).Err()
}
```

### 1.2 API响应缓存

**适用场景**：
- Admin面板统计数据
- 用户权限信息
- 系统设置配置
- 数据库查询结果

**缓存策略**：
- **Write-through**: 写入数据库同时更新缓存
- **Cache-aside**: 先查缓存，miss时查数据库
- **TTL设置**: 根据数据更新频率设置过期时间

### 1.3 异步任务队列

**当前痛点**：
- LLM代码生成任务阻塞HTTP请求
- 大文件处理影响用户体验

**Redis解决方案**：
```go
// 使用Redis List作为任务队列
type JobQueue struct {
    client *redis.Client
    queueName string
}

func (q *JobQueue) Enqueue(job GenerationJob) error {
    jobData, _ := json.Marshal(job)
    return q.client.LPush(context.Background(), q.queueName, jobData).Err()
}

func (q *JobQueue) Dequeue() (*GenerationJob, error) {
    result := q.client.BRPop(context.Background(), 0, q.queueName)
    // 处理任务...
}
```

### 1.4 实时通知系统

**功能**：
- 任务进度推送
- 系统状态通知
- 多用户消息广播

**技术实现**：
```go
// Redis Pub/Sub + WebSocket
func (n *NotificationService) Publish(channel string, message interface{}) {
    data, _ := json.Marshal(message)
    n.client.Publish(context.Background(), channel, data)
}
```

---

## 2 · 配置与部署

### 2.1 Docker Compose 配置

```yaml
# docker-compose.yml
services:
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes --maxmemory 256mb --maxmemory-policy allkeys-lru
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 5

  app:
    environment:
      - REDIS_HOST=redis
      - REDIS_PORT=6379
      - REDIS_PASSWORD=
      - REDIS_DB=0
    depends_on:
      redis:
        condition: service_healthy

volumes:
  redis_data:
```

### 2.2 应用配置

```go
// internal/config/config.go
type RedisConfig struct {
    Host     string `mapstructure:"host"`
    Port     int    `mapstructure:"port"`
    Password string `mapstructure:"password"`
    DB       int    `mapstructure:"db"`
    PoolSize int    `mapstructure:"pool_size"`
    
    // 会话配置
    SessionTTL time.Duration `mapstructure:"session_ttl"`
    SessionPrefix string `mapstructure:"session_prefix"`
    
    // 缓存配置
    CacheTTL time.Duration `mapstructure:"cache_ttl"`
    CachePrefix string `mapstructure:"cache_prefix"`
}

// 默认配置
viper.SetDefault("redis.host", "localhost")
viper.SetDefault("redis.port", 6379)
viper.SetDefault("redis.db", 0)
viper.SetDefault("redis.pool_size", 10)
viper.SetDefault("redis.session_ttl", "24h")
viper.SetDefault("redis.cache_ttl", "1h")
```

### 2.3 连接管理

```go
// internal/store/redis.go
type RedisClient struct {
    client *redis.Client
    config *config.RedisConfig
}

func NewRedisClient(cfg *config.RedisConfig) (*RedisClient, error) {
    rdb := redis.NewClient(&redis.Options{
        Addr:     fmt.Sprintf("%s:%d", cfg.Host, cfg.Port),
        Password: cfg.Password,
        DB:       cfg.DB,
        PoolSize: cfg.PoolSize,
    })
    
    // 健康检查
    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
    defer cancel()
    
    if err := rdb.Ping(ctx).Err(); err != nil {
        return nil, fmt.Errorf("redis connection failed: %w", err)
    }
    
    return &RedisClient{
        client: rdb,
        config: cfg,
    }, nil
}
```

---

## 3 · 性能优化

### 3.1 连接池配置

```go
// 生产环境推荐配置
&redis.Options{
    PoolSize:     20,              // 连接池大小
    MinIdleConns: 5,               // 最小空闲连接
    MaxRetries:   3,               // 重试次数
    DialTimeout:  5 * time.Second,  // 连接超时
    ReadTimeout:  3 * time.Second,  // 读取超时
    WriteTimeout: 3 * time.Second,  // 写入超时
}
```

### 3.2 内存优化

```bash
# redis.conf 优化配置
maxmemory 512mb
maxmemory-policy allkeys-lru
save 900 1    # 900秒内有1次写入就保存
save 300 10   # 300秒内有10次写入就保存
save 60 10000 # 60秒内有10000次写入就保存
```

### 3.3 键命名规范

```go
// 键名规范
const (
    SessionKeyPrefix = "gvf:session:"    // gvf:session:user_123
    CacheKeyPrefix   = "gvf:cache:"      // gvf:cache:users:list
    QueueKeyPrefix   = "gvf:queue:"      // gvf:queue:generation
    NotifyKeyPrefix  = "gvf:notify:"     // gvf:notify:user_123
)

// 构建键名
func BuildSessionKey(userID uint) string {
    return fmt.Sprintf("%s%d", SessionKeyPrefix, userID)
}
```

---

## 4 · 故障处理

### 4.1 降级策略

```go
// 缓存降级：Redis不可用时使用数据库
type CacheService struct {
    redis *redis.Client
    db    *gorm.DB
}

func (c *CacheService) GetUserPermissions(userID uint) ([]Permission, error) {
    // 尝试从Redis获取
    if c.redis != nil {
        if data, err := c.getFromRedis(userID); err == nil {
            return data, nil
        }
    }
    
    // 降级到数据库
    return c.getFromDatabase(userID)
}
```

### 4.2 监控指标

```go
// 监控Redis连接状态
func (r *RedisClient) HealthCheck() error {
    ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
    defer cancel()
    
    return r.client.Ping(ctx).Err()
}

// 获取Redis统计信息
func (r *RedisClient) GetStats() (*RedisStats, error) {
    info := r.client.Info(context.Background(), "memory", "stats")
    // 解析统计信息...
}
```

### 4.3 日志记录

```go
// Redis操作日志
func (r *RedisClient) logOperation(operation, key string, duration time.Duration, err error) {
    fields := logrus.Fields{
        "operation": operation,
        "key":       key,
        "duration":  duration,
    }
    
    if err != nil {
        fields["error"] = err.Error()
        logrus.WithFields(fields).Error("Redis operation failed")
    } else {
        logrus.WithFields(fields).Debug("Redis operation completed")
    }
}
```

---

## 5 · 最佳实践

### 5.1 数据序列化

```go
// 使用JSON序列化，便于调试和跨语言兼容
func SerializeToRedis(data interface{}) (string, error) {
    bytes, err := json.Marshal(data)
    if err != nil {
        return "", err
    }
    return string(bytes), nil
}

func DeserializeFromRedis(data string, target interface{}) error {
    return json.Unmarshal([]byte(data), target)
}
```

### 5.2 缓存失效策略

```go
// 标签化缓存失效
type CacheTag struct {
    redis  *redis.Client
    prefix string
}

func (c *CacheTag) InvalidateTag(tag string) error {
    // 查找所有带有该标签的键
    pattern := fmt.Sprintf("%s:tag:%s:*", c.prefix, tag)
    keys, err := c.redis.Keys(context.Background(), pattern).Result()
    if err != nil {
        return err
    }
    
    // 批量删除
    if len(keys) > 0 {
        return c.redis.Del(context.Background(), keys...).Err()
    }
    return nil
}
```

### 5.3 批量操作

```go
// 使用Pipeline提升性能
func (r *RedisClient) BatchSet(data map[string]interface{}, ttl time.Duration) error {
    pipe := r.client.Pipeline()
    
    for key, value := range data {
        jsonData, _ := json.Marshal(value)
        pipe.Set(context.Background(), key, jsonData, ttl)
    }
    
    _, err := pipe.Exec(context.Background())
    return err
}
```

---

## 6 · 迁移指南

### 6.1 会话存储迁移

1. **第一阶段**：双写模式（同时写入数据库和Redis）
2. **第二阶段**：切换读取源为Redis
3. **第三阶段**：移除数据库session写入

### 6.2 缓存层引入

1. **识别热点数据**：分析API调用频率
2. **逐步引入**：从最高频的API开始
3. **性能对比**：监控缓存命中率和响应时间

### 6.3 任务队列改造

1. **保留原有同步处理**：作为降级方案
2. **新增异步选项**：配置化选择处理方式
3. **监控队列状态**：确保任务不丢失

---

## 7 · 故障排除

### 7.1 常见问题

**连接超时**：
```bash
# 检查Redis服务状态
docker-compose ps redis
docker-compose logs redis

# 检查网络连接
telnet localhost 6379
```

**内存不足**：
```bash
# 查看内存使用
redis-cli info memory

# 清理过期键
redis-cli --scan --pattern "gvf:cache:*" | xargs redis-cli del
```

**性能问题**：
```bash
# 查看慢查询
redis-cli slowlog get 10

# 监控实时命令
redis-cli monitor
```

### 7.2 数据备份

```bash
# 生产环境备份策略
# 1. RDB快照
save 900 1

# 2. AOF日志
appendonly yes
appendfsync everysec

# 3. 手动备份
redis-cli BGSAVE
```

---

## 8 · 生产部署清单

### ✅ 部署前检查

- [ ] Redis配置文件优化
- [ ] 内存限制设置合理
- [ ] 持久化策略配置
- [ ] 监控告警设置
- [ ] 备份恢复方案
- [ ] 故障降级测试
- [ ] 性能压测完成

### ✅ 安全配置

- [ ] 设置Redis密码
- [ ] 网络访问控制
- [ ] 禁用危险命令
- [ ] 日志审计启用

---

> Redis集成大幅提升了go-vibe-friend的性能和用户体验，为后续功能扩展提供了强大的基础设施支持。