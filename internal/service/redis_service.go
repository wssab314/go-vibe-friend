package service

import (
	"context"
	"fmt"
	"strings"
	"time"

	"go-vibe-friend/internal/store"

	"github.com/redis/go-redis/v9"
)

type RedisService struct {
	storeManager *store.Store
}

func NewRedisService(storeManager *store.Store) *RedisService {
	return &RedisService{
		storeManager: storeManager,
	}
}

// RedisInfo Redis信息结构
type RedisInfo struct {
	IsAvailable bool                   `json:"is_available"`
	Info        map[string]interface{} `json:"info"`
	Stats       RedisStats             `json:"stats"`
}

// RedisStats Redis统计信息
type RedisStats struct {
	ConnectedClients    int64  `json:"connected_clients"`
	UsedMemory          string `json:"used_memory"`
	UsedMemoryHuman     string `json:"used_memory_human"`
	TotalCommandsProcessed int64 `json:"total_commands_processed"`
	InstantaneousOps    int64  `json:"instantaneous_ops"`
	KeyspaceHits        int64  `json:"keyspace_hits"`
	KeyspaceMisses      int64  `json:"keyspace_misses"`
	TotalKeys           int64  `json:"total_keys"`
}

// RedisKey Redis键信息
type RedisKey struct {
	Key    string      `json:"key"`
	Type   string      `json:"type"`
	TTL    int64       `json:"ttl"`
	Size   int64       `json:"size"`
	Value  interface{} `json:"value,omitempty"`
}

// GetRedisInfo 获取Redis信息
func (s *RedisService) GetRedisInfo() (*RedisInfo, error) {
	if !s.storeManager.IsRedisAvailable() {
		return &RedisInfo{
			IsAvailable: false,
			Info:        map[string]interface{}{"error": "Redis不可用"},
			Stats:       RedisStats{},
		}, nil
	}

	ctx := context.Background()
	client := s.storeManager.Redis
	
	// 获取Redis info
	infoResult, err := client.Client().Info(ctx).Result()
	if err != nil {
		return nil, fmt.Errorf("获取Redis信息失败: %w", err)
	}

	// 解析info信息
	info := parseRedisInfo(infoResult)
	
	// 获取统计信息
	stats, err := s.getRedisStats(ctx, client.Client())
	if err != nil {
		return nil, fmt.Errorf("获取Redis统计信息失败: %w", err)
	}

	return &RedisInfo{
		IsAvailable: true,
		Info:        info,
		Stats:       stats,
	}, nil
}

// GetKeys 获取Redis键列表
func (s *RedisService) GetKeys(pattern string, limit int) ([]RedisKey, error) {
	if !s.storeManager.IsRedisAvailable() {
		return nil, fmt.Errorf("Redis不可用")
	}

	ctx := context.Background()
	client := s.storeManager.Redis.Client()

	if pattern == "" {
		pattern = "*"
	}

	var keys []string
	iter := client.Scan(ctx, 0, pattern, int64(limit)).Iterator()
	for iter.Next(ctx) {
		keys = append(keys, iter.Val())
	}
	if err := iter.Err(); err != nil {
		return nil, fmt.Errorf("扫描键失败: %w", err)
	}

	var redisKeys []RedisKey
	for _, key := range keys {
		keyInfo, err := s.getKeyInfo(ctx, client, key)
		if err != nil {
			continue // 跳过错误的键
		}
		redisKeys = append(redisKeys, keyInfo)
	}

	return redisKeys, nil
}

// GetKeyValue 获取键值
func (s *RedisService) GetKeyValue(key string) (*RedisKey, error) {
	if !s.storeManager.IsRedisAvailable() {
		return nil, fmt.Errorf("Redis不可用")
	}

	ctx := context.Background()
	client := s.storeManager.Redis.Client()

	keyInfo, err := s.getKeyInfo(ctx, client, key)
	if err != nil {
		return nil, err
	}

	// 获取值
	switch keyInfo.Type {
	case "string":
		val, err := client.Get(ctx, key).Result()
		if err != nil {
			return nil, err
		}
		keyInfo.Value = val
	case "hash":
		val, err := client.HGetAll(ctx, key).Result()
		if err != nil {
			return nil, err
		}
		keyInfo.Value = val
	case "list":
		val, err := client.LRange(ctx, key, 0, -1).Result()
		if err != nil {
			return nil, err
		}
		keyInfo.Value = val
	case "set":
		val, err := client.SMembers(ctx, key).Result()
		if err != nil {
			return nil, err
		}
		keyInfo.Value = val
	case "zset":
		val, err := client.ZRangeWithScores(ctx, key, 0, -1).Result()
		if err != nil {
			return nil, err
		}
		keyInfo.Value = val
	}

	return &keyInfo, nil
}

// DeleteKey 删除键
func (s *RedisService) DeleteKey(key string) error {
	if !s.storeManager.IsRedisAvailable() {
		return fmt.Errorf("Redis不可用")
	}

	ctx := context.Background()
	return s.storeManager.Redis.Client().Del(ctx, key).Err()
}

// SetKeyTTL 设置键过期时间
func (s *RedisService) SetKeyTTL(key string, ttl time.Duration) error {
	if !s.storeManager.IsRedisAvailable() {
		return fmt.Errorf("Redis不可用")
	}

	ctx := context.Background()
	return s.storeManager.Redis.Client().Expire(ctx, key, ttl).Err()
}

// FlushDB 清空当前数据库
func (s *RedisService) FlushDB() error {
	if !s.storeManager.IsRedisAvailable() {
		return fmt.Errorf("Redis不可用")
	}

	ctx := context.Background()
	return s.storeManager.Redis.Client().FlushDB(ctx).Err()
}

