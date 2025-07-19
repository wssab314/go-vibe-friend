package store

import (
	"errors"

	"go-vibe-friend/internal/models"

	"gorm.io/gorm"
)

type EmailStore struct {
	db *Database
}

func NewEmailStore(db *Database) *EmailStore {
	return &EmailStore{db: db}
}

// CreateEmailVerification 创建邮箱验证记录
func (s *EmailStore) CreateEmailVerification(verification *models.EmailVerification) error {
	return s.db.DB.Create(verification).Error
}

// GetEmailVerificationByToken 根据令牌获取邮箱验证记录
func (s *EmailStore) GetEmailVerificationByToken(token string) (*models.EmailVerification, error) {
	var verification models.EmailVerification
	err := s.db.DB.Where("token = ?", token).First(&verification).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	return &verification, err
}

// GetEmailVerificationsByUserID 获取用户的邮箱验证记录
func (s *EmailStore) GetEmailVerificationsByUserID(userID uint) ([]models.EmailVerification, error) {
	var verifications []models.EmailVerification
	err := s.db.DB.Where("user_id = ?", userID).Find(&verifications).Error
	return verifications, err
}

// UpdateEmailVerification 更新邮箱验证记录
func (s *EmailStore) UpdateEmailVerification(verification *models.EmailVerification) error {
	return s.db.DB.Save(verification).Error
}

// CreatePasswordReset 创建密码重置记录
func (s *EmailStore) CreatePasswordReset(reset *models.PasswordReset) error {
	return s.db.DB.Create(reset).Error
}

// GetPasswordResetByToken 根据令牌获取密码重置记录
func (s *EmailStore) GetPasswordResetByToken(token string) (*models.PasswordReset, error) {
	var reset models.PasswordReset
	err := s.db.DB.Where("token = ?", token).First(&reset).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	return &reset, err
}

// UpdatePasswordReset 更新密码重置记录
func (s *EmailStore) UpdatePasswordReset(reset *models.PasswordReset) error {
	return s.db.DB.Save(reset).Error
}

// CreateEmailLog 创建邮件日志
func (s *EmailStore) CreateEmailLog(log *models.EmailLog) error {
	return s.db.DB.Create(log).Error
}

// UpdateEmailLog 更新邮件日志
func (s *EmailStore) UpdateEmailLog(log *models.EmailLog) error {
	return s.db.DB.Save(log).Error
}

// GetEmailLogs 获取邮件日志
func (s *EmailStore) GetEmailLogs(userID *uint, limit, offset int) ([]models.EmailLog, error) {
	var logs []models.EmailLog
	query := s.db.DB.Model(&models.EmailLog{})
	
	if userID != nil {
		query = query.Where("user_id = ?", *userID)
	}
	
	err := query.Order("created_at DESC").Limit(limit).Offset(offset).Find(&logs).Error
	return logs, err
}

// CreateEmailTemplate 创建邮件模板
func (s *EmailStore) CreateEmailTemplate(template *models.EmailTemplate) error {
	return s.db.DB.Create(template).Error
}

// GetEmailTemplateByName 根据名称获取邮件模板
func (s *EmailStore) GetEmailTemplateByName(name string) (*models.EmailTemplate, error) {
	var template models.EmailTemplate
	err := s.db.DB.Where("name = ? AND is_active = ?", name, true).First(&template).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, nil
	}
	return &template, err
}

// GetEmailTemplates 获取邮件模板列表
func (s *EmailStore) GetEmailTemplates(limit, offset int) ([]models.EmailTemplate, error) {
	var templates []models.EmailTemplate
	err := s.db.DB.Order("created_at DESC").Limit(limit).Offset(offset).Find(&templates).Error
	return templates, err
}

// UpdateEmailTemplate 更新邮件模板
func (s *EmailStore) UpdateEmailTemplate(template *models.EmailTemplate) error {
	return s.db.DB.Save(template).Error
}

// DeleteEmailTemplate 删除邮件模板
func (s *EmailStore) DeleteEmailTemplate(id uint) error {
	return s.db.DB.Delete(&models.EmailTemplate{}, id).Error
}

// GetEmailStats 获取邮件统计信息
func (s *EmailStore) GetEmailStats() (map[string]interface{}, error) {
	stats := make(map[string]interface{})
	
	// 总邮件数
	var totalEmails int64
	err := s.db.DB.Model(&models.EmailLog{}).Count(&totalEmails).Error
	if err != nil {
		return nil, err
	}
	stats["total_emails"] = totalEmails
	
	// 按状态统计
	var statusStats []struct {
		Status string `json:"status"`
		Count  int64  `json:"count"`
	}
	err = s.db.DB.Model(&models.EmailLog{}).
		Select("status, COUNT(*) as count").
		Group("status").
		Scan(&statusStats).Error
	if err != nil {
		return nil, err
	}
	stats["by_status"] = statusStats
	
	// 按类型统计
	var typeStats []struct {
		EmailType string `json:"email_type"`
		Count     int64  `json:"count"`
	}
	err = s.db.DB.Model(&models.EmailLog{}).
		Select("email_type, COUNT(*) as count").
		Group("email_type").
		Scan(&typeStats).Error
	if err != nil {
		return nil, err
	}
	stats["by_type"] = typeStats
	
	// 验证统计
	var verificationStats struct {
		Total    int64 `json:"total"`
		Verified int64 `json:"verified"`
		Pending  int64 `json:"pending"`
	}
	s.db.DB.Model(&models.EmailVerification{}).Count(&verificationStats.Total)
	s.db.DB.Model(&models.EmailVerification{}).Where("is_verified = ?", true).Count(&verificationStats.Verified)
	s.db.DB.Model(&models.EmailVerification{}).Where("is_verified = ?", false).Count(&verificationStats.Pending)
	stats["verification"] = verificationStats
	
	return stats, nil
}

// CleanupExpiredTokens 清理过期的令牌
func (s *EmailStore) CleanupExpiredTokens() error {
	// 清理过期的邮箱验证令牌
	err := s.db.DB.Where("expires_at < ? AND is_verified = ?", "NOW()", false).
		Delete(&models.EmailVerification{}).Error
	if err != nil {
		return err
	}
	
	// 清理过期的密码重置令牌
	err = s.db.DB.Where("expires_at < ? AND is_used = ?", "NOW()", false).
		Delete(&models.PasswordReset{}).Error
	if err != nil {
		return err
	}
	
	return nil
}