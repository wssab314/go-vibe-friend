package service

import (
	"encoding/csv"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"strconv"
	"time"

	"go-vibe-friend/internal/models"
	"go-vibe-friend/internal/store"
)

type ExportService struct {
	userStore       *store.UserStore
	jobStore        *store.JobStore
	fileStore       *store.FileStore
	emailStore      *store.EmailStore
	permissionStore *store.PermissionStore
	exportPath      string
}

func NewExportService(userStore *store.UserStore, jobStore *store.JobStore, fileStore *store.FileStore, emailStore *store.EmailStore, permissionStore *store.PermissionStore) *ExportService {
	return &ExportService{
		userStore:       userStore,
		jobStore:        jobStore,
		fileStore:       fileStore,
		emailStore:      emailStore,
		permissionStore: permissionStore,
		exportPath:      "exports",
	}
}

// ExportRequest 导出请求
type ExportRequest struct {
	DataType    string            `json:"data_type"`    // users, jobs, files, emails, permissions
	Format      string            `json:"format"`       // csv, json, xlsx
	DateRange   *DateRange        `json:"date_range,omitempty"`
	Filters     map[string]string `json:"filters,omitempty"`
	UserID      *uint             `json:"user_id,omitempty"` // 用于用户特定数据导出
	IncludeData []string          `json:"include_data,omitempty"`
}

type DateRange struct {
	StartDate string `json:"start_date"`
	EndDate   string `json:"end_date"`
}

type ExportResult struct {
	FilePath    string    `json:"file_path"`
	FileName    string    `json:"file_name"`
	FileSize    int64     `json:"file_size"`
	RecordCount int       `json:"record_count"`
	CreatedAt   time.Time `json:"created_at"`
	ExpiresAt   time.Time `json:"expires_at"`
}

// ExportData 导出数据
func (s *ExportService) ExportData(req *ExportRequest) (*ExportResult, error) {
	// 确保导出目录存在
	if err := os.MkdirAll(s.exportPath, 0755); err != nil {
		return nil, fmt.Errorf("创建导出目录失败: %v", err)
	}

	// 生成文件名
	timestamp := time.Now().Format("20060102_150405")
	fileName := fmt.Sprintf("%s_%s.%s", req.DataType, timestamp, req.Format)
	filePath := filepath.Join(s.exportPath, fileName)

	var recordCount int
	var err error

	// 根据数据类型执行导出
	switch req.DataType {
	case "users":
		recordCount, err = s.exportUsers(filePath, req)
	case "jobs":
		recordCount, err = s.exportJobs(filePath, req)
	case "files":
		recordCount, err = s.exportFiles(filePath, req)
	case "emails":
		recordCount, err = s.exportEmails(filePath, req)
	case "permissions":
		recordCount, err = s.exportPermissions(filePath, req)
	case "system_report":
		recordCount, err = s.exportSystemReport(filePath, req)
	default:
		return nil, fmt.Errorf("不支持的数据类型: %s", req.DataType)
	}

	if err != nil {
		return nil, fmt.Errorf("导出失败: %v", err)
	}

	// 获取文件大小
	fileInfo, err := os.Stat(filePath)
	if err != nil {
		return nil, fmt.Errorf("获取文件信息失败: %v", err)
	}

	return &ExportResult{
		FilePath:    filePath,
		FileName:    fileName,
		FileSize:    fileInfo.Size(),
		RecordCount: recordCount,
		CreatedAt:   time.Now(),
		ExpiresAt:   time.Now().Add(24 * time.Hour), // 24小时后过期
	}, nil
}

// exportUsers 导出用户数据
func (s *ExportService) exportUsers(filePath string, req *ExportRequest) (int, error) {
	// 获取用户列表
	users, err := s.userStore.ListUsers(1000, 0) // 限制最大1000条
	if err != nil {
		return 0, err
	}

	// 如果指定了用户ID，只导出该用户的数据
	if req.UserID != nil {
		user, err := s.userStore.GetUserByID(*req.UserID)
		if err != nil {
			return 0, err
		}
		if user != nil {
			users = []models.User{*user}
		} else {
			users = []models.User{}
		}
	}

	switch req.Format {
	case "csv":
		return s.exportUsersCSV(filePath, users)
	case "json":
		return s.exportUsersJSON(filePath, users)
	default:
		return 0, fmt.Errorf("不支持的格式: %s", req.Format)
	}
}

// exportUsersCSV 导出用户CSV
func (s *ExportService) exportUsersCSV(filePath string, users []models.User) (int, error) {
	file, err := os.Create(filePath)
	if err != nil {
		return 0, err
	}
	defer file.Close()

	writer := csv.NewWriter(file)
	defer writer.Flush()

	// 写入头部
	headers := []string{"ID", "用户名", "邮箱", "状态", "创建时间", "更新时间"}
	if err := writer.Write(headers); err != nil {
		return 0, err
	}

	// 写入数据
	for _, user := range users {
		record := []string{
			strconv.Itoa(int(user.ID)),
			user.Username,
			user.Email,
			user.Status,
			user.CreatedAt.Format("2006-01-02 15:04:05"),
			user.UpdatedAt.Format("2006-01-02 15:04:05"),
		}
		if err := writer.Write(record); err != nil {
			return 0, err
		}
	}

	return len(users), nil
}

