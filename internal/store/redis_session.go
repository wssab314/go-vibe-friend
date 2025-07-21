package store

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"go-vibe-friend/internal/models"
)

// RedisSessionStore implements session storage using Redis
type RedisSessionStore struct {
	redis *RedisClient
}

// NewRedisSessionStore creates a new Redis session store
func NewRedisSessionStore(redis *RedisClient) *RedisSessionStore {
	return &RedisSessionStore{
		redis: redis,
	}
}

// SessionData represents session data stored in Redis
type SessionData struct {
	UserID     uint      `json:"user_id"`
	Email      string    `json:"email"`
	Role       string    `json:"role"`
	LoginTime  time.Time `json:"login_time"`
	LastAccess time.Time `json:"last_access"`
	IPAddress  string    `json:"ip_address"`
	UserAgent  string    `json:"user_agent"`
	ExpiresAt  time.Time `json:"expires_at"`
}

// Set stores session data in Redis
func (r *RedisSessionStore) Set(sessionID string, data SessionData) error {
	key := BuildSessionKey(sessionID)
	
	// Update last access time
	data.LastAccess = time.Now()
	
	jsonData, err := json.Marshal(data)
	if err != nil {
		return fmt.Errorf("failed to marshal session data: %w", err)
	}

	ctx := context.Background()
	return r.redis.client.Set(ctx, key, jsonData, r.redis.config.SessionTTL).Err()
}

// Get retrieves session data from Redis
func (r *RedisSessionStore) Get(sessionID string) (*SessionData, error) {
	key := BuildSessionKey(sessionID)
	
	ctx := context.Background()
	result, err := r.redis.client.Get(ctx, key).Result()
	if err != nil {
		return nil, err
	}

	var data SessionData
	if err := json.Unmarshal([]byte(result), &data); err != nil {
		return nil, fmt.Errorf("failed to unmarshal session data: %w", err)
	}

	return &data, nil
}

// Delete removes session from Redis
func (r *RedisSessionStore) Delete(sessionID string) error {
	key := BuildSessionKey(sessionID)
	
	ctx := context.Background()
	return r.redis.client.Del(ctx, key).Err()
}

// Exists checks if session exists in Redis
func (r *RedisSessionStore) Exists(sessionID string) (bool, error) {
	key := BuildSessionKey(sessionID)
	
	ctx := context.Background()
	count, err := r.redis.client.Exists(ctx, key).Result()
	if err != nil {
		return false, err
	}
	
	return count > 0, nil
}

// Refresh extends session TTL
func (r *RedisSessionStore) Refresh(sessionID string) error {
	key := BuildSessionKey(sessionID)
	
	ctx := context.Background()
	return r.redis.client.Expire(ctx, key, r.redis.config.SessionTTL).Err()
}

// GetUserSessions gets all sessions for a user
func (r *RedisSessionStore) GetUserSessions(userID uint) ([]string, error) {
	pattern := SessionKeyPrefix + "*"
	
	ctx := context.Background()
	var sessions []string
	
	iter := r.redis.client.Scan(ctx, 0, pattern, 0).Iterator()
	for iter.Next(ctx) {
		key := iter.Val()
		
		// Get session data to check user ID
		result, err := r.redis.client.Get(ctx, key).Result()
		if err != nil {
			continue
		}
		
		var data SessionData
		if err := json.Unmarshal([]byte(result), &data); err != nil {
			continue
		}
		
		if data.UserID == userID {
			// Extract session ID from key
			sessionID := key[len(SessionKeyPrefix):]
			sessions = append(sessions, sessionID)
		}
	}
	
	return sessions, iter.Err()
}

// DeleteUserSessions deletes all sessions for a user
func (r *RedisSessionStore) DeleteUserSessions(userID uint) error {
	sessions, err := r.GetUserSessions(userID)
	if err != nil {
		return err
	}
	
	ctx := context.Background()
	for _, sessionID := range sessions {
		key := BuildSessionKey(sessionID)
		r.redis.client.Del(ctx, key)
	}
	
	return nil
}

// CreateUserSession creates a new session in Redis using user details
func (r *RedisSessionStore) CreateUserSession(user *models.User, sessionID, ipAddress, userAgent string) error {
	data := SessionData{
		UserID:     user.ID,
		Email:      user.Email,
		Role:       "user", // Default role, can be enhanced
		LoginTime:  time.Now(),
		LastAccess: time.Now(),
		IPAddress:  ipAddress,
		UserAgent:  userAgent,
	}
	
	return r.Set(sessionID, data)
}

// UpdateLastAccess updates the last access time for a session
func (r *RedisSessionStore) UpdateLastAccess(sessionID string) error {
	data, err := r.Get(sessionID)
	if err != nil {
		return err
	}
	
	data.LastAccess = time.Now()
	return r.Set(sessionID, *data)
}

// Database-style session operations (for compatibility with AuthService)
func (r *RedisSessionStore) CreateSession(session *models.Session) error {
	// Convert models.Session to SessionData and store in Redis
	sessionData := SessionData{
		UserID:     session.UserID,
		IPAddress:  session.IPAddress,
		UserAgent:  session.UserAgent,
		LoginTime:  time.Now(),
		LastAccess: time.Now(),
		ExpiresAt:  session.ExpiresAt,
	}
	
	// Use refresh token as session ID for compatibility
	return r.Set(session.RefreshToken, sessionData)
}

func (r *RedisSessionStore) GetSessionByToken(refreshToken string) (*models.Session, error) {
	sessionData, err := r.Get(refreshToken)
	if err != nil {
		return nil, err
	}
	if sessionData == nil {
		return nil, nil
	}
	
	// Convert SessionData back to models.Session
	session := &models.Session{
		UserID:       sessionData.UserID,
		RefreshToken: refreshToken,
		IPAddress:    sessionData.IPAddress,
		UserAgent:    sessionData.UserAgent,
		ExpiresAt:    sessionData.ExpiresAt,
		IsRevoked:    false, // Sessions in Redis are not revoked, they're deleted
	}
	
	return session, nil
}

func (r *RedisSessionStore) RevokeSession(refreshToken string) error {
	// In Redis, revoking means deleting the session
	return r.Delete(refreshToken)
}

func (r *RedisSessionStore) RevokeAllUserSessions(userID uint) error {
	// Use the existing DeleteUserSessions method
	return r.DeleteUserSessions(userID)
}