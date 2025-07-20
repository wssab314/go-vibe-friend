package admin

import (
	"net/http"
	"path/filepath"
	"strconv"

	"go-vibe-friend/internal/service"

	"github.com/gin-gonic/gin"
)

type StorageHandler struct {
	storageService *service.StorageService
}

func NewStorageHandler(storageService *service.StorageService) *StorageHandler {
	return &StorageHandler{
		storageService: storageService,
	}
}

// ListStorageObjects 列出存储对象
func (h *StorageHandler) ListStorageObjects(c *gin.Context) {
	prefix := c.DefaultQuery("prefix", "")
	recursive := c.DefaultQuery("recursive", "true") == "true"

	objects, err := h.storageService.ListObjects(prefix, recursive)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    5000,
			"message": "Failed to list objects",
			"error":   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    0,
		"message": "Objects listed successfully",
		"data":    objects,
	})
}

// DownloadStorageObject 下载存储对象
func (h *StorageHandler) DownloadStorageObject(c *gin.Context) {
	objectKey := c.Param("objectKey")
	if objectKey == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    4000,
			"message": "Object key is required",
		})
		return
	}
	
	// 移除前缀斜杠（Gin的*参数会包含前导斜杠）
	if objectKey[0] == '/' {
		objectKey = objectKey[1:]
	}

	object, err := h.storageService.GetObject(objectKey)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    5000,
			"message": "Failed to download object",
			"error":   err.Error(),
		})
		return
	}
	defer object.Close()

	// 获取对象信息以设置正确的headers
	objectInfo, err := h.storageService.GetObjectInfo(objectKey)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    5000,
			"message": "Failed to get object info",
			"error":   err.Error(),
		})
		return
	}

	// 获取文件名（从路径中提取）
	filename := filepath.Base(objectInfo.Key)
	
	// 设置响应头
	c.Header("Content-Type", objectInfo.ContentType)
	
	// 检查是否是图片类型，如果是则内联显示，否则作为附件下载
	if objectInfo.ContentType != "" && 
		(objectInfo.ContentType == "image/jpeg" || 
		 objectInfo.ContentType == "image/png" || 
		 objectInfo.ContentType == "image/gif" || 
		 objectInfo.ContentType == "image/bmp" || 
		 objectInfo.ContentType == "image/webp" || 
		 objectInfo.ContentType == "image/svg+xml") {
		c.Header("Content-Disposition", "inline; filename=\""+filename+"\"")
	} else {
		c.Header("Content-Disposition", "attachment; filename=\""+filename+"\"")
	}
	
	c.Header("Content-Length", strconv.FormatInt(objectInfo.Size, 10))

	// 流式传输文件内容
	c.DataFromReader(http.StatusOK, objectInfo.Size, objectInfo.ContentType, object, nil)
}
