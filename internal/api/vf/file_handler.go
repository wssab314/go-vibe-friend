package vf

import (
	"io"
	"net/http"
	"strconv"

	"go-vibe-friend/internal/service"

	"github.com/gin-gonic/gin"
)

type FileHandler struct {
	fileService *service.FileService
}

func NewFileHandler(fileService *service.FileService) *FileHandler {
	return &FileHandler{
		fileService: fileService,
	}
}

// UploadFile 上传文件
func (h *FileHandler) UploadFile(c *gin.Context) {
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

	// 获取文件分类
	category := c.DefaultPostForm("category", "general")

	// 获取上传的文件
	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    1001,
			"message": "未找到上传的文件",
			"error":   err.Error(),
		})
		return
	}

	// 上传文件
	fileModel, err := h.fileService.UploadFile(file, uid, category)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    1001,
			"message": "文件上传失败",
			"error":   err.Error(),
		})
		return
	}

	// 记录上传操作
	ipAddress := c.ClientIP()
	userAgent := c.GetHeader("User-Agent")
	h.fileService.RecordUpload(fileModel.ID, uid, ipAddress, userAgent)

	c.JSON(http.StatusOK, gin.H{
		"code":    0,
		"message": "文件上传成功",
		"data": gin.H{
			"file_id":       fileModel.ID,
			"file_name":     fileModel.FileName,
			"original_name": fileModel.OriginalName,
			"file_size":     fileModel.FileSize,
			"mime_type":     fileModel.MimeType,
			"category":      fileModel.Category,
			"created_at":    fileModel.CreatedAt,
		},
	})
}

// UploadAvatar 上传头像
func (h *FileHandler) UploadAvatar(c *gin.Context) {
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

	// 获取上传的文件
	file, err := c.FormFile("avatar")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    1001,
			"message": "未找到上传的头像文件",
			"error":   err.Error(),
		})
		return
	}

	// 上传头像
	fileModel, err := h.fileService.UpdateAvatar(uid, file)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    1001,
			"message": "头像上传失败",
			"error":   err.Error(),
		})
		return
	}

	// 记录上传操作
	ipAddress := c.ClientIP()
	userAgent := c.GetHeader("User-Agent")
	h.fileService.RecordUpload(fileModel.ID, uid, ipAddress, userAgent)

	c.JSON(http.StatusOK, gin.H{
		"code":    0,
		"message": "头像上传成功",
		"data": gin.H{
			"file_id":       fileModel.ID,
			"file_name":     fileModel.FileName,
			"original_name": fileModel.OriginalName,
			"file_size":     fileModel.FileSize,
			"avatar_url":    "/api/vf/v1/files/" + strconv.Itoa(int(fileModel.ID)) + "/download",
			"created_at":    fileModel.CreatedAt,
		},
	})
}

// GetFiles 获取用户文件列表
func (h *FileHandler) GetFiles(c *gin.Context) {
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
	category := c.Query("category")
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

	// 获取文件列表
	files, err := h.fileService.GetUserFiles(uid, category, limit, offset)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    5000,
			"message": "获取文件列表失败",
			"error":   err.Error(),
		})
		return
	}

	// 转换为响应格式
	var responseFiles []gin.H
	for _, file := range files {
		responseFiles = append(responseFiles, gin.H{
			"file_id":       file.ID,
			"file_name":     file.FileName,
			"original_name": file.OriginalName,
			"file_size":     file.FileSize,
			"mime_type":     file.MimeType,
			"category":      file.Category,
			"is_public":     file.IsPublic,
			"download_url":  "/api/vf/v1/files/" + strconv.Itoa(int(file.ID)) + "/download",
			"created_at":    file.CreatedAt,
		})
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    0,
		"message": "获取成功",
		"data": gin.H{
			"files": responseFiles,
			"count": len(responseFiles),
		},
	})
}

// DownloadFile 下载文件
func (h *FileHandler) DownloadFile(c *gin.Context) {
	// 获取文件ID
	fileIDStr := c.Param("id")
	fileID, err := strconv.ParseUint(fileIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    1001,
			"message": "文件ID格式错误",
		})
		return
	}

	// 获取用户ID（可能不存在，用于权限检查）
	userID, _ := c.Get("user_id")
	var uid uint
	if userID != nil {
		uid, _ = userID.(uint)
	}

	// 获取文件信息
	file, err := h.fileService.GetFile(uint(fileID), uid)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"code":    1004,
			"message": "文件不存在或无权访问",
			"error":   err.Error(),
		})
		return
	}

	// 从 MinIO 获取文件对象
	obj, err := h.fileService.GetFileObject(file)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"code":    1004,
			"message": "文件不存在",
			"error":   err.Error(),
		})
		return
	}
	defer obj.Close()

	// 设置响应头
	c.Header("Content-Type", file.MimeType)
	c.Header("Content-Disposition", "attachment; filename=\""+file.OriginalName+"\"")
	c.Header("Content-Length", strconv.FormatInt(file.FileSize, 10))

	// 将文件内容写入响应体
	if _, err := io.Copy(c.Writer, obj); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    5000,
			"message": "文件下载失败",
		})
		return
	}
}

// DeleteFile 删除文件
func (h *FileHandler) DeleteFile(c *gin.Context) {
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

	// 获取文件ID
	fileIDStr := c.Param("id")
	fileID, err := strconv.ParseUint(fileIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    1001,
			"message": "文件ID格式错误",
		})
		return
	}

	// 删除文件
	err = h.fileService.DeleteFile(uint(fileID), uid)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"code":    1001,
			"message": "删除文件失败",
			"error":   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    0,
		"message": "文件删除成功",
	})
}

// GetFileStats 获取文件统计信息
func (h *FileHandler) GetFileStats(c *gin.Context) {
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

	// 获取统计信息
	stats, err := h.fileService.GetFileStats(uid)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"code":    5000,
			"message": "获取统计信息失败",
			"error":   err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code":    0,
		"message": "获取成功",
		"data":    stats,
	})
}
