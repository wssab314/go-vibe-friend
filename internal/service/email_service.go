package service

import (
	"crypto/rand"
	"crypto/tls"
	"encoding/hex"
	"fmt"
	"net/smtp"
	"time"

	"go-vibe-friend/internal/models"
	"go-vibe-friend/internal/store"
)

type EmailService struct {
	emailStore *store.EmailStore
	smtpHost   string
	smtpPort   string
	smtpUser   string
	smtpPass   string
	fromEmail  string
	fromName   string
}

func NewEmailService(emailStore *store.EmailStore, smtpHost, smtpPort, smtpUser, smtpPass, fromEmail, fromName string) *EmailService {
	return &EmailService{
		emailStore: emailStore,
		smtpHost:   smtpHost,
		smtpPort:   smtpPort,
		smtpUser:   smtpUser,
		smtpPass:   smtpPass,
		fromEmail:  fromEmail,
		fromName:   fromName,
	}
}

// SendVerificationEmail 发送邮箱验证邮件
func (s *EmailService) SendVerificationEmail(userID uint, email string) error {
	// 生成验证令牌
	token := s.generateToken()
	
	// 创建验证记录
	verification := &models.EmailVerification{
		UserID:    userID,
		Email:     email,
		Token:     token,
		ExpiresAt: time.Now().Add(24 * time.Hour), // 24小时过期
	}
	
	if err := s.emailStore.CreateEmailVerification(verification); err != nil {
		return fmt.Errorf("创建验证记录失败: %v", err)
	}
	
	// 发送邮件
	subject := "验证您的邮箱地址"
	body := s.buildVerificationEmailBody(token)
	
	return s.sendEmail(email, subject, body, "verification", &userID)
}

// SendPasswordResetEmail 发送密码重置邮件
func (s *EmailService) SendPasswordResetEmail(userID uint, email string) error {
	// 生成重置令牌
	token := s.generateToken()
	
	// 创建重置记录
	reset := &models.PasswordReset{
		UserID:    userID,
		Email:     email,
		Token:     token,
		ExpiresAt: time.Now().Add(1 * time.Hour), // 1小时过期
	}
	
	if err := s.emailStore.CreatePasswordReset(reset); err != nil {
		return fmt.Errorf("创建重置记录失败: %v", err)
	}
	
	// 发送邮件
	subject := "重置您的密码"
	body := s.buildPasswordResetEmailBody(token)
	
	return s.sendEmail(email, subject, body, "password_reset", &userID)
}

// VerifyEmail 验证邮箱
func (s *EmailService) VerifyEmail(token string) error {
	verification, err := s.emailStore.GetEmailVerificationByToken(token)
	if err != nil {
		return fmt.Errorf("验证记录不存在: %v", err)
	}
	
	if verification == nil {
		return fmt.Errorf("无效的验证令牌")
	}
	
	if verification.IsVerified {
		return fmt.Errorf("邮箱已验证")
	}
	
	if time.Now().After(verification.ExpiresAt) {
		return fmt.Errorf("验证令牌已过期")
	}
	
	// 标记为已验证
	now := time.Now()
	verification.IsVerified = true
	verification.VerifiedAt = &now
	
	return s.emailStore.UpdateEmailVerification(verification)
}

// ResetPassword 重置密码
func (s *EmailService) ResetPassword(token, newPassword string) error {
	reset, err := s.emailStore.GetPasswordResetByToken(token)
	if err != nil {
		return fmt.Errorf("重置记录不存在: %v", err)
	}
	
	if reset == nil {
		return fmt.Errorf("无效的重置令牌")
	}
	
	if reset.IsUsed {
		return fmt.Errorf("重置令牌已使用")
	}
	
	if time.Now().After(reset.ExpiresAt) {
		return fmt.Errorf("重置令牌已过期")
	}
	
	// 标记为已使用
	now := time.Now()
	reset.IsUsed = true
	reset.UsedAt = &now
	
	return s.emailStore.UpdatePasswordReset(reset)
}

// sendEmail 发送邮件
func (s *EmailService) sendEmail(toEmail, subject, body, emailType string, userID *uint) error {
	// 创建邮件日志
	emailLog := &models.EmailLog{
		ToEmail:   toEmail,
		Subject:   subject,
		Body:      body,
		Status:    "pending",
		EmailType: emailType,
		UserID:    userID,
	}
	
	if err := s.emailStore.CreateEmailLog(emailLog); err != nil {
		return fmt.Errorf("创建邮件日志失败: %v", err)
	}
	
	// 发送邮件
	err := s.sendSMTPEmail(toEmail, subject, body)
	
	// 更新邮件状态
	if err != nil {
		emailLog.Status = "failed"
		emailLog.ErrorMsg = err.Error()
	} else {
		emailLog.Status = "sent"
		now := time.Now()
		emailLog.SentAt = &now
	}
	
	s.emailStore.UpdateEmailLog(emailLog)
	
	return err
}

