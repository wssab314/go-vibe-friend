#!/bin/bash

# Script to start PostgreSQL database using Docker Compose

echo "🚀 Starting PostgreSQL database..."

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    echo "❌ docker-compose is not installed. Please install Docker and Docker Compose."
    exit 1
fi

# Start only the database service
docker-compose up -d db

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
sleep 8

# Check if database is running
if docker-compose ps db | grep -q "Up"; then
    echo "✅ PostgreSQL database is now running!"
    echo "📝 Connection details:"
    echo "   Host: localhost"
    echo "   Port: 5432"
    echo "   Database: go_vibe_friend"
    echo "   User: postgres"
    echo "   Password: postgres"
    echo ""
    echo "🔧 To connect using psql:"
    echo "   psql -h localhost -p 5432 -U postgres -d go_vibe_friend"
    echo ""
    echo "🛑 To stop the database:"
    echo "   docker-compose down"
else
    echo "❌ Failed to start database. Please check Docker logs:"
    echo "   docker-compose logs db"
    exit 1
fi