package llm

import (
	"context"
	"fmt"
	"strings"
)

type CodeGenerator struct {
	client *Client
}

type GenerationRequest struct {
	Frontend     string            `json:"frontend"`      // Frontend code content
	ChatHistory  string            `json:"chat_history"`  // Chat history content
	ProjectName  string            `json:"project_name"`  // Project name
	Framework    string            `json:"framework"`     // Frontend framework (react, vue, etc.)
	Requirements []string          `json:"requirements"`  // Additional requirements
	Context      map[string]string `json:"context"`       // Additional context
}

type GenerationResult struct {
	Success      bool                   `json:"success"`
	Models       []GeneratedModel       `json:"models"`
	APIs         []GeneratedAPI         `json:"apis"`
	Migrations   []GeneratedMigration   `json:"migrations"`
	Summary      string                 `json:"summary"`
	Errors       []string               `json:"errors"`
	TokensUsed   int                    `json:"tokens_used"`
}

type GeneratedModel struct {
	Name     string `json:"name"`
	Package  string `json:"package"`
	Content  string `json:"content"`
	FilePath string `json:"file_path"`
}

type GeneratedAPI struct {
	Name     string `json:"name"`
	Package  string `json:"package"`
	Content  string `json:"content"`
	FilePath string `json:"file_path"`
	Routes   []string `json:"routes"`
}

type GeneratedMigration struct {
	Name     string `json:"name"`
	Content  string `json:"content"`
	FilePath string `json:"file_path"`
}

func NewCodeGenerator(client *Client) *CodeGenerator {
	return &CodeGenerator{
		client: client,
	}
}

func (g *CodeGenerator) GenerateFromFrontend(ctx context.Context, req *GenerationRequest) (*GenerationResult, error) {
	if !g.client.IsConfigured() {
		return nil, fmt.Errorf("LLM API key is not configured")
	}

	// Build the system prompt
	systemPrompt := g.buildSystemPrompt(req.Framework)
	
	// Build the user prompt
	userPrompt := g.buildUserPrompt(req)

	// Create chat request with appropriate model based on provider
	model := "gpt-4-turbo-preview"
	if g.client.GetProviderName() == "gemini" {
		model = "gemini-1.5-flash"
	}

	chatReq := &ChatRequest{
		Model: model,
		Messages: []Message{
			{Role: "system", Content: systemPrompt},
			{Role: "user", Content: userPrompt},
		},
		Temperature: 0.1,
		MaxTokens:   4000,
	}

	// Make the API call
	resp, err := g.client.ChatCompletion(ctx, chatReq)
	if err != nil {
		return nil, fmt.Errorf("failed to generate code: %w", err)
	}

	if len(resp.Choices) == 0 {
		return nil, fmt.Errorf("no response from LLM")
	}

	// Parse the response
	result, err := g.parseGenerationResponse(resp.Choices[0].Message.Content)
	if err != nil {
		return nil, fmt.Errorf("failed to parse generation response: %w", err)
	}

	result.TokensUsed = resp.Usage.TotalTokens
	return result, nil
}

func (g *CodeGenerator) buildSystemPrompt(framework string) string {
	return fmt.Sprintf(`You are an expert Go backend developer specializing in creating APIs for %s frontends.

Your task is to analyze frontend code and chat history to generate:
1. Go data models (using GORM)
2. API handlers (using Gin framework)
3. Database migrations (PostgreSQL)

Requirements:
- Use Go 1.22+ features
- Follow RESTful API conventions
- Use GORM for ORM
- Use Gin for HTTP routing
- Generate complete, production-ready code
- Include proper error handling
- Add appropriate validation
- Use PostgreSQL-compatible SQL

Output format should be JSON with this structure:
{
  "success": true,
  "models": [{"name": "User", "package": "models", "content": "...", "file_path": "internal/models/user.go"}],
  "apis": [{"name": "UserHandler", "package": "handlers", "content": "...", "file_path": "internal/api/handlers/user.go", "routes": ["GET /users", "POST /users"]}],
  "migrations": [{"name": "001_create_users", "content": "...", "file_path": "migrations/001_create_users.sql"}],
  "summary": "Generated User management API with authentication...",
  "errors": []
}`, framework)
}

func (g *CodeGenerator) buildUserPrompt(req *GenerationRequest) string {
	var prompt strings.Builder
	
	prompt.WriteString(fmt.Sprintf("Project: %s\n", req.ProjectName))
	prompt.WriteString(fmt.Sprintf("Frontend Framework: %s\n\n", req.Framework))
	
	if req.Frontend != "" {
		prompt.WriteString("Frontend Code:\n")
		prompt.WriteString("```\n")
		prompt.WriteString(req.Frontend)
		prompt.WriteString("\n```\n\n")
	}
	
	if req.ChatHistory != "" {
		prompt.WriteString("Chat History:\n")
		prompt.WriteString("```\n")
		prompt.WriteString(req.ChatHistory)
		prompt.WriteString("\n```\n\n")
	}
	
	if len(req.Requirements) > 0 {
		prompt.WriteString("Additional Requirements:\n")
		for _, req := range req.Requirements {
			prompt.WriteString(fmt.Sprintf("- %s\n", req))
		}
		prompt.WriteString("\n")
	}
	
	if len(req.Context) > 0 {
		prompt.WriteString("Context:\n")
		for key, value := range req.Context {
			prompt.WriteString(fmt.Sprintf("- %s: %s\n", key, value))
		}
		prompt.WriteString("\n")
	}
	
	prompt.WriteString("Please analyze the frontend code and generate the corresponding Go backend code.")
	
	return prompt.String()
}

func (g *CodeGenerator) parseGenerationResponse(content string) (*GenerationResult, error) {
	// Try to extract JSON from the response
	// Sometimes the response might contain markdown code blocks
	start := strings.Index(content, "{")
	end := strings.LastIndex(content, "}")
	
	if start == -1 || end == -1 {
		return &GenerationResult{
			Success: false,
			Summary: content,
			Errors:  []string{"Failed to parse JSON response from OpenAI"},
		}, nil
	}
	
	// For now, we'll create a simple parser
	// In a real implementation, you'd want more sophisticated JSON parsing
	result := &GenerationResult{
		Success: true,
		Summary: "Code generation completed successfully. Response: " + content[start:end+1],
		Models:  []GeneratedModel{},
		APIs:    []GeneratedAPI{},
		Migrations: []GeneratedMigration{},
	}
	
	// TODO: Implement proper JSON parsing
	// This is a simplified version for demonstration
	
	return result, nil
}

func (g *CodeGenerator) GenerateAPI(ctx context.Context, prompt string) (string, error) {
	if !g.client.IsConfigured() {
		return "", fmt.Errorf("LLM API key is not configured")
	}

	// Choose appropriate model based on provider
	model := "gpt-3.5-turbo"
	if g.client.GetProviderName() == "gemini" {
		model = "gemini-1.5-flash"
	}

	chatReq := &ChatRequest{
		Model: model,
		Messages: []Message{
			{
				Role: "system",
				Content: "You are a Go backend developer. Generate clean, production-ready Go code using Gin framework and GORM.",
			},
			{
				Role: "user",
				Content: prompt,
			},
		},
		Temperature: 0.1,
		MaxTokens:   2000,
	}

	resp, err := g.client.ChatCompletion(ctx, chatReq)
	if err != nil {
		return "", err
	}

	if len(resp.Choices) == 0 {
		return "", fmt.Errorf("no response from LLM")
	}

	return resp.Choices[0].Message.Content, nil
}