// exportUsersJSON 导出用户JSON
func (s *ExportService) exportUsersJSON(filePath string, users []models.User) (int, error) {
	// 清除敏感信息
	for i := range users {
		users[i].Password = ""
	}

	file, err := os.Create(filePath)
	if err != nil {
		return 0, err
	}
	defer file.Close()

	encoder := json.NewEncoder(file)
	encoder.SetIndent("", "  ")
	
	if err := encoder.Encode(users); err != nil {
		return 0, err
	}

	return len(users), nil
}

// exportJobs 导出任务数据
func (s *ExportService) exportJobs(filePath string, req *ExportRequest) (int, error) {
	jobs, err := s.jobStore.ListJobs(1000, 0)
	if err != nil {
		return 0, err
	}

	// 如果指定了用户ID，只导出该用户的任务
	if req.UserID != nil {
		jobs, err = s.jobStore.GetJobsByUserID(*req.UserID, 1000, 0)
		if err != nil {
			return 0, err
		}
	}

	switch req.Format {
	case "csv":
		return s.exportJobsCSV(filePath, jobs)
	case "json":
		return s.exportJobsJSON(filePath, jobs)
	default:
		return 0, fmt.Errorf("不支持的格式: %s", req.Format)
	}
}

// exportJobsCSV 导出任务CSV
func (s *ExportService) exportJobsCSV(filePath string, jobs []models.GenerationJob) (int, error) {
	file, err := os.Create(filePath)
	if err != nil {
		return 0, err
	}
	defer file.Close()

	writer := csv.NewWriter(file)
	defer writer.Flush()

	// 写入头部
	headers := []string{"ID", "用户ID", "状态", "任务类型", "创建时间", "更新时间"}
	if err := writer.Write(headers); err != nil {
		return 0, err
	}

	// 写入数据
	for _, job := range jobs {
		record := []string{
			strconv.Itoa(int(job.ID)),
			strconv.Itoa(int(job.UserID)),
			job.Status,
			job.JobType,
			job.CreatedAt.Format("2006-01-02 15:04:05"),
			job.UpdatedAt.Format("2006-01-02 15:04:05"),
		}
		if err := writer.Write(record); err != nil {
			return 0, err
		}
	}

	return len(jobs), nil
}

// exportJobsJSON 导出任务JSON
func (s *ExportService) exportJobsJSON(filePath string, jobs []models.GenerationJob) (int, error) {
	file, err := os.Create(filePath)
	if err != nil {
		return 0, err
	}
	defer file.Close()

	encoder := json.NewEncoder(file)
	encoder.SetIndent("", "  ")
	
	if err := encoder.Encode(jobs); err != nil {
		return 0, err
	}

	return len(jobs), nil
}

// exportFiles 导出文件数据
func (s *ExportService) exportFiles(filePath string, req *ExportRequest) (int, error) {
	var files []models.File
	var err error

	if req.UserID != nil {
		files, err = s.fileStore.GetFilesByUserID(*req.UserID, "", 1000, 0)
	} else {
		// 需要在FileStore中添加GetAllFiles方法
		files = []models.File{} // 暂时返回空
	}

	if err != nil {
		return 0, err
	}

	switch req.Format {
	case "csv":
		return s.exportFilesCSV(filePath, files)
	case "json":
		return s.exportFilesJSON(filePath, files)
	default:
		return 0, fmt.Errorf("不支持的格式: %s", req.Format)
	}
}

// exportFilesCSV 导出文件CSV
func (s *ExportService) exportFilesCSV(filePath string, files []models.File) (int, error) {
	file, err := os.Create(filePath)
	if err != nil {
		return 0, err
	}
	defer file.Close()

	writer := csv.NewWriter(file)
	defer writer.Flush()

	// 写入头部
	headers := []string{"ID", "文件名", "原始名称", "大小", "类型", "分类", "用户ID", "创建时间"}
	if err := writer.Write(headers); err != nil {
		return 0, err
	}

	// 写入数据
	for _, f := range files {
		record := []string{
			strconv.Itoa(int(f.ID)),
			f.FileName,
			f.OriginalName,
			strconv.FormatInt(f.FileSize, 10),
			f.MimeType,
			f.Category,
			strconv.Itoa(int(f.UserID)),
			f.CreatedAt.Format("2006-01-02 15:04:05"),
		}
		if err := writer.Write(record); err != nil {
			return 0, err
		}
	}

	return len(files), nil
}

// exportFilesJSON 导出文件JSON
func (s *ExportService) exportFilesJSON(filePath string, files []models.File) (int, error) {
	file, err := os.Create(filePath)
	if err != nil {
		return 0, err
	}
	defer file.Close()

	encoder := json.NewEncoder(file)
	encoder.SetIndent("", "  ")
	
	if err := encoder.Encode(files); err != nil {
		return 0, err
	}

	return len(files), nil
}

