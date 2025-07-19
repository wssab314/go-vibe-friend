package api

import (
	"io"
	"log"
	"net/http"
	"os"
	"strings"
	"testing"

	"github.com/tidwall/gjson"
)

var (
	baseURL = os.Getenv("API_BASE_URL") // e.g., http://localhost:8080
	adminJWT string
)

func TestMain(m *testing.M) {
	// In a real scenario, you would fetch this from the environment or a config file.
	if baseURL == "" {
		baseURL = "http://localhost:8080"
	}

	// Perform login to get a token for other tests.
	// Note: This assumes the seeded 'admin@demo.dev' user exists.
	// The login logic might need to be adapted based on the actual API response.
	// For now, we'll just set a placeholder. A real implementation would call the login endpoint.
	adminJWT = loginAsAdmin()

	// Run all tests
	os.Exit(m.Run())
}

// loginAsAdmin performs a real login request to get a valid JWT.
func loginAsAdmin() string {
	// This requires the server to be running.
	payload := `{"email":"admin@demo.dev","password":"Pa$"}`
	resp, err := http.Post(baseURL+"/api/admin/auth/login", "application/json", strings.NewReader(payload))
	if err != nil {
		log.Fatalf("Failed to send login request: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		bodyBytes, _ := io.ReadAll(resp.Body)
		log.Fatalf("Admin login failed with status %d: %s", resp.StatusCode, string(bodyBytes))
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		log.Fatalf("Failed to read login response body: %v", err)
	}

	// Assuming the token is in the response: {"data":{"token":"..."}}
	// Use gjson to extract it.
	token := gjson.Get(string(body), "data.access_token").String()
	if token == "" {
		log.Fatalf("Could not extract JWT token from login response. Body: %s", string(body))
	}
	return token
}

// doReq is a helper function to make HTTP requests to the test server.
func doReq(method, path string, body io.Reader, jwt string) (*http.Response, error) {
	req, err := http.NewRequest(method, baseURL+path, body)
	if err != nil {
		return nil, err
	}

	if jwt != "" {
		req.Header.Set("Authorization", "Bearer "+jwt)
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(req)
	return resp, err
}

// readBody is a helper to read the response body and return it as a string.
func readBody(resp *http.Response) (string, error) {
	defer resp.Body.Close()
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", err
	}
	return string(body), nil
}
