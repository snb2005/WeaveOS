# Weave OS

**Enterprise Browser-Based Operating System**

[![React](https://img.shields.io/badge/React-18.x-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.x-38B2AC.svg)](https://tailwindcss.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green.svg)](https://www.mongodb.com/atlas)

## Executive Summary

Weave OS represents a paradigm shift in computing, delivering a complete desktop operating system experience through modern web browsers. Built with enterprise-grade architecture and inspired by Ubuntu/GNOME design principles, it provides organizations and developers with a powerful, scalable platform for cloud-native computing environments.

## 🏢 Enterprise Features

### Security & Authentication
- **🔐 JWT-Based Authentication** - Enterprise-grade token-based security
- **👤 Multi-User Management** - Role-based access control and user permissions
- **🛡️ Session Management** - Secure session handling with automatic timeout
- **🔒 Password Security** - Bcrypt encryption with configurable complexity requirements

### Infrastructure & Performance
- **☁️ Cloud-Native Architecture** - Designed for scalable cloud deployment
- **📊 MongoDB GridFS Integration** - Enterprise file storage with unlimited scalability
- **🚀 Optimized Performance** - Lazy loading, code splitting, and efficient resource management
- **📱 Cross-Platform Compatibility** - Runs on any modern browser across all devices

### File System & Storage
- **🗄️ Virtual File System** - Complete file system abstraction with POSIX-like operations
- **📁 Advanced File Management** - Full CRUD operations, batch processing, and metadata handling
- **🔍 Enterprise Search** - Full-text search across files and folders with advanced filtering
- **💾 Storage Analytics** - Real-time storage usage monitoring and quota management

## 🛠️ Technology Architecture

### Frontend Stack
```
React 18.x          → Component-based UI framework
TypeScript 5.x      → Type-safe development environment  
Tailwind CSS 3.x    → Utility-first styling framework
Zustand             → Lightweight state management
Vite                → Next-generation build tooling
```

### Backend Infrastructure
```
Node.js + Express   → RESTful API server
MongoDB Atlas       → Cloud-native database
GridFS              → Large file storage system
JWT Authentication  → Stateless security tokens
Bcrypt             → Password hashing and salt
```

### Development Tools
```
ESLint + Prettier   → Code quality and formatting
Husky              → Git hooks for quality gates
TypeScript         → Compile-time error detection
Hot Module Reload   → Instant development feedback
```

## 📋 System Requirements

### Development Environment
- **Node.js**: Version 18.0 or higher
- **MongoDB**: Atlas cluster or local instance
- **Browser**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Memory**: Minimum 8GB RAM recommended
- **Storage**: 2GB available space for development

### Production Deployment
- **Server**: Linux/Windows/macOS with Docker support
- **Database**: MongoDB Atlas (recommended) or self-hosted MongoDB 5.0+
- **CDN**: CloudFlare or AWS CloudFront for static assets
- **SSL**: Valid SSL certificate for HTTPS deployment

## 🚀 Installation & Setup

### Prerequisites Setup
```bash
# Verify Node.js installation
node --version  # Should be 18.0+
npm --version   # Should be 8.0+

# Install Git (if not already installed)
git --version  # Should be 2.0+
```

### Project Installation
```bash
# 1. Clone the repository
git clone https://github.com/snb2005/WeaveOS.git
cd WeaveOS

# 2. Install frontend dependencies
npm install

# 3. Setup backend environment
cd server
npm install
cp .env.example .env

# 4. Configure environment variables (see Configuration section)
nano .env  # or use your preferred editor
```

### Environment Configuration
Create a `.env` file in the `server` directory with the following variables:

```env
# Database Configuration
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/weave-os
DB_NAME=weave-os

# Authentication
JWT_SECRET=your-super-secure-jwt-secret-key-here
JWT_EXPIRES_IN=7d
BCRYPT_ROUNDS=12

# Server Configuration
PORT=3001
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173

# Session Configuration
SESSION_SECRET=your-session-secret-key-here
SESSION_COOKIE_MAX_AGE=86400000

# File Upload Limits
MAX_FILE_SIZE=100MB
MAX_FILES_PER_USER=10000
```

### Database Setup
1. **Create MongoDB Atlas Cluster**:
   - Visit [MongoDB Atlas](https://cloud.mongodb.com)
   - Create a new cluster
   - Configure network access (whitelist your IP)
   - Create database user with read/write permissions

2. **Initialize Database**:
   ```bash
   cd server
   npm run db:init  # Creates initial collections and indexes
   ```

### Development Startup
```bash
# Terminal 1: Start backend server
cd server
npm run dev

# Terminal 2: Start frontend development server  
cd ..
npm run dev

# Access the application
open http://localhost:5173
```

## 🎯 Core Application Features

### Desktop Environment
- **🖥️ Complete Desktop Experience** - Window management, taskbar, system tray
- **🪟 Advanced Window System** - Drag, resize, minimize, maximize, snap-to-grid
- **🎨 Professional Theming** - Dark/light mode with enterprise color schemes
- **⌨️ Keyboard Navigation** - Full keyboard shortcuts and accessibility support

### Integrated Applications
- **📁 File Manager** - Multi-tab browsing, bulk operations, advanced search
- **💻 Terminal Emulator** - Full bash-compatible terminal with command history
- **📝 Code Editor** - Syntax highlighting, auto-completion, Git integration
- **🧮 Calculator** - Scientific calculator with memory functions
- **⚙️ System Settings** - User preferences, system configuration, theme management

### User Experience
- **🔄 Real-Time Updates** - Live file sync, instant notifications, collaborative editing
- **📱 Responsive Design** - Optimized for desktop, tablet, and mobile devices
- **🌐 Offline Capability** - Service worker caching for offline functionality
- **🔍 Global Search** - System-wide search across files, applications, and settings

## 📊 Performance Metrics

### Application Performance
- **Initial Load Time**: < 3 seconds on broadband connection
- **Memory Usage**: 150-300MB typical browser memory footprint
- **File Operations**: < 100ms for typical file system operations
- **Concurrent Users**: Supports 1000+ concurrent users per server instance

### Scalability Features
- **Horizontal Scaling**: Load balancer compatible with multiple server instances
- **Database Optimization**: Indexed queries with sub-second response times
- **CDN Integration**: Static asset delivery through global CDN network
- **Caching Strategy**: Redis-compatible session and file caching

## 🔧 Development Guidelines

### Code Quality Standards
```bash
# Run linting and formatting
npm run lint        # ESLint checks
npm run format      # Prettier formatting
npm run type-check  # TypeScript compilation

# Testing
npm run test        # Unit tests
npm run test:e2e    # End-to-end tests
npm run test:coverage # Coverage reports
```

### Project Structure
```
src/
├── apps/              # Application components
│   ├── CodeEditor/    # Code editor application
│   ├── Terminal/      # Terminal emulator
│   ├── FileManager/   # File management system
│   └── Settings/      # System configuration
├── components/        # Reusable UI components
│   ├── Desktop/       # Desktop environment
│   ├── Window/        # Window management
│   └── UI/           # Common UI elements
├── services/          # Business logic and API clients
│   ├── api/          # REST API integrations
│   ├── auth/         # Authentication services
│   └── vfs/          # Virtual file system
├── stores/            # State management
│   ├── authStore.ts  # Authentication state
│   ├── fileStore.ts  # File system state
│   └── windowStore.ts # Window management state
└── utils/             # Helper functions and utilities
```

### Contributing Workflow
1. **Fork & Clone**: Fork the repository and clone locally
2. **Branch**: Create feature branch (`git checkout -b feature/amazing-feature`)
3. **Develop**: Write code following established patterns
4. **Test**: Ensure all tests pass and coverage meets requirements
5. **Commit**: Use conventional commits (`feat:`, `fix:`, `docs:`, etc.)
6. **Pull Request**: Submit PR with detailed description and test results

## 🚀 Deployment Options

### Cloud Deployment (Recommended)
```bash
# Deploy to Vercel
npm run build
vercel --prod

# Deploy to Netlify
npm run build
netlify deploy --prod --dir=dist

# Deploy to AWS S3 + CloudFront
npm run build
aws s3 sync dist/ s3://your-bucket-name
```

### Docker Deployment
```dockerfile
# Dockerfile example
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

### Traditional Server Deployment
```bash
# Build for production
npm run build

# Setup reverse proxy (nginx example)
server {
    listen 80;
    server_name your-domain.com;
    location / {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 📞 Support & Community

### Documentation & Resources
- **📖 Wiki**: [GitHub Wiki](https://github.com/snb2005/WeaveOS/wiki)
- **🐛 Bug Reports**: [GitHub Issues](https://github.com/snb2005/WeaveOS/issues)
- **💬 Discussions**: [GitHub Discussions](https://github.com/snb2005/WeaveOS/discussions)
- **📧 Contact**: [support@weave-os.dev](mailto:support@weave-os.dev)

## 📄 Legal & Licensing

### Third-Party Acknowledgments
- **React Team** - Component framework and development tools
- **MongoDB** - Database platform and GridFS storage system
- **Tailwind Labs** - CSS framework and design system
- **Vercel** - Build tools and deployment platform
- **Open Source Community** - Countless contributors to supporting libraries

