# Weave OS

**A modern browser-based operating system inspired by Ubuntu/GNOME**

[![React](https://img.shields.io/badge/React-18.x-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.x-38B2AC.svg)](https://tailwindcss.com/)

## Overview

Weave OS is a full-featured desktop environment that runs entirely in the web browser. Built with modern web technologies, it provides a familiar Ubuntu/GNOME-inspired interface with complete window management, file system operations, and native applications.

## 🚀 Quick Start

### Prerequisites
- Node.js 18.0 or later
- MongoDB Atlas account (for backend services)
- Modern web browser with ES6+ support

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/snb2005/WeaveOS.git
   cd WeaveOS
   ```

2. **Install frontend dependencies**
   ```bash
   npm install
   ```

3. **Setup backend services**
   ```bash
   cd server
   npm install
   ```

4. **Configure environment variables**
   ```bash
   # Copy and configure server environment
   cp server/.env.example server/.env
   # Edit server/.env with your MongoDB connection string
   ```

5. **Start the application**
   ```bash
   # Terminal 1: Start backend server
   cd server && npm start
   
   # Terminal 2: Start frontend development server
   npm run dev
   ```

6. **Access Weave OS**
   - Open your browser to `http://localhost:5173`
   - Use test credentials: `test@weave.com` / `password123`

## ✨ Current Features

### Core System
- **� User Authentication** - Secure login/registration with JWT tokens
- **🖥️ Desktop Environment** - Full Ubuntu/GNOME-inspired interface
- **🪟 Window Management** - Draggable, resizable windows with minimize/maximize/close
- **📱 System Components** - Top bar with clock, notifications, and user menu
- **🎯 Application Dock** - macOS-style dock with app launching and window management

### File System
- **📁 Virtual File System** - MongoDB GridFS-backed file storage
- **📂 File Manager** - Full-featured file browser with multiple view modes
- **🔍 Search & Navigation** - File search, breadcrumb navigation, and quick access
- **📤 File Operations** - Upload, download, create, delete, and organize files
- **� Text Editor** - Built-in text editor for code and document editing

### Applications
- **🖥️ Terminal** - Full-featured terminal emulator with command support
- **⚙️ Settings** - System preferences and theme customization
- **🧮 Calculator** - Basic calculator functionality
- **🌐 Browser** - Embedded web browser component
- **🎨 Icon Gallery** - System icon showcase and preview

### User Experience
- **🎨 Theme System** - Light/dark mode with auto-detection
- **🖼️ Wallpaper Management** - Custom wallpaper support with default themes
- **⌨️ Keyboard Shortcuts** - Standard desktop keyboard navigation
- **📱 Responsive Design** - Optimized for desktop and tablet devices

## 🏗️ Architecture

```
Weave OS/
├── Frontend (React + TypeScript)
│   ├── Desktop Environment
│   ├── Window Manager
│   ├── Application Framework
│   └── UI Components
├── Backend (Node.js + Express)
│   ├── Authentication System
│   ├── File Management API
│   ├── User Management
│   └── GridFS Integration
└── Database (MongoDB Atlas)
    ├── User Data
    ├── File Storage (GridFS)
    └── System Preferences
```

## 🛠️ Technology Stack

### Frontend
- **React 18** - Modern component-based UI framework
- **TypeScript** - Type-safe development environment
- **Tailwind CSS** - Utility-first CSS framework
- **Zustand** - Lightweight state management
- **Vite** - Fast build tool and development server

### Backend
- **Node.js** - JavaScript runtime environment
- **Express.js** - Web application framework
- **MongoDB** - Document database with GridFS
- **JWT** - JSON Web Token authentication
- **Bcrypt** - Password hashing and security

### Infrastructure
- **MongoDB Atlas** - Cloud database service
- **GridFS** - Large file storage system
- **CORS** - Cross-origin resource sharing
- **Helmet** - Security middleware

## 🔧 Development

### Project Structure
```
src/
├── apps/           # Application components
├── components/     # Reusable UI components
├── services/       # API and business logic
├── stores/         # State management
├── utils/          # Helper functions
└── hooks/          # Custom React hooks
```

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint checks

### Contributing
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 🚀 Roadmap

### Version 1.1 (Coming Soon)
- **📊 System Monitor** - Resource usage and process management
- **🔌 Plugin System** - Third-party application support
- **📚 Document Viewer** - PDF and document preview
- **🎵 Media Player** - Audio and video playback

### Version 1.2 (Planned)
- **👥 Multi-user Support** - Shared workspace functionality
- **🌐 Cloud Sync** - External cloud storage integration
- **📱 Mobile Support** - Touch-optimized mobile interface
- **🔄 Real-time Collaboration** - Live document editing

### Future Enhancements
- **🐳 Container Support** - Isolated application environments
- **🌍 Web App Integration** - Progressive Web App capabilities
- **🔒 Enhanced Security** - Two-factor authentication
- **🎯 Performance Optimization** - Advanced caching and loading

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Support

- **Documentation**: [GitHub Wiki](https://github.com/snb2005/WeaveOS/wiki)
- **Issues**: [GitHub Issues](https://github.com/snb2005/WeaveOS/issues)
- **Discussions**: [GitHub Discussions](https://github.com/snb2005/WeaveOS/discussions)

## 🙏 Acknowledgments

- **Ubuntu/GNOME** - Design inspiration and user experience patterns
- **React Community** - Tools, libraries, and best practices
- **Open Source Contributors** - Supporting libraries and frameworks

---

**Weave OS v1.0** - Bringing the desktop experience to the web browser.

