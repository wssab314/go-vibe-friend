package vf

import (
	"net/http"
	"strconv"

	"go-vibe-friend/internal/service"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
)

type EmailHandler struct {
	emailService *service.EmailService
	authService  *service.AuthService
}

func NewEmailHandler(emailService *service.EmailService, authService *service.AuthService) *EmailHandler {
	return &EmailHandler{
		emailService: emailService,
		authService:  authService,
	}
}

// SendVerificationEmail 发送邮箱验证邮件
func (h *EmailHandler) SendVerificationEmail(c *gin.Context) {
	// 获取用户ID
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"code":    1002,
			"message": "未认证用户",
		})
		return
	}

	uid, ok := userID.(uint)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    5000,
			"message": "用户ID类型错误",
		})
		return
	}

	// 获取请求参数
	var req struct {
		Email string `json:"email" binding:"required,email"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    1001,
			"message": "请输入有效的邮箱地址",
			"error":   err.Error(),
		})
		return
	}

	// 发送验证邮件
	if err := h.emailService.SendVerificationEmail(uid, req.Email); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    5000,
			"message": "发送验证邮件失败",
			"error":   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    0,
		"message": "验证邮件已发送，请检查您的邮箱",
	})
}

// VerifyEmail 验证邮箱
func (h *EmailHandler) VerifyEmail(c *gin.Context) {
	// 获取令牌
	token := c.Query("token")
	if token == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    1001,
			"message": "验证令牌不能为空",
		})
		return
	}

	// 验证邮箱
	if err := h.emailService.VerifyEmail(token); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    1001,
			"message": "邮箱验证失败",
			"error":   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    0,
		"message": "邮箱验证成功",
	})
}

// RequestPasswordReset 请求密码重置
func (h *EmailHandler) RequestPasswordReset(c *gin.Context) {
	// 获取请求参数
	var req struct {
		Email string `json:"email" binding:"required,email"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    1001,
			"message": "请输入有效的邮箱地址",
			"error":   err.Error(),
		})
		return
	}

	// 查找用户
	user, err := h.authService.GetUserByEmail(req.Email)
	if err != nil {
		// 为了安全起见，即使用户不存在也返回成功
		c.JSON(http.StatusOK, gin.H{
			"code":    0,
			"message": "如果邮箱存在，密码重置邮件已发送",
		})
		return
	}

	// 发送密码重置邮件
	if err := h.emailService.SendPasswordResetEmail(user.ID, req.Email); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    5000,
			"message": "发送密码重置邮件失败",
			"error":   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    0,
		"message": "如果邮箱存在，密码重置邮件已发送",
	})
}

// ResetPassword 重置密码
func (h *EmailHandler) ResetPassword(c *gin.Context) {
	// 获取请求参数
	var req struct {
		Token       string `json:"token" binding:"required"`
		NewPassword string `json:"new_password" binding:"required,min=6"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    1001,
			"message": "参数校验失败",
			"error":   err.Error(),
		})
		return
	}

	// 加密新密码
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.NewPassword), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    5000,
			"message": "密码加密失败",
			"error":   err.Error(),
		})
		return
	}

	// 重置密码
	if err := h.emailService.ResetPassword(req.Token, string(hashedPassword)); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    1001,
			"message": "密码重置失败",
			"error":   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    0,
		"message": "密码重置成功",
	})
}

// GetEmailStatus 获取邮箱验证状态
func (h *EmailHandler) GetEmailStatus(c *gin.Context) {
	// 获取用户ID
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"code":    1002,
			"message": "未认证用户",
		})
		return
	}

	uid, ok := userID.(uint)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    5000,
			"message": "用户ID类型错误",
		})
		return
	}

	// 获取邮箱参数
	email := c.Query("email")
	if email == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    1001,
			"message": "邮箱地址不能为空",
		})
		return
	}

	// 检查邮箱是否已验证
	isVerified, err := h.emailService.IsEmailVerified(uid, email)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    5000,
			"message": "获取邮箱状态失败",
			"error":   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    0,
		"message": "获取成功",
		"data": gin.H{
			"email":       email,
			"is_verified": isVerified,
		},
	})
}

// GetEmailLogs 获取邮件日志
func (h *EmailHandler) GetEmailLogs(c *gin.Context) {
	// 获取用户ID
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"code":    1002,
			"message": "未认证用户",
		})
		return
	}

	uid, ok := userID.(uint)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    5000,
			"message": "用户ID类型错误",
		})
		return
	}

	// 获取查询参数
	limitStr := c.DefaultQuery("limit", "20")
	offsetStr := c.DefaultQuery("offset", "0")

	limit, err := strconv.Atoi(limitStr)
	if err != nil {
		limit = 20
	}

	offset, err := strconv.Atoi(offsetStr)
	if err != nil {
		offset = 0
	}

	// 获取邮件日志
	logs, err := h.emailService.GetEmailLogs(&uid, limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    5000,
			"message": "获取邮件日志失败",
			"error":   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    0,
		"message": "获取成功",
		"data": gin.H{
			"logs":  logs,
			"count": len(logs),
		},
	})
}