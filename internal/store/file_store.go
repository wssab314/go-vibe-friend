package store

import (
	"errors"
	"time"

	"go-vibe-friend/internal/models"

	"gorm.io/gorm"
)

type FileStore struct {
	db *Database
}

func NewFileStore(db *Database) *FileStore {
	return &FileStore{db: db}
}

// CreateFile 创建文件记录
func (s *FileStore) CreateFile(file *models.File) error {
	return s.db.DB.Create(file).Error
}

// GetFileByID 根据ID获取文件
func (s *FileStore) GetFileByID(id uint) (*models.File, error) {
	var file models.File
	err := s.db.DB.First(&file, id).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	return &file, err
}

// GetFileByHash 根据哈希值获取文件
func (s *FileStore) GetFileByHash(hash string) (*models.File, error) {
	var file models.File
	err := s.db.DB.Where("file_hash = ?", hash).First(&file).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	return &file, err
}

// GetFilesByUserID 获取用户的文件列表
func (s *FileStore) GetFilesByUserID(userID uint, category string, limit, offset int) ([]models.File, error) {
	var files []models.File
	query := s.db.DB.Where("user_id = ? AND status = ?", userID, "active")
	
	if category != "" {
		query = query.Where("category = ?", category)
	}
	
	err := query.Order("created_at DESC").Limit(limit).Offset(offset).Find(&files).Error
	return files, err
}

// GetFilesByCategory 根据分类获取文件
func (s *FileStore) GetFilesByCategory(category string, limit, offset int) ([]models.File, error) {
	var files []models.File
	err := s.db.DB.Where("category = ? AND status = ?", category, "active").
		Order("created_at DESC").Limit(limit).Offset(offset).Find(&files).Error
	return files, err
}

// UpdateFile 更新文件信息
func (s *FileStore) UpdateFile(file *models.File) error {
	return s.db.DB.Save(file).Error
}

// DeleteFile 软删除文件
func (s *FileStore) DeleteFile(id uint) error {
	return s.db.DB.Delete(&models.File{}, id).Error
}

// GetFileStats 获取文件统计信息
func (s *FileStore) GetFileStats(userID uint) (map[string]interface{}, error) {
	stats := make(map[string]interface{})
	
	// 总文件数
	var totalFiles int64
	err := s.db.DB.Model(&models.File{}).Where("user_id = ? AND status = ?", userID, "active").Count(&totalFiles).Error
	if err != nil {
		return nil, err
	}
	stats["total_files"] = totalFiles
	
	// 总存储大小
	var totalSize int64
	err = s.db.DB.Model(&models.File{}).Where("user_id = ? AND status = ?", userID, "active").
		Select("COALESCE(SUM(file_size), 0)").Scan(&totalSize).Error
	if err != nil {
		return nil, err
	}
	stats["total_size"] = totalSize
	
	// 按分类统计
	var categoryStats []struct {
		Category string `json:"category"`
		Count    int64  `json:"count"`
		Size     int64  `json:"size"`
	}
	err = s.db.DB.Model(&models.File{}).
		Where("user_id = ? AND status = ?", userID, "active").
		Select("category, COUNT(*) as count, COALESCE(SUM(file_size), 0) as size").
		Group("category").
		Scan(&categoryStats).Error
	if err != nil {
		return nil, err
	}
	stats["by_category"] = categoryStats
	
	return stats, nil
}

// CreateFileUpload 创建文件上传记录
func (s *FileStore) CreateFileUpload(upload *models.FileUpload) error {
	return s.db.DB.Create(upload).Error
}

// GetRecentUploads 获取最近的上传记录
func (s *FileStore) GetRecentUploads(userID uint, limit int) ([]models.FileUpload, error) {
	var uploads []models.FileUpload
	err := s.db.DB.Where("user_id = ?", userID).
		Preload("File").
		Order("created_at DESC").
		Limit(limit).
		Find(&uploads).Error
	return uploads, err
}

// CleanupExpiredFiles 清理过期文件（可用于定时任务）
func (s *FileStore) CleanupExpiredFiles(days int) error {
	expiredTime := time.Now().AddDate(0, 0, -days)
	return s.db.DB.Where("status = ? AND updated_at < ?", "deleted", expiredTime).
		Delete(&models.File{}).Error
}