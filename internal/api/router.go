package api

import (
	"net/http"

	"go-vibe-friend/internal/api/admin"
	"go-vibe-friend/internal/api/middleware"
	"go-vibe-friend/internal/config"
	"go-vibe-friend/internal/llm"
	"go-vibe-friend/internal/service"
	"go-vibe-friend/internal/store"

	"github.com/gin-gonic/gin"
)

func SetupRouter(db *store.Database, cfg *config.Config) *gin.Engine {
	r := gin.New()

	// Middleware
	r.Use(middleware.Logger())
	r.Use(gin.Recovery())
	r.Use(middleware.CORS())

	// Initialize stores and services
	userStore := store.NewUserStore(db)
	jobStore := store.NewJobStore(db)
	authService := service.NewAuthService(userStore)
	llmService := llm.NewService(cfg, jobStore, userStore)
	
	// Initialize handlers
	authHandler := admin.NewAuthHandler(authService)
	userHandler := admin.NewUserHandler(userStore)
	jobHandler := admin.NewJobHandler(jobStore)
	dashboardHandler := admin.NewDashboardHandler(userStore, jobStore)
	llmHandler := admin.NewLLMHandler(llmService)

	// Health check endpoint
	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{
			"status":  "ok",
			"message": "go-vibe-friend server is running",
		})
	})

	// API routes
	api := r.Group("/api")
	{
		// Admin routes
		adminGroup := api.Group("/admin")
		{
			// Public auth routes
			adminGroup.POST("/register", authHandler.Register)
			adminGroup.POST("/login", authHandler.Login)
			
			// Protected routes
			protected := adminGroup.Group("/")
			protected.Use(middleware.AuthMiddleware())
			{
				// User management
				protected.GET("/profile", authHandler.GetProfile)
				protected.GET("/users", userHandler.ListUsers)
				protected.GET("/users/:id", userHandler.GetUser)
				protected.DELETE("/users/:id", userHandler.DeleteUser)
				
				// Dashboard
				protected.GET("/dashboard/stats", dashboardHandler.GetStats)
				protected.GET("/dashboard/system", dashboardHandler.GetSystemInfo)
				
				// Job management
				protected.GET("/jobs", jobHandler.ListJobs)
				protected.POST("/jobs", jobHandler.CreateJob)
				protected.GET("/jobs/:id", jobHandler.GetJob)
				protected.PUT("/jobs/:id", jobHandler.UpdateJob)
				protected.DELETE("/jobs/:id", jobHandler.DeleteJob)
				protected.POST("/jobs/sample", jobHandler.CreateSampleJobs)
				
				// LLM services
				protected.GET("/llm/config", llmHandler.GetConfig)
				protected.POST("/llm/test", llmHandler.TestConnection)
				protected.POST("/llm/generate", llmHandler.GenerateCode)
				protected.POST("/llm/simple", llmHandler.SimpleGenerate)
				protected.GET("/llm/jobs/:id", llmHandler.GetJobStatus)
				
				protected.GET("/ping", func(c *gin.Context) {
					c.JSON(http.StatusOK, gin.H{
						"message": "admin pong",
					})
				})
			}
		}

		// Vibe Friend routes
		vf := api.Group("/vf")
		{
			vf.GET("/ping", func(c *gin.Context) {
				c.JSON(http.StatusOK, gin.H{
					"message": "vf pong",
				})
			})
		}
	}

	return r
}