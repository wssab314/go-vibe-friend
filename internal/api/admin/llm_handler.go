package admin

import (
	"net/http"
	"strconv"

	"go-vibe-friend/internal/llm"

	"github.com/gin-gonic/gin"
)

type LLMHandler struct {
	llmService *llm.Service
}

func NewLLMHandler(llmService *llm.Service) *LLMHandler {
	return &LLMHandler{
		llmService: llmService,
	}
}

type GenerateCodeRequest struct {
	ProjectName string            `json:"project_name" binding:"required"`
	Framework   string            `json:"framework" binding:"required"`
	Frontend    string            `json:"frontend"`
	ChatHistory string            `json:"chat_history"`
	Context     map[string]string `json:"context"`
}

type TestConnectionRequest struct {
	APIKey string `json:"api_key"`
}

type SimpleGenerateRequest struct {
	Prompt string `json:"prompt" binding:"required"`
}

// TestConnection tests the OpenAI API connection
func (h *LLMHandler) TestConnection(c *gin.Context) {
	if !h.llmService.IsConfigured() {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "OpenAI API key is not configured",
		})
		return
	}

	err := h.llmService.TestConnection(c.Request.Context())
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to connect to OpenAI: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "OpenAI API connection successful",
	})
}

// GenerateCode creates a new code generation job
func (h *LLMHandler) GenerateCode(c *gin.Context) {
	var req GenerateCodeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request: " + err.Error(),
		})
		return
	}

	// Get user ID from context
	userID, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{
			"error": "User not authenticated",
		})
		return
	}

	// Create generation job request
	jobReq := &llm.GenerationJobRequest{
		UserID:      userID.(uint),
		ProjectName: req.ProjectName,
		Framework:   req.Framework,
		Frontend:    req.Frontend,
		ChatHistory: req.ChatHistory,
		Context:     req.Context,
	}

	// Create the job
	job, err := h.llmService.CreateGenerationJob(c.Request.Context(), jobReq)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to create generation job: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusCreated, gin.H{
		"success": true,
		"job":     job,
		"message": "Code generation job created successfully",
	})
}

// GetJobStatus returns the status of a generation job
func (h *LLMHandler) GetJobStatus(c *gin.Context) {
	jobIDStr := c.Param("id")
	jobID, err := strconv.ParseUint(jobIDStr, 10, 32)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid job ID",
		})
		return
	}

	job, err := h.llmService.GetJobStatus(uint(jobID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to get job status: " + err.Error(),
		})
		return
	}

	if job == nil {
		c.JSON(http.StatusNotFound, gin.H{
			"error": "Job not found",
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"job":     job,
	})
}

// SimpleGenerate provides a simple code generation interface
func (h *LLMHandler) SimpleGenerate(c *gin.Context) {
	var req SimpleGenerateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid request: " + err.Error(),
		})
		return
	}

	if !h.llmService.IsConfigured() {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "OpenAI API key is not configured",
		})
		return
	}

	result, err := h.llmService.GenerateSimpleCode(c.Request.Context(), req.Prompt)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error": "Failed to generate code: " + err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"result":  result,
	})
}

// GetConfig returns the current LLM configuration status
func (h *LLMHandler) GetConfig(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"configured": h.llmService.IsConfigured(),
		"available":  true,
	})
}