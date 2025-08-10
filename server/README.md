# Weave OS Backend Server

A Node.js/Express backend server for the Weave OS browser-based operating system. This server provides user authentication, file management with MongoDB GridFS storage, and multi-user capabilities.

## 🚀 Features

- **User Authentication**: JWT + session-based authentication with bcrypt password hashing
- **File Management**: Upload, download, organize files with GridFS for large file storage
- **Multi-User Support**: Individual user spaces with storage quotas and permissions
- **File Sharing**: Granular permission system for sharing files between users
- **Security**: Rate limiting, CORS protection, helmet security headers
- **Admin Panel**: User management and system administration features

## 📋 Prerequisites

- Node.js (v16 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn package manager

## 🛠️ Installation

1. **Clone and navigate to server directory:**
   ```bash
   cd server
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start MongoDB:**
   ```bash
   # Ubuntu/Debian
   sudo systemctl start mongod
   
   # macOS with Homebrew
   brew services start mongodb/brew/mongodb-community
   
   # Docker
   docker run --name mongodb -p 27017:27017 -d mongo:latest
   ```

5. **Start the server:**
   ```bash
   npm start
   # or use the startup script
   ./start.sh
   ```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` |
| `PORT` | Server port | `3001` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/weave-os` |
| `JWT_SECRET` | JWT signing secret | Required |
| `SESSION_SECRET` | Session signing secret | Required |
| `DEFAULT_STORAGE_QUOTA` | Default user storage limit | `5GB` |
| `MAX_FILE_SIZE` | Maximum file upload size | `50MB` |

### Security Configuration

- **Rate Limiting**: 100 requests per 15 minutes by default
- **CORS**: Configured for development (localhost:5177, localhost:3000)
- **Password Hashing**: bcrypt with configurable rounds
- **Session Management**: MongoDB-backed sessions with secure cookies

## 📡 API Endpoints

### Authentication (`/api/auth`)
- `POST /register` - User registration
- `POST /login` - User login
- `POST /logout` - User logout
- `POST /change-password` - Change password
- `GET /me` - Get current user info

### File Management (`/api/files`)
- `GET /` - List user files
- `POST /upload` - Upload files
- `GET /:id` - Download file
- `PUT /:id` - Update file metadata
- `DELETE /:id` - Delete file
- `POST /folder` - Create folder
- `PUT /:id/move` - Move file/folder

### User Management (`/api/users`)
- `GET /profile` - Get user profile
- `PUT /profile` - Update profile
- `GET /storage` - Get storage info
- `GET /search` - Search users
- `GET /admin/all` - List all users (admin)
- `PUT /admin/:id/status` - Update user status (admin)

### File Sharing (`/api/sharing`)
- `POST /:id/share` - Share file with user
- `DELETE /:id/share/:userId` - Revoke file sharing
- `GET /shared-with-me` - Get files shared with user
- `GET /shared-by-me` - Get files shared by user

## 🗃️ Database Schema

### User Model
```javascript
{
  username: String (unique),
  email: String (unique),
  password: String (hashed),
  firstName: String,
  lastName: String,
  role: String (user/admin),
  storageQuota: Number,
  storageUsed: Number,
  isActive: Boolean,
  preferences: Object,
  homeDirectoryId: ObjectId
}
```

### File Model
```javascript
{
  filename: String,
  originalName: String,
  mimeType: String,
  size: Number,
  gridFSId: ObjectId,
  owner: ObjectId (User),
  parent: ObjectId (File),
  isDirectory: Boolean,
  permissions: {
    read: [ObjectId],
    write: [ObjectId],
    delete: [ObjectId],
    share: [ObjectId]
  },
  sharedWith: [{
    user: ObjectId,
    permissions: [String],
    sharedAt: Date
  }],
  isDeleted: Boolean,
  path: String
}
```

## 🚦 Development

### Running in Development Mode
```bash
npm run dev
```

### Running Tests
```bash
npm test
```

### Linting
```bash
npm run lint
```

### Database Operations
```bash
# Drop database (development only)
npm run db:drop

# Seed sample data
npm run db:seed
```

## 🔒 Security Features

- **Password Security**: bcrypt hashing with configurable rounds
- **JWT Tokens**: Secure token-based authentication
- **Rate Limiting**: Protection against brute force attacks
- **CORS Protection**: Configurable cross-origin request handling
- **Input Validation**: Comprehensive request validation
- **Session Security**: Secure HTTP-only cookies
- **File Upload Security**: Type and size validation

## 📊 Monitoring & Logging

- **Request Logging**: Morgan HTTP request logger
- **Error Handling**: Centralized error handling middleware
- **Health Checks**: `/health` endpoint for monitoring
- **Debug Logging**: Configurable debug output

## 🚀 Deployment

### Production Configuration
1. Set `NODE_ENV=production` in environment
2. Configure secure JWT and session secrets
3. Set up MongoDB replica set for production
4. Configure reverse proxy (nginx/Apache)
5. Set up SSL certificates
6. Configure proper CORS origins

### Docker Deployment
```bash
# Build image
docker build -t weave-os-backend .

# Run container
docker run -p 3001:3001 --env-file .env weave-os-backend
```

## 🤝 Integration with Frontend

The backend is designed to work with the Weave OS React frontend. Key integration points:

1. **Authentication**: JWT tokens stored in frontend, sent via Authorization header
2. **File Operations**: RESTful API for all file management operations
3. **Real-time Updates**: WebSocket support for live file system updates (future)
4. **Error Handling**: Consistent error response format

## 📚 Additional Resources

- [MongoDB Documentation](https://docs.mongodb.com/)
- [Express.js Guide](https://expressjs.com/en/guide/)
- [GridFS Documentation](https://docs.mongodb.com/manual/core/gridfs/)
- [JWT Best Practices](https://auth0.com/blog/a-look-at-the-latest-draft-for-jwt-bcp/)

## 🐛 Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Ensure MongoDB is running
   - Check connection string in `.env`
   - Verify network connectivity

2. **Authentication Failures**
   - Check JWT secret configuration
   - Verify token expiration settings
   - Ensure proper CORS configuration

3. **File Upload Issues**
   - Check file size limits
   - Verify GridFS configuration
   - Ensure sufficient storage space

4. **Permission Errors**
   - Verify user roles and permissions
   - Check file ownership
   - Ensure proper authentication

## 📄 License

This project is part of the Weave OS browser-based operating system.

---

For frontend integration, see the main [Weave OS README](../README.md).
