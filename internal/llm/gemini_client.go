package llm

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"
)

type GeminiClient struct {
	APIKey  string
	BaseURL string
	Client  *http.Client
}

type GeminiRequest struct {
	Contents []GeminiContent `json:"contents"`
	GenerationConfig GeminiGenerationConfig `json:"generationConfig,omitempty"`
}

type GeminiContent struct {
	Parts []GeminiPart `json:"parts"`
}

type GeminiPart struct {
	Text string `json:"text"`
}

type GeminiGenerationConfig struct {
	Temperature     float64 `json:"temperature,omitempty"`
	TopP           float64 `json:"topP,omitempty"`
	TopK           int     `json:"topK,omitempty"`
	MaxOutputTokens int     `json:"maxOutputTokens,omitempty"`
}

type GeminiResponse struct {
	Candidates []GeminiCandidate `json:"candidates"`
	UsageMetadata GeminiUsageMetadata `json:"usageMetadata"`
}

type GeminiCandidate struct {
	Content GeminiContent `json:"content"`
	FinishReason string `json:"finishReason"`
	Index int `json:"index"`
}

type GeminiUsageMetadata struct {
	PromptTokenCount int `json:"promptTokenCount"`
	CandidatesTokenCount int `json:"candidatesTokenCount"`
	TotalTokenCount int `json:"totalTokenCount"`
}

func NewGeminiClient(apiKey, baseURL string) *GeminiClient {
	return &GeminiClient{
		APIKey:  apiKey,
		BaseURL: baseURL,
		Client: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

func (c *GeminiClient) IsConfigured() bool {
	return c.APIKey != ""
}

func (c *GeminiClient) GenerateContent(ctx context.Context, prompt string) (*ChatResponse, error) {
	if !c.IsConfigured() {
		return nil, fmt.Errorf("Gemini API key is not configured")
	}

	// Create request
	req := GeminiRequest{
		Contents: []GeminiContent{
			{
				Parts: []GeminiPart{
					{Text: prompt},
				},
			},
		},
		GenerationConfig: GeminiGenerationConfig{
			Temperature:     0.1,
			MaxOutputTokens: 4000,
		},
	}

	reqBody, err := json.Marshal(req)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal request: %w", err)
	}

	// Make HTTP request
	url := fmt.Sprintf("%s/models/gemini-1.5-flash:generateContent?key=%s", c.BaseURL, c.APIKey)
	httpReq, err := http.NewRequestWithContext(ctx, "POST", url, bytes.NewBuffer(reqBody))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	httpReq.Header.Set("Content-Type", "application/json")

	resp, err := c.Client.Do(httpReq)
	if err != nil {
		return nil, fmt.Errorf("failed to make request: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("API request failed with status %d: %s", resp.StatusCode, string(body))
	}

	var geminiResp GeminiResponse
	if err := json.Unmarshal(body, &geminiResp); err != nil {
		return nil, fmt.Errorf("failed to unmarshal response: %w", err)
	}

	// Convert to ChatResponse format
	if len(geminiResp.Candidates) == 0 {
		return nil, fmt.Errorf("no candidates in response")
	}

	candidate := geminiResp.Candidates[0]
	if len(candidate.Content.Parts) == 0 {
		return nil, fmt.Errorf("no content parts in response")
	}

	chatResp := &ChatResponse{
		ID:      fmt.Sprintf("gemini-%d", time.Now().Unix()),
		Object:  "chat.completion",
		Created: time.Now().Unix(),
		Model:   "gemini-1.5-flash",
		Choices: []Choice{
			{
				Index: 0,
				Message: Message{
					Role:    "assistant",
					Content: candidate.Content.Parts[0].Text,
				},
				FinishReason: strings.ToLower(candidate.FinishReason),
			},
		},
		Usage: Usage{
			PromptTokens:     geminiResp.UsageMetadata.PromptTokenCount,
			CompletionTokens: geminiResp.UsageMetadata.CandidatesTokenCount,
			TotalTokens:     geminiResp.UsageMetadata.TotalTokenCount,
		},
	}

	return chatResp, nil
}

func (c *GeminiClient) ChatCompletion(ctx context.Context, req *ChatRequest) (*ChatResponse, error) {
	// Convert chat messages to a single prompt
	var prompt strings.Builder
	
	for _, msg := range req.Messages {
		switch msg.Role {
		case "system":
			prompt.WriteString(fmt.Sprintf("Instructions: %s\n\n", msg.Content))
		case "user":
			prompt.WriteString(fmt.Sprintf("User: %s\n\n", msg.Content))
		case "assistant":
			prompt.WriteString(fmt.Sprintf("Assistant: %s\n\n", msg.Content))
		}
	}

	return c.GenerateContent(ctx, prompt.String())
}

func (c *GeminiClient) TestConnection(ctx context.Context) error {
	_, err := c.GenerateContent(ctx, "Hello, please respond with 'Connection successful!'")
	return err
}