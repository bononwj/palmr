.PHONY: help build start start-nginx stop stop-nginx logs logs-nginx reload-nginx clean shell shell-nginx update-version deploy-prod

# Default target
help:
	@echo "🚀 Palmr - Available Commands:"
	@echo ""
	@echo "  构建相关:"
	@echo "    make build                - Build Docker image with multi-platform support"
	@echo "    make update-version       - Update version in all package.json files"
	@echo ""
	@echo "  启动服务:"
	@echo "    make start                - Start Palmr (standalone)"
	@echo "    make start-nginx          - Start Palmr + Nginx (recommended)"
	@echo "    make deploy-prod          - Production deployment (auto-path)"
	@echo ""
	@echo "  停止服务:"
	@echo "    make stop                 - Stop Palmr (standalone)"
	@echo "    make stop-nginx           - Stop Palmr + Nginx"
	@echo ""
	@echo "  日志查看:"
	@echo "    make logs                 - Show Palmr logs"
	@echo "    make logs-nginx           - Show Nginx logs (interactive)"
	@echo ""
	@echo "  Nginx 管理:"
	@echo "    make reload-nginx         - Reload Nginx configuration"
	@echo "    make test-nginx           - Test Nginx configuration"
	@echo ""
	@echo "  其他:"
	@echo "    make shell                - Access Palmr container shell"
	@echo "    make shell-nginx          - Access Nginx container shell"
	@echo "    make clean                - Clean up containers and images"
	@echo ""
	@echo "📁 Scripts location: ./infra/"

# Build Docker image using the build script
build:
	@echo "🏗️  Building Palmr Docker image..."
	@echo "📝 This will update version numbers in all package.json files before building"
	@echo ""
	@chmod +x ./infra/update-versions.sh
	@chmod +x ./infra/build-docker.sh
	@echo "🔄 Starting build process..."
	@./infra/build-docker.sh

# Update version in all package.json files
update-version:
	@echo "🔄 Updating version numbers..."
	@echo "🏷️  Please enter the new version (e.g., v3.0.0, 3.0-beta):"
	@read -p "Version: " VERSION; \
	if [ -z "$$VERSION" ]; then \
		echo "❌ Error: Version cannot be empty"; \
		exit 1; \
	fi; \
	chmod +x ./infra/update-versions.sh; \
	./infra/update-versions.sh "$$VERSION"

# Start Palmr (standalone)
start:
	@echo "🚀 Starting Palmr (standalone)..."
	@docker-compose up -d

# Start Palmr + Nginx
start-nginx:
	@echo "🚀 Starting Palmr + Nginx..."
	@docker-compose -f docker-compose-nginx.yaml up -d
	@echo ""
	@echo "✅ Services started!"
	@echo "   Web: http://localhost"
	@echo "   API: http://localhost/api/"

# Stop Palmr (standalone)
stop:
	@echo "🛑 Stopping Palmr..."
	@docker-compose down

# Stop Palmr + Nginx
stop-nginx:
	@echo "🛑 Stopping Palmr + Nginx..."
	@docker-compose -f docker-compose-nginx.yaml down

# Show Palmr logs
logs:
	@echo "📋 Showing Palmr logs..."
	@docker-compose logs -f

# Show Nginx logs (interactive)
logs-nginx:
	@chmod +x ./nginx-logs.sh
	@./nginx-logs.sh

# Reload Nginx configuration
reload-nginx:
	@chmod +x ./nginx-reload.sh
	@./nginx-reload.sh

# Test Nginx configuration
test-nginx:
	@echo "🔍 Testing Nginx configuration..."
	@docker exec palmr-nginx nginx -t

# Clean up containers and images
clean:
	@echo "🧹 Cleaning up Docker containers and images..."
	@docker-compose down -v || true
	@docker-compose -f docker-compose-nginx.yaml down -v || true
	@docker system prune -f
	@echo "✅ Cleanup completed!"

# Access Palmr container shell
shell:
	@echo "🐚 Accessing Palmr container shell..."
	@docker exec -it palmr sh

# Access Nginx container shell
shell-nginx:
	@echo "🐚 Accessing Nginx container shell..."
	@docker exec -it palmr-nginx sh

# Restart services
restart:
	@echo "🔄 Restarting Palmr..."
	@docker-compose restart

restart-nginx:
	@echo "🔄 Restarting Palmr + Nginx..."
	@docker-compose -f docker-compose-nginx.yaml restart

# Production deployment with auto-path handling
deploy-prod:
	@echo "🚀 Production Deployment..."
	@chmod +x ./deploy-production.sh
	@./deploy-production.sh
