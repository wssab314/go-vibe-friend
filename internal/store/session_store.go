package store

import (
	"go-vibe-friend/internal/models"
	"gorm.io/gorm"
)

type SessionStore struct {
	db *gorm.DB
}

func NewSessionStore(database *Database) *SessionStore {
	return &SessionStore{
		db: database.DB,
	}
}

// CreateSession 创建会话
func (s *SessionStore) CreateSession(session *models.Session) error {
	return s.db.Create(session).Error
}

// GetSessionByToken 根据刷新令牌获取会话
func (s *SessionStore) GetSessionByToken(refreshToken string) (*models.Session, error) {
	var session models.Session
	err := s.db.Where("refresh_token = ?", refreshToken).First(&session).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &session, nil
}

// RevokeSession 撤销会话
func (s *SessionStore) RevokeSession(refreshToken string) error {
	return s.db.Model(&models.Session{}).
		Where("refresh_token = ?", refreshToken).
		Update("is_revoked", true).Error
}

// RevokeAllUserSessions 撤销用户的所有会话
func (s *SessionStore) RevokeAllUserSessions(userID uint) error {
	return s.db.Model(&models.Session{}).
		Where("user_id = ?", userID).
		Update("is_revoked", true).Error
}

// CleanExpiredSessions 清理过期的会话
func (s *SessionStore) CleanExpiredSessions() error {
	return s.db.Delete(&models.Session{}, "expires_at < NOW()").Error
}

// GetUserSessions 获取用户的所有会话
func (s *SessionStore) GetUserSessions(userID uint) ([]models.Session, error) {
	var sessions []models.Session
	err := s.db.Where("user_id = ? AND is_revoked = false", userID).Find(&sessions).Error
	return sessions, err
}