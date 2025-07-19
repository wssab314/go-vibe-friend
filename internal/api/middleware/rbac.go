package middleware

import (
	"net/http"
	"strings"

	"go-vibe-friend/internal/service"

	"github.com/gin-gonic/gin"
)

// RBACMiddleware 基于角色的访问控制中间件
func RBACMiddleware(permissionService *service.PermissionService) gin.HandlerFunc {
	return func(c *gin.Context) {
		// 获取用户ID
		userID, exists := c.Get("user_id")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{
				"code":    1002,
				"message": "未认证用户",
			})
			c.Abort()
			return
		}

		uid, ok := userID.(uint)
		if !ok {
			c.JSON(http.StatusInternalServerError, gin.H{
				"code":    5000,
				"message": "用户ID类型错误",
			})
			c.Abort()
			return
		}

		// 解析请求路径和方法
		resource, action := parseResourceAndAction(c.Request.Method, c.Request.URL.Path)
		if resource == "" || action == "" {
			// 如果无法解析，则跳过权限检查
			c.Next()
			return
		}

		// 检查用户权限
		hasPermission, err := permissionService.CheckUserPermission(uid, resource, action)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"code":    5000,
				"message": "权限检查失败",
				"error":   err.Error(),
			})
			c.Abort()
			return
		}

		if !hasPermission {
			c.JSON(http.StatusForbidden, gin.H{
				"code":    1003,
				"message": "权限不足",
			})
			c.Abort()
			return
		}

		c.Next()
	}
}

// RequirePermission 需要特定权限的中间件
func RequirePermission(permissionService *service.PermissionService, resource, action string) gin.HandlerFunc {
	return func(c *gin.Context) {
		// 获取用户ID
		userID, exists := c.Get("user_id")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{
				"code":    1002,
				"message": "未认证用户",
			})
			c.Abort()
			return
		}

		uid, ok := userID.(uint)
		if !ok {
			c.JSON(http.StatusInternalServerError, gin.H{
				"code":    5000,
				"message": "用户ID类型错误",
			})
			c.Abort()
			return
		}

		// 检查用户权限
		hasPermission, err := permissionService.CheckUserPermission(uid, resource, action)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"code":    5000,
				"message": "权限检查失败",
				"error":   err.Error(),
			})
			c.Abort()
			return
		}

		if !hasPermission {
			c.JSON(http.StatusForbidden, gin.H{
				"code":    1003,
				"message": "权限不足",
			})
			c.Abort()
			return
		}

		c.Next()
	}
}

// RequireRole 需要特定角色的中间件
func RequireRole(roleNames ...string) gin.HandlerFunc {
	return func(c *gin.Context) {
		// 获取用户角色
		userRoles, exists := c.Get("user_roles")
		if !exists {
			c.JSON(http.StatusForbidden, gin.H{
				"code":    1003,
				"message": "权限不足",
			})
			c.Abort()
			return
		}

		roles, ok := userRoles.([]string)
		if !ok {
			c.JSON(http.StatusInternalServerError, gin.H{
				"code":    5000,
				"message": "用户角色类型错误",
			})
			c.Abort()
			return
		}

		// 检查是否有所需角色
		hasRole := false
		for _, userRole := range roles {
			for _, requiredRole := range roleNames {
				if userRole == requiredRole {
					hasRole = true
					break
				}
			}
			if hasRole {
				break
			}
		}

		if !hasRole {
			c.JSON(http.StatusForbidden, gin.H{
				"code":    1003,
				"message": "权限不足",
			})
			c.Abort()
			return
		}

		c.Next()
	}
}

// parseResourceAndAction 解析请求路径和方法，返回资源和动作
func parseResourceAndAction(method, path string) (string, string) {
	// 移除查询参数
	if idx := strings.Index(path, "?"); idx != -1 {
		path = path[:idx]
	}

	// 规范化路径
	path = strings.TrimSuffix(path, "/")
	parts := strings.Split(path, "/")

	// 跳过空和api前缀
	var pathParts []string
	for _, part := range parts {
		if part != "" && part != "api" {
			pathParts = append(pathParts, part)
		}
	}

	if len(pathParts) == 0 {
		return "", ""
	}

	// 根据路径确定资源
	var resource string
	switch {
	case strings.HasPrefix(path, "/api/admin/users"):
		resource = "user"
	case strings.HasPrefix(path, "/api/admin/dashboard"):
		resource = "system"
	case strings.HasPrefix(path, "/api/admin/jobs"):
		resource = "job"
	case strings.HasPrefix(path, "/api/admin/llm"):
		resource = "api"
	case strings.HasPrefix(path, "/api/vf/v1/profile"):
		resource = "profile"
	case strings.HasPrefix(path, "/api/vf/v1/files"):
		resource = "file"
	case strings.HasPrefix(path, "/api/vf/v1/email"):
		resource = "email"
	default:
		return "", ""
	}

	// 根据HTTP方法确定动作
	var action string
	switch method {
	case "GET":
		action = "read"
	case "POST":
		action = "create"
	case "PUT", "PATCH":
		action = "update"
	case "DELETE":
		action = "delete"
	default:
		action = "access"
	}

	// 特殊路径处理
	if strings.Contains(path, "/dashboard") {
		action = "dashboard"
	}

	return resource, action
}

// ResourceOwnerMiddleware 资源所有者中间件
func ResourceOwnerMiddleware(permissionService *service.PermissionService, resourceType string) gin.HandlerFunc {
	return func(c *gin.Context) {
		// 获取用户ID
		userID, exists := c.Get("user_id")
		if !exists {
			c.JSON(http.StatusUnauthorized, gin.H{
				"code":    1002,
				"message": "未认证用户",
			})
			c.Abort()
			return
		}

		_, ok := userID.(uint)
		if !ok {
			c.JSON(http.StatusInternalServerError, gin.H{
				"code":    5000,
				"message": "用户ID类型错误",
			})
			c.Abort()
			return
		}

		// 获取资源ID
		resourceIDStr := c.Param("id")
		if resourceIDStr == "" {
			c.JSON(http.StatusBadRequest, gin.H{
				"code":    1001,
				"message": "资源ID不能为空",
			})
			c.Abort()
			return
		}

		// 这里应该根据资源类型和ID检查所有权
		// 暂时简化处理
		c.Set("resource_type", resourceType)
		c.Set("resource_id", resourceIDStr)

		c.Next()
	}
}