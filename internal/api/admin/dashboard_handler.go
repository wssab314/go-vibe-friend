package admin

import (
	"fmt"
	"net/http"
	"runtime"
	"strconv"
	"time"

	"go-vibe-friend/internal/store"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type DashboardHandler struct {
	userStore *store.UserStore
	jobStore  *store.JobStore
	db        *gorm.DB
	startTime time.Time
}

func NewDashboardHandler(userStore *store.UserStore, jobStore *store.JobStore, db *gorm.DB) *DashboardHandler {
	return &DashboardHandler{
		userStore: userStore,
		jobStore:  jobStore,
		db:        db,
		startTime: time.Now(),
	}
}

type DashboardStats struct {
	TotalUsers       int64                  `json:"total_users"`
	TotalJobs        int64                  `json:"total_jobs"`
	ActiveJobs       int64                  `json:"active_jobs"`
	CompletedJobs    int64                  `json:"completed_jobs"`
	RecentUsers      []UserSummary          `json:"recent_users"`
	RecentJobs       []JobSummary           `json:"recent_jobs"`
	UserGrowth       []TimeSeriesData       `json:"user_growth"`
	JobStatusBreakdown []StatusBreakdown    `json:"job_status_breakdown"`
}

type UserSummary struct {
	ID        uint      `json:"id"`
	Username  string    `json:"username"`
	Email     string    `json:"email"`
	Role      string    `json:"role"`
	CreatedAt time.Time `json:"created_at"`
}

type JobSummary struct {
	ID        uint      `json:"id"`
	UserID    uint      `json:"user_id"`
	Username  string    `json:"username"`
	Status    string    `json:"status"`
	JobType   string    `json:"job_type"`
	CreatedAt time.Time `json:"created_at"`
}

type TimeSeriesData = store.TimeSeriesData

type StatusBreakdown = store.StatusBreakdown

// 系统健康状态结构体
type SystemHealth struct {
	Uptime           string  `json:"uptime"`
	CPUUsage         float64 `json:"cpu_usage"`
	MemoryUsage      float64 `json:"memory_usage"`
	MemoryTotal      string  `json:"memory_total"`
	MemoryUsed       string  `json:"memory_used"`
	DBConnections    int     `json:"db_connections"`
	DBMaxConnections int     `json:"db_max_connections"`
	QueueDepth       int     `json:"queue_depth"`
}

// 数据库容量结构体
type DatabaseCapacity struct {
	TotalSize string      `json:"total_size"`
	Tables    []TableInfo `json:"tables"`
}

type TableInfo struct {
	Name       string  `json:"name"`
	SizeMB     float64 `json:"size_mb"`
	Percentage float64 `json:"percentage"`
	RowCount   int64   `json:"row_count"`
}

// Data Explorer相关结构体
type DataExplorerTable struct {
	Name        string  `json:"name"`
	Rows        int64   `json:"rows"`
	SizeMB      float64 `json:"size_mb"`
	Description string  `json:"description"`
}

type TableColumn struct {
	Name string `json:"name"`
	Type string `json:"type"`
}

type TableDataResponse struct {
	TableName  string                   `json:"table_name"`
	Columns    []TableColumn            `json:"columns"`
	Data       []map[string]interface{} `json:"data"`
	Page       int                      `json:"page"`
	Limit      int                      `json:"limit"`
	Total      int64                    `json:"total"`
	TotalPages int                      `json:"total_pages"`
}

func (h *DashboardHandler) GetStats(c *gin.Context) {
	stats := DashboardStats{}

	// Get user statistics
	totalUsers, err := h.userStore.GetTotalUsers()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get user statistics"})
		return
	}
	stats.TotalUsers = totalUsers

	// Get job statistics
	totalJobs, err := h.jobStore.GetTotalJobs()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get job statistics"})
		return
	}
	stats.TotalJobs = totalJobs

	activeJobs, err := h.jobStore.GetJobCountByStatus("pending", "in_progress")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get active jobs"})
		return
	}
	stats.ActiveJobs = activeJobs

	completedJobs, err := h.jobStore.GetJobCountByStatus("completed")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get completed jobs"})
		return
	}
	stats.CompletedJobs = completedJobs

	// Get recent users
	recentUsers, err := h.userStore.GetRecentUsers(5)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get recent users"})
		return
	}
	
	stats.RecentUsers = make([]UserSummary, len(recentUsers))
	for i, user := range recentUsers {
		stats.RecentUsers[i] = UserSummary{
			ID:        user.ID,
			Username:  user.Username,
			Email:     user.Email,
			Role:      "user", // 默认角色，需要时可以通过UserRole查询
			CreatedAt: user.CreatedAt,
		}
	}

	// Get recent jobs
	recentJobs, err := h.jobStore.GetRecentJobs(5)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get recent jobs"})
		return
	}
	
	stats.RecentJobs = make([]JobSummary, len(recentJobs))
	for i, job := range recentJobs {
		// 获取用户名，如果没有关联用户则使用默认值
		username := "Unknown"
		if user, err := h.userStore.GetUserByID(job.UserID); err == nil && user != nil {
			username = user.Username
		}
		
		stats.RecentJobs[i] = JobSummary{
			ID:        job.ID,
			UserID:    job.UserID,
			Username:  username,
			Status:    string(job.Status),
			JobType:   job.JobType,
			CreatedAt: job.CreatedAt,
		}
	}

	// Get user growth data (last 7 days)
	userGrowth, err := h.userStore.GetUserGrowth(7)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get user growth data"})
		return
	}
	stats.UserGrowth = userGrowth

	// Get job status breakdown
	jobStatusBreakdown, err := h.jobStore.GetJobStatusBreakdown()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get job status breakdown"})
		return
	}
	stats.JobStatusBreakdown = jobStatusBreakdown

	c.JSON(http.StatusOK, stats)
}

