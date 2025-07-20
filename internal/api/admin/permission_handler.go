package admin

import (
	"net/http"
	"strconv"

	"go-vibe-friend/internal/service"

	"github.com/gin-gonic/gin"
)

type PermissionHandler struct {
	permissionService *service.PermissionService
}

func NewPermissionHandler(permissionService *service.PermissionService) *PermissionHandler {
	return &PermissionHandler{
		permissionService: permissionService,
	}
}

// CreatePermission 创建权限
func (h *PermissionHandler) CreatePermission(c *gin.Context) {
	var req struct {
		Name        string `json:"name" binding:"required"`
		Description string `json:"description"`
		Resource    string `json:"resource" binding:"required"`
		Action      string `json:"action" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request parameters",
		})
		return
	}

	// 验证权限格式
	if !h.permissionService.ValidatePermission(req.Resource, req.Action) {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid resource or action",
		})
		return
	}

	permission, err := h.permissionService.CreatePermission(req.Name, req.Description, req.Resource, req.Action)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, permission)
}

// GetPermissions 获取权限列表
func (h *PermissionHandler) GetPermissions(c *gin.Context) {
	limitStr := c.DefaultQuery("limit", "50")
	offsetStr := c.DefaultQuery("offset", "0")

	limit, err := strconv.Atoi(limitStr)
	if err != nil {
		limit = 50
	}

	offset, err := strconv.Atoi(offsetStr)
	if err != nil {
		offset = 0
	}

	permissions, err := h.permissionService.GetPermissions(limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to get permissions",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"permissions": permissions,
		"count":       len(permissions),
	})
}

// GetPermissionsByResource 根据资源类型获取权限
func (h *PermissionHandler) GetPermissionsByResource(c *gin.Context) {
	resource := c.Param("resource")
	if resource == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Resource parameter is required",
		})
		return
	}

	permissions, err := h.permissionService.GetPermissionsByResource(resource)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to get permissions by resource",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"resource":    resource,
		"permissions": permissions,
		"count":       len(permissions),
	})
}

// AssignPermissionToRole 给角色分配权限
func (h *PermissionHandler) AssignPermissionToRole(c *gin.Context) {
	var req struct {
		RoleID       uint `json:"role_id" binding:"required"`
		PermissionID uint `json:"permission_id" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request parameters",
		})
		return
	}

	err := h.permissionService.AssignPermissionToRole(req.RoleID, req.PermissionID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Permission assigned to role successfully",
	})
}

// RemovePermissionFromRole 移除角色的权限
func (h *PermissionHandler) RemovePermissionFromRole(c *gin.Context) {
	var req struct {
		RoleID       uint `json:"role_id" binding:"required"`
		PermissionID uint `json:"permission_id" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request parameters",
		})
		return
	}

	err := h.permissionService.RemovePermissionFromRole(req.RoleID, req.PermissionID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Permission removed from role successfully",
	})
}

// GetRolePermissions 获取角色的权限
func (h *PermissionHandler) GetRolePermissions(c *gin.Context) {
	roleIDStr := c.Param("id")
	roleID, err := strconv.ParseUint(roleIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid role ID",
		})
		return
	}

	permissions, err := h.permissionService.GetRolePermissions(uint(roleID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to get role permissions",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"role_id":     roleID,
		"permissions": permissions,
		"count":       len(permissions),
	})
}

// GetUserPermissions 获取用户的权限
func (h *PermissionHandler) GetUserPermissions(c *gin.Context) {
	userIDStr := c.Param("id")
	userID, err := strconv.ParseUint(userIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid user ID",
		})
		return
	}

	permissions, err := h.permissionService.GetUserPermissions(uint(userID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to get user permissions",
		})
		return
	}

	// 获取用户的角色权限
	rolePermissions, err := h.permissionService.GetUserRolePermissions(uint(userID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to get user role permissions",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"user_id":          userID,
		"permissions":      permissions,
		"role_permissions": rolePermissions,
		"count":            len(permissions),
	})
}

// AssignPermissionToUser 给用户分配直接权限
func (h *PermissionHandler) AssignPermissionToUser(c *gin.Context) {
	var req struct {
		UserID       uint `json:"user_id" binding:"required"`
		PermissionID uint `json:"permission_id" binding:"required"`
		IsDenied     bool `json:"is_denied"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request parameters",
		})
		return
	}

	err := h.permissionService.AssignPermissionToUser(req.UserID, req.PermissionID, req.IsDenied)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	message := "Permission assigned to user successfully"
	if req.IsDenied {
		message = "Permission denied for user successfully"
	}

	c.JSON(http.StatusOK, gin.H{
		"message": message,
	})
}

