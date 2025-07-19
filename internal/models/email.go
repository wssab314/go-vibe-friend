package models

import (
	"time"

	"gorm.io/gorm"
)

// EmailTemplate 邮件模板
type EmailTemplate struct {
	ID          uint           `gorm:"primaryKey" json:"id"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"deleted_at,omitempty"`
	
	Name        string `gorm:"size:100;not null;uniqueIndex" json:"name"`
	Subject     string `gorm:"size:255;not null" json:"subject"`
	Body        string `gorm:"type:text;not null" json:"body"`
	Description string `gorm:"type:text" json:"description"`
	IsActive    bool   `gorm:"default:true" json:"is_active"`
}

// EmailVerification 邮箱验证
type EmailVerification struct {
	ID          uint           `gorm:"primaryKey" json:"id"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"deleted_at,omitempty"`
	
	UserID      uint      `gorm:"not null" json:"user_id"`
	Email       string    `gorm:"size:255;not null" json:"email"`
	Token       string    `gorm:"size:255;not null;uniqueIndex" json:"token"`
	ExpiresAt   time.Time `gorm:"not null" json:"expires_at"`
	IsVerified  bool      `gorm:"default:false" json:"is_verified"`
	VerifiedAt  *time.Time `json:"verified_at,omitempty"`
}

// PasswordReset 密码重置
type PasswordReset struct {
	ID          uint           `gorm:"primaryKey" json:"id"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"deleted_at,omitempty"`
	
	UserID      uint      `gorm:"not null" json:"user_id"`
	Email       string    `gorm:"size:255;not null" json:"email"`
	Token       string    `gorm:"size:255;not null;uniqueIndex" json:"token"`
	ExpiresAt   time.Time `gorm:"not null" json:"expires_at"`
	IsUsed      bool      `gorm:"default:false" json:"is_used"`
	UsedAt      *time.Time `json:"used_at,omitempty"`
}

// EmailLog 邮件发送日志
type EmailLog struct {
	ID          uint           `gorm:"primaryKey" json:"id"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"deleted_at,omitempty"`
	
	ToEmail     string    `gorm:"size:255;not null" json:"to_email"`
	Subject     string    `gorm:"size:255;not null" json:"subject"`
	Body        string    `gorm:"type:text" json:"body"`
	Status      string    `gorm:"size:20;not null;default:'pending'" json:"status"` // pending, sent, failed
	ErrorMsg    string    `gorm:"type:text" json:"error_msg,omitempty"`
	SentAt      *time.Time `json:"sent_at,omitempty"`
	
	// 邮件类型和模板
	EmailType   string `gorm:"size:50" json:"email_type"` // verification, password_reset, notification
	TemplateID  *uint  `json:"template_id,omitempty"`
	
	// 关联用户
	UserID      *uint  `json:"user_id,omitempty"`
}