package store

import (
	"go-vibe-friend/internal/models"
	"gorm.io/gorm"
)

type ProfileStore struct {
	db *gorm.DB
}

func NewProfileStore(database *Database) *ProfileStore {
	return &ProfileStore{
		db: database.DB,
	}
}

// CreateProfile 创建个人资料
func (s *ProfileStore) CreateProfile(profile *models.Profile) error {
	return s.db.Create(profile).Error
}

// GetProfileByUserID 根据用户ID获取个人资料
func (s *ProfileStore) GetProfileByUserID(userID uint) (*models.Profile, error) {
	var profile models.Profile
	err := s.db.Where("user_id = ?", userID).First(&profile).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &profile, nil
}

// UpdateProfile 更新个人资料
func (s *ProfileStore) UpdateProfile(profile *models.Profile) error {
	return s.db.Save(profile).Error
}

// DeleteProfile 删除个人资料
func (s *ProfileStore) DeleteProfile(userID uint) error {
	return s.db.Where("user_id = ?", userID).Delete(&models.Profile{}).Error
}

// GetProfileByID 根据ID获取个人资料
func (s *ProfileStore) GetProfileByID(id uint) (*models.Profile, error) {
	var profile models.Profile
	err := s.db.Preload("User").First(&profile, id).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			return nil, nil
		}
		return nil, err
	}
	return &profile, nil
}