func (h *DashboardHandler) GetSystemInfo(c *gin.Context) {
	info := map[string]interface{}{
		"version":     "1.0.0",
		"environment": "development",
		"uptime":      time.Since(time.Now().Add(-time.Hour * 24)).String(),
		"go_version":  "1.22+",
		"database":    "PostgreSQL",
		"features": []string{
			"User Management",
			"JWT Authentication",
			"AI Code Generation",
			"File Upload",
			"Real-time Dashboard",
		},
	}

	c.JSON(http.StatusOK, info)
}

// GetSystemHealth 获取系统健康状态
func (h *DashboardHandler) GetSystemHealth(c *gin.Context) {
	var mem runtime.MemStats
	runtime.ReadMemStats(&mem)

	// 计算运行时间
	uptime := time.Since(h.startTime)
	uptimeStr := formatUptime(uptime)

	// 获取数据库连接信息
	sqlDB, err := h.db.DB()
	var dbConnections, dbMaxConnections int
	if err == nil {
		dbStats := sqlDB.Stats()
		dbConnections = dbStats.OpenConnections
		dbMaxConnections = dbStats.MaxOpenConnections
		if dbMaxConnections == 0 {
			dbMaxConnections = 100 // 默认值
		}
	}

	// 计算内存使用情况
	memoryUsedMB := float64(mem.Alloc) / 1024 / 1024
	memoryTotalMB := float64(mem.Sys) / 1024 / 1024
	memoryUsagePercent := (memoryUsedMB / memoryTotalMB) * 100

	// 获取队列深度（待处理的Job数量）
	queueDepth := int64(0)
	if depth, err := h.jobStore.GetJobCountByStatus("pending"); err == nil {
		queueDepth = depth
	}

	health := SystemHealth{
		Uptime:           uptimeStr,
		CPUUsage:         roundToTwoDecimals(getCPUUsage()), // 简化的CPU使用率
		MemoryUsage:      roundToTwoDecimals(memoryUsagePercent),
		MemoryTotal:      formatMemory(memoryTotalMB),
		MemoryUsed:       formatMemory(memoryUsedMB),
		DBConnections:    dbConnections,
		DBMaxConnections: dbMaxConnections,
		QueueDepth:       int(queueDepth),
	}

	c.JSON(http.StatusOK, health)
}

// GetDatabaseCapacity 获取数据库容量信息
func (h *DashboardHandler) GetDatabaseCapacity(c *gin.Context) {
	tables := []string{"users", "jobs", "files", "sessions", "permissions", "user_roles", "roles", "audit_logs"}
	var tableInfos []TableInfo
	var totalSizeMB float64

	for _, tableName := range tables {
		// 获取表的行数
		var rowCount int64
		h.db.Table(tableName).Count(&rowCount)

		// 估算表大小（这是一个简化的估算）
		// 在生产环境中，您可能需要使用数据库特定的查询来获取准确的表大小
		sizeMB := estimateTableSize(tableName, rowCount)
		totalSizeMB += sizeMB

		tableInfos = append(tableInfos, TableInfo{
			Name:     tableName,
			SizeMB:   roundToTwoDecimals(sizeMB),
			RowCount: rowCount,
		})
	}

	// 计算百分比
	for i := range tableInfos {
		if totalSizeMB > 0 {
			tableInfos[i].Percentage = roundToTwoDecimals((tableInfos[i].SizeMB / totalSizeMB) * 100)
		}
	}

	// 按大小排序，只返回前5个最大的表
	// 这里简化处理，实际中可以使用sort包
	var topTables []TableInfo
	for len(topTables) < 5 && len(topTables) < len(tableInfos) {
		maxIdx := 0
		maxSize := 0.0
		for i, table := range tableInfos {
			if table.SizeMB > maxSize {
				// 检查是否已经在topTables中
				found := false
				for _, top := range topTables {
					if top.Name == table.Name {
						found = true
						break
					}
				}
				if !found {
					maxSize = table.SizeMB
					maxIdx = i
				}
			}
		}
		if maxSize > 0 {
			topTables = append(topTables, tableInfos[maxIdx])
		} else {
			break
		}
	}

	capacity := DatabaseCapacity{
		TotalSize: formatMemory(totalSizeMB),
		Tables:    topTables,
	}

	c.JSON(http.StatusOK, capacity)
}