// RemovePermissionFromUser 移除用户的直接权限
func (h *PermissionHandler) RemovePermissionFromUser(c *gin.Context) {
	var req struct {
		UserID       uint `json:"user_id" binding:"required"`
		PermissionID uint `json:"permission_id" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request parameters",
		})
		return
	}

	err := h.permissionService.RemovePermissionFromUser(req.UserID, req.PermissionID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Permission removed from user successfully",
	})
}

// GetPermissionStats 获取权限统计信息
func (h *PermissionHandler) GetPermissionStats(c *gin.Context) {
	stats, err := h.permissionService.GetPermissionStats()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to get permission stats",
		})
		return
	}

	c.JSON(http.StatusOK, stats)
}

// InitializePermissions 初始化默认权限
func (h *PermissionHandler) InitializePermissions(c *gin.Context) {
	err := h.permissionService.InitializeDefaultPermissions()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Default permissions initialized successfully",
	})
}

// ===== 角色管理API =====

// CreateRole 创建角色
func (h *PermissionHandler) CreateRole(c *gin.Context) {
	var req struct {
		Name        string `json:"name" binding:"required"`
		Description string `json:"description"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request parameters",
		})
		return
	}

	role, err := h.permissionService.CreateRole(req.Name, req.Description)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, role)
}

// GetRoles 获取角色列表
func (h *PermissionHandler) GetRoles(c *gin.Context) {
	limitStr := c.DefaultQuery("limit", "50")
	offsetStr := c.DefaultQuery("offset", "0")

	limit, err := strconv.Atoi(limitStr)
	if err != nil {
		limit = 50
	}

	offset, err := strconv.Atoi(offsetStr)
	if err != nil {
		offset = 0
	}

	roles, err := h.permissionService.GetRoles(limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to get roles",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"roles": roles,
		"count": len(roles),
	})
}

// GetRole 获取单个角色详情
func (h *PermissionHandler) GetRole(c *gin.Context) {
	roleIDStr := c.Param("id")
	roleID, err := strconv.ParseUint(roleIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid role ID",
		})
		return
	}

	role, err := h.permissionService.GetRole(uint(roleID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to get role",
		})
		return
	}

	c.JSON(http.StatusOK, role)
}

// UpdateRole 更新角色
func (h *PermissionHandler) UpdateRole(c *gin.Context) {
	roleIDStr := c.Param("id")
	roleID, err := strconv.ParseUint(roleIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid role ID",
		})
		return
	}

	var req struct {
		Name        string `json:"name" binding:"required"`
		Description string `json:"description"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request parameters",
		})
		return
	}

	role, err := h.permissionService.UpdateRole(uint(roleID), req.Name, req.Description)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, role)
}

// DeleteRole 删除角色
func (h *PermissionHandler) DeleteRole(c *gin.Context) {
	roleIDStr := c.Param("id")
	roleID, err := strconv.ParseUint(roleIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid role ID",
		})
		return
	}

	err = h.permissionService.DeleteRole(uint(roleID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Role deleted successfully",
	})
}

// AssignRoleToUser 给用户分配角色
func (h *PermissionHandler) AssignRoleToUser(c *gin.Context) {
	var req struct {
		UserID uint `json:"user_id" binding:"required"`
		RoleID uint `json:"role_id" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request parameters",
		})
		return
	}

	err := h.permissionService.AssignRoleToUser(req.UserID, req.RoleID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Role assigned to user successfully",
	})
}

// RemoveRoleFromUser 移除用户的角色
func (h *PermissionHandler) RemoveRoleFromUser(c *gin.Context) {
	var req struct {
		UserID uint `json:"user_id" binding:"required"`
		RoleID uint `json:"role_id" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request parameters",
		})
		return
	}

	err := h.permissionService.RemoveRoleFromUser(req.UserID, req.RoleID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Role removed from user successfully",
	})
}

// GetUserRoles 获取用户的角色
func (h *PermissionHandler) GetUserRoles(c *gin.Context) {
	userIDStr := c.Param("id")
	userID, err := strconv.ParseUint(userIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid user ID",
		})
		return
	}

	roles, err := h.permissionService.GetUserRoles(uint(userID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to get user roles",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"user_id": userID,
		"roles":   roles,
		"count":   len(roles),
	})
}