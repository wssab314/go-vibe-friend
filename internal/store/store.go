package store

import (
	"log"

	"go-vibe-friend/internal/config"
	"go-vibe-friend/internal/models"
)

// Store manages all storage services (Database, Redis, etc.)
type Store struct {
	DB       *Database
	Redis    *RedisClient
	
	// Redis-based services
	Session  *RedisSessionStore
	Cache    *RedisCacheService
	Queue    *RedisQueueService
	
	// Database-based stores (existing)
	User       *UserStore
	Profile    *ProfileStore
	Job        *JobStore
	Permission *PermissionStore
	Email      *EmailStore
	File       *FileStore
}

// NewStore creates a new Store with all services initialized
func NewStore(cfg *config.Config) (*Store, error) {
	// Initialize Database
	db, err := NewDatabase(cfg)
	if err != nil {
		return nil, err
	}

	store := &Store{
		DB: db,
	}

	// Initialize Redis (optional, continues without Redis if fails)
	redisClient, err := NewRedisClient(&cfg.Redis)
	if err != nil {
		log.Printf("Redis connection failed: %v. Continuing without Redis caching.", err)
	} else {
		log.Println("Redis connected successfully")
		store.Redis = redisClient
		
		// Initialize Redis-based services
		store.Session = NewRedisSessionStore(redisClient)
		store.Cache = NewRedisCacheService(redisClient)
		store.Queue = NewRedisQueueService(redisClient)
	}

	// Initialize database-based stores
	store.User = NewUserStore(db)
	store.Profile = NewProfileStore(db)
	store.Job = NewJobStore(db)
	store.Permission = NewPermissionStore(db)
	store.Email = NewEmailStore(db)
	store.File = NewFileStore(db)

	return store, nil
}

// Close closes all connections
func (s *Store) Close() error {
	if s.Redis != nil {
		if err := s.Redis.Close(); err != nil {
			log.Printf("Error closing Redis connection: %v", err)
		}
	}
	
	if s.DB != nil {
		return s.DB.Close()
	}
	
	return nil
}

// IsRedisAvailable checks if Redis is available
func (s *Store) IsRedisAvailable() bool {
	return s.Redis != nil && s.Redis.HealthCheck() == nil
}

// GetSessionStore returns appropriate session store (Redis preferred, fallback to DB)
func (s *Store) GetSessionStore() SessionStoreInterface {
	if s.IsRedisAvailable() {
		return s.Session
	}
	// Return database session store as fallback
	return NewDatabaseSessionStore(s.DB)
}

// SessionStoreInterface defines common session operations
type SessionStoreInterface interface {
	// Redis-style session operations (for generic session data)
	Set(sessionID string, data SessionData) error
	Get(sessionID string) (*SessionData, error)
	Delete(sessionID string) error
	Exists(sessionID string) (bool, error)
	Refresh(sessionID string) error
	
	// Database-style session operations (for existing auth service compatibility)
	CreateSession(session *models.Session) error
	GetSessionByToken(refreshToken string) (*models.Session, error)
	RevokeSession(refreshToken string) error
	RevokeAllUserSessions(userID uint) error
}

// DatabaseSessionStore implements SessionStoreInterface using database
type DatabaseSessionStore struct {
	db *Database
}

// NewDatabaseSessionStore creates a database-backed session store
func NewDatabaseSessionStore(db *Database) *DatabaseSessionStore {
	return &DatabaseSessionStore{db: db}
}

// Implement SessionStoreInterface for database fallback
func (d *DatabaseSessionStore) Set(sessionID string, data SessionData) error {
	// Implementation would use database session storage
	// This is a fallback when Redis is not available
	log.Printf("Using database session storage for session: %s", sessionID)
	return nil // Placeholder implementation
}

func (d *DatabaseSessionStore) Get(sessionID string) (*SessionData, error) {
	// Implementation would query database
	log.Printf("Getting session from database: %s", sessionID)
	return nil, nil // Placeholder implementation
}

func (d *DatabaseSessionStore) Delete(sessionID string) error {
	// Implementation would delete from database
	log.Printf("Deleting session from database: %s", sessionID)
	return nil // Placeholder implementation
}

func (d *DatabaseSessionStore) Exists(sessionID string) (bool, error) {
	// Implementation would check database
	log.Printf("Checking session existence in database: %s", sessionID)
	return false, nil // Placeholder implementation
}

func (d *DatabaseSessionStore) Refresh(sessionID string) error {
	// Implementation would update database
	log.Printf("Refreshing session in database: %s", sessionID)
	return nil // Placeholder implementation
}

// Database-style session operations (delegate to existing SessionStore)
func (d *DatabaseSessionStore) CreateSession(session *models.Session) error {
	sessionStore := NewSessionStore(d.db)
	return sessionStore.CreateSession(session)
}

func (d *DatabaseSessionStore) GetSessionByToken(refreshToken string) (*models.Session, error) {
	sessionStore := NewSessionStore(d.db)
	return sessionStore.GetSessionByToken(refreshToken)
}

func (d *DatabaseSessionStore) RevokeSession(refreshToken string) error {
	sessionStore := NewSessionStore(d.db)
	return sessionStore.RevokeSession(refreshToken)
}

func (d *DatabaseSessionStore) RevokeAllUserSessions(userID uint) error {
	sessionStore := NewSessionStore(d.db)
	return sessionStore.RevokeAllUserSessions(userID)
}