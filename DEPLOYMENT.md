# Deployment Guide - Netlify + Render

This guide explains how to deploy Weave OS with the frontend on Netlify and backend on Render.

## Architecture Overview

```
Frontend (Netlify)     Backend (Render)      Database (MongoDB Atlas)
https://weaveos.netlify.app  ←→  https://weaveos.onrender.com  ←→  MongoDB Cluster
```

## 🌐 Frontend Deployment (Netlify)

### 1. Environment Configuration

Netlify automatically uses these environment variables (configured in `netlify.toml`):

```bash
VITE_API_BASE_URL=https://weaveos.onrender.com/api
VITE_NODE_ENV=production
VITE_ENABLE_DEBUG=false
```

### 2. Build Settings

The `netlify.toml` file configures:
- **Build command**: `npm run build`
- **Publish directory**: `dist`
- **Redirects**: SPA routing support
- **Security headers**: XSS protection, frame options, etc.

### 3. Deployment Steps

1. **Connect Repository**:
   - Link your GitHub repo to Netlify
   - Choose the main branch for deployment

2. **Deploy**:
   - Netlify will automatically build and deploy
   - Site will be available at: `https://weaveos.netlify.app`

## 🖥️ Backend Deployment (Render)

### 1. Environment Variables

Set these environment variables in Render dashboard:

```bash
NODE_ENV=production
PORT=10000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/weave-os
JWT_SECRET=your-super-secure-jwt-secret
SESSION_SECRET=your-super-secure-session-secret
ALLOWED_ORIGINS=https://weaveos.netlify.app,http://localhost:5173
ENABLE_CORS_CREDENTIALS=true
BCRYPT_ROUNDS=12
MAX_FILE_SIZE=100000000
DEFAULT_STORAGE_QUOTA=5368709120
GRIDFS_BUCKET_NAME=weave-files
LOG_LEVEL=info
ENABLE_DEBUG_LOGS=false
```

### 2. Build Settings

- **Build command**: `npm install`
- **Start command**: `npm start`
- **Node version**: 18.x

### 3. Deployment Steps

1. **Create Web Service**:
   - Connect your GitHub repo
   - Choose the `server` directory as root
   - Set environment variables

2. **Deploy**:
   - Service will be available at: `https://weaveos.onrender.com`

## 🗄️ Database Setup (MongoDB Atlas)

### 1. Cluster Configuration

1. **Create Cluster**:
   - Choose your preferred cloud provider
   - Select region closest to your users

2. **Database Setup**:
   - Database name: `weave-os`
   - Collections will be created automatically

3. **Network Access**:
   - Add Render's IP addresses (or use 0.0.0.0/0 for all)
   - Ensure your development IP is whitelisted

### 2. Connection String

Format: `mongodb+srv://username:password@cluster.mongodb.net/weave-os?retryWrites=true&w=majority`

## 🔧 Local Development

### 1. Environment Setup

Create `.env.local` in the root directory:

```bash
VITE_API_BASE_URL=http://localhost:3001/api
VITE_NODE_ENV=development
VITE_ENABLE_DEBUG=true
```

Create `.env` in the `server` directory:

```bash
NODE_ENV=development
PORT=3001
MONGODB_URI=your-connection-string
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:5174
# ... other variables
```

### 2. Running Locally

```bash
# Frontend (Terminal 1)
npm run dev  # Runs on http://localhost:5173

# Backend (Terminal 2)
cd server
npm run dev  # Runs on http://localhost:3001
```

## 🔒 Security Considerations

### 1. CORS Configuration

The backend is configured to allow requests from:
- `https://weaveos.netlify.app` (production)
- `http://localhost:5173` (development)
- Additional localhost ports for testing

### 2. Environment Variables

- **Never commit** actual `.env` files
- Use strong, unique secrets for JWT and sessions
- Rotate secrets regularly in production

### 3. Database Security

- Use strong MongoDB credentials
- Whitelist only necessary IP addresses
- Enable MongoDB's built-in security features

## 🔄 Continuous Deployment

### Netlify
- Automatically deploys on push to main branch
- Environment variables configured in `netlify.toml`
- Build logs available in Netlify dashboard

### Render
- Automatically deploys on push to main branch
- Environment variables set in Render dashboard
- Service logs available in Render dashboard

## 🐛 Troubleshooting

### Common Issues

1. **CORS Errors**:
   - Check `ALLOWED_ORIGINS` includes your frontend domain
   - Verify protocol (http vs https) matches

2. **API Connection Issues**:
   - Check `VITE_API_BASE_URL` points to correct backend
   - Verify backend is running and accessible

3. **Database Connection**:
   - Confirm MongoDB connection string is correct
   - Check network access whitelist includes server IPs

### Debug Mode

Enable debug logging by setting:
- Frontend: `VITE_ENABLE_DEBUG=true`
- Backend: `ENABLE_DEBUG_LOGS=true`

## 📊 Monitoring

### Health Checks

- **Backend**: `https://weaveos.onrender.com/health`
- **Database**: Check MongoDB Atlas dashboard
- **Frontend**: Monitor Netlify deployment status

### Performance

- Monitor Render service metrics
- Check Netlify analytics for frontend performance
- MongoDB Atlas provides database performance insights
