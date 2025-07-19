package models

import (
	"time"

	"gorm.io/gorm"
)

// Permission 权限表
type Permission struct {
	ID          uint           `gorm:"primaryKey" json:"id"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"deleted_at,omitempty"`
	
	Name        string `gorm:"size:100;not null;uniqueIndex" json:"name"`
	Description string `gorm:"type:text" json:"description"`
	Resource    string `gorm:"size:100;not null" json:"resource"`    // 资源类型，如 user, file, job
	Action      string `gorm:"size:50;not null" json:"action"`       // 操作类型，如 create, read, update, delete
	
	// 关联
	RolePermissions []RolePermission `json:"role_permissions,omitempty" gorm:"foreignKey:PermissionID"`
}

// RolePermission 角色权限关联表
type RolePermission struct {
	ID          uint           `gorm:"primaryKey" json:"id"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"deleted_at,omitempty"`
	
	RoleID       uint `gorm:"not null" json:"role_id"`
	PermissionID uint `gorm:"not null" json:"permission_id"`
	
	// 关联
	Role       Role       `json:"role,omitempty" gorm:"foreignKey:RoleID"`
	Permission Permission `json:"permission,omitempty" gorm:"foreignKey:PermissionID"`
}

// UserPermission 用户直接权限表（用于特殊权限赋予）
type UserPermission struct {
	ID          uint           `gorm:"primaryKey" json:"id"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"deleted_at,omitempty"`
	
	UserID       uint `gorm:"not null" json:"user_id"`
	PermissionID uint `gorm:"not null" json:"permission_id"`
	
	// 是否为拒绝权限（用于撤销角色的某个权限）
	IsDenied bool `gorm:"default:false" json:"is_denied"`
	
	// 关联
	User       User       `json:"user,omitempty" gorm:"foreignKey:UserID"`
	Permission Permission `json:"permission,omitempty" gorm:"foreignKey:PermissionID"`
}

// ResourcePolicy 资源策略表（用于基于资源的访问控制）
type ResourcePolicy struct {
	ID          uint           `gorm:"primaryKey" json:"id"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"deleted_at,omitempty"`
	
	ResourceType string `gorm:"size:50;not null" json:"resource_type"` // file, job, profile
	ResourceID   uint   `gorm:"not null" json:"resource_id"`
	OwnerID      uint   `gorm:"not null" json:"owner_id"`
	
	// 访问级别
	IsPublic    bool `gorm:"default:false" json:"is_public"`
	IsShared    bool `gorm:"default:false" json:"is_shared"`
	SharePolicy string `gorm:"type:text" json:"share_policy"` // JSON格式的共享策略
	
	// 关联
	Owner User `json:"owner,omitempty" gorm:"foreignKey:OwnerID"`
}

// APIRateLimit API限流表
type APIRateLimit struct {
	ID          uint           `gorm:"primaryKey" json:"id"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`
	DeletedAt   gorm.DeletedAt `gorm:"index" json:"deleted_at,omitempty"`
	
	RoleID      uint   `gorm:"not null" json:"role_id"`
	Endpoint    string `gorm:"size:255;not null" json:"endpoint"`
	Method      string `gorm:"size:10;not null" json:"method"`
	RateLimit   int    `gorm:"not null" json:"rate_limit"` // 每分钟请求数
	WindowSize  int    `gorm:"not null;default:60" json:"window_size"` // 时间窗口（秒）
	
	// 关联
	Role Role `json:"role,omitempty" gorm:"foreignKey:RoleID"`
}