package config

import (
	"fmt"
	"log"

	"github.com/spf13/viper"
)

type Config struct {
	Server   ServerConfig   `mapstructure:"server"`
	Database DatabaseConfig `mapstructure:"database"`
	OpenAI   OpenAIConfig   `mapstructure:"openai"`
	Gemini   GeminiConfig   `mapstructure:"gemini"`
}

type ServerConfig struct {
	Port string `mapstructure:"port"`
	Host string `mapstructure:"host"`
	Mode string `mapstructure:"mode"`
}

type DatabaseConfig struct {
	Driver   string `mapstructure:"driver"`
	Host     string `mapstructure:"host"`
	Port     int    `mapstructure:"port"`
	User     string `mapstructure:"user"`
	Password string `mapstructure:"password"`
	Name     string `mapstructure:"name"`
	SSLMode  string `mapstructure:"sslmode"`
}

type OpenAIConfig struct {
	APIKey  string `mapstructure:"api_key"`
	BaseURL string `mapstructure:"base_url"`
}

type GeminiConfig struct {
	APIKey  string `mapstructure:"api_key"`
	BaseURL string `mapstructure:"base_url"`
}

func Load() (*Config, error) {
	viper.SetConfigName("config")
	viper.SetConfigType("yaml")
	viper.AddConfigPath(".")
	viper.AddConfigPath("./config")

	// Set default values
	viper.SetDefault("server.port", "8080")
	viper.SetDefault("server.host", "0.0.0.0")
	viper.SetDefault("server.mode", "debug")
	viper.SetDefault("database.driver", "postgres")
	viper.SetDefault("database.host", "localhost")
	viper.SetDefault("database.port", 5432)
	viper.SetDefault("database.user", "postgres")
	viper.SetDefault("database.password", "postgres")
	viper.SetDefault("database.name", "go_vibe_friend")
	viper.SetDefault("database.sslmode", "disable")
	viper.SetDefault("openai.base_url", "https://api.openai.com/v1")
	viper.SetDefault("gemini.base_url", "https://generativelanguage.googleapis.com/v1beta")

	// Bind environment variables
	viper.SetEnvPrefix("APP")
	viper.AutomaticEnv()

	// Read config file if exists
	if err := viper.ReadInConfig(); err != nil {
		if _, ok := err.(viper.ConfigFileNotFoundError); !ok {
			return nil, fmt.Errorf("error reading config file: %w", err)
		}
		log.Println("Config file not found, using defaults and environment variables")
	}

	// Bind specific env vars
	viper.BindEnv("database.driver", "DB_DRIVER")
	viper.BindEnv("database.host", "DB_HOST")
	viper.BindEnv("database.port", "DB_PORT")
	viper.BindEnv("database.user", "DB_USER")
	viper.BindEnv("database.password", "DB_PASSWORD")
	viper.BindEnv("database.name", "DB_NAME")
	viper.BindEnv("database.sslmode", "DB_SSLMODE")
	viper.BindEnv("openai.api_key", "OPENAI_API_KEY")
	viper.BindEnv("openai.base_url", "OPENAI_BASE_URL")
	viper.BindEnv("gemini.api_key", "GEMINI_API_KEY")
	viper.BindEnv("gemini.base_url", "GEMINI_BASE_URL")

	var config Config
	if err := viper.Unmarshal(&config); err != nil {
		return nil, fmt.Errorf("error unmarshaling config: %w", err)
	}

	return &config, nil
}

func (c *Config) GetDatabaseDSN() string {
	switch c.Database.Driver {
	case "sqlite":
		return c.Database.Name
	case "postgres":
		return fmt.Sprintf("host=%s port=%d user=%s password=%s dbname=%s sslmode=%s",
			c.Database.Host,
			c.Database.Port,
			c.Database.User,
			c.Database.Password,
			c.Database.Name,
			c.Database.SSLMode)
	default:
		return c.Database.Name
	}
}