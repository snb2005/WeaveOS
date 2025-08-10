# Weave OS - Complete Installation Guide

This guide will help you set up the complete Weave OS browser-based operating system with multi-user authentication and file management.

## 🚀 Quick Start

### Prerequisites
- **Node.js** v16 or higher
- **MongoDB** (or Docker for easy setup)
- **Git** for cloning the repository

### 1. Clone and Setup Frontend

```bash
# Clone the repository
git clone https://github.com/snb2005/WeaveOS.git
cd WeaveOS

# Install frontend dependencies
npm install

# Start the frontend development server
npm run dev
```

The frontend will be available at `http://localhost:5174`

### 2. Setup Backend (Choose One Method)

#### Option A: Docker Setup (Recommended)
```bash
# Navigate to server directory
cd server

# Copy environment file
cp .env.example .env

# Start MongoDB and Backend with Docker
docker-compose up -d

# Check if services are running
docker-compose ps
```

#### Option B: Local MongoDB Setup
```bash
# Navigate to server directory
cd server

# Run the automated setup script
./setup.sh
# Choose option 2 for local MongoDB installation
# Or option 3 if you already have MongoDB running
```

#### Option C: Manual Setup
```bash
# Navigate to server directory
cd server

# Install dependencies
npm install --legacy-peer-deps

# Copy and configure environment
cp .env.example .env
# Edit .env file with your MongoDB connection string

# Start the backend server
npm start
```

## 🔧 Configuration

### Environment Variables

Edit `server/.env` file:

```env
# Server Configuration
NODE_ENV=development
PORT=3001

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/weave-os

# Authentication & Security
JWT_SECRET=your-jwt-secret-change-in-production
SESSION_SECRET=your-session-secret-change-in-production

# File Upload Configuration
MAX_FILE_SIZE=50000000  # 50MB
DEFAULT_STORAGE_QUOTA=5368709120  # 5GB

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100
```

### CORS Configuration

The backend is configured to accept requests from:
- `http://localhost:5173` (Vite default)
- `http://localhost:5174` (Alternative port)
- `http://localhost:3000` (Create React App)

## 🎯 Features

### Authentication System
- **User Registration**: Create new accounts with email validation
- **Secure Login**: JWT + session-based authentication
- **Password Management**: Change passwords securely
- **User Profiles**: Manage personal information and preferences

### File Management
- **File Upload**: Upload files with drag-and-drop support
- **Folder Creation**: Organize files in folders
- **File Sharing**: Share files with other users with granular permissions
- **Storage Quotas**: Each user has a configurable storage limit
- **GridFS Storage**: Large file support using MongoDB GridFS

### Desktop Environment
- **Window Management**: Draggable, resizable windows
- **Application Launcher**: Built-in apps (Files, Terminal, Text Editor, Calculator)
- **Theme System**: Light/dark themes with live wallpapers
- **Desktop Widgets**: Clock, system info, weather, notes, quick actions

## 🧪 Testing the System

### 1. Access the Frontend
Navigate to `http://localhost:5174` in your browser.

### 2. Create an Account
1. Click the **"Sign In"** button in the top-right corner
2. Switch to **"Sign up"** mode
3. Fill in your details and create an account

### 3. Test File Operations
1. Open the **Files** app from the dock
2. Upload some files
3. Create folders
4. Test file sharing with other users

### 4. Explore Features
- Open multiple applications
- Try the desktop widgets
- Switch between light/dark themes
- Test the terminal application

## 🔍 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user
- `POST /api/auth/change-password` - Change password

### File Management
- `GET /api/files` - List user files
- `POST /api/files/upload` - Upload file
- `GET /api/files/:id` - Download file
- `DELETE /api/files/:id` - Delete file
- `POST /api/files/folder` - Create folder
- `PUT /api/files/:id/move` - Move file/folder

### User Management
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update profile
- `GET /api/users/storage` - Get storage info
- `GET /api/users/search` - Search users

### File Sharing
- `POST /api/sharing/:id/share` - Share file
- `DELETE /api/sharing/:id/share/:userId` - Revoke sharing
- `GET /api/sharing/shared-with-me` - Files shared with user
- `GET /api/sharing/shared-by-me` - Files shared by user

## 🛠️ Development

### Frontend Development
```bash
# Start development server with hot reload
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Backend Development
```bash
cd server

# Start development server with auto-restart
npm run dev

# Run tests
npm test

# Check API health
curl http://localhost:3001/health
```

### Database Operations
```bash
cd server

# Drop database (development only)
npm run db:drop

# Seed sample data
npm run db:seed
```

## 🔒 Security Features

- **Password Hashing**: bcrypt with configurable rounds
- **JWT Tokens**: Secure token-based authentication
- **Rate Limiting**: Protection against brute force attacks
- **CORS Protection**: Configurable cross-origin request handling
- **Input Validation**: Comprehensive request validation
- **Session Security**: Secure HTTP-only cookies
- **File Upload Security**: Type and size validation

## 📊 Monitoring

### Health Checks
- **Frontend**: Available at the application URL
- **Backend**: `GET http://localhost:3001/health`
- **Database**: MongoDB connection status in server logs

### Logs
- **Frontend**: Browser console and Vite output
- **Backend**: Server logs with request/response details
- **Database**: MongoDB logs for connection and operation status

## 🐛 Troubleshooting

### Common Issues

1. **Frontend won't start**
   - Check if Node.js is installed: `node --version`
   - Clear npm cache: `npm cache clean --force`
   - Delete node_modules and reinstall: `rm -rf node_modules && npm install`

2. **Backend connection errors**
   - Verify MongoDB is running: Check with `mongo` or MongoDB Compass
   - Check environment variables in `server/.env`
   - Ensure port 3001 is not in use

3. **Authentication not working**
   - Check JWT secrets in environment variables
   - Verify CORS configuration allows your frontend URL
   - Check browser console for network errors

4. **File upload issues**
   - Check file size limits in configuration
   - Verify GridFS is properly configured
   - Ensure user has sufficient storage quota

### Reset Instructions

To completely reset the system:

```bash
# Stop all services
docker-compose down  # If using Docker
# Or kill Node.js processes manually

# Clear database
mongo weave-os --eval "db.dropDatabase()"

# Clear frontend storage
# In browser: DevTools > Application > Storage > Clear storage

# Restart services
docker-compose up -d  # Docker
# Or restart backend: npm start
```

## 📚 Architecture Overview

```
Weave OS Architecture

Frontend (React + TypeScript)
├── Desktop Environment
│   ├── Window Manager
│   ├── Application Launcher
│   └── Theme System
├── Authentication UI
│   ├── Login/Register Modal
│   └── User Profile Management
└── File Manager
    ├── File Upload/Download
    ├── Folder Navigation
    └── File Sharing Interface

Backend (Node.js + Express)
├── Authentication System
│   ├── JWT Token Management
│   ├── Session Handling
│   └── Password Security
├── File Management
│   ├── GridFS Storage
│   ├── Permission System
│   └── Sharing Mechanism
└── User Management
    ├── Profile Management
    ├── Storage Quotas
    └── Admin Functions

Database (MongoDB)
├── Users Collection
├── Files Collection (Metadata)
├── GridFS (File Storage)
└── Sessions Collection
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes and test thoroughly
4. Commit with descriptive messages
5. Push to your fork and create a pull request

## 🆘 Support

For support and questions:
- **GitHub Issues**: Report bugs and request features
- **Documentation**: Check this README and inline code comments
- **Community**: Join discussions in GitHub Discussions

---

**Weave OS** - A modern, browser-based operating system with multi-user support and comprehensive file management.
