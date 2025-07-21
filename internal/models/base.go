package models

import (
	"time"

	"gorm.io/gorm"
)

type BaseModel struct {
	ID        uint           `json:"id" gorm:"primaryKey"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `json:"deleted_at,omitempty" gorm:"index"`
}

// User 用户基础表
type User struct {
	BaseModel
	Username string `json:"username" gorm:"uniqueIndex;not null"`
	Email    string `json:"email" gorm:"uniqueIndex;not null"`
	Password string `json:"-" gorm:"not null"`
	Status   string `json:"status" gorm:"default:active"` // active, inactive, banned
	
	// 关联（避免递归引用，在查询时使用Preload）
	UserRoles []UserRole  `json:"user_roles,omitempty" gorm:"foreignKey:UserID"`
	Sessions  []Session   `json:"sessions,omitempty" gorm:"foreignKey:UserID"`
}

// Profile 用户公开信息表
type Profile struct {
	BaseModel
	UserID      uint   `json:"user_id" gorm:"not null;uniqueIndex"`
	DisplayName string `json:"display_name" gorm:"size:100"`
	Avatar      string `json:"avatar" gorm:"size:255"`
	Bio         string `json:"bio" gorm:"type:text"`
	Location    string `json:"location" gorm:"size:100"`
	Website     string `json:"website" gorm:"size:255"`
}

// Role 角色表
type Role struct {
	BaseModel
	Name        string `json:"name" gorm:"uniqueIndex;not null"`
	Description string `json:"description" gorm:"type:text"`
	
	// 关联
	UserRoles []UserRole `json:"user_roles,omitempty" gorm:"foreignKey:RoleID"`
}

// UserRole 用户角色关联表
type UserRole struct {
	BaseModel
	UserID uint `json:"user_id" gorm:"not null"`
	RoleID uint `json:"role_id" gorm:"not null"`
}

// Session 会话表（用于refresh token）
type Session struct {
	BaseModel
	UserID       uint      `json:"user_id" gorm:"not null"`
	RefreshToken string    `json:"refresh_token" gorm:"uniqueIndex;not null"`
	ExpiresAt    time.Time `json:"expires_at" gorm:"not null"`
	IsRevoked    bool      `json:"is_revoked" gorm:"default:false"`
	UserAgent    string    `json:"user_agent" gorm:"size:255"`
	IPAddress    string    `json:"ip_address" gorm:"size:45"`
}


// AuditLog 审计日志表
type AuditLog struct {
	BaseModel
	ActorID    uint   `json:"actor_id" gorm:"not null"`
	Resource   string `json:"resource" gorm:"not null"`
	Action     string `json:"action" gorm:"not null"`
	Details    string `json:"details" gorm:"type:text"`
	IPAddress  string `json:"ip_address" gorm:"size:45"`
	UserAgent  string `json:"user_agent" gorm:"size:255"`
}

// Setting 系统设置表
type Setting struct {
	BaseModel
	Key         string `json:"key" gorm:"uniqueIndex;not null"`
	Value       string `json:"value" gorm:"type:text"`
	Description string `json:"description" gorm:"type:text"`
}

// Job 任务表
type Job struct {
	BaseModel
	UserID      uint   `json:"user_id" gorm:"not null"`
	Title       string `json:"title" gorm:"not null"`
	Description string `json:"description" gorm:"type:text"`
	Status      string `json:"status" gorm:"default:pending"` // pending, running, completed, failed
	JobType     string `json:"job_type" gorm:"not null"`
	Progress    int    `json:"progress" gorm:"default:0"`
	Result      string `json:"result" gorm:"type:text"`
	ErrorMsg    string `json:"error_msg" gorm:"type:text"`
}