package llm

import (
	"context"

	"go-vibe-friend/internal/config"
)

type LLMProvider interface {
	IsConfigured() bool
	ChatCompletion(ctx context.Context, req *ChatRequest) (*ChatResponse, error)
	TestConnection(ctx context.Context) error
}

type Client struct {
	provider LLMProvider
	providerName string
}

type Message struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type ChatRequest struct {
	Model       string    `json:"model"`
	Messages    []Message `json:"messages"`
	Temperature float32   `json:"temperature,omitempty"`
	MaxTokens   int       `json:"max_tokens,omitempty"`
	Stream      bool      `json:"stream,omitempty"`
}

type Choice struct {
	Index   int     `json:"index"`
	Message Message `json:"message"`
	FinishReason string `json:"finish_reason"`
}

type Usage struct {
	PromptTokens     int `json:"prompt_tokens"`
	CompletionTokens int `json:"completion_tokens"`
	TotalTokens      int `json:"total_tokens"`
}

type ChatResponse struct {
	ID      string   `json:"id"`
	Object  string   `json:"object"`
	Created int64    `json:"created"`
	Model   string   `json:"model"`
	Choices []Choice `json:"choices"`
	Usage   Usage    `json:"usage"`
}

type ErrorResponse struct {
	Error struct {
		Message string `json:"message"`
		Type    string `json:"type"`
		Code    string `json:"code"`
	} `json:"error"`
}

func NewClient(cfg *config.Config) *Client {
	// Check Gemini first, then OpenAI
	if cfg.Gemini.APIKey != "" {
		return &Client{
			provider: NewGeminiClient(cfg.Gemini.APIKey, cfg.Gemini.BaseURL),
			providerName: "gemini",
		}
	}
	
	if cfg.OpenAI.APIKey != "" {
		return &Client{
			provider: NewOpenAIClient(cfg.OpenAI.APIKey, cfg.OpenAI.BaseURL),
			providerName: "openai",
		}
	}

	// Return unconfigured client
	return &Client{
		provider: &OpenAIClient{},
		providerName: "none",
	}
}

func (c *Client) ChatCompletion(ctx context.Context, req *ChatRequest) (*ChatResponse, error) {
	return c.provider.ChatCompletion(ctx, req)
}

func (c *Client) IsConfigured() bool {
	return c.provider.IsConfigured()
}

func (c *Client) TestConnection(ctx context.Context) error {
	return c.provider.TestConnection(ctx)
}

func (c *Client) GetProviderName() string {
	return c.providerName
}