package vf

import (
	"net/http"
	"strings"

	"go-vibe-friend/internal/models"
	"go-vibe-friend/internal/service"
	"go-vibe-friend/internal/utils"

	"github.com/gin-gonic/gin"
)

type AuthHandler struct {
	authService *service.AuthService
}

func NewAuthHandler(authService *service.AuthService) *AuthHandler {
	return &AuthHandler{
		authService: authService,
	}
}

// RegisterRequest 注册请求
type RegisterRequest struct {
	Username string `json:"username" binding:"required,min=3,max=20"`
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=6"`
}

// LoginRequest 登录请求
type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

// RefreshRequest 刷新令牌请求
type RefreshRequest struct {
	RefreshToken string `json:"refresh_token" binding:"required"`
}

// RegisterResponse 注册响应
type RegisterResponse struct {
	Code    int    `json:"code"`
	Message string `json:"message"`
	Data    struct {
		User         *models.User `json:"user"`
		AccessToken  string       `json:"access_token"`
		RefreshToken string       `json:"refresh_token"`
	} `json:"data"`
}

// LoginResponse 登录响应
type LoginResponse struct {
	Code    int    `json:"code"`
	Message string `json:"message"`
	Data    struct {
		User         *models.User `json:"user"`
		AccessToken  string       `json:"access_token"`
		RefreshToken string       `json:"refresh_token"`
	} `json:"data"`
}

// RefreshResponse 刷新响应
type RefreshResponse struct {
	Code    int    `json:"code"`
	Message string `json:"message"`
	Data    struct {
		AccessToken  string `json:"access_token"`
		RefreshToken string `json:"refresh_token"`
	} `json:"data"`
}

// Register 用户注册
func (h *AuthHandler) Register(c *gin.Context) {
	var req RegisterRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    1001,
			"message": "参数校验失败",
			"error":   err.Error(),
		})
		return
	}

	// 检查用户名是否已存在
	if exists, err := h.authService.UserExists(req.Username, req.Email); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    5000,
			"message": "服务器内部错误",
			"error":   err.Error(),
		})
		return
	} else if exists {
		c.JSON(http.StatusConflict, gin.H{
			"code":    1001,
			"message": "用户名或邮箱已存在",
		})
		return
	}

	// 创建用户
	user, err := h.authService.CreateUser(req.Username, req.Email, req.Password)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    5000,
			"message": "创建用户失败",
			"error":   err.Error(),
		})
		return
	}

	// 生成令牌
	accessToken, refreshToken, err := h.authService.GenerateTokens(user)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    5000,
			"message": "生成令牌失败",
			"error":   err.Error(),
		})
		return
	}

	// 创建会话
	clientIP := c.ClientIP()
	userAgent := c.GetHeader("User-Agent")
	if err := h.authService.CreateSession(user.ID, refreshToken, clientIP, userAgent); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    5000,
			"message": "创建会话失败",
			"error":   err.Error(),
		})
		return
	}

	// 返回响应
	c.JSON(http.StatusCreated, RegisterResponse{
		Code:    0,
		Message: "注册成功",
		Data: struct {
			User         *models.User `json:"user"`
			AccessToken  string       `json:"access_token"`
			RefreshToken string       `json:"refresh_token"`
		}{
			User:         user,
			AccessToken:  accessToken,
			RefreshToken: refreshToken,
		},
	})
}

// Login 用户登录
func (h *AuthHandler) Login(c *gin.Context) {
	var req LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    1001,
			"message": "参数校验失败",
			"error":   err.Error(),
		})
		return
	}

	// 验证用户
	user, err := h.authService.ValidateUser(req.Email, req.Password)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"code":    1002,
			"message": "邮箱或密码错误",
		})
		return
	}

	// 检查用户状态
	if user.Status != "active" {
		c.JSON(http.StatusForbidden, gin.H{
			"code":    1003,
			"message": "用户账号已被禁用",
		})
		return
	}

	// 生成令牌
	accessToken, refreshToken, err := h.authService.GenerateTokens(user)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    5000,
			"message": "生成令牌失败",
			"error":   err.Error(),
		})
		return
	}

	// 创建会话
	clientIP := c.ClientIP()
	userAgent := c.GetHeader("User-Agent")
	if err := h.authService.CreateSession(user.ID, refreshToken, clientIP, userAgent); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    5000,
			"message": "创建会话失败",
			"error":   err.Error(),
		})
		return
	}

	// 返回响应
	c.JSON(http.StatusOK, LoginResponse{
		Code:    0,
		Message: "登录成功",
		Data: struct {
			User         *models.User `json:"user"`
			AccessToken  string       `json:"access_token"`
			RefreshToken string       `json:"refresh_token"`
		}{
			User:         user,
			AccessToken:  accessToken,
			RefreshToken: refreshToken,
		},
	})
}

// Refresh 刷新令牌
func (h *AuthHandler) Refresh(c *gin.Context) {
	var req RefreshRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    1001,
			"message": "参数校验失败",
			"error":   err.Error(),
		})
		return
	}

	// 验证刷新令牌
	user, err := h.authService.ValidateRefreshToken(req.RefreshToken)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"code":    1002,
			"message": "刷新令牌无效或已过期",
		})
		return
	}

	// 生成新令牌
	accessToken, refreshToken, err := h.authService.GenerateTokens(user)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    5000,
			"message": "生成令牌失败",
			"error":   err.Error(),
		})
		return
	}

	// 撤销旧会话，创建新会话
	clientIP := c.ClientIP()
	userAgent := c.GetHeader("User-Agent")
	if err := h.authService.RefreshSession(req.RefreshToken, refreshToken, clientIP, userAgent); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    5000,
			"message": "刷新会话失败",
			"error":   err.Error(),
		})
		return
	}

	// 返回响应
	c.JSON(http.StatusOK, RefreshResponse{
		Code:    0,
		Message: "刷新成功",
		Data: struct {
			AccessToken  string `json:"access_token"`
			RefreshToken string `json:"refresh_token"`
		}{
			AccessToken:  accessToken,
			RefreshToken: refreshToken,
		},
	})
}

// Logout 用户登出
func (h *AuthHandler) Logout(c *gin.Context) {
	// 从Authorization头获取令牌
	authHeader := c.GetHeader("Authorization")
	if authHeader == "" {
		c.JSON(http.StatusUnauthorized, gin.H{
			"code":    1002,
			"message": "未提供认证令牌",
		})
		return
	}

	// 解析Bearer令牌
	tokenParts := strings.Split(authHeader, " ")
	if len(tokenParts) != 2 || tokenParts[0] != "Bearer" {
		c.JSON(http.StatusUnauthorized, gin.H{
			"code":    1002,
			"message": "令牌格式错误",
		})
		return
	}

	token := tokenParts[1]

	// 验证令牌并获取用户ID
	userID, err := utils.ValidateJWT(token)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{
			"code":    1002,
			"message": "令牌无效",
		})
		return
	}

	// 撤销用户的所有会话
	if err := h.authService.RevokeAllSessions(userID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    5000,
			"message": "撤销会话失败",
			"error":   err.Error(),
		})
		return
	}

	// 返回响应
	c.JSON(http.StatusOK, gin.H{
		"code":    0,
		"message": "登出成功",
	})
}