// TestConnection 测试Redis连接
func (s *RedisService) TestConnection() map[string]interface{} {
	result := map[string]interface{}{
		"available": false,
		"error":     "",
		"ping":      "",
		"timestamp": time.Now(),
	}

	if !s.storeManager.IsRedisAvailable() {
		result["error"] = "Redis连接不可用"
		return result
	}

	ctx := context.Background()
	client := s.storeManager.Redis.Client()

	// 测试ping
	pong, err := client.Ping(ctx).Result()
	if err != nil {
		result["error"] = err.Error()
		return result
	}

	result["available"] = true
	result["ping"] = pong
	return result
}

// ExecuteCommand 执行Redis命令（危险操作，需要权限控制）
func (s *RedisService) ExecuteCommand(command string, args ...interface{}) (interface{}, error) {
	if !s.storeManager.IsRedisAvailable() {
		return nil, fmt.Errorf("Redis不可用")
	}

	// 安全性检查：禁止危险命令
	dangerousCommands := []string{"FLUSHALL", "FLUSHDB", "CONFIG", "SHUTDOWN", "DEBUG"}
	upperCommand := strings.ToUpper(command)
	for _, dangerous := range dangerousCommands {
		if upperCommand == dangerous {
			return nil, fmt.Errorf("危险命令被禁止: %s", command)
		}
	}

	ctx := context.Background()
	client := s.storeManager.Redis.Client()
	
	result := client.Do(ctx, append([]interface{}{command}, args...)...)
	return result.Result()
}

// 辅助函数

func (s *RedisService) getRedisStats(ctx context.Context, client *redis.Client) (RedisStats, error) {
	stats := RedisStats{}

	// 获取客户端信息
	clientInfo, err := client.Info(ctx, "clients").Result()
	if err == nil {
		if connectedClients := parseInfoValue(clientInfo, "connected_clients"); connectedClients != "" {
			fmt.Sscanf(connectedClients, "%d", &stats.ConnectedClients)
		}
	}

	// 获取内存信息
	memoryInfo, err := client.Info(ctx, "memory").Result()
	if err == nil {
		stats.UsedMemory = parseInfoValue(memoryInfo, "used_memory")
		stats.UsedMemoryHuman = parseInfoValue(memoryInfo, "used_memory_human")
	}

	// 获取统计信息
	statsInfo, err := client.Info(ctx, "stats").Result()
	if err == nil {
		if totalCommands := parseInfoValue(statsInfo, "total_commands_processed"); totalCommands != "" {
			fmt.Sscanf(totalCommands, "%d", &stats.TotalCommandsProcessed)
		}
		if instantaneousOps := parseInfoValue(statsInfo, "instantaneous_ops_per_sec"); instantaneousOps != "" {
			fmt.Sscanf(instantaneousOps, "%d", &stats.InstantaneousOps)
		}
		if keyspaceHits := parseInfoValue(statsInfo, "keyspace_hits"); keyspaceHits != "" {
			fmt.Sscanf(keyspaceHits, "%d", &stats.KeyspaceHits)
		}
		if keyspaceMisses := parseInfoValue(statsInfo, "keyspace_misses"); keyspaceMisses != "" {
			fmt.Sscanf(keyspaceMisses, "%d", &stats.KeyspaceMisses)
		}
	}

	// 获取键数量
	dbSize, err := client.DBSize(ctx).Result()
	if err == nil {
		stats.TotalKeys = dbSize
	}

	return stats, nil
}

func (s *RedisService) getKeyInfo(ctx context.Context, client *redis.Client, key string) (RedisKey, error) {
	keyInfo := RedisKey{Key: key}

	// 获取类型
	keyType, err := client.Type(ctx, key).Result()
	if err != nil {
		return keyInfo, err
	}
	keyInfo.Type = keyType

	// 获取TTL
	ttl, err := client.TTL(ctx, key).Result()
	if err != nil {
		return keyInfo, err
	}
	keyInfo.TTL = int64(ttl.Seconds())

	// 获取大小（估算）
	switch keyType {
	case "string":
		size, _ := client.StrLen(ctx, key).Result()
		keyInfo.Size = size
	case "list":
		size, _ := client.LLen(ctx, key).Result()
		keyInfo.Size = size
	case "set":
		size, _ := client.SCard(ctx, key).Result()
		keyInfo.Size = size
	case "zset":
		size, _ := client.ZCard(ctx, key).Result()
		keyInfo.Size = size
	case "hash":
		size, _ := client.HLen(ctx, key).Result()
		keyInfo.Size = size
	}

	return keyInfo, nil
}

func parseRedisInfo(infoStr string) map[string]interface{} {
	info := make(map[string]interface{})
	lines := strings.Split(infoStr, "\r\n")
	
	currentSection := ""
	for _, line := range lines {
		line = strings.TrimSpace(line)
		if line == "" || strings.HasPrefix(line, "#") {
			if strings.HasPrefix(line, "#") {
				currentSection = strings.TrimSpace(strings.TrimPrefix(line, "#"))
			}
			continue
		}

		parts := strings.SplitN(line, ":", 2)
		if len(parts) == 2 {
			key := parts[0]
			value := parts[1]
			
			// 如果有section，添加前缀
			if currentSection != "" {
				key = currentSection + "_" + key
			}
			
			info[key] = value
		}
	}
	
	return info
}

func parseInfoValue(infoStr, key string) string {
	lines := strings.Split(infoStr, "\r\n")
	for _, line := range lines {
		if strings.HasPrefix(line, key+":") {
			return strings.TrimPrefix(line, key+":")
		}
	}
	return ""
}