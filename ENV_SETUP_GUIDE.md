# Environment Variables Setup Guide

## ⚠️ SECURITY NOTICE

**NEVER commit `.env` files to Git!** This repository is configured to exclude all environment files from version control.

## Files Tracked in Git

✅ `.env.example` - Template file with placeholder values (safe to commit)
✅ `server/.env.example` - Server template file (safe to commit)

## Files NOT Tracked (Ignored by Git)

❌ `.env` - Your local environment file
❌ `.env.local` - Local overrides
❌ `.env.production` - Production configuration
❌ `server/.env` - Server environment file
❌ Any file matching `.env.*` pattern

---

## Setup Instructions

### 1. Local Development

#### Frontend (.env)
```bash
# Copy the example file
cp .env.example .env

# Edit with your local values
VITE_API_BASE_URL=http://localhost:3001/api
VITE_NODE_ENV=development
VITE_ENABLE_DEBUG=true
```

#### Backend (server/.env)
```bash
# Copy the example file
cp server/.env.example server/.env

# Edit with your local values
NODE_ENV=development
PORT=3001
MONGODB_URI=mongodb://localhost:27017/weave-os
SESSION_SECRET=your-local-secret-here
JWT_SECRET=your-local-jwt-secret-here
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:5174
ENABLE_CORS_CREDENTIALS=true
```

---

## 2. Production Deployment

### Netlify (Frontend)

Environment variables are configured in `netlify.toml` and Netlify Dashboard:

1. **In netlify.toml** (already configured):
   - `VITE_API_BASE_URL` - Points to your Render backend
   - `VITE_NODE_ENV` - Set to production
   - `VITE_ENABLE_DEBUG` - Set to false

2. **In Netlify Dashboard** (if needed for secrets):
   - Go to Site settings > Build & deploy > Environment variables
   - Add any sensitive variables that shouldn't be in netlify.toml

### Render (Backend)

Environment variables must be set in Render Dashboard:

1. Go to your service on Render
2. Navigate to **Environment** tab
3. Add the following variables:

#### Required Variables
```
NODE_ENV=production
PORT=10000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/weaveos?retryWrites=true&w=majority
SESSION_SECRET=<generate-strong-random-secret>
JWT_SECRET=<generate-different-strong-random-secret>
ALLOWED_ORIGINS=https://your-app.netlify.app,https://weaveos.netlify.app
ENABLE_CORS_CREDENTIALS=true
```

#### Optional Variables
```
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
LOG_LEVEL=info

# If using Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

#### How to Generate Secrets
```bash
# Generate a strong random secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Or use online tools like:
# https://randomkeygen.com/
# https://passwordsgenerator.net/
```

---

## 3. MongoDB Setup

### Option A: MongoDB Atlas (Recommended)
1. Create account at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Create a cluster (free tier available)
3. Create database user
4. Whitelist IP addresses (or allow from anywhere: `0.0.0.0/0`)
5. Get connection string: `mongodb+srv://user:pass@cluster.mongodb.net/weaveos`
6. Add to Render environment variables as `MONGODB_URI`

### Option B: Render PostgreSQL
If you prefer PostgreSQL, you can modify the app to use Sequelize/TypeORM

---

## 4. Updating Environment Variables

### When adding new environment variables:

1. ✅ Add to `.env.example` with placeholder value
2. ✅ Add to `server/.env.example` if server-side
3. ✅ Document in this file
4. ✅ Update Render environment variables
5. ✅ Update Netlify environment variables (if frontend)
6. ❌ NEVER commit actual `.env` files

---

## 5. Verifying Setup

### Check if .env files are tracked
```bash
git ls-files | grep "\.env"
# Should ONLY show: .env.example and server/.env.example
```

### Check if .env files are ignored
```bash
git status
# Should NOT show any .env files in "Untracked files"
```

### Remove accidentally tracked .env files
```bash
# If you accidentally committed .env files:
git rm --cached .env .env.production server/.env
git commit -m "Remove environment files from git"
git push
```

---

## 6. Troubleshooting

### Frontend not connecting to backend?
- Check `VITE_API_BASE_URL` in Netlify environment
- Verify CORS settings in backend allow your Netlify domain
- Check Render logs for CORS errors

### Backend deployment fails?
- Verify all required environment variables are set in Render
- Check MongoDB URI is correct and accessible
- Review Render build logs for errors

### CORS errors?
- Add your Netlify domain to `ALLOWED_ORIGINS` in Render
- Ensure `ENABLE_CORS_CREDENTIALS=true` is set
- Check that your frontend uses correct API URL

---

## 7. Security Best Practices

1. ✅ Use different secrets for SESSION_SECRET and JWT_SECRET
2. ✅ Use strong, randomly generated secrets (64+ characters)
3. ✅ Never reuse production secrets in development
4. ✅ Rotate secrets periodically
5. ✅ Use MongoDB user with minimal required permissions
6. ✅ Enable IP whitelisting on MongoDB if possible
7. ✅ Review Render logs for suspicious activity
8. ✅ Keep dependencies updated for security patches

---

## Quick Reference

| Variable | Location | Purpose |
|----------|----------|---------|
| `VITE_API_BASE_URL` | Netlify | Frontend API endpoint |
| `MONGODB_URI` | Render | Database connection |
| `SESSION_SECRET` | Render | Session encryption |
| `JWT_SECRET` | Render | JWT token signing |
| `ALLOWED_ORIGINS` | Render | CORS whitelist |
| `NODE_ENV` | Render | Environment mode |

---

## Support

If you encounter issues:
1. Check Render logs: Dashboard > Logs
2. Check Netlify deploy logs: Deploys > [build]
3. Verify all environment variables are set
4. Ensure MongoDB is accessible
5. Check browser console for frontend errors
