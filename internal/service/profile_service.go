package service

import (
	"fmt"

	"go-vibe-friend/internal/models"
	"go-vibe-friend/internal/store"
)

type ProfileService struct {
	userStore    *store.UserStore
	profileStore *store.ProfileStore
}

func NewProfileService(userStore *store.UserStore, profileStore *store.ProfileStore) *ProfileService {
	return &ProfileService{
		userStore:    userStore,
		profileStore: profileStore,
	}
}

// GetUserProfile 获取用户和个人资料信息
func (s *ProfileService) GetUserProfile(userID uint) (*models.User, *models.Profile, error) {
	// 获取用户信息
	user, err := s.userStore.GetUserByID(userID)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to get user: %w", err)
	}
	if user == nil {
		return nil, nil, fmt.Errorf("user not found")
	}

	// 获取个人资料
	profile, err := s.profileStore.GetProfileByUserID(userID)
	if err != nil {
		return nil, nil, fmt.Errorf("failed to get profile: %w", err)
	}

	// 如果没有个人资料，创建一个默认的
	if profile == nil {
		profile = &models.Profile{
			UserID:      userID,
			DisplayName: user.Username,
		}
		if err := s.profileStore.CreateProfile(profile); err != nil {
			return nil, nil, fmt.Errorf("failed to create profile: %w", err)
		}
	}

	// 移除敏感信息
	user.Password = ""

	return user, profile, nil
}

// UpdateProfile 更新个人资料
func (s *ProfileService) UpdateProfile(userID uint, displayName, bio, location, website string) (*models.Profile, error) {
	// 获取现有个人资料
	profile, err := s.profileStore.GetProfileByUserID(userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get profile: %w", err)
	}

	// 如果没有个人资料，创建一个
	if profile == nil {
		profile = &models.Profile{
			UserID: userID,
		}
	}

	// 更新字段
	if displayName != "" {
		profile.DisplayName = displayName
	}
	profile.Bio = bio
	profile.Location = location
	profile.Website = website

	// 保存更新
	if profile.ID == 0 {
		// 创建新的个人资料
		if err := s.profileStore.CreateProfile(profile); err != nil {
			return nil, fmt.Errorf("failed to create profile: %w", err)
		}
	} else {
		// 更新现有个人资料
		if err := s.profileStore.UpdateProfile(profile); err != nil {
			return nil, fmt.Errorf("failed to update profile: %w", err)
		}
	}

	return profile, nil
}

// UpdateAvatar 更新头像
func (s *ProfileService) UpdateAvatar(userID uint, avatarURL string) (*models.Profile, error) {
	// 获取现有个人资料
	profile, err := s.profileStore.GetProfileByUserID(userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get profile: %w", err)
	}

	// 如果没有个人资料，创建一个
	if profile == nil {
		user, err := s.userStore.GetUserByID(userID)
		if err != nil {
			return nil, fmt.Errorf("failed to get user: %w", err)
		}
		if user == nil {
			return nil, fmt.Errorf("user not found")
		}

		profile = &models.Profile{
			UserID:      userID,
			DisplayName: user.Username,
			Avatar:      avatarURL,
		}

		if err := s.profileStore.CreateProfile(profile); err != nil {
			return nil, fmt.Errorf("failed to create profile: %w", err)
		}
	} else {
		// 更新头像
		profile.Avatar = avatarURL
		if err := s.profileStore.UpdateProfile(profile); err != nil {
			return nil, fmt.Errorf("failed to update profile: %w", err)
		}
	}

	return profile, nil
}