package store

import (
	"context"
	"fmt"
	"time"

	"github.com/redis/go-redis/v9"
	"go-vibe-friend/internal/config"
)

// RedisClient wraps Redis client with configuration
type RedisClient struct {
	client *redis.Client
	config *config.RedisConfig
}

// NewRedisClient creates a new Redis client with health check
func NewRedisClient(cfg *config.RedisConfig) (*RedisClient, error) {
	rdb := redis.NewClient(&redis.Options{
		Addr:         fmt.Sprintf("%s:%d", cfg.Host, cfg.Port),
		Password:     cfg.Password,
		DB:           cfg.DB,
		PoolSize:     cfg.PoolSize,
		MinIdleConns: cfg.PoolSize / 2,
		MaxRetries:   3,
		DialTimeout:  5 * time.Second,
		ReadTimeout:  3 * time.Second,
		WriteTimeout: 3 * time.Second,
	})

	// Health check
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

// GetClient returns the underlying Redis client
func (r *RedisClient) GetClient() *redis.Client {
	return r.client
}

// Client returns the underlying Redis client (alias for GetClient)
func (r *RedisClient) Client() *redis.Client {
	return r.client
}

// Close closes the Redis connection
func (r *RedisClient) Close() error {
	return r.client.Close()
}

// HealthCheck checks if Redis is available
func (r *RedisClient) HealthCheck() error {
	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()

	return r.client.Ping(ctx).Err()
}

// GetConfig returns the Redis configuration
func (r *RedisClient) GetConfig() *config.RedisConfig {
	return r.config
}

// Key prefixes for different data types
const (
	SessionKeyPrefix = "gvf:session:"
	CacheKeyPrefix   = "gvf:cache:"
	QueueKeyPrefix   = "gvf:queue:"
	NotifyKeyPrefix  = "gvf:notify:"
)

// BuildSessionKey builds a session key with prefix
func BuildSessionKey(sessionID string) string {
	return SessionKeyPrefix + sessionID
}

// BuildCacheKey builds a cache key with prefix
func BuildCacheKey(key string) string {
	return CacheKeyPrefix + key
}

// BuildQueueKey builds a queue key with prefix
func BuildQueueKey(queueName string) string {
	return QueueKeyPrefix + queueName
}

// BuildNotifyKey builds a notification key with prefix
func BuildNotifyKey(channel string) string {
	return NotifyKeyPrefix + channel
}