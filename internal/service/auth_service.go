package service

import (
	"errors"
	"fmt"
	"time"

	"go-vibe-friend/internal/models"
	"go-vibe-friend/internal/store"
	"go-vibe-friend/internal/utils"
)

type AuthService struct {
	userStore    *store.UserStore
	sessionStore *store.SessionStore
}

func NewAuthService(userStore *store.UserStore, sessionStore *store.SessionStore) *AuthService {
	return &AuthService{
		userStore:    userStore,
		sessionStore: sessionStore,
	}
}

// GetUserByEmail 根据邮箱获取用户
func (s *AuthService) GetUserByEmail(email string) (*models.User, error) {
	return s.userStore.GetUserByEmail(email)
}

type RegisterRequest struct {
	Username string `json:"username" binding:"required,min=3,max=20"`
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=6"`
}

type LoginRequest struct {
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}

type AuthResponse struct {
	Token string      `json:"token"`
	User  models.User `json:"user"`
}

// UserExists 检查用户是否存在
func (s *AuthService) UserExists(username, email string) (bool, error) {
	// 检查邮箱是否存在
	existingUser, err := s.userStore.GetUserByEmail(email)
	if err != nil {
		return false, fmt.Errorf("database error: %w", err)
	}
	if existingUser != nil {
		return true, nil
	}

	// 检查用户名是否存在
	existingUser, err = s.userStore.GetUserByUsername(username)
	if err != nil {
		return false, fmt.Errorf("database error: %w", err)
	}
	if existingUser != nil {
		return true, nil
	}

	return false, nil
}

// CreateUser 创建新用户
func (s *AuthService) CreateUser(username, email, password string) (*models.User, error) {
	// 哈希密码
	hashedPassword, err := utils.HashPassword(password)
	if err != nil {
		return nil, fmt.Errorf("failed to hash password: %w", err)
	}

	// 创建用户
	user := &models.User{
		Username: username,
		Email:    email,
		Password: hashedPassword,
		Status:   "active",
	}

	if err := s.userStore.CreateUser(user); err != nil {
		return nil, fmt.Errorf("failed to create user: %w", err)
	}

	// 创建默认角色
	if err := s.userStore.AssignRole(user.ID, "user"); err != nil {
		return nil, fmt.Errorf("failed to assign role: %w", err)
	}

	// 创建默认个人资料
	if err := s.userStore.CreateProfile(user.ID, username, "", "", "", ""); err != nil {
		return nil, fmt.Errorf("failed to create profile: %w", err)
	}

	// 移除密码
	user.Password = ""
	return user, nil
}

// ValidateUser 验证用户登录
func (s *AuthService) ValidateUser(email, password string) (*models.User, error) {
	// 根据邮箱获取用户
	user, err := s.userStore.GetUserByEmail(email)
	if err != nil {
		return nil, fmt.Errorf("database error: %w", err)
	}
	if user == nil {
		return nil, errors.New("invalid email or password")
	}

	// 验证密码
	if err := utils.CheckPassword(password, user.Password); err != nil {
		return nil, errors.New("invalid email or password")
	}

	return user, nil
}

// GenerateTokens 生成访问令牌和刷新令牌
func (s *AuthService) GenerateTokens(user *models.User) (string, string, error) {
	// 获取用户角色
	roles, err := s.userStore.GetUserRoles(user.ID)
	if err != nil {
		return "", "", fmt.Errorf("failed to get user roles: %w", err)
	}

	// 默认角色
	role := "user"
	if len(roles) > 0 {
		role = roles[0]
	}

	// 生成访问令牌（15分钟有效期）
	accessToken, err := utils.GenerateJWT(user.ID, user.Username, role)
	if err != nil {
		return "", "", fmt.Errorf("failed to generate access token: %w", err)
	}

	// 生成刷新令牌（7天有效期）
	refreshToken, err := utils.GenerateRefreshToken()
	if err != nil {
		return "", "", fmt.Errorf("failed to generate refresh token: %w", err)
	}

	return accessToken, refreshToken, nil
}

