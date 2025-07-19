package store

import (
	"errors"
	"fmt"

	"go-vibe-friend/internal/models"

	"gorm.io/gorm"
)

type UserStore struct {
	db *Database
}

func NewUserStore(db *Database) *UserStore {
	return &UserStore{db: db}
}

func (s *UserStore) CreateUser(user *models.User) error {
	return s.db.DB.Create(user).Error
}

func (s *UserStore) GetUserByID(id uint) (*models.User, error) {
	var user models.User
	err := s.db.DB.First(&user, id).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	return &user, err
}

func (s *UserStore) GetUserByEmail(email string) (*models.User, error) {
	var user models.User
	err := s.db.DB.Where("email = ?", email).First(&user).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	return &user, err
}

func (s *UserStore) GetUserByUsername(username string) (*models.User, error) {
	var user models.User
	err := s.db.DB.Where("username = ?", username).First(&user).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	return &user, err
}

func (s *UserStore) UpdateUser(user *models.User) error {
	return s.db.DB.Save(user).Error
}

func (s *UserStore) DeleteUser(id uint) error {
	return s.db.DB.Delete(&models.User{}, id).Error
}

func (s *UserStore) ListUsers(limit, offset int) ([]models.User, error) {
	var users []models.User
	err := s.db.DB.Order("created_at DESC").Limit(limit).Offset(offset).Find(&users).Error
	return users, err
}

func (s *UserStore) GetTotalUsers() (int64, error) {
	var count int64
	err := s.db.DB.Model(&models.User{}).Count(&count).Error
	return count, err
}

func (s *UserStore) GetRecentUsers(limit int) ([]models.User, error) {
	var users []models.User
	err := s.db.DB.Order("created_at DESC").Limit(limit).Find(&users).Error
	return users, err
}

func (s *UserStore) GetUserGrowth(days int) ([]TimeSeriesData, error) {
	var results []TimeSeriesData
	
	// PostgreSQL compatible query
	query := `
		SELECT 
			DATE(created_at) as date,
			COUNT(*) as count
		FROM users 
		WHERE created_at >= NOW() - INTERVAL '%d days'
		GROUP BY DATE(created_at)
		ORDER BY date
	`
	
	err := s.db.DB.Raw(fmt.Sprintf(query, days)).Scan(&results).Error
	return results, err
}

// 角色管理相关方法
func (s *UserStore) AssignRole(userID uint, roleName string) error {
	// 首先确保角色存在
	var role models.Role
	err := s.db.DB.Where("name = ?", roleName).First(&role).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		// 创建角色
		role = models.Role{
			Name:        roleName,
			Description: fmt.Sprintf("Default %s role", roleName),
		}
		if err := s.db.DB.Create(&role).Error; err != nil {
			return err
		}
	} else if err != nil {
		return err
	}

	// 检查用户是否已有此角色
	var userRole models.UserRole
	err = s.db.DB.Where("user_id = ? AND role_id = ?", userID, role.ID).First(&userRole).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		// 创建用户角色关联
		userRole = models.UserRole{
			UserID: userID,
			RoleID: role.ID,
		}
		return s.db.DB.Create(&userRole).Error
	}

	return err
}

func (s *UserStore) GetUserRoles(userID uint) ([]string, error) {
	var roleNames []string
	err := s.db.DB.Table("user_roles").
		Select("roles.name").
		Joins("JOIN roles ON user_roles.role_id = roles.id").
		Where("user_roles.user_id = ?", userID).
		Pluck("roles.name", &roleNames).Error
	return roleNames, err
}

func (s *UserStore) RemoveRole(userID uint, roleName string) error {
	return s.db.DB.Where("user_id = ? AND role_id = (SELECT id FROM roles WHERE name = ?)", userID, roleName).
		Delete(&models.UserRole{}).Error
}

// 个人资料相关方法
func (s *UserStore) CreateProfile(userID uint, displayName, bio, location, website, avatar string) error {
	profile := &models.Profile{
		UserID:      userID,
		DisplayName: displayName,
		Bio:         bio,
		Location:    location,
		Website:     website,
		Avatar:      avatar,
	}
	return s.db.DB.Create(profile).Error
}

type TimeSeriesData struct {
	Date  string `json:"date"`
	Count int64  `json:"count"`
}