package api

import (
	"net/http"

	"go-vibe-friend/internal/api/admin"
	"go-vibe-friend/internal/api/middleware"
	"go-vibe-friend/internal/api/vf"
	"go-vibe-friend/internal/config"
	"go-vibe-friend/internal/service"
	"go-vibe-friend/internal/store"

	"github.com/gin-gonic/gin"
	"github.com/minio/minio-go/v7"
)

func SetupRouter(storeManager *store.Store, cfg *config.Config, minioClient *minio.Client) *gin.Engine {
	r := gin.New()

	// Middleware
	r.Use(middleware.Logger())
	r.Use(gin.Recovery())
	r.Use(middleware.CORS())

	// Initialize stores and services using Store manager
	authService := service.NewAuthService(storeManager.User, storeManager.GetSessionStore())
	profileService := service.NewProfileService(storeManager.User, storeManager.Profile)
	fileService := service.NewFileService(storeManager.File, minioClient, cfg)
	emailService := service.NewEmailService(storeManager.Email, "", "", "", "", "", "")
	permissionService := service.NewPermissionService(storeManager.Permission, storeManager.User)
	redisService := service.NewRedisService(storeManager)
	
	// Initialize handlers
	adminAuthHandler := admin.NewAuthHandler(authService)
	userHandler := admin.NewUserHandler(storeManager.User)
	jobHandler := admin.NewJobHandler(storeManager.Job)
	dashboardHandler := admin.NewDashboardHandler(storeManager.User, storeManager.Job, storeManager.DB.DB)
	permissionHandler := admin.NewPermissionHandler(permissionService)
	exportService := service.NewExportService(storeManager.User, storeManager.Job, storeManager.File, storeManager.Email, storeManager.Permission)
	exportHandler := admin.NewExportHandler(exportService)
	storageService := service.NewStorageService(minioClient, cfg)
	storageHandler := admin.NewStorageHandler(storageService)
	redisHandler := admin.NewRedisHandler(redisService)
	
	// VF handlers
	vfAuthHandler := vf.NewAuthHandler(authService)
	vfProfileHandler := vf.NewProfileHandler(profileService)
	vfFileHandler := vf.NewFileHandler(fileService)
	vfEmailHandler := vf.NewEmailHandler(emailService, authService)

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
			adminGroup.POST("/register", adminAuthHandler.Register)
			adminGroup.POST("/login", adminAuthHandler.Login)
			
			// Protected routes
			protected := adminGroup.Group("/")
			protected.Use(middleware.AuthMiddleware())
			{
				// User management
				protected.GET("/profile", adminAuthHandler.GetProfile)
				protected.GET("/users", userHandler.ListUsers)
				protected.GET("/users/:id", userHandler.GetUser)
				protected.DELETE("/users/:id", userHandler.DeleteUser)
				
				// Dashboard
				protected.GET("/dashboard/stats", dashboardHandler.GetStats)
				protected.GET("/dashboard/system", dashboardHandler.GetSystemInfo)
				
				// System monitoring
				protected.GET("/health", dashboardHandler.GetSystemHealth)
				protected.GET("/database/capacity", dashboardHandler.GetDatabaseCapacity)
				
				// Data Explorer
				protected.GET("/data-explorer/tables", dashboardHandler.GetDataExplorerTables)
				protected.GET("/data-explorer/tables/:table/data", dashboardHandler.GetTableData)
				
				// Job management
				protected.GET("/jobs", jobHandler.ListJobs)
				protected.POST("/jobs", jobHandler.CreateJob)
				protected.GET("/jobs/:id", jobHandler.GetJob)
				protected.PUT("/jobs/:id", jobHandler.UpdateJob)
				protected.DELETE("/jobs/:id", jobHandler.DeleteJob)
				protected.POST("/jobs/sample", jobHandler.CreateSampleJobs)
				
				
				// Permission management
				protected.GET("/permissions", permissionHandler.GetPermissions)
				protected.POST("/permissions", permissionHandler.CreatePermission)
				protected.GET("/permissions/resource/:resource", permissionHandler.GetPermissionsByResource)
				protected.POST("/permissions/assign-role", permissionHandler.AssignPermissionToRole)
				protected.POST("/permissions/remove-role", permissionHandler.RemovePermissionFromRole)
				protected.GET("/permissions/roles/:id", permissionHandler.GetRolePermissions)
				protected.GET("/permissions/users/:id", permissionHandler.GetUserPermissions)
				protected.POST("/permissions/assign-user", permissionHandler.AssignPermissionToUser)
				protected.POST("/permissions/remove-user", permissionHandler.RemovePermissionFromUser)
				protected.GET("/permissions/stats", permissionHandler.GetPermissionStats)
				protected.POST("/permissions/initialize", permissionHandler.InitializePermissions)
				
				// Role management
				protected.GET("/roles", permissionHandler.GetRoles)
				protected.POST("/roles", permissionHandler.CreateRole)
				protected.GET("/roles/:id", permissionHandler.GetRole)
				protected.PUT("/roles/:id", permissionHandler.UpdateRole)
				protected.DELETE("/roles/:id", permissionHandler.DeleteRole)
				protected.POST("/roles/assign-user", permissionHandler.AssignRoleToUser)
				protected.POST("/roles/remove-user", permissionHandler.RemoveRoleFromUser)
				protected.GET("/roles/users/:id", permissionHandler.GetUserRoles)
				
				// Data export
				protected.POST("/export", exportHandler.ExportData)
				protected.GET("/export/download/:filename", exportHandler.DownloadExport)
				protected.GET("/export/users/:id", exportHandler.ExportUserData)
				protected.GET("/export/system-report", exportHandler.ExportSystemReport)
				protected.GET("/export/types", exportHandler.GetExportTypes)
				protected.GET("/export/templates", exportHandler.GetExportTemplates)
				protected.POST("/export/cleanup", exportHandler.CleanupExpiredExports)
				
				// Storage management
				protected.GET("/storage/objects", storageHandler.ListStorageObjects)
				protected.GET("/storage/objects/download/*objectKey", storageHandler.DownloadStorageObject)
				
				// Redis management
				protected.GET("/redis/info", redisHandler.GetRedisInfo)
				protected.GET("/redis/keys", redisHandler.GetKeys)
				protected.POST("/redis/keys/get", redisHandler.GetKeyValue)  // 使用POST传递key名
				protected.POST("/redis/keys/delete", redisHandler.DeleteKey) // 使用POST传递key名
				protected.POST("/redis/keys/ttl", redisHandler.SetKeyTTL)    // 使用POST传递key和TTL
				protected.POST("/redis/test", redisHandler.TestConnection)
				protected.POST("/redis/command", redisHandler.ExecuteCommand)
				protected.POST("/redis/flush", redisHandler.FlushDB)
				protected.GET("/redis/app-keys", redisHandler.GetApplicationKeys)
				
				
			// Public file access (for image preview)
			adminGroup.GET("/storage/preview/*objectKey", storageHandler.DownloadStorageObject)

				protected.GET("/ping", func(c *gin.Context) {
					c.JSON(http.StatusOK, gin.H{
						"message": "admin pong",
					})
				})
			}
		}

		// Vibe Friend routes (用户业务接口)
		vf := api.Group("/vf/v1")
		{
			// 身份认证接口
			authGroup := vf.Group("/auth")
			{
				authGroup.POST("/register", vfAuthHandler.Register)
				authGroup.POST("/login", vfAuthHandler.Login)
				authGroup.POST("/refresh", vfAuthHandler.Refresh)
				authGroup.POST("/logout", vfAuthHandler.Logout)
			}
			
			// 需要认证的接口
			protected := vf.Group("/")
			protected.Use(middleware.AuthMiddleware())
			{
				// 个人中心
				protected.GET("/profile", vfProfileHandler.GetProfile)
				protected.PUT("/profile", vfProfileHandler.UpdateProfile)
				
				// 公开的用户资料查看
				protected.GET("/users/:id/profile", vfProfileHandler.GetUserProfile)
				
				// 文件管理
				protected.POST("/files/upload", vfFileHandler.UploadFile)
				protected.POST("/files/avatar", vfFileHandler.UploadAvatar)
				protected.GET("/files", vfFileHandler.GetFiles)
				protected.GET("/files/stats", vfFileHandler.GetFileStats)
				protected.DELETE("/files/:id", vfFileHandler.DeleteFile)
				
				// 邮件管理
				protected.POST("/email/send-verification", vfEmailHandler.SendVerificationEmail)
				protected.GET("/email/status", vfEmailHandler.GetEmailStatus)
				protected.GET("/email/logs", vfEmailHandler.GetEmailLogs)
			}
			
			// 公开的文件下载接口（支持公开文件）
			vf.GET("/files/:id/download", vfFileHandler.DownloadFile)
			
			// 公开的邮件接口
			vf.GET("/email/verify", vfEmailHandler.VerifyEmail)
			vf.POST("/email/request-reset", vfEmailHandler.RequestPasswordReset)
			vf.POST("/email/reset-password", vfEmailHandler.ResetPassword)
			
			// 测试接口
			vf.GET("/ping", func(c *gin.Context) {
				c.JSON(http.StatusOK, gin.H{
					"code":    0,
					"message": "vf pong",
				})
			})
		}
	}

	return r
}
