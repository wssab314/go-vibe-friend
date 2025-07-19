package service

import (
	"crypto/md5"
	"fmt"
	"io"
	"mime/multipart"
	"os"
	"path/filepath"
	"strings"
	"time"

	"go-vibe-friend/internal/models"
	"go-vibe-friend/internal/store"
)

type FileService struct {
	fileStore   *store.FileStore
	uploadPath  string
	maxFileSize int64
	allowedMimes []string
}

func NewFileService(fileStore *store.FileStore) *FileService {
	return &FileService{
		fileStore:   fileStore,
		uploadPath:  "uploads", // 可配置
		maxFileSize: 10 * 1024 * 1024, // 10MB
		allowedMimes: []string{
			"image/jpeg",
			"image/png",
			"image/gif",
			"image/webp",
			"application/pdf",
			"text/plain",
			"application/json",
		},
	}
}

// UploadFile 上传文件
func (s *FileService) UploadFile(file *multipart.FileHeader, userID uint, category string) (*models.File, error) {
	// 验证文件大小
	if file.Size > s.maxFileSize {
		return nil, fmt.Errorf("文件大小超过限制: %d bytes", s.maxFileSize)
	}

	// 打开文件
	src, err := file.Open()
	if err != nil {
		return nil, fmt.Errorf("打开文件失败: %v", err)
	}
	defer src.Close()

	// 计算文件哈希
	hash := md5.New()
	if _, err := io.Copy(hash, src); err != nil {
		return nil, fmt.Errorf("计算文件哈希失败: %v", err)
	}
	fileHash := fmt.Sprintf("%x", hash.Sum(nil))

	// 检查文件是否已存在
	existingFile, err := s.fileStore.GetFileByHash(fileHash)
	if err != nil {
		return nil, fmt.Errorf("检查文件是否存在失败: %v", err)
	}
	if existingFile != nil {
		// 文件已存在，返回现有文件信息
		return existingFile, nil
	}

	// 重置文件指针
	src.Seek(0, 0)

	// 验证MIME类型
	mimeType := file.Header.Get("Content-Type")
	if !s.isAllowedMimeType(mimeType) {
		return nil, fmt.Errorf("不支持的文件类型: %s", mimeType)
	}

	// 生成文件路径
	now := time.Now()
	fileName := fmt.Sprintf("%d_%s_%s", userID, now.Format("20060102150405"), fileHash)
	
	// 获取文件扩展名
	ext := filepath.Ext(file.Filename)
	if ext != "" {
		fileName += ext
	}

	// 创建目录结构
	dateDir := now.Format("2006/01/02")
	fullDir := filepath.Join(s.uploadPath, category, dateDir)
	if err := os.MkdirAll(fullDir, 0755); err != nil {
		return nil, fmt.Errorf("创建目录失败: %v", err)
	}

	// 完整文件路径
	filePath := filepath.Join(fullDir, fileName)

	// 创建目标文件
	dst, err := os.Create(filePath)
	if err != nil {
		return nil, fmt.Errorf("创建文件失败: %v", err)
	}
	defer dst.Close()

	// 复制文件内容
	if _, err := io.Copy(dst, src); err != nil {
		return nil, fmt.Errorf("保存文件失败: %v", err)
	}

	// 创建文件记录
	fileModel := &models.File{
		FileName:     fileName,
		OriginalName: file.Filename,
		FilePath:     filePath,
		FileSize:     file.Size,
		MimeType:     mimeType,
		FileHash:     fileHash,
		UserID:       userID,
		Category:     category,
		IsPublic:     category == "avatar", // 头像默认公开
		Status:       "active",
	}

	if err := s.fileStore.CreateFile(fileModel); err != nil {
		// 如果数据库保存失败，删除已上传的文件
		os.Remove(filePath)
		return nil, fmt.Errorf("保存文件信息失败: %v", err)
	}

	return fileModel, nil
}

// GetFile 获取文件信息
func (s *FileService) GetFile(fileID uint, userID uint) (*models.File, error) {
	file, err := s.fileStore.GetFileByID(fileID)
	if err != nil {
		return nil, err
	}
	if file == nil {
		return nil, fmt.Errorf("文件不存在")
	}

	// 检查访问权限
	if !file.IsPublic && file.UserID != userID {
		return nil, fmt.Errorf("无权访问此文件")
	}

	return file, nil
}

// DeleteFile 删除文件
func (s *FileService) DeleteFile(fileID uint, userID uint) error {
	file, err := s.fileStore.GetFileByID(fileID)
	if err != nil {
		return err
	}
	if file == nil {
		return fmt.Errorf("文件不存在")
	}

	// 检查权限
	if file.UserID != userID {
		return fmt.Errorf("无权删除此文件")
	}

	// 软删除
	file.Status = "deleted"
	return s.fileStore.UpdateFile(file)
}

// GetUserFiles 获取用户文件列表
func (s *FileService) GetUserFiles(userID uint, category string, limit, offset int) ([]models.File, error) {
	return s.fileStore.GetFilesByUserID(userID, category, limit, offset)
}

// GetFileStats 获取文件统计信息
func (s *FileService) GetFileStats(userID uint) (map[string]interface{}, error) {
	return s.fileStore.GetFileStats(userID)
}

// UpdateAvatar 更新用户头像
func (s *FileService) UpdateAvatar(userID uint, file *multipart.FileHeader) (*models.File, error) {
	// 验证是否为图片
	mimeType := file.Header.Get("Content-Type")
	if !strings.HasPrefix(mimeType, "image/") {
		return nil, fmt.Errorf("头像必须是图片文件")
	}

	return s.UploadFile(file, userID, "avatar")
}

// isAllowedMimeType 检查MIME类型是否允许
func (s *FileService) isAllowedMimeType(mimeType string) bool {
	for _, allowed := range s.allowedMimes {
		if allowed == mimeType {
			return true
		}
	}
	return false
}

// GetFilePath 获取文件的完整路径
func (s *FileService) GetFilePath(file *models.File) string {
	return file.FilePath
}

// RecordUpload 记录上传操作
func (s *FileService) RecordUpload(fileID, userID uint, ipAddress, userAgent string) error {
	upload := &models.FileUpload{
		FileID:    fileID,
		UserID:    userID,
		IPAddress: ipAddress,
		UserAgent: userAgent,
		Status:    "completed",
	}
	return s.fileStore.CreateFileUpload(upload)
}