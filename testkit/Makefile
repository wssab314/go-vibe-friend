.PHONY: testkit test-api test-e2e reports-clean kill-server setup-db

testkit:
	@$(MAKE) test-api
	@$(MAKE) test-e2e

test-api: kill-server setup-db
	@echo "▶ Starting server for API tests..."
	@cd .. && make dev &
	@echo "⏳ Waiting for server to be ready..."
	@sleep 8
	@echo "▶ Running API Contract Tests"
	go test ./api/... -v -count=1 -coverprofile=reports/api.cover
	@$(MAKE) kill-server

setup-db:
	@echo "▶ Setting up the database for testing..."
	@echo "  - Waiting for PostgreSQL container..."
	@until docker-compose -f ../docker-compose.yml exec -T db pg_isready -U postgres; do sleep 1; done
	@echo "  - Running migrations..."
	@docker-compose -f ../docker-compose.yml exec -T db psql -U postgres -d go_vibe_friend -f /testkit-data/migrations/20250718_initial.sql
	@echo "  - Seeding data..."
	@docker-compose -f ../docker-compose.yml exec -T db psql -U postgres -d go_vibe_friend -f /testkit-data/data/seed.sql
	@echo "✅ Database is ready."


test-e2e:
	@echo "▶ E2E Tests (Playwright will manage the server)"
	cd e2e && pnpm test

reports-clean:
	rm -rf reports/*

kill-server:
	@echo "▶ Forcefully stopping any running dev servers..."
	@pkill -f "air" || true
	@pkill -f "vite" || true
	@lsof -t -i:8080 | xargs kill -9 || true
	@lsof -t -i:5173 | xargs kill -9 || true