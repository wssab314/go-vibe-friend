package vf

import (
	"net/http"
	"strconv"

	"go-vibe-friend/internal/models"
	"go-vibe-friend/internal/service"

	"github.com/gin-gonic/gin"
)

type ProfileHandler struct {
	profileService *service.ProfileService
}

func NewProfileHandler(profileService *service.ProfileService) *ProfileHandler {
	return &ProfileHandler{
		profileService: profileService,
	}
}

// ProfileResponse 个人资料响应
type ProfileResponse struct {
	Code    int    `json:"code"`
	Message string `json:"message"`
	Data    struct {
		User    *models.User    `json:"user"`
		Profile *models.Profile `json:"profile"`
	} `json:"data"`
}

// UpdateProfileRequest 更新个人资料请求
type UpdateProfileRequest struct {
	DisplayName string `json:"display_name" binding:"max=100"`
	Bio         string `json:"bio" binding:"max=500"`
	Location    string `json:"location" binding:"max=100"`
	Website     string `json:"website" binding:"max=255,url"`
}

// GetProfile 获取个人资料
func (h *ProfileHandler) GetProfile(c *gin.Context) {
	// 从中间件获取用户ID
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

	// 获取用户信息和个人资料
	user, profile, err := h.profileService.GetUserProfile(uid)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    5000,
			"message": "获取个人资料失败",
			"error":   err.Error(),
		})
		return
	}

	// 返回响应
	c.JSON(http.StatusOK, ProfileResponse{
		Code:    0,
		Message: "获取成功",
		Data: struct {
			User    *models.User    `json:"user"`
			Profile *models.Profile `json:"profile"`
		}{
			User:    user,
			Profile: profile,
		},
	})
}

// UpdateProfile 更新个人资料
func (h *ProfileHandler) UpdateProfile(c *gin.Context) {
	// 从中间件获取用户ID
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

	var req UpdateProfileRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    1001,
			"message": "参数校验失败",
			"error":   err.Error(),
		})
		return
	}

	// 更新个人资料
	profile, err := h.profileService.UpdateProfile(uid, req.DisplayName, req.Bio, req.Location, req.Website)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    5000,
			"message": "更新个人资料失败",
			"error":   err.Error(),
		})
		return
	}

	// 获取完整的用户信息
	user, _, err := h.profileService.GetUserProfile(uid)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    5000,
			"message": "获取用户信息失败",
			"error":   err.Error(),
		})
		return
	}

	// 返回响应
	c.JSON(http.StatusOK, ProfileResponse{
		Code:    0,
		Message: "更新成功",
		Data: struct {
			User    *models.User    `json:"user"`
			Profile *models.Profile `json:"profile"`
		}{
			User:    user,
			Profile: profile,
		},
	})
}

// GetUserProfile 获取指定用户的公开资料
func (h *ProfileHandler) GetUserProfile(c *gin.Context) {
	// 获取用户ID参数
	userIDStr := c.Param("id")
	userID, err := strconv.ParseUint(userIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    1001,
			"message": "用户ID格式错误",
		})
		return
	}

	// 获取用户信息和个人资料
	user, profile, err := h.profileService.GetUserProfile(uint(userID))
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"code":    1004,
			"message": "用户不存在",
		})
		return
	}

	// 移除敏感信息
	user.Password = ""

	// 返回响应
	c.JSON(http.StatusOK, ProfileResponse{
		Code:    0,
		Message: "获取成功",
		Data: struct {
			User    *models.User    `json:"user"`
			Profile *models.Profile `json:"profile"`
		}{
			User:    user,
			Profile: profile,
		},
	})
}