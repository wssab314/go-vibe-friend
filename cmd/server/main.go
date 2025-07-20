package main

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"go-vibe-friend/internal/api"
	"go-vibe-friend/internal/config"
	"go-vibe-friend/internal/models"
	"go-vibe-friend/internal/store"
	"go-vibe-friend/internal/utils"

	"github.com/gin-gonic/gin"
	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
	"golang.org/x/crypto/bcrypt"
)

func main() {
	logger := utils.NewLogger()
	logger.Info("Starting go-vibe-friend server...")

	// Load configuration
	cfg, err := config.Load()
	if err != nil {
		logger.Fatal(fmt.Sprintf("Failed to load config: %v", err))
	}

	// Set Gin mode
	gin.SetMode(cfg.Server.Mode)

	// Initialize database
	db, err := store.NewDatabase(cfg)
	if err != nil {
		logger.Fatal(fmt.Sprintf("Failed to connect to database: %v", err))
	}
	defer db.Close()

	logger.Info("Database connected successfully")

	// Initialize MinIO client
	minioClient, err := minio.New(cfg.MinIO.Endpoint, &minio.Options{
		Creds:  credentials.NewStaticV4(cfg.MinIO.AccessKeyID, cfg.MinIO.SecretAccessKey, ""),
		Secure: cfg.MinIO.UseSSL,
	})
	if err != nil {
		logger.Fatal(fmt.Sprintf("Failed to initialize minio client: %v", err))
	}
	logger.Info("MinIO client initialized successfully")

	// Create default admin user if not exists
	if err := createDefaultAdmin(db); err != nil {
		logger.Fatal(fmt.Sprintf("Failed to create default admin: %v", err))
	}

	// Setup router with database and config
	router := api.SetupRouter(db, cfg, minioClient)

	// Create HTTP server
	server := &http.Server{
		Addr:    fmt.Sprintf("%s:%s", cfg.Server.Host, cfg.Server.Port),
		Handler: router,
	}

	// Start server in a goroutine
	go func() {
		logger.Info(fmt.Sprintf("Server starting on %s:%s", cfg.Server.Host, cfg.Server.Port))
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			logger.Fatal(fmt.Sprintf("Failed to start server: %v", err))
		}
	}()

	// Wait for interrupt signal to gracefully shutdown the server
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	logger.Info("Shutting down server...")

	// Give the server 30 seconds to shutdown gracefully
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	if err := server.Shutdown(ctx); err != nil {
		logger.Fatal(fmt.Sprintf("Server forced to shutdown: %v", err))
	}

	logger.Info("Server exited")
}

func createDefaultAdmin(db *store.Database) error {
	userStore := store.NewUserStore(db)

	// Check if admin user already exists
	existingAdmin, err := userStore.GetUserByEmail("admin@example.com")
	if err != nil {
		return fmt.Errorf("failed to check for existing admin: %w", err)
	}

	if existingAdmin != nil {
		return nil // Admin already exists
	}

	// Hash the password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte("admin123"), bcrypt.DefaultCost)
	if err != nil {
		return fmt.Errorf("failed to hash password: %w", err)
	}

	// Create admin user
	admin := &models.User{
		Username: "admin",
		Email:    "admin@example.com",
		Password: string(hashedPassword),
		Status:   "active",
	}

	if err := userStore.CreateUser(admin); err != nil {
		return fmt.Errorf("failed to create admin user: %w", err)
	}

	// Assign admin role
	if err := userStore.AssignRole(admin.ID, "admin"); err != nil {
		return fmt.Errorf("failed to assign admin role: %w", err)
	}

	fmt.Println("✅ Default admin user created successfully")
	fmt.Println("📧 Email: admin@example.com")
	fmt.Println("🔑 Password: admin123")

	return nil
}
