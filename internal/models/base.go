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

type User struct {
	BaseModel
	Username string `json:"username" gorm:"uniqueIndex;not null"`
	Email    string `json:"email" gorm:"uniqueIndex;not null"`
	Password string `json:"-" gorm:"not null"`
	Role     string `json:"role" gorm:"default:user"`
}

type GenerationJob struct {
	BaseModel
	UserID      uint   `json:"user_id" gorm:"not null"`
	Status      string `json:"status" gorm:"default:pending"`
	InputData   string `json:"input_data" gorm:"type:text"`
	OutputData  string `json:"output_data" gorm:"type:text"`
	ErrorMsg    string `json:"error_msg,omitempty" gorm:"type:text"`
	JobType     string `json:"job_type" gorm:"not null"`
	User        User   `json:"user,omitempty" gorm:"foreignKey:UserID"`
}