// CreateSession 创建会话
func (s *AuthService) CreateSession(userID uint, refreshToken, ipAddress, userAgent string) error {
	session := &models.Session{
		UserID:       userID,
		RefreshToken: refreshToken,
		ExpiresAt:    time.Now().Add(7 * 24 * time.Hour), // 7天有效期
		IPAddress:    ipAddress,
		UserAgent:    userAgent,
	}

	return s.sessionStore.CreateSession(session)
}

// ValidateRefreshToken 验证刷新令牌
func (s *AuthService) ValidateRefreshToken(refreshToken string) (*models.User, error) {
	// 获取会话
	session, err := s.sessionStore.GetSessionByToken(refreshToken)
	if err != nil {
		return nil, fmt.Errorf("failed to get session: %w", err)
	}
	if session == nil {
		return nil, errors.New("invalid refresh token")
	}

	// 检查会话是否已撤销
	if session.IsRevoked {
		return nil, errors.New("refresh token has been revoked")
	}

	// 检查会话是否已过期
	if time.Now().After(session.ExpiresAt) {
		return nil, errors.New("refresh token has expired")
	}

	// 获取用户信息
	user, err := s.userStore.GetUserByID(session.UserID)
	if err != nil {
		return nil, fmt.Errorf("failed to get user: %w", err)
	}
	if user == nil {
		return nil, errors.New("user not found")
	}

	return user, nil
}

// RefreshSession 刷新会话
func (s *AuthService) RefreshSession(oldRefreshToken, newRefreshToken, ipAddress, userAgent string) error {
	// 撤销旧会话
	if err := s.sessionStore.RevokeSession(oldRefreshToken); err != nil {
		return fmt.Errorf("failed to revoke old session: %w", err)
	}

	// 获取旧会话信息
	oldSession, err := s.sessionStore.GetSessionByToken(oldRefreshToken)
	if err != nil {
		return fmt.Errorf("failed to get old session: %w", err)
	}
	if oldSession == nil {
		return errors.New("old session not found")
	}

	// 创建新会话
	return s.CreateSession(oldSession.UserID, newRefreshToken, ipAddress, userAgent)
}

// RevokeAllSessions 撤销用户的所有会话
func (s *AuthService) RevokeAllSessions(userID uint) error {
	return s.sessionStore.RevokeAllUserSessions(userID)
}

// GetUserByID 根据ID获取用户
func (s *AuthService) GetUserByID(id uint) (*models.User, error) {
	user, err := s.userStore.GetUserByID(id)
	if err != nil {
		return nil, fmt.Errorf("database error: %w", err)
	}
	if user == nil {
		return nil, errors.New("user not found")
	}

	// 移除密码
	user.Password = ""
	return user, nil
}

// 兼容旧版本接口
func (s *AuthService) Register(req *RegisterRequest) (*AuthResponse, error) {
	// 检查用户是否存在
	exists, err := s.UserExists(req.Username, req.Email)
	if err != nil {
		return nil, err
	}
	if exists {
		return nil, errors.New("user already exists")
	}

	// 创建用户
	user, err := s.CreateUser(req.Username, req.Email, req.Password)
	if err != nil {
		return nil, err
	}

	// 生成令牌
	accessToken, _, err := s.GenerateTokens(user)
	if err != nil {
		return nil, err
	}

	return &AuthResponse{
		Token: accessToken,
		User:  *user,
	}, nil
}

func (s *AuthService) Login(req *LoginRequest) (*AuthResponse, error) {
	// 验证用户
	user, err := s.ValidateUser(req.Email, req.Password)
	if err != nil {
		return nil, err
	}

	// 生成令牌
	accessToken, _, err := s.GenerateTokens(user)
	if err != nil {
		return nil, err
	}

	// 移除密码
	user.Password = ""

	return &AuthResponse{
		Token: accessToken,
		User:  *user,
	}, nil
}