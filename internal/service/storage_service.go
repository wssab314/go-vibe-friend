package service

import (
	"context"
	"fmt"
	"io"
	"path/filepath"
	"strings"
	"go-vibe-friend/internal/config"

	"github.com/minio/minio-go/v7"
)

type StorageService struct {
	minioClient *minio.Client
	cfg         *config.Config
}

func NewStorageService(minioClient *minio.Client, cfg *config.Config) *StorageService {
	return &StorageService{
		minioClient: minioClient,
		cfg:         cfg,
	}
}

type MinioObjectInfo struct {
	Key          string `json:"key"`
	Size         int64  `json:"size"`
	LastModified string `json:"last_modified"`
	ContentType  string `json:"content_type"`
	URL          string `json:"url"`
}

func (s *StorageService) ListObjects(prefix string, recursive bool) ([]MinioObjectInfo, error) {
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	bucketName := s.cfg.MinIO.BucketName
	objectCh := s.minioClient.ListObjects(ctx, bucketName, minio.ListObjectsOptions{
		Prefix:    prefix,
		Recursive: recursive,
	})

	var objects []MinioObjectInfo
	for object := range objectCh {
		if object.Err != nil {
			return nil, object.Err
		}
		
		url := fmt.Sprintf("%s/%s/%s", s.cfg.MinIO.Endpoint, bucketName, object.Key)

		// 获取详细的对象信息来获取content type
		contentType := object.ContentType
		if contentType == "" {
			// 如果ListObjects没有返回content type，尝试从StatObject获取
			if stat, err := s.minioClient.StatObject(ctx, bucketName, object.Key, minio.StatObjectOptions{}); err == nil {
				contentType = stat.ContentType
			}
		}

		// 如果仍然为空，基于文件扩展名推断
		if contentType == "" {
			contentType = s.inferContentTypeFromExtension(object.Key)
		}

		objects = append(objects, MinioObjectInfo{
			Key:          object.Key,
			Size:         object.Size,
			LastModified: object.LastModified.Format("2006-01-02 15:04:05"),
			ContentType:  contentType,
			URL:          url,
		})
	}

	return objects, nil
}

// inferContentTypeFromExtension 基于文件扩展名推断content type
func (s *StorageService) inferContentTypeFromExtension(filename string) string {
	ext := strings.ToLower(filepath.Ext(filename))
	
	contentTypes := map[string]string{
		".txt":  "text/plain",
		".md":   "text/markdown",
		".html": "text/html",
		".css":  "text/css",
		".js":   "application/javascript",
		".json": "application/json",
		".xml":  "application/xml",
		".pdf":  "application/pdf",
		".doc":  "application/msword",
		".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
		".xls":  "application/vnd.ms-excel",
		".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
		".ppt":  "application/vnd.ms-powerpoint",
		".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
		".zip":  "application/zip",
		".tar":  "application/x-tar",
		".gz":   "application/gzip",
		".rar":  "application/x-rar-compressed",
		".jpg":  "image/jpeg",
		".jpeg": "image/jpeg",
		".png":  "image/png",
		".gif":  "image/gif",
		".bmp":  "image/bmp",
		".svg":  "image/svg+xml",
		".ico":  "image/x-icon",
		".webp": "image/webp",
		".mp3":  "audio/mpeg",
		".wav":  "audio/wav",
		".ogg":  "audio/ogg",
		".mp4":  "video/mp4",
		".avi":  "video/x-msvideo",
		".mov":  "video/quicktime",
		".wmv":  "video/x-ms-wmv",
		".flv":  "video/x-flv",
		".webm": "video/webm",
	}
	
	if contentType, exists := contentTypes[ext]; exists {
		return contentType
	}
	
	return "application/octet-stream"
}

// GetObject 获取对象内容
func (s *StorageService) GetObject(objectKey string) (io.ReadCloser, error) {
	ctx := context.Background()
	bucketName := s.cfg.MinIO.BucketName
	
	object, err := s.minioClient.GetObject(ctx, bucketName, objectKey, minio.GetObjectOptions{})
	if err != nil {
		return nil, fmt.Errorf("failed to get object: %w", err)
	}
	
	return object, nil
}

// GetObjectInfo 获取对象信息
func (s *StorageService) GetObjectInfo(objectKey string) (*MinioObjectInfo, error) {
	ctx := context.Background()
	bucketName := s.cfg.MinIO.BucketName
	
	stat, err := s.minioClient.StatObject(ctx, bucketName, objectKey, minio.StatObjectOptions{})
	if err != nil {
		return nil, fmt.Errorf("failed to get object info: %w", err)
	}
	
	contentType := stat.ContentType
	if contentType == "" {
		contentType = s.inferContentTypeFromExtension(objectKey)
	}
	
	url := fmt.Sprintf("%s/%s/%s", s.cfg.MinIO.Endpoint, bucketName, objectKey)
	
	return &MinioObjectInfo{
		Key:          objectKey,
		Size:         stat.Size,
		LastModified: stat.LastModified.Format("2006-01-02 15:04:05"),
		ContentType:  contentType,
		URL:          url,
	}, nil
}
