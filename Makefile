.PHONY: help setup dev build docker-build test testkit lint migrate db-start db-stop db-logs

help:
	@echo "Usage: make <command>"
	@echo ""
	@echo "Commands:"
	@echo "  setup         First-time setup for development environment"
	@echo "  dev           Start development environment (backend hot-reload + frontend dev server)"
	@echo "  build         Build the Go binary and frontend assets"
	@echo "  docker-build  Build the production Docker image"
	@echo "  test          Run Go tests"
	@echo "  lint          Run linters for Go and frontend code"
	@echo "  migrate       Run database migrations"
	@echo "  db-start      Start PostgreSQL database using Docker"
	@echo "  db-stop       Stop PostgreSQL database"
	@echo "  db-logs       View PostgreSQL database logs"

# ==============================================================================
# DEVELOPMENT
# ==============================================================================

setup:
	@echo "🔧 Setting up development environment..."
	@echo "📋 Checking prerequisites..."
	@if ! command -v docker-compose &> /dev/null; then \
		echo "❌ docker-compose is not installed. Please install Docker and Docker Compose."; \
		exit 1; \
	fi
	@if ! command -v air &> /dev/null; then \
		echo "❌ air is not installed. Installing..."; \
		go install github.com/air-verse/air@latest; \
	fi
	@echo "📦 Installing frontend dependencies..."
	@cd web/admin && pnpm install
	@echo "🗄️  Starting PostgreSQL database..."
	@docker-compose up -d db
	@echo "⏳ Waiting for database to be ready..."
	@sleep 5
	@echo "✅ Setup complete! Run 'make dev' to start development."

dev:
	@echo "🚀 Starting development environment..."
	@echo "📦 Checking if PostgreSQL is running..."
	@if ! docker-compose ps db | grep -q "Up"; then \
		echo "🔧 PostgreSQL not running, starting database..."; \
		docker-compose up -d db; \
		echo "⏳ Waiting for database to be ready..."; \
		sleep 3; \
	else \
		echo "✅  PostgreSQL is already running"; \
	fi
	@echo "🔥 Starting backend server with Air (hot-reload)..."
	@air & \
	echo "🌐 Starting frontend dev server..."; \
	(cd web/admin && pnpm dev)

# ==============================================================================
# BUILD
# ==============================================================================

build: build-backend build-frontend

build-backend:
	@echo "Building Go binary..."
	@go build -o ./bin/server ./cmd/server

build-frontend:
	@echo "Building frontend assets..."
	@(cd web/admin && pnpm build)

docker-build:
	@echo "Building Docker image..."
	@docker build -t go-vibe-friend:latest .

# ==============================================================================
# TESTING & LINTING
# ==============================================================================

test:
	@echo "Running Go tests..."
	@go test ./...

testkit:
	@echo "Running TestKit (API & E2E)..."
	@$(MAKE) -C testkit testkit

lint:
	@echo "Running Go linter..."
	@golangci-lint run
	@echo "Running frontend linter..."
	@(cd web/admin && pnpm lint)

# ==============================================================================
# DATABASE
# ==============================================================================

migrate:
	@echo "Running database migrations..."
	# Add your migration command here, e.g., using goose or atlas
	@echo "Migration tool not implemented yet."

db-start:
	@echo "Starting PostgreSQL database..."
	@./scripts/start-db.sh

db-stop:
	@echo "Stopping PostgreSQL database..."
	@docker-compose down

db-logs:
	@echo "Viewing PostgreSQL database logs..."
	@docker-compose logs -f db

# ==============================================================================
# CLEANUP
# ==============================================================================

clean:
	@echo "Cleaning up..."
	@rm -f ./bin/server
	@rm -rf ./tmp
	@rm -f air.log
	@(cd web/admin && rm -rf dist .vite)

