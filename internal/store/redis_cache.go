package store

import (
	"context"
	"encoding/json"
	"fmt"
	"time"
)

// RedisCacheService provides caching functionality
type RedisCacheService struct {
	redis *RedisClient
}

// NewRedisCacheService creates a new Redis cache service
func NewRedisCacheService(redis *RedisClient) *RedisCacheService {
	return &RedisCacheService{
		redis: redis,
	}
}

// Set stores data in cache with TTL
func (c *RedisCacheService) Set(key string, value interface{}, ttl time.Duration) error {
	cacheKey := BuildCacheKey(key)
	
	data, err := json.Marshal(value)
	if err != nil {
		return fmt.Errorf("failed to marshal cache data: %w", err)
	}

	ctx := context.Background()
	return c.redis.client.Set(ctx, cacheKey, data, ttl).Err()
}

// Get retrieves data from cache
func (c *RedisCacheService) Get(key string, dest interface{}) error {
	cacheKey := BuildCacheKey(key)
	
	ctx := context.Background()
	result, err := c.redis.client.Get(ctx, cacheKey).Result()
	if err != nil {
		return err
	}

	return json.Unmarshal([]byte(result), dest)
}

// Delete removes data from cache
func (c *RedisCacheService) Delete(key string) error {
	cacheKey := BuildCacheKey(key)
	
	ctx := context.Background()
	return c.redis.client.Del(ctx, cacheKey).Err()
}

// Exists checks if key exists in cache
func (c *RedisCacheService) Exists(key string) (bool, error) {
	cacheKey := BuildCacheKey(key)
	
	ctx := context.Background()
	count, err := c.redis.client.Exists(ctx, cacheKey).Result()
	if err != nil {
		return false, err
	}
	
	return count > 0, nil
}

// Invalidate deletes keys matching a pattern
func (c *RedisCacheService) Invalidate(pattern string) error {
	fullPattern := BuildCacheKey(pattern)
	
	ctx := context.Background()
	var keys []string
	
	iter := c.redis.client.Scan(ctx, 0, fullPattern, 0).Iterator()
	for iter.Next(ctx) {
		keys = append(keys, iter.Val())
	}
	
	if len(keys) > 0 {
		return c.redis.client.Del(ctx, keys...).Err()
	}
	
	return iter.Err()
}

// SetWithDefaultTTL sets cache with default TTL from config
func (c *RedisCacheService) SetWithDefaultTTL(key string, value interface{}) error {
	return c.Set(key, value, c.redis.config.CacheTTL)
}

// GetOrSet retrieves from cache or sets if not exists
func (c *RedisCacheService) GetOrSet(key string, dest interface{}, fetcher func() (interface{}, error), ttl time.Duration) error {
	// Try to get from cache first
	err := c.Get(key, dest)
	if err == nil {
		return nil // Found in cache
	}

	// Cache miss, fetch from source
	data, err := fetcher()
	if err != nil {
		return fmt.Errorf("failed to fetch data: %w", err)
	}

	// Set in cache
	if err := c.Set(key, data, ttl); err != nil {
		// Log error but don't fail the request
		// In production, you might want to use a proper logger
		fmt.Printf("Failed to set cache for key %s: %v\n", key, err)
	}

	// Copy fetched data to destination
	dataBytes, err := json.Marshal(data)
	if err != nil {
		return fmt.Errorf("failed to marshal fetched data: %w", err)
	}

	return json.Unmarshal(dataBytes, dest)
}

// Increment increments a counter in cache
func (c *RedisCacheService) Increment(key string, expiration time.Duration) (int64, error) {
	cacheKey := BuildCacheKey(key)
	
	ctx := context.Background()
	
	// Increment the counter
	count, err := c.redis.client.Incr(ctx, cacheKey).Result()
	if err != nil {
		return 0, err
	}

	// Set expiration if this is the first increment
	if count == 1 {
		c.redis.client.Expire(ctx, cacheKey, expiration)
	}

	return count, nil
}

// DecrementBy decrements a counter by specified amount
func (c *RedisCacheService) DecrementBy(key string, amount int64) (int64, error) {
	cacheKey := BuildCacheKey(key)
	
	ctx := context.Background()
	return c.redis.client.DecrBy(ctx, cacheKey, amount).Result()
}

// GetTTL returns the remaining TTL for a key
func (c *RedisCacheService) GetTTL(key string) (time.Duration, error) {
	cacheKey := BuildCacheKey(key)
	
	ctx := context.Background()
	return c.redis.client.TTL(ctx, cacheKey).Result()
}

// Batch operations
type BatchOperation struct {
	Key   string
	Value interface{}
	TTL   time.Duration
}

// SetBatch sets multiple keys in a single pipeline
func (c *RedisCacheService) SetBatch(operations []BatchOperation) error {
	ctx := context.Background()
	pipe := c.redis.client.Pipeline()

	for _, op := range operations {
		cacheKey := BuildCacheKey(op.Key)
		data, err := json.Marshal(op.Value)
		if err != nil {
			return fmt.Errorf("failed to marshal data for key %s: %w", op.Key, err)
		}
		pipe.Set(ctx, cacheKey, data, op.TTL)
	}

	_, err := pipe.Exec(ctx)
	return err
}

// DeleteBatch deletes multiple keys
func (c *RedisCacheService) DeleteBatch(keys []string) error {
	if len(keys) == 0 {
		return nil
	}

	cacheKeys := make([]string, len(keys))
	for i, key := range keys {
		cacheKeys[i] = BuildCacheKey(key)
	}

	ctx := context.Background()
	return c.redis.client.Del(ctx, cacheKeys...).Err()
}