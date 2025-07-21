package store

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/redis/go-redis/v9"
)

// RedisQueueService provides task queue functionality
type RedisQueueService struct {
	redis *RedisClient
}

// NewRedisQueueService creates a new Redis queue service
func NewRedisQueueService(redis *RedisClient) *RedisQueueService {
	return &RedisQueueService{
		redis: redis,
	}
}

// QueuedJob represents a job in the queue
type QueuedJob struct {
	ID         string                 `json:"id"`
	UserID     uint                   `json:"user_id"`
	Type       string                 `json:"type"`
	Priority   int                    `json:"priority"`    // 1-10, higher is more priority
	Payload    map[string]interface{} `json:"payload"`
	CreatedAt  time.Time              `json:"created_at"`
	RetryCount int                    `json:"retry_count"`
	MaxRetries int                    `json:"max_retries"`
}

// Enqueue adds a job to the queue
func (q *RedisQueueService) Enqueue(queueName string, job QueuedJob) error {
	queueKey := BuildQueueKey(queueName)
	
	// Set creation time if not set
	if job.CreatedAt.IsZero() {
		job.CreatedAt = time.Now()
	}
	
	// Set default max retries if not set
	if job.MaxRetries == 0 {
		job.MaxRetries = 3
	}

	jobData, err := json.Marshal(job)
	if err != nil {
		return fmt.Errorf("failed to marshal job: %w", err)
	}

	ctx := context.Background()
	
	// Use priority queue (sorted set) for jobs with different priorities
	score := float64(job.Priority)*1000000 - float64(job.CreatedAt.Unix()) // Higher priority and older jobs first
	return q.redis.client.ZAdd(ctx, queueKey, redis.Z{
		Score:  score,
		Member: string(jobData),
	}).Err()
}

// Dequeue removes and returns the highest priority job from the queue
func (q *RedisQueueService) Dequeue(queueName string, timeout time.Duration) (*QueuedJob, error) {
	queueKey := BuildQueueKey(queueName)
	
	ctx, cancel := context.WithTimeout(context.Background(), timeout)
	defer cancel()

	// Get the highest priority job (lowest score due to our scoring system)
	result, err := q.redis.client.ZPopMin(ctx, queueKey).Result()
	if err != nil {
		return nil, err
	}

	if len(result) == 0 {
		return nil, fmt.Errorf("no jobs available")
	}

	var job QueuedJob
	if err := json.Unmarshal([]byte(result[0].Member.(string)), &job); err != nil {
		return nil, fmt.Errorf("failed to unmarshal job: %w", err)
	}

	return &job, nil
}

// DequeueBlocking blocks until a job is available
func (q *RedisQueueService) DequeueBlocking(queueName string, timeout time.Duration) (*QueuedJob, error) {
	queueKey := BuildQueueKey(queueName)
	
	ctx, cancel := context.WithTimeout(context.Background(), timeout)
	defer cancel()

	// Use BZPOPMIN for blocking operation
	result, err := q.redis.client.BZPopMin(ctx, timeout, queueKey).Result()
	if err != nil {
		return nil, err
	}

	var job QueuedJob
	if err := json.Unmarshal([]byte(result.Member.(string)), &job); err != nil {
		return nil, fmt.Errorf("failed to unmarshal job: %w", err)
	}

	return &job, nil
}

// Peek returns the next job without removing it
func (q *RedisQueueService) Peek(queueName string) (*QueuedJob, error) {
	queueKey := BuildQueueKey(queueName)
	
	ctx := context.Background()
	result, err := q.redis.client.ZRangeWithScores(ctx, queueKey, 0, 0).Result()
	if err != nil {
		return nil, err
	}

	if len(result) == 0 {
		return nil, fmt.Errorf("no jobs available")
	}

	var job QueuedJob
	if err := json.Unmarshal([]byte(result[0].Member.(string)), &job); err != nil {
		return nil, fmt.Errorf("failed to unmarshal job: %w", err)
	}

	return &job, nil
}

// GetQueueLength returns the number of jobs in the queue
func (q *RedisQueueService) GetQueueLength(queueName string) (int64, error) {
	queueKey := BuildQueueKey(queueName)
	
	ctx := context.Background()
	return q.redis.client.ZCard(ctx, queueKey).Result()
}

// GetJobs returns jobs in the queue (for monitoring/admin purposes)
func (q *RedisQueueService) GetJobs(queueName string, start, stop int64) ([]QueuedJob, error) {
	queueKey := BuildQueueKey(queueName)
	
	ctx := context.Background()
	result, err := q.redis.client.ZRangeWithScores(ctx, queueKey, start, stop).Result()
	if err != nil {
		return nil, err
	}

	jobs := make([]QueuedJob, len(result))
	for i, z := range result {
		var job QueuedJob
		if err := json.Unmarshal([]byte(z.Member.(string)), &job); err != nil {
			return nil, fmt.Errorf("failed to unmarshal job at index %d: %w", i, err)
		}
		jobs[i] = job
	}

	return jobs, nil
}

// RemoveJob removes a specific job from the queue
func (q *RedisQueueService) RemoveJob(queueName string, job QueuedJob) error {
	queueKey := BuildQueueKey(queueName)
	
	jobData, err := json.Marshal(job)
	if err != nil {
		return fmt.Errorf("failed to marshal job: %w", err)
	}

	ctx := context.Background()
	return q.redis.client.ZRem(ctx, queueKey, string(jobData)).Err()
}

// RequeueJob adds a failed job back to the queue with incremented retry count
func (q *RedisQueueService) RequeueJob(queueName string, job QueuedJob) error {
	job.RetryCount++
	
	// If max retries exceeded, don't requeue
	if job.RetryCount > job.MaxRetries {
		return fmt.Errorf("job %s exceeded max retries (%d)", job.ID, job.MaxRetries)
	}

	// Add delay for retries (exponential backoff)
	delay := time.Duration(job.RetryCount*job.RetryCount) * time.Second
	job.CreatedAt = time.Now().Add(delay)

	return q.Enqueue(queueName, job)
}

// ClearQueue removes all jobs from the queue
func (q *RedisQueueService) ClearQueue(queueName string) error {
	queueKey := BuildQueueKey(queueName)
	
	ctx := context.Background()
	return q.redis.client.Del(ctx, queueKey).Err()
}

// GetJobsByUser returns jobs for a specific user
func (q *RedisQueueService) GetJobsByUser(queueName string, userID uint) ([]QueuedJob, error) {
	queueKey := BuildQueueKey(queueName)
	
	ctx := context.Background()
	result, err := q.redis.client.ZRangeWithScores(ctx, queueKey, 0, -1).Result()
	if err != nil {
		return nil, err
	}

	var userJobs []QueuedJob
	for _, z := range result {
		var job QueuedJob
		if err := json.Unmarshal([]byte(z.Member.(string)), &job); err != nil {
			continue // Skip malformed jobs
		}
		
		if job.UserID == userID {
			userJobs = append(userJobs, job)
		}
	}

	return userJobs, nil
}