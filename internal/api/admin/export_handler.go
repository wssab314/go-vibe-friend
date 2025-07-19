package admin

import (
	"net/http"
	"strconv"

	"go-vibe-friend/internal/service"

	"github.com/gin-gonic/gin"
)

type ExportHandler struct {
	exportService *service.ExportService
}

func NewExportHandler(exportService *service.ExportService) *ExportHandler {
	return &ExportHandler{
		exportService: exportService,
	}
}

// ExportData 导出数据
func (h *ExportHandler) ExportData(c *gin.Context) {
	var req service.ExportRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request parameters",
		})
		return
	}

	// 验证数据类型
	validTypes := []string{"users", "jobs", "files", "emails", "permissions", "system_report"}
	validType := false
	for _, t := range validTypes {
		if req.DataType == t {
			validType = true
			break
		}
	}
	if !validType {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid data type",
		})
		return
	}

	// 验证格式
	validFormats := []string{"csv", "json"}
	validFormat := false
	for _, f := range validFormats {
		if req.Format == f {
			validFormat = true
			break
		}
	}
	if !validFormat {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid format",
		})
		return
	}

	// 执行导出
	result, err := h.exportService.ExportData(&req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":      "导出成功",
		"file_name":    result.FileName,
		"file_size":    result.FileSize,
		"record_count": result.RecordCount,
		"created_at":   result.CreatedAt,
		"expires_at":   result.ExpiresAt,
		"download_url": "/api/admin/export/download/" + result.FileName,
	})
}

// DownloadExport 下载导出文件
func (h *ExportHandler) DownloadExport(c *gin.Context) {
	fileName := c.Param("filename")
	if fileName == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "文件名不能为空",
		})
		return
	}

	filePath, err := h.exportService.GetExportFile(fileName)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "文件不存在或已过期",
		})
		return
	}

	// 设置响应头
	c.Header("Content-Type", "application/octet-stream")
	c.Header("Content-Disposition", "attachment; filename=\""+fileName+"\"")
	c.Header("Content-Transfer-Encoding", "binary")

	// 返回文件
	c.File(filePath)
}

// ExportUserData 导出用户数据
func (h *ExportHandler) ExportUserData(c *gin.Context) {
	userIDStr := c.Param("id")
	userID, err := strconv.ParseUint(userIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid user ID",
		})
		return
	}

	// 获取查询参数
	dataType := c.DefaultQuery("type", "users")
	format := c.DefaultQuery("format", "json")

	uid := uint(userID)
	req := &service.ExportRequest{
		DataType: dataType,
		Format:   format,
		UserID:   &uid,
	}

	// 执行导出
	result, err := h.exportService.ExportData(req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":      "用户数据导出成功",
		"file_name":    result.FileName,
		"file_size":    result.FileSize,
		"record_count": result.RecordCount,
		"created_at":   result.CreatedAt,
		"expires_at":   result.ExpiresAt,
		"download_url": "/api/admin/export/download/" + result.FileName,
	})
}

// ExportSystemReport 导出系统报告
func (h *ExportHandler) ExportSystemReport(c *gin.Context) {
	format := c.DefaultQuery("format", "json")

	req := &service.ExportRequest{
		DataType: "system_report",
		Format:   format,
	}

	// 执行导出
	result, err := h.exportService.ExportData(req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message":      "系统报告导出成功",
		"file_name":    result.FileName,
		"file_size":    result.FileSize,
		"record_count": result.RecordCount,
		"created_at":   result.CreatedAt,
		"expires_at":   result.ExpiresAt,
		"download_url": "/api/admin/export/download/" + result.FileName,
	})
}

// GetExportTypes 获取支持的导出类型
func (h *ExportHandler) GetExportTypes(c *gin.Context) {
	types := []map[string]interface{}{
		{
			"type":        "users",
			"name":        "用户数据",
			"description": "导出用户基本信息",
			"formats":     []string{"csv", "json"},
		},
		{
			"type":        "jobs",
			"name":        "任务数据",
			"description": "导出生成任务信息",
			"formats":     []string{"csv", "json"},
		},
		{
			"type":        "files",
			"name":        "文件数据",
			"description": "导出文件管理信息",
			"formats":     []string{"csv", "json"},
		},
		{
			"type":        "emails",
			"name":        "邮件数据",
			"description": "导出邮件发送日志",
			"formats":     []string{"csv", "json"},
		},
		{
			"type":        "permissions",
			"name":        "权限数据",
			"description": "导出权限配置信息",
			"formats":     []string{"json"},
		},
		{
			"type":        "system_report",
			"name":        "系统报告",
			"description": "导出系统整体统计报告",
			"formats":     []string{"json"},
		},
	}

	c.JSON(http.StatusOK, gin.H{
		"export_types": types,
	})
}

// GetExportTemplates 获取导出模板
func (h *ExportHandler) GetExportTemplates(c *gin.Context) {
	templates := []map[string]interface{}{
		{
			"name":        "用户报告",
			"description": "包含用户基本信息的完整报告",
			"data_type":   "users",
			"format":      "csv",
			"filters":     map[string]string{},
		},
		{
			"name":        "任务统计",
			"description": "生成任务的统计分析",
			"data_type":   "jobs",
			"format":      "json",
			"filters":     map[string]string{},
		},
		{
			"name":        "系统概览",
			"description": "系统整体运行状况报告",
			"data_type":   "system_report",
			"format":      "json",
			"filters":     map[string]string{},
		},
	}

	c.JSON(http.StatusOK, gin.H{
		"templates": templates,
	})
}

// CleanupExpiredExports 清理过期的导出文件
func (h *ExportHandler) CleanupExpiredExports(c *gin.Context) {
	err := h.exportService.CleanupExpiredExports()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "清理失败: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "过期文件清理完成",
	})
}