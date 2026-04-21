#!/bin/bash

echo "🚧 Stopping all running containers..."
docker stop $(docker ps -aq) 2>/dev/null

echo "🗑 Removing all containers..."
docker rm $(docker ps -aq) 2>/dev/null

echo "🧼 Removing unused Docker volumes (Mongo data will be lost if stored here)..."
docker volume prune -f

echo "🧹 Removing unused Docker networks..."
docker network prune -f

echo "🔥 Removing dangling and unused images..."
docker image prune -a -f

echo "⚡ Clearing build cache..."
docker builder prune -a -f

echo "📦 Docker system prune (final sweep)..."
docker system prune -a --volumes -f

echo "✅ Cleanup complete!"
#!/bin/bash

echo "🧩 Bringing down docker-compose stack (including volumes & orphans)..."
docker compose down --volumes --remove-orphans 2>/dev/null || docker-compose down --volumes --remove-orphans 2>/dev/null

echo "🚧 Stopping all running containers..."
docker stop $(docker ps -aq) 2>/dev/null

echo "🗑 Removing all containers..."
docker rm $(docker ps -aq) 2>/dev/null

echo "🧼 Removing unused Docker volumes (Mongo data will be lost if stored here)..."
docker volume prune -f

echo "🧹 Removing unused Docker networks..."
docker network prune -f

echo "🔥 Removing dangling and unused images..."
docker image prune -a -f

echo "⚡ Clearing build cache..."
docker builder prune -a -f

echo "📦 Docker system prune (final sweep)..."
docker system prune -a --volumes -f

echo "✅ Cleanup complete!"