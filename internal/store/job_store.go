package store

import (
	"errors"

	"go-vibe-friend/internal/models"

	"gorm.io/gorm"
)

type JobStore struct {
	db *Database
}

func NewJobStore(db *Database) *JobStore {
	return &JobStore{db: db}
}

func (s *JobStore) CreateJob(job *models.Job) error {
	return s.db.DB.Create(job).Error
}

func (s *JobStore) GetJobByID(id uint) (*models.Job, error) {
	var job models.Job
	err := s.db.DB.First(&job, id).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	return &job, err
}

func (s *JobStore) UpdateJob(job *models.Job) error {
	return s.db.DB.Save(job).Error
}

func (s *JobStore) DeleteJob(id uint) error {
	return s.db.DB.Delete(&models.Job{}, id).Error
}

func (s *JobStore) ListJobs(limit, offset int) ([]models.Job, error) {
	var jobs []models.Job
	err := s.db.DB.Order("created_at DESC").Limit(limit).Offset(offset).Find(&jobs).Error
	return jobs, err
}

func (s *JobStore) GetJobsByUserID(userID uint, limit, offset int) ([]models.Job, error) {
	var jobs []models.Job
	err := s.db.DB.Where("user_id = ?", userID).Order("created_at DESC").Limit(limit).Offset(offset).Find(&jobs).Error
	return jobs, err
}

func (s *JobStore) GetJobsByStatus(status string, limit, offset int) ([]models.Job, error) {
	var jobs []models.Job
	err := s.db.DB.Where("status = ?", status).Order("created_at DESC").Limit(limit).Offset(offset).Find(&jobs).Error
	return jobs, err
}

func (s *JobStore) GetTotalJobs() (int64, error) {
	var count int64
	err := s.db.DB.Model(&models.Job{}).Count(&count).Error
	return count, err
}

func (s *JobStore) GetJobCountByStatus(statuses ...string) (int64, error) {
	var count int64
	err := s.db.DB.Model(&models.Job{}).Where("status IN ?", statuses).Count(&count).Error
	return count, err
}

func (s *JobStore) GetRecentJobs(limit int) ([]models.Job, error) {
	var jobs []models.Job
	err := s.db.DB.Order("created_at DESC").Limit(limit).Find(&jobs).Error
	return jobs, err
}

func (s *JobStore) GetJobStatusBreakdown() ([]StatusBreakdown, error) {
	var results []StatusBreakdown
	err := s.db.DB.Model(&models.Job{}).
		Select("status, count(*) as count").
		Group("status").
		Scan(&results).Error
	return results, err
}

type StatusBreakdown struct {
	Status string `json:"status"`
	Count  int64  `json:"count"`
}