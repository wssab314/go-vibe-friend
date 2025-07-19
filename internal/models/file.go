package models

import (
	"time"

	"gorm.io/gorm"
)

// File 文件信息模型
type File struct {
	ID          uint           `gorm:"primaryKey" json:"id"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"deleted_at,omitempty"`
	
	// 文件基本信息
	FileName     string `gorm:"size:255;not null" json:"file_name"`
	OriginalName string `gorm:"size:255;not null" json:"original_name"`
	FilePath     string `gorm:"size:500;not null" json:"file_path"`
	FileSize     int64  `gorm:"not null" json:"file_size"`
	MimeType     string `gorm:"size:100;not null" json:"mime_type"`
	FileHash     string `gorm:"size:64;not null;uniqueIndex" json:"file_hash"`
	
	// 上传者信息
	UserID   uint   `gorm:"not null;index" json:"user_id"`
	
	// 文件分类
	Category string `gorm:"size:50;not null;default:'general'" json:"category"` // avatar, document, image, etc.
	
	// 访问控制
	IsPublic bool `gorm:"default:false" json:"is_public"`
	
	// 文件状态
	Status string `gorm:"size:20;not null;default:'active'" json:"status"` // active, deleted, processing
}

// FileUpload 文件上传记录
type FileUpload struct {
	ID          uint           `gorm:"primaryKey" json:"id"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"deleted_at,omitempty"`
	
	FileID    uint   `gorm:"not null" json:"file_id"`
	UserID    uint   `gorm:"not null" json:"user_id"`
	IPAddress string `gorm:"size:45" json:"ip_address"`
	UserAgent string `gorm:"size:500" json:"user_agent"`
	Status    string `gorm:"size:20;not null;default:'completed'" json:"status"`
	
	// 关联
	File File `gorm:"foreignKey:FileID" json:"file,omitempty"`
}