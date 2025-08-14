# 🌐 Frontend & Backend Connection Setup

## ✅ Changes Made for Netlify + Render Deployment

### 📁 Frontend Configuration (Netlify)

#### 1. **Environment Variables Setup**
- Created `.env.production` with production API URL
- Created `.env.local` for local development
- Updated `apiClient.js` to use environment-based URLs

#### 2. **API Client Updates**
```javascript
// Auto-detects environment and uses appropriate API URL
const getAPIBaseURL = () => {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;  // From env vars
  }
  
  if (import.meta.env.DEV || window.location.hostname === 'localhost') {
    return 'http://localhost:3001/api';  // Local development
  }
  
  return 'https://weaveos.onrender.com/api';  // Production
};
```

#### 3. **Netlify Configuration** (`netlify.toml`)
```toml
[build]
  publish = "dist"
  command = "npm run build"

[build.environment]
  VITE_API_BASE_URL = "https://weaveos.onrender.com/api"
  VITE_NODE_ENV = "production"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### 🖥️ Backend Configuration (Render)

#### 1. **CORS Configuration**
Updated `server/.env` to include Netlify domain:
```bash
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:5174,http://localhost:5177,http://localhost:3000,https://weaveos.netlify.app
```

#### 2. **Production Environment** (`server/.env.production`)
```bash
NODE_ENV=production
PORT=10000
ALLOWED_ORIGINS=https://weaveos.netlify.app,http://localhost:5173
MONGODB_URI=mongodb+srv://snb2005:F92TUrJL1q9o7otB@cluster0.zlilfjz.mongodb.net/weave-os
# ... other production settings
```

### 🔧 Development vs Production URLs

| Environment | Frontend URL | Backend URL |
|-------------|-------------|-------------|
| **Local Development** | http://localhost:5173 | http://localhost:3001 |
| **Production** | https://weaveos.netlify.app | https://weaveos.onrender.com |

## 🚀 Deployment Steps

### For Netlify (Frontend)
1. **Environment Variables** - Already configured in `netlify.toml`
2. **Build Settings** - Uses `npm run build` command
3. **Domain** - Will be available at `https://weaveos.netlify.app`

### For Render (Backend)
1. **Set Environment Variables** in Render dashboard:
   ```bash
   NODE_ENV=production
   PORT=10000
   MONGODB_URI=your-connection-string
   ALLOWED_ORIGINS=https://weaveos.netlify.app,http://localhost:5173
   JWT_SECRET=your-secure-secret
   SESSION_SECRET=your-secure-secret
   ENABLE_CORS_CREDENTIALS=true
   ```

2. **Build Settings**:
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Root Directory: `server`

## 🔄 How It Works

### Environment Detection
The frontend automatically detects the environment:

```javascript
// Development (localhost)
if (hostname === 'localhost') {
  API_URL = 'http://localhost:3001/api'
}

// Production (netlify)
if (hostname === 'weaveos.netlify.app') {
  API_URL = 'https://weaveos.onrender.com/api'
}
```

### Cross-Origin Requests
- **CORS** is configured on the backend to allow requests from both local and production domains
- **Credentials** are enabled for authentication cookies/headers
- **Headers** include Authorization for JWT tokens

## 🧪 Testing

### Local Development
```bash
# Terminal 1: Frontend
npm run dev  # http://localhost:5173

# Terminal 2: Backend  
cd server && npm run dev  # http://localhost:3001
```

### Production URLs
- **Frontend**: https://weaveos.netlify.app
- **Backend**: https://weaveos.onrender.com
- **Health Check**: https://weaveos.onrender.com/health

## ⚠️ Important Notes

1. **CORS Security**: Only specified domains can access the API
2. **Environment Variables**: Never commit real `.env` files
3. **MongoDB**: Ensure IP whitelist includes Render's IPs
4. **SSL**: Production uses HTTPS for both frontend and backend
5. **Authentication**: JWT tokens work across domains with proper CORS

## 🐛 Troubleshooting

### Common Issues:
1. **CORS Errors**: Check `ALLOWED_ORIGINS` includes your domain
2. **API Connection**: Verify `VITE_API_BASE_URL` is correct
3. **Auth Issues**: Ensure credentials are enabled in CORS
4. **Build Failures**: Check environment variables are set

### Debug Commands:
```bash
# Check API URL in browser console
console.log('API URL:', import.meta.env.VITE_API_BASE_URL)

# Test backend health
curl https://weaveos.onrender.com/health
```

## ✅ Next Steps

1. **Deploy to Render**: Set environment variables and deploy backend
2. **Deploy to Netlify**: Push to main branch for automatic deployment
3. **Test Connection**: Verify frontend can communicate with backend
4. **Monitor**: Check both service health endpoints
