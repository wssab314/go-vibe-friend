package admin

import (
	"net/http"
	"time"

	"go-vibe-friend/internal/store"

	"github.com/gin-gonic/gin"
)

type DashboardHandler struct {
	userStore *store.UserStore
	jobStore  *store.JobStore
}

func NewDashboardHandler(userStore *store.UserStore, jobStore *store.JobStore) *DashboardHandler {
	return &DashboardHandler{
		userStore: userStore,
		jobStore:  jobStore,
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
			Role:      user.Role,
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
		stats.RecentJobs[i] = JobSummary{
			ID:        job.ID,
			UserID:    job.UserID,
			Username:  job.User.Username,
			Status:    job.Status,
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