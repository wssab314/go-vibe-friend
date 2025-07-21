package admin

import (
	"net/http"
	"strconv"
	"strings"
	"time"

	"go-vibe-friend/internal/service"

	"github.com/gin-gonic/gin"
)

type RedisHandler struct {
	redisService *service.RedisService
}

func NewRedisHandler(redisService *service.RedisService) *RedisHandler {
	return &RedisHandler{
		redisService: redisService,
	}
}

// GetRedisInfo 获取Redis信息
// @Summary 获取Redis信息
// @Description 获取Redis连接状态、统计信息等
// @Tags Redis管理
// @Accept json
// @Produce json
// @Success 200 {object} map[string]interface{}
// @Router /api/admin/redis/info [get]
func (h *RedisHandler) GetRedisInfo(c *gin.Context) {
	info, err := h.redisService.GetRedisInfo()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "获取Redis信息失败",
			"error":   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    0,
		"message": "success",
		"data":    info,
	})
}

// GetKeys 获取Redis键列表
// @Summary 获取Redis键列表
// @Description 根据模式获取Redis键列表
// @Tags Redis管理
// @Accept json
// @Produce json
// @Param pattern query string false "键模式" default("*")
// @Param limit query int false "限制数量" default(100)
// @Success 200 {object} map[string]interface{}
// @Router /api/admin/redis/keys [get]
func (h *RedisHandler) GetKeys(c *gin.Context) {
	pattern := c.DefaultQuery("pattern", "*")
	limitStr := c.DefaultQuery("limit", "100")
	
	limit, err := strconv.Atoi(limitStr)
	if err != nil {
		limit = 100
	}
	
	// 限制最大数量防止性能问题
	if limit > 1000 {
		limit = 1000
	}

	keys, err := h.redisService.GetKeys(pattern, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "获取键列表失败",
			"error":   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    0,
		"message": "success",
		"data": gin.H{
			"keys":    keys,
			"pattern": pattern,
			"count":   len(keys),
			"limit":   limit,
		},
	})
}

// GetKeyValue 获取键值
// @Summary 获取键值
// @Description 获取指定键的值
// @Tags Redis管理
// @Accept json
// @Produce json
// @Param key path string true "键名"
// @Success 200 {object} map[string]interface{}
// @Router /api/admin/redis/keys/{key} [get]
func (h *RedisHandler) GetKeyValue(c *gin.Context) {
	var req struct {
		Key string `json:"key" binding:"required"`
	}
	
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "请求参数错误: " + err.Error(),
		})
		return
	}
	
	key := req.Key

	keyInfo, err := h.redisService.GetKeyValue(key)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "获取键值失败",
			"error":   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    0,
		"message": "success",
		"data":    keyInfo,
	})
}

// DeleteKey 删除键
// @Summary 删除键
// @Description 删除指定的Redis键
// @Tags Redis管理
// @Accept json
// @Produce json
// @Param key path string true "键名"
// @Success 200 {object} map[string]interface{}
// @Router /api/admin/redis/keys/{key} [delete]
func (h *RedisHandler) DeleteKey(c *gin.Context) {
	var req struct {
		Key string `json:"key" binding:"required"`
	}
	
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "请求参数错误: " + err.Error(),
		})
		return
	}
	
	key := req.Key

	err := h.redisService.DeleteKey(key)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "删除键失败",
			"error":   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    0,
		"message": "删除成功",
		"data": gin.H{
			"key": key,
		},
	})
}

// SetKeyTTL 设置键过期时间
// @Summary 设置键过期时间
// @Description 设置指定键的过期时间
// @Tags Redis管理
// @Accept json
// @Produce json
// @Param key path string true "键名"
// @Param body body map[string]interface{} true "过期时间"
// @Success 200 {object} map[string]interface{}
// @Router /api/admin/redis/keys/{key}/ttl [put]
func (h *RedisHandler) SetKeyTTL(c *gin.Context) {
	var req struct {
		Key string `json:"key" binding:"required"`
		TTL int64 `json:"ttl"` // 秒
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "请求参数错误",
			"error":   err.Error(),
		})
		return
	}

	ttl := time.Duration(req.TTL) * time.Second
	err := h.redisService.SetKeyTTL(req.Key, ttl)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "设置过期时间失败",
			"error":   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    0,
		"message": "设置成功",
		"data": gin.H{
			"key": req.Key,
			"ttl": req.TTL,
		},
	})
}

