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

func (s *JobStore) CreateJob(job *models.GenerationJob) error {
	return s.db.Create(job).Error
}

func (s *JobStore) GetJobByID(id uint) (*models.GenerationJob, error) {
	var job models.GenerationJob
	err := s.db.Preload("User").First(&job, id).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	return &job, err
}

func (s *JobStore) UpdateJob(job *models.GenerationJob) error {
	return s.db.Save(job).Error
}

func (s *JobStore) DeleteJob(id uint) error {
	return s.db.Delete(&models.GenerationJob{}, id).Error
}

func (s *JobStore) ListJobs(limit, offset int) ([]models.GenerationJob, error) {
	var jobs []models.GenerationJob
	err := s.db.Preload("User").Order("created_at DESC").Limit(limit).Offset(offset).Find(&jobs).Error
	return jobs, err
}

func (s *JobStore) GetJobsByUserID(userID uint, limit, offset int) ([]models.GenerationJob, error) {
	var jobs []models.GenerationJob
	err := s.db.Preload("User").Where("user_id = ?", userID).Order("created_at DESC").Limit(limit).Offset(offset).Find(&jobs).Error
	return jobs, err
}

func (s *JobStore) GetJobsByStatus(status string, limit, offset int) ([]models.GenerationJob, error) {
	var jobs []models.GenerationJob
	err := s.db.Preload("User").Where("status = ?", status).Order("created_at DESC").Limit(limit).Offset(offset).Find(&jobs).Error
	return jobs, err
}

func (s *JobStore) GetTotalJobs() (int64, error) {
	var count int64
	err := s.db.Model(&models.GenerationJob{}).Count(&count).Error
	return count, err
}

func (s *JobStore) GetJobCountByStatus(statuses ...string) (int64, error) {
	var count int64
	err := s.db.Model(&models.GenerationJob{}).Where("status IN ?", statuses).Count(&count).Error
	return count, err
}

func (s *JobStore) GetRecentJobs(limit int) ([]models.GenerationJob, error) {
	var jobs []models.GenerationJob
	err := s.db.Preload("User").Order("created_at DESC").Limit(limit).Find(&jobs).Error
	return jobs, err
}

func (s *JobStore) GetJobStatusBreakdown() ([]StatusBreakdown, error) {
	var results []StatusBreakdown
	err := s.db.Model(&models.GenerationJob{}).
		Select("status, count(*) as count").
		Group("status").
		Scan(&results).Error
	return results, err
}

type StatusBreakdown struct {
	Status string `json:"status"`
	Count  int64  `json:"count"`
}