// exportEmails 导出邮件数据
func (s *ExportService) exportEmails(filePath string, req *ExportRequest) (int, error) {
	emails, err := s.emailStore.GetEmailLogs(req.UserID, 1000, 0)
	if err != nil {
		return 0, err
	}

	switch req.Format {
	case "csv":
		return s.exportEmailsCSV(filePath, emails)
	case "json":
		return s.exportEmailsJSON(filePath, emails)
	default:
		return 0, fmt.Errorf("不支持的格式: %s", req.Format)
	}
}

// exportEmailsCSV 导出邮件CSV
func (s *ExportService) exportEmailsCSV(filePath string, emails []models.EmailLog) (int, error) {
	file, err := os.Create(filePath)
	if err != nil {
		return 0, err
	}
	defer file.Close()

	writer := csv.NewWriter(file)
	defer writer.Flush()

	// 写入头部
	headers := []string{"ID", "收件人", "主题", "状态", "类型", "发送时间", "创建时间"}
	if err := writer.Write(headers); err != nil {
		return 0, err
	}

	// 写入数据
	for _, email := range emails {
		sentAt := ""
		if email.SentAt != nil {
			sentAt = email.SentAt.Format("2006-01-02 15:04:05")
		}
		
		record := []string{
			strconv.Itoa(int(email.ID)),
			email.ToEmail,
			email.Subject,
			email.Status,
			email.EmailType,
			sentAt,
			email.CreatedAt.Format("2006-01-02 15:04:05"),
		}
		if err := writer.Write(record); err != nil {
			return 0, err
		}
	}

	return len(emails), nil
}

// exportEmailsJSON 导出邮件JSON
func (s *ExportService) exportEmailsJSON(filePath string, emails []models.EmailLog) (int, error) {
	file, err := os.Create(filePath)
	if err != nil {
		return 0, err
	}
	defer file.Close()

	encoder := json.NewEncoder(file)
	encoder.SetIndent("", "  ")
	
	if err := encoder.Encode(emails); err != nil {
		return 0, err
	}

	return len(emails), nil
}

// exportPermissions 导出权限数据
func (s *ExportService) exportPermissions(filePath string, req *ExportRequest) (int, error) {
	permissions, err := s.permissionStore.GetPermissions(1000, 0)
	if err != nil {
		return 0, err
	}

	switch req.Format {
	case "json":
		return s.exportPermissionsJSON(filePath, permissions)
	default:
		return 0, fmt.Errorf("权限数据仅支持JSON格式")
	}
}

// exportPermissionsJSON 导出权限JSON
func (s *ExportService) exportPermissionsJSON(filePath string, permissions []models.Permission) (int, error) {
	file, err := os.Create(filePath)
	if err != nil {
		return 0, err
	}
	defer file.Close()

	encoder := json.NewEncoder(file)
	encoder.SetIndent("", "  ")
	
	if err := encoder.Encode(permissions); err != nil {
		return 0, err
	}

	return len(permissions), nil
}

// exportSystemReport 导出系统报告
func (s *ExportService) exportSystemReport(filePath string, req *ExportRequest) (int, error) {
	// 收集系统统计信息
	report := make(map[string]interface{})
	
	// 用户统计
	totalUsers, _ := s.userStore.GetTotalUsers()
	report["user_stats"] = map[string]interface{}{
		"total_users": totalUsers,
	}
	
	// 任务统计
	totalJobs, _ := s.jobStore.GetTotalJobs()
	report["job_stats"] = map[string]interface{}{
		"total_jobs": totalJobs,
	}
	
	// 文件统计
	// 这里需要添加文件统计方法
	
	// 邮件统计
	emailStats, _ := s.emailStore.GetEmailStats()
	report["email_stats"] = emailStats
	
	// 权限统计
	permissionStats, _ := s.permissionStore.GetPermissionStats()
	report["permission_stats"] = permissionStats
	
	// 系统信息
	report["system_info"] = map[string]interface{}{
		"export_time": time.Now().Format("2006-01-02 15:04:05"),
		"version":     "1.0.0",
	}

	file, err := os.Create(filePath)
	if err != nil {
		return 0, err
	}
	defer file.Close()

	encoder := json.NewEncoder(file)
	encoder.SetIndent("", "  ")
	
	if err := encoder.Encode(report); err != nil {
		return 0, err
	}

	return 1, nil
}

// GetExportFile 获取导出文件
func (s *ExportService) GetExportFile(fileName string) (string, error) {
	filePath := filepath.Join(s.exportPath, fileName)
	if _, err := os.Stat(filePath); os.IsNotExist(err) {
		return "", fmt.Errorf("文件不存在")
	}
	return filePath, nil
}

// CleanupExpiredExports 清理过期的导出文件
func (s *ExportService) CleanupExpiredExports() error {
	files, err := filepath.Glob(filepath.Join(s.exportPath, "*"))
	if err != nil {
		return err
	}

	for _, file := range files {
		info, err := os.Stat(file)
		if err != nil {
			continue
		}

		// 删除24小时前的文件
		if time.Since(info.ModTime()) > 24*time.Hour {
			os.Remove(file)
		}
	}

	return nil
}