// TestConnection 测试Redis连接
// @Summary 测试Redis连接
// @Description 测试Redis连接状态
// @Tags Redis管理
// @Accept json
// @Produce json
// @Success 200 {object} map[string]interface{}
// @Router /api/admin/redis/test [post]
func (h *RedisHandler) TestConnection(c *gin.Context) {
	result := h.redisService.TestConnection()
	
	c.JSON(http.StatusOK, gin.H{
		"code":    0,
		"message": "测试完成",
		"data":    result,
	})
}

// ExecuteCommand 执行Redis命令
// @Summary 执行Redis命令
// @Description 执行指定的Redis命令（受限制）
// @Tags Redis管理
// @Accept json
// @Produce json
// @Param body body map[string]interface{} true "命令参数"
// @Success 200 {object} map[string]interface{}
// @Router /api/admin/redis/command [post]
func (h *RedisHandler) ExecuteCommand(c *gin.Context) {
	var req struct {
		Command string        `json:"command"`
		Args    []interface{} `json:"args"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "请求参数错误",
			"error":   err.Error(),
		})
		return
	}

	if req.Command == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "命令不能为空",
		})
		return
	}

	result, err := h.redisService.ExecuteCommand(req.Command, req.Args...)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "执行命令失败",
			"error":   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    0,
		"message": "执行成功",
		"data": gin.H{
			"command": req.Command,
			"args":    req.Args,
			"result":  result,
		},
	})
}

// FlushDB 清空数据库
// @Summary 清空Redis数据库
// @Description 清空当前Redis数据库（危险操作）
// @Tags Redis管理
// @Accept json
// @Produce json
// @Success 200 {object} map[string]interface{}
// @Router /api/admin/redis/flush [post]
func (h *RedisHandler) FlushDB(c *gin.Context) {
	// 需要确认参数
	var req struct {
		Confirm bool `json:"confirm"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "请求参数错误",
			"error":   err.Error(),
		})
		return
	}

	if !req.Confirm {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "请确认清空操作",
		})
		return
	}

	err := h.redisService.FlushDB()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    500,
			"message": "清空数据库失败",
			"error":   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    0,
		"message": "数据库已清空",
		"data": gin.H{
			"timestamp": time.Now(),
		},
	})
}

// GetApplicationKeys 获取应用相关的键
// @Summary 获取应用相关的键
// @Description 获取应用命名空间下的键列表
// @Tags Redis管理
// @Accept json
// @Produce json
// @Param type query string false "键类型" Enums(session,cache,queue,all) default("all")
// @Success 200 {object} map[string]interface{}
// @Router /api/admin/redis/app-keys [get]
func (h *RedisHandler) GetApplicationKeys(c *gin.Context) {
	keyType := c.DefaultQuery("type", "all")
	
	var patterns []string
	switch strings.ToLower(keyType) {
	case "session":
		patterns = []string{"go_vibe_friend:session:*"}
	case "cache":
		patterns = []string{"go_vibe_friend:cache:*"}
	case "queue":
		patterns = []string{"go_vibe_friend:queue:*"}
	case "all":
		patterns = []string{
			"go_vibe_friend:session:*",
			"go_vibe_friend:cache:*",
			"go_vibe_friend:queue:*",
		}
	default:
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    400,
			"message": "无效的键类型",
		})
		return
	}

	allKeys := make(map[string][]interface{})
	totalCount := 0

	for _, pattern := range patterns {
		keys, err := h.redisService.GetKeys(pattern, 100)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"code":    500,
				"message": "获取应用键失败",
				"error":   err.Error(),
			})
			return
		}
		
		patternType := extractPatternType(pattern)
		allKeys[patternType] = make([]interface{}, len(keys))
		for i, key := range keys {
			allKeys[patternType][i] = key
		}
		totalCount += len(keys)
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    0,
		"message": "success",
		"data": gin.H{
			"keys":       allKeys,
			"type":       keyType,
			"total":      totalCount,
			"timestamp":  time.Now(),
		},
	})
}

// 辅助函数
func extractPatternType(pattern string) string {
	if strings.Contains(pattern, ":session:") {
		return "session"
	} else if strings.Contains(pattern, ":cache:") {
		return "cache"
	} else if strings.Contains(pattern, ":queue:") {
		return "queue"
	}
	return "unknown"
}