package service

import (
	"errors"
	"fmt"

	"go-vibe-friend/internal/models"
	"go-vibe-friend/internal/store"
	"go-vibe-friend/internal/utils"
)

type AuthService struct {
	userStore *store.UserStore
}

func NewAuthService(userStore *store.UserStore) *AuthService {
	return &AuthService{
		userStore: userStore,
	}
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

func (s *AuthService) Register(req *RegisterRequest) (*AuthResponse, error) {
	// Check if user already exists
	existingUser, err := s.userStore.GetUserByEmail(req.Email)
	if err != nil {
		return nil, fmt.Errorf("database error: %w", err)
	}
	if existingUser != nil {
		return nil, errors.New("user with this email already exists")
	}

	// Check if username already exists
	existingUser, err = s.userStore.GetUserByUsername(req.Username)
	if err != nil {
		return nil, fmt.Errorf("database error: %w", err)
	}
	if existingUser != nil {
		return nil, errors.New("username already taken")
	}

	// Hash password
	hashedPassword, err := utils.HashPassword(req.Password)
	if err != nil {
		return nil, fmt.Errorf("failed to hash password: %w", err)
	}

	// Create user
	user := &models.User{
		Username: req.Username,
		Email:    req.Email,
		Password: hashedPassword,
		Role:     "user",
	}

	if err := s.userStore.CreateUser(user); err != nil {
		return nil, fmt.Errorf("failed to create user: %w", err)
	}

	// Generate JWT token
	token, err := utils.GenerateJWT(user.ID, user.Username, user.Role)
	if err != nil {
		return nil, fmt.Errorf("failed to generate token: %w", err)
	}

	// Remove password from response
	user.Password = ""

	return &AuthResponse{
		Token: token,
		User:  *user,
	}, nil
}

func (s *AuthService) Login(req *LoginRequest) (*AuthResponse, error) {
	// Get user by email
	user, err := s.userStore.GetUserByEmail(req.Email)
	if err != nil {
		return nil, fmt.Errorf("database error: %w", err)
	}
	if user == nil {
		return nil, errors.New("invalid email or password")
	}

	// Check password
	if err := utils.CheckPassword(req.Password, user.Password); err != nil {
		return nil, errors.New("invalid email or password")
	}

	// Generate JWT token
	token, err := utils.GenerateJWT(user.ID, user.Username, user.Role)
	if err != nil {
		return nil, fmt.Errorf("failed to generate token: %w", err)
	}

	// Remove password from response
	user.Password = ""

	return &AuthResponse{
		Token: token,
		User:  *user,
	}, nil
}

func (s *AuthService) GetUserByID(id uint) (*models.User, error) {
	user, err := s.userStore.GetUserByID(id)
	if err != nil {
		return nil, fmt.Errorf("database error: %w", err)
	}
	if user == nil {
		return nil, errors.New("user not found")
	}

	// Remove password from response
	user.Password = ""
	return user, nil
}