package admin

import (
	"net/http"
	"strconv"

	"go-vibe-friend/internal/models"
	"go-vibe-friend/internal/store"

	"github.com/gin-gonic/gin"
)

type JobHandler struct {
	jobStore *store.JobStore
}

func NewJobHandler(jobStore *store.JobStore) *JobHandler {
	return &JobHandler{
		jobStore: jobStore,
	}
}

type CreateJobRequest struct {
	JobType   string `json:"job_type" binding:"required"`
	InputData string `json:"input_data"`
}

func (h *JobHandler) CreateJob(c *gin.Context) {
	var req CreateJobRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	job := &models.GenerationJob{
		UserID:    userID.(uint),
		Status:    "pending",
		JobType:   req.JobType,
		InputData: req.InputData,
	}

	if err := h.jobStore.CreateJob(job); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create job"})
		return
	}

	c.JSON(http.StatusCreated, gin.H{"job": job})
}

func (h *JobHandler) ListJobs(c *gin.Context) {
	limitStr := c.DefaultQuery("limit", "10")
	offsetStr := c.DefaultQuery("offset", "0")
	status := c.Query("status")
	userIDStr := c.Query("user_id")

	limit, err := strconv.Atoi(limitStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid limit parameter"})
		return
	}

	offset, err := strconv.Atoi(offsetStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid offset parameter"})
		return
	}

	var jobs []models.GenerationJob

	if userIDStr != "" {
		userID, err := strconv.ParseUint(userIDStr, 10, 32)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid user_id parameter"})
			return
		}
		jobs, err = h.jobStore.GetJobsByUserID(uint(userID), limit, offset)
	} else if status != "" {
		jobs, err = h.jobStore.GetJobsByStatus(status, limit, offset)
	} else {
		jobs, err = h.jobStore.ListJobs(limit, offset)
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch jobs"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"jobs":  jobs,
		"count": len(jobs),
	})
}

func (h *JobHandler) GetJob(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid job ID"})
		return
	}

	job, err := h.jobStore.GetJobByID(uint(id))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch job"})
		return
	}

	if job == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Job not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"job": job})
}

func (h *JobHandler) UpdateJob(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid job ID"})
		return
	}

	job, err := h.jobStore.GetJobByID(uint(id))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch job"})
		return
	}

	if job == nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Job not found"})
		return
	}

	var updateData map[string]interface{}
	if err := c.ShouldBindJSON(&updateData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Update allowed fields
	if status, ok := updateData["status"].(string); ok {
		job.Status = status
	}
	if outputData, ok := updateData["output_data"].(string); ok {
		job.OutputData = outputData
	}
	if errorMsg, ok := updateData["error_msg"].(string); ok {
		job.ErrorMsg = errorMsg
	}

	if err := h.jobStore.UpdateJob(job); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update job"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"job": job})
}

func (h *JobHandler) DeleteJob(c *gin.Context) {
	idStr := c.Param("id")
	id, err := strconv.ParseUint(idStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid job ID"})
		return
	}

	err = h.jobStore.DeleteJob(uint(id))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete job"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Job deleted successfully"})
}

// Demo endpoint to create sample jobs
func (h *JobHandler) CreateSampleJobs(c *gin.Context) {
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	sampleJobs := []models.GenerationJob{
		{
			UserID:    userID.(uint),
			Status:    "completed",
			JobType:   "frontend-analysis",
			InputData: "React component analysis",
			OutputData: "Generated API endpoints and models",
		},
		{
			UserID:    userID.(uint),
			Status:    "pending",
			JobType:   "code-generation",
			InputData: "Vue.js application upload",
		},
		{
			UserID:    userID.(uint),
			Status:    "in_progress",
			JobType:   "database-schema",
			InputData: "Angular frontend analysis",
		},
		{
			UserID:    userID.(uint),
			Status:    "failed",
			JobType:   "api-generation",
			InputData: "React Native app structure",
			ErrorMsg:  "Invalid input format",
		},
	}

	createdJobs := 0
	for _, job := range sampleJobs {
		if err := h.jobStore.CreateJob(&job); err == nil {
			createdJobs++
		}
	}

	c.JSON(http.StatusCreated, gin.H{
		"message": "Sample jobs created",
		"created": createdJobs,
	})
}