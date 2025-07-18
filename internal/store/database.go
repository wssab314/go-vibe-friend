package store

import (
	"fmt"
	"log"
	"os"
	"path/filepath"

	"go-vibe-friend/internal/config"
	"go-vibe-friend/internal/models"

	"gorm.io/driver/postgres"
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

type Database struct {
	*gorm.DB
}

func NewDatabase(cfg *config.Config) (*Database, error) {
	var db *gorm.DB
	var err error

	// Configure GORM logger
	gormLogger := logger.New(
		log.New(os.Stdout, "\r\n", log.LstdFlags),
		logger.Config{
			LogLevel: logger.Info,
			Colorful: true,
		},
	)

	switch cfg.Database.Driver {
	case "sqlite":
		// Ensure data directory exists
		if err := os.MkdirAll(filepath.Dir(cfg.Database.Name), 0755); err != nil {
			return nil, fmt.Errorf("failed to create data directory: %w", err)
		}
		
		db, err = gorm.Open(sqlite.Open(cfg.Database.Name), &gorm.Config{
			Logger: gormLogger,
		})
	case "postgres":
		dsn := cfg.GetDatabaseDSN()
		db, err = gorm.Open(postgres.Open(dsn), &gorm.Config{
			Logger: gormLogger,
		})
	default:
		return nil, fmt.Errorf("unsupported database driver: %s", cfg.Database.Driver)
	}

	if err != nil {
		return nil, fmt.Errorf("failed to connect to database: %w", err)
	}

	// Auto-migrate models
	if err := db.AutoMigrate(&models.User{}, &models.GenerationJob{}); err != nil {
		return nil, fmt.Errorf("failed to auto-migrate models: %w", err)
	}

	return &Database{db}, nil
}

func (d *Database) Close() error {
	sqlDB, err := d.DB.DB()
	if err != nil {
		return err
	}
	return sqlDB.Close()
}