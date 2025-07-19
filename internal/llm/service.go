package llm

import (
	"context"
	"fmt"
	"log"

	"go-vibe-friend/internal/config"
	"go-vibe-friend/internal/models"
	"go-vibe-friend/internal/store"
)

type Service struct {
	client    *Client
	generator *CodeGenerator
	jobStore  *store.JobStore
	userStore *store.UserStore
}

type GenerationJobRequest struct {
	UserID      uint              `json:"user_id"`
	ProjectName string            `json:"project_name"`
	Framework   string            `json:"framework"`
	Frontend    string            `json:"frontend"`
	ChatHistory string            `json:"chat_history"`
	Context     map[string]string `json:"context"`
}

func NewService(cfg *config.Config, jobStore *store.JobStore, userStore *store.UserStore) *Service {
	client := NewClient(cfg)
	generator := NewCodeGenerator(client)

	return &Service{
		client:    client,
		generator: generator,
		jobStore:  jobStore,
		userStore: userStore,
	}
}

func (s *Service) IsConfigured() bool {
	return s.client.IsConfigured()
}

func (s *Service) GetProviderName() string {
	return s.client.GetProviderName()
}

func (s *Service) CreateGenerationJob(ctx context.Context, req *GenerationJobRequest) (*models.GenerationJob, error) {
	// Create a new job record
	job := &models.GenerationJob{
		UserID:    req.UserID,
		Status:    "pending",
		JobType:   "code_generation",
		InputData: fmt.Sprintf("Project: %s, Framework: %s", req.ProjectName, req.Framework),
	}

	if err := s.jobStore.CreateJob(job); err != nil {
		return nil, fmt.Errorf("failed to create job: %w", err)
	}

	// Start generation in background
	go s.processGenerationJob(context.Background(), job, req)

	return job, nil
}

func (s *Service) processGenerationJob(ctx context.Context, job *models.GenerationJob, req *GenerationJobRequest) {
	// Update job status to in_progress
	job.Status = "in_progress"
	if err := s.jobStore.UpdateJob(job); err != nil {
		log.Printf("Failed to update job status: %v", err)
		return
	}

	// Prepare generation request
	genReq := &GenerationRequest{
		Frontend:    req.Frontend,
		ChatHistory: req.ChatHistory,
		ProjectName: req.ProjectName,
		Framework:   req.Framework,
		Context:     req.Context,
	}

	// Generate code
	result, err := s.generator.GenerateFromFrontend(ctx, genReq)
	if err != nil {
		job.Status = "failed"
		job.ErrorMsg = err.Error()
		if updateErr := s.jobStore.UpdateJob(job); updateErr != nil {
			log.Printf("Failed to update job error: %v", updateErr)
		}
		return
	}

	// Update job with results
	job.Status = "completed"
	
	// Store the generation result as JSON
	if resultJSON, err := s.serializeResult(result); err == nil {
		job.OutputData = resultJSON
	} else {
		job.ErrorMsg = fmt.Sprintf("Failed to serialize result: %v", err)
	}

	if err := s.jobStore.UpdateJob(job); err != nil {
		log.Printf("Failed to update job completion: %v", err)
	}
}

func (s *Service) serializeResult(result *GenerationResult) (string, error) {
	// Simple serialization for now
	return fmt.Sprintf(`{
		"success": %t,
		"models_count": %d,
		"apis_count": %d,
		"migrations_count": %d,
		"summary": "%s",
		"tokens_used": %d
	}`, result.Success, len(result.Models), len(result.APIs), len(result.Migrations), result.Summary, result.TokensUsed), nil
}

func (s *Service) GetJobStatus(jobID uint) (*models.GenerationJob, error) {
	return s.jobStore.GetJobByID(jobID)
}

func (s *Service) TestConnection(ctx context.Context) error {
	if !s.client.IsConfigured() {
		return fmt.Errorf("LLM API key is not configured")
	}

	return s.client.TestConnection(ctx)
}

func (s *Service) GenerateSimpleCode(ctx context.Context, prompt string) (string, error) {
	return s.generator.GenerateAPI(ctx, prompt)
}