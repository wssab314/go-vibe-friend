package api

import (
	"fmt"
	"strings"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/tidwall/gjson"
)

func TestRegisterAndLogin(t *testing.T) {
	// Note: This test assumes the API server is running and accessible at `baseURL`.
	// It also assumes the database is in a clean state before this test runs.

	// Generate a unique email for each test run to avoid conflicts
	uniqueEmail := fmt.Sprintf("testuser_%d@example.com", time.Now().UnixNano())
	username := fmt.Sprintf("testuser_%d", time.Now().UnixNano())

	// 1. Register a new user
	registerPayload := fmt.Sprintf(`{"username": "%s", "email": "%s", "password": "password123"}`, username, uniqueEmail)
	registerResp, err := doReq("POST", "/api/vf/v1/auth/register", strings.NewReader(registerPayload), "")
	assert.NoError(t, err)

	registerBody, err := readBody(registerResp)
	assert.NoError(t, err)
	assert.Equal(t, 201, registerResp.StatusCode, "Registration should return 201 Created. Body: %s", registerBody)

	// 2. Login with the new user credentials
	loginPayload := fmt.Sprintf(`{"email": "%s", "password": "password123"}`, uniqueEmail)
	loginResp, err := doReq("POST", "/api/vf/v1/auth/login", strings.NewReader(loginPayload), "")
	assert.NoError(t, err)

	loginBody, err := readBody(loginResp)
	assert.NoError(t, err)

	// Assert that the login was successful and a token is returned.
	assert.Equal(t, 200, loginResp.StatusCode, "Login should be successful after registration. Body: %s", loginBody)
	assert.NotEmpty(t, gjson.Get(loginBody, "data.access_token").String(), "An access_token should be present in the login response")
	assert.NotEmpty(t, gjson.Get(loginBody, "data.refresh_token").String(), "A refresh_token should be present in the login response")
}