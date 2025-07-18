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
	return s.db.Create(user).Error
}

func (s *UserStore) GetUserByID(id uint) (*models.User, error) {
	var user models.User
	err := s.db.First(&user, id).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	return &user, err
}

func (s *UserStore) GetUserByEmail(email string) (*models.User, error) {
	var user models.User
	err := s.db.Where("email = ?", email).First(&user).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	return &user, err
}

func (s *UserStore) GetUserByUsername(username string) (*models.User, error) {
	var user models.User
	err := s.db.Where("username = ?", username).First(&user).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	return &user, err
}

func (s *UserStore) UpdateUser(user *models.User) error {
	return s.db.Save(user).Error
}

func (s *UserStore) DeleteUser(id uint) error {
	return s.db.Delete(&models.User{}, id).Error
}

func (s *UserStore) ListUsers(limit, offset int) ([]models.User, error) {
	var users []models.User
	err := s.db.Order("created_at DESC").Limit(limit).Offset(offset).Find(&users).Error
	return users, err
}

func (s *UserStore) GetTotalUsers() (int64, error) {
	var count int64
	err := s.db.Model(&models.User{}).Count(&count).Error
	return count, err
}

func (s *UserStore) GetRecentUsers(limit int) ([]models.User, error) {
	var users []models.User
	err := s.db.Order("created_at DESC").Limit(limit).Find(&users).Error
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
	
	err := s.db.Raw(fmt.Sprintf(query, days)).Scan(&results).Error
	return results, err
}

type TimeSeriesData struct {
	Date  string `json:"date"`
	Count int64  `json:"count"`
}