// sendSMTPEmail 通过SMTP发送邮件
func (s *EmailService) sendSMTPEmail(toEmail, subject, body string) error {
	// 构建邮件内容
	from := fmt.Sprintf("%s <%s>", s.fromName, s.fromEmail)
	to := toEmail
	
	msg := []byte(fmt.Sprintf("From: %s\r\n"+
		"To: %s\r\n"+
		"Subject: %s\r\n"+
		"MIME-Version: 1.0\r\n"+
		"Content-Type: text/html; charset=UTF-8\r\n"+
		"\r\n"+
		"%s\r\n", from, to, subject, body))
	
	// 连接SMTP服务器
	auth := smtp.PlainAuth("", s.smtpUser, s.smtpPass, s.smtpHost)
	
	// 创建TLS连接
	tlsConfig := &tls.Config{
		InsecureSkipVerify: true,
		ServerName:         s.smtpHost,
	}
	
	conn, err := tls.Dial("tcp", s.smtpHost+":"+s.smtpPort, tlsConfig)
	if err != nil {
		return fmt.Errorf("连接SMTP服务器失败: %v", err)
	}
	defer conn.Close()
	
	client, err := smtp.NewClient(conn, s.smtpHost)
	if err != nil {
		return fmt.Errorf("创建SMTP客户端失败: %v", err)
	}
	defer client.Close()
	
	// 身份验证
	if err := client.Auth(auth); err != nil {
		return fmt.Errorf("SMTP身份验证失败: %v", err)
	}
	
	// 设置发件人
	if err := client.Mail(s.fromEmail); err != nil {
		return fmt.Errorf("设置发件人失败: %v", err)
	}
	
	// 设置收件人
	if err := client.Rcpt(toEmail); err != nil {
		return fmt.Errorf("设置收件人失败: %v", err)
	}
	
	// 发送邮件内容
	wc, err := client.Data()
	if err != nil {
		return fmt.Errorf("获取邮件写入器失败: %v", err)
	}
	
	if _, err := wc.Write(msg); err != nil {
		return fmt.Errorf("写入邮件内容失败: %v", err)
	}
	
	if err := wc.Close(); err != nil {
		return fmt.Errorf("关闭邮件写入器失败: %v", err)
	}
	
	return nil
}

// generateToken 生成随机令牌
func (s *EmailService) generateToken() string {
	bytes := make([]byte, 32)
	rand.Read(bytes)
	return hex.EncodeToString(bytes)
}

// buildVerificationEmailBody 构建邮箱验证邮件内容
func (s *EmailService) buildVerificationEmailBody(token string) string {
	// 这里应该使用模板引擎，暂时使用简单的字符串替换
	verifyURL := fmt.Sprintf("http://localhost:3000/verify-email?token=%s", token)
	
	return fmt.Sprintf(`
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>邮箱验证</title>
</head>
<body>
    <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
        <h2>验证您的邮箱地址</h2>
        <p>感谢您注册 Go Vibe Friend！</p>
        <p>请点击下面的链接验证您的邮箱地址：</p>
        <p><a href="%s" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">验证邮箱</a></p>
        <p>如果您无法点击上面的链接，请复制以下地址到浏览器中打开：</p>
        <p>%s</p>
        <p>此链接将在24小时后过期。</p>
        <p>如果您没有注册账户，请忽略此邮件。</p>
    </div>
</body>
</html>
	`, verifyURL, verifyURL)
}

// buildPasswordResetEmailBody 构建密码重置邮件内容
func (s *EmailService) buildPasswordResetEmailBody(token string) string {
	resetURL := fmt.Sprintf("http://localhost:3000/reset-password?token=%s", token)
	
	return fmt.Sprintf(`
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>密码重置</title>
</head>
<body>
    <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
        <h2>重置您的密码</h2>
        <p>您好！</p>
        <p>我们收到了您的密码重置请求。</p>
        <p>请点击下面的链接重置您的密码：</p>
        <p><a href="%s" style="background-color: #dc3545; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">重置密码</a></p>
        <p>如果您无法点击上面的链接，请复制以下地址到浏览器中打开：</p>
        <p>%s</p>
        <p>此链接将在1小时后过期。</p>
        <p>如果您没有请求密码重置，请忽略此邮件。</p>
    </div>
</body>
</html>
	`, resetURL, resetURL)
}

// IsEmailVerified 检查邮箱是否已验证
func (s *EmailService) IsEmailVerified(userID uint, email string) (bool, error) {
	verifications, err := s.emailStore.GetEmailVerificationsByUserID(userID)
	if err != nil {
		return false, err
	}
	
	for _, v := range verifications {
		if v.Email == email && v.IsVerified {
			return true, nil
		}
	}
	
	return false, nil
}

// GetEmailLogs 获取邮件日志
func (s *EmailService) GetEmailLogs(userID *uint, limit, offset int) ([]models.EmailLog, error) {
	return s.emailStore.GetEmailLogs(userID, limit, offset)
}