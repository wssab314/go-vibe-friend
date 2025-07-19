package llm

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"
)

type OpenAIClient struct {
	APIKey  string
	BaseURL string
	Client  *http.Client
}

func NewOpenAIClient(apiKey, baseURL string) *OpenAIClient {
	if baseURL == "" {
		baseURL = "https://api.openai.com/v1"
	}
	
	return &OpenAIClient{
		APIKey:  apiKey,
		BaseURL: baseURL,
		Client: &http.Client{
			Timeout: 60 * time.Second,
		},
	}
}

func (c *OpenAIClient) IsConfigured() bool {
	return c.APIKey != ""
}

func (c *OpenAIClient) ChatCompletion(ctx context.Context, req *ChatRequest) (*ChatResponse, error) {
	if !c.IsConfigured() {
		return nil, fmt.Errorf("OpenAI API key is not configured")
	}

	// Set default model if not specified
	if req.Model == "" {
		req.Model = "gpt-3.5-turbo"
	}

	// Prepare request body
	reqBody, err := json.Marshal(req)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal request: %w", err)
	}

	// Create HTTP request
	httpReq, err := http.NewRequestWithContext(ctx, "POST", c.BaseURL+"/chat/completions", bytes.NewBuffer(reqBody))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	// Set headers
	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("Authorization", "Bearer "+c.APIKey)

	// Make request
	resp, err := c.Client.Do(httpReq)
	if err != nil {
		return nil, fmt.Errorf("failed to make request: %w", err)
	}
	defer resp.Body.Close()

	// Read response body
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response: %w", err)
	}

	// Handle error responses
	if resp.StatusCode != http.StatusOK {
		var errorResp ErrorResponse
		if err := json.Unmarshal(body, &errorResp); err != nil {
			return nil, fmt.Errorf("API error (status %d): %s", resp.StatusCode, string(body))
		}
		return nil, fmt.Errorf("OpenAI API error: %s", errorResp.Error.Message)
	}

	// Parse successful response
	var chatResp ChatResponse
	if err := json.Unmarshal(body, &chatResp); err != nil {
		return nil, fmt.Errorf("failed to parse response: %w", err)
	}

	return &chatResp, nil
}

func (c *OpenAIClient) TestConnection(ctx context.Context) error {
	req := &ChatRequest{
		Model: "gpt-3.5-turbo",
		Messages: []Message{
			{Role: "user", Content: "Hello, please respond with 'Connection successful!'"},
		},
		Temperature: 0.1,
		MaxTokens:   10,
	}

	_, err := c.ChatCompletion(ctx, req)
	return err
}