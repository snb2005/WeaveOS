#!/bin/bash

# Weave OS Backend Setup Script

echo "🚀 Setting up Weave OS Backend..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Docker is installed
if command -v docker &> /dev/null; then
    echo -e "${GREEN}✅ Docker is installed${NC}"
    DOCKER_AVAILABLE=true
else
    echo -e "${YELLOW}⚠️  Docker is not installed${NC}"
    DOCKER_AVAILABLE=false
fi

# Check if MongoDB is installed locally
if command -v mongod &> /dev/null; then
    echo -e "${GREEN}✅ MongoDB is installed locally${NC}"
    MONGO_LOCAL=true
else
    echo -e "${YELLOW}⚠️  MongoDB is not installed locally${NC}"
    MONGO_LOCAL=false
fi

echo ""
echo "🔧 Setup Options:"
echo "1. Use Docker (MongoDB + Backend) - Recommended"
echo "2. Install MongoDB locally"
echo "3. Use existing MongoDB connection"

read -p "Choose an option (1-3): " choice

case $choice in
    1)
        if [ "$DOCKER_AVAILABLE" = true ]; then
            echo -e "${GREEN}🐳 Setting up with Docker...${NC}"
            
            # Copy environment file
            if [ ! -f .env ]; then
                cp .env.example .env
                echo -e "${GREEN}✅ Created .env file${NC}"
            fi
            
            # Start with Docker Compose
            echo "🚀 Starting services with Docker Compose..."
            docker-compose up -d
            
            echo ""
            echo -e "${GREEN}✅ Weave OS Backend is now running!${NC}"
            echo "📊 MongoDB: http://localhost:27017"
            echo "🚀 Backend API: http://localhost:3001"
            echo "🔍 Health Check: http://localhost:3001/health"
            echo ""
            echo "To stop the services: docker-compose down"
            echo "To view logs: docker-compose logs -f"
            
        else
            echo -e "${RED}❌ Docker is required for this option${NC}"
            echo "Please install Docker and try again"
            exit 1
        fi
        ;;
    2)
        echo -e "${YELLOW}📦 Installing MongoDB locally...${NC}"
        
        # Detect OS and install MongoDB
        if [[ "$OSTYPE" == "linux-gnu"* ]]; then
            echo "Installing MongoDB on Linux..."
            wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
            echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
            sudo apt-get update
            sudo apt-get install -y mongodb-org
            sudo systemctl start mongod
            sudo systemctl enable mongod
        elif [[ "$OSTYPE" == "darwin"* ]]; then
            echo "Installing MongoDB on macOS..."
            if command -v brew &> /dev/null; then
                brew tap mongodb/brew
                brew install mongodb-community
                brew services start mongodb/brew/mongodb-community
            else
                echo -e "${RED}❌ Homebrew is required to install MongoDB on macOS${NC}"
                exit 1
            fi
        else
            echo -e "${RED}❌ Unsupported operating system${NC}"
            echo "Please install MongoDB manually"
            exit 1
        fi
        
        # Copy environment file
        if [ ! -f .env ]; then
            cp .env.example .env
            echo -e "${GREEN}✅ Created .env file${NC}"
        fi
        
        # Install npm dependencies
        echo "📦 Installing npm dependencies..."
        npm install --legacy-peer-deps
        
        # Start the server
        echo "🚀 Starting backend server..."
        npm start
        ;;
    3)
        echo -e "${YELLOW}🔗 Using existing MongoDB connection...${NC}"
        
        read -p "Enter MongoDB URI (e.g., mongodb://localhost:27017/weave-os): " mongo_uri
        
        # Copy environment file and update MongoDB URI
        if [ ! -f .env ]; then
            cp .env.example .env
        fi
        
        # Update MongoDB URI in .env file
        sed -i "s|MONGODB_URI=.*|MONGODB_URI=$mongo_uri|" .env
        
        echo -e "${GREEN}✅ Updated .env file with MongoDB URI${NC}"
        
        # Install npm dependencies
        echo "📦 Installing npm dependencies..."
        npm install --legacy-peer-deps
        
        # Start the server
        echo "🚀 Starting backend server..."
        npm start
        ;;
    *)
        echo -e "${RED}❌ Invalid option${NC}"
        exit 1
        ;;
esac