// GetDataExplorerTables 获取数据库表信息用于Data Explorer
func (h *DashboardHandler) GetDataExplorerTables(c *gin.Context) {
	tables := []string{"users", "jobs", "files", "sessions", "permissions", "user_roles", "roles", "audit_logs", "email_logs"}
	var tableInfos []DataExplorerTable

	for _, tableName := range tables {
		// 获取表的行数
		var rowCount int64
		h.db.Table(tableName).Count(&rowCount)

		// 估算表大小
		sizeMB := estimateTableSize(tableName, rowCount)

		// 获取表描述
		description := getTableDescription(tableName)

		tableInfos = append(tableInfos, DataExplorerTable{
			Name:        tableName,
			Rows:        rowCount,
			SizeMB:      roundToTwoDecimals(sizeMB),
			Description: description,
		})
	}

	c.JSON(http.StatusOK, tableInfos)
}

// GetTableData 获取指定表的数据
func (h *DashboardHandler) GetTableData(c *gin.Context) {
	tableName := c.Param("table")
	page := c.DefaultQuery("page", "1")
	limit := c.DefaultQuery("limit", "20")

	// 验证表名
	allowedTables := map[string]bool{
		"users": true, "jobs": true, "files": true, "sessions": true,
		"permissions": true, "user_roles": true, "roles": true, 
		"audit_logs": true, "email_logs": true,
	}
	
	if !allowedTables[tableName] {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid table name"})
		return
	}

	// 转换分页参数
	pageInt, err := strconv.Atoi(page)
	if err != nil || pageInt < 1 {
		pageInt = 1
	}
	
	limitInt, err := strconv.Atoi(limit)
	if err != nil || limitInt < 1 || limitInt > 100 {
		limitInt = 20
	}

	offset := (pageInt - 1) * limitInt

	// 获取表结构
	columns, err := h.getTableColumns(tableName)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get table structure"})
		return
	}

	// 获取数据
	var results []map[string]interface{}
	if err := h.db.Table(tableName).Limit(limitInt).Offset(offset).Find(&results).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch table data"})
		return
	}

	// 获取总数
	var totalCount int64
	h.db.Table(tableName).Count(&totalCount)

	response := TableDataResponse{
		TableName:   tableName,
		Columns:     columns,
		Data:        results,
		Page:        pageInt,
		Limit:       limitInt,
		Total:       totalCount,
		TotalPages:  int((totalCount + int64(limitInt) - 1) / int64(limitInt)),
	}

	c.JSON(http.StatusOK, response)
}

// 辅助函数
func formatUptime(duration time.Duration) string {
	days := int(duration.Hours()) / 24
	hours := int(duration.Hours()) % 24
	minutes := int(duration.Minutes()) % 60

	if days > 0 {
		return fmt.Sprintf("%dd %dh %dm", days, hours, minutes)
	} else if hours > 0 {
		return fmt.Sprintf("%dh %dm", hours, minutes)
	} else {
		return fmt.Sprintf("%dm", minutes)
	}
}

func formatMemory(mb float64) string {
	if mb > 1024 {
		return fmt.Sprintf("%.2f GB", mb/1024)
	}
	return fmt.Sprintf("%.2f MB", mb)
}

func roundToTwoDecimals(val float64) float64 {
	return float64(int(val*100+0.5)) / 100
}

func getCPUUsage() float64 {
	// 这是一个简化的CPU使用率计算
	// 在生产环境中，您可能需要使用更复杂的方法来获取准确的CPU使用率
	// 例如使用 github.com/shirou/gopsutil 包
	numCPU := runtime.NumCPU()
	numGoroutine := runtime.NumGoroutine()
	
	// 简单估算：基于Goroutine数量和CPU核心数
	usage := float64(numGoroutine) / float64(numCPU) * 10
	if usage > 100 {
		usage = 100
	}
	if usage < 5 {
		usage = 5 // 最小值
	}
	return usage
}

func estimateTableSize(tableName string, rowCount int64) float64 {
	// 简化的表大小估算，基于表名和行数
	// 在实际应用中，您应该使用数据库特定的查询来获取准确的表大小
	baseSize := map[string]float64{
		"users":      0.5,  // KB per row
		"jobs":       1.0,  // KB per row
		"files":      0.3,  // KB per row
		"sessions":   0.2,  // KB per row
		"permissions": 0.1, // KB per row
		"user_roles": 0.05, // KB per row
		"roles":      0.1,  // KB per row
		"audit_logs": 0.8,  // KB per row
	}

	sizePerRow := baseSize[tableName]
	if sizePerRow == 0 {
		sizePerRow = 0.5 // 默认值
	}

	sizeMB := (float64(rowCount) * sizePerRow) / 1024
	if sizeMB < 0.1 {
		sizeMB = 0.1 // 最小值
	}
	return sizeMB
}

func getTableDescription(tableName string) string {
	descriptions := map[string]string{
		"users":       "用户账户信息",
		"jobs":        "任务处理记录", 
		"files":       "文件上传记录",
		"sessions":    "用户会话数据",
		"permissions": "权限配置信息",
		"user_roles":  "用户角色关联",
		"roles":       "角色定义信息",
		"audit_logs":  "系统审计日志",
		"email_logs":  "邮件发送日志",
	}
	
	if desc, exists := descriptions[tableName]; exists {
		return desc
	}
	return "数据表"
}

func (h *DashboardHandler) getTableColumns(tableName string) ([]TableColumn, error) {
	// 基本的列信息映射，在实际应用中可以通过数据库查询获取
	columnMappings := map[string][]TableColumn{
		"users": {
			{Name: "id", Type: "integer"},
			{Name: "username", Type: "string"},
			{Name: "email", Type: "string"},
			{Name: "created_at", Type: "timestamp"},
			{Name: "updated_at", Type: "timestamp"},
		},
		"jobs": {
			{Name: "id", Type: "integer"},
			{Name: "user_id", Type: "integer"},
			{Name: "status", Type: "string"},
			{Name: "job_type", Type: "string"},
			{Name: "created_at", Type: "timestamp"},
			{Name: "updated_at", Type: "timestamp"},
		},
		"files": {
			{Name: "id", Type: "integer"},
			{Name: "user_id", Type: "integer"},
			{Name: "filename", Type: "string"},
			{Name: "file_size", Type: "integer"},
			{Name: "created_at", Type: "timestamp"},
		},
		"sessions": {
			{Name: "id", Type: "integer"},
			{Name: "user_id", Type: "integer"},
			{Name: "token", Type: "string"},
			{Name: "expires_at", Type: "timestamp"},
			{Name: "created_at", Type: "timestamp"},
		},
		"permissions": {
			{Name: "id", Type: "integer"},
			{Name: "name", Type: "string"},
			{Name: "resource", Type: "string"},
			{Name: "action", Type: "string"},
			{Name: "created_at", Type: "timestamp"},
		},
		"user_roles": {
			{Name: "id", Type: "integer"},
			{Name: "user_id", Type: "integer"},
			{Name: "role_id", Type: "integer"},
			{Name: "created_at", Type: "timestamp"},
		},
		"roles": {
			{Name: "id", Type: "integer"},
			{Name: "name", Type: "string"},
			{Name: "description", Type: "string"},
			{Name: "created_at", Type: "timestamp"},
		},
		"audit_logs": {
			{Name: "id", Type: "integer"},
			{Name: "user_id", Type: "integer"},
			{Name: "action", Type: "string"},
			{Name: "resource", Type: "string"},
			{Name: "created_at", Type: "timestamp"},
		},
		"email_logs": {
			{Name: "id", Type: "integer"},
			{Name: "user_id", Type: "integer"},
			{Name: "email_type", Type: "string"},
			{Name: "status", Type: "string"},
			{Name: "created_at", Type: "timestamp"},
		},
	}
	
	if columns, exists := columnMappings[tableName]; exists {
		return columns, nil
	}
	
	// 默认列结构
	return []TableColumn{
		{Name: "id", Type: "integer"},
		{Name: "created_at", Type: "timestamp"},
		{Name: "updated_at", Type: "timestamp"},
	}, nil
}