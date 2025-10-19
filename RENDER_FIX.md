# Render Deployment Fix - Dockerfile Issue

## Problem
Getting error: `failed to solve: failed to read dockerfile: open Dockerfile: no such file or directory`

## Solution

You have **TWO OPTIONS** to deploy on Render:

---

## Option 1: Use Node.js Build (RECOMMENDED for Free Tier)

This is simpler and works well with Render's free tier.

### Configuration (Already Set Up!)

The `render.yaml` is now configured to use Node.js:

```yaml
services:
  - type: web
    name: weaveos-backend
    env: node
    rootDir: server  # Points to server directory
    buildCommand: npm install
    startCommand: npm start
```

### Steps:
1. **Push your changes to GitHub**
2. **In Render Dashboard:**
   - If creating new service: Choose "Web Service" → Connect your GitHub repo
   - If service exists: It will auto-deploy
3. **Verify it's using Node.js environment** (not Docker)
4. **Add environment variables** as documented in `ENV_SETUP_GUIDE.md`

---

## Option 2: Use Docker Build

If you prefer Docker or need more control.

### In Render Dashboard:

1. Go to your service settings
2. Under **Build & Deploy**, set:
   - **Environment**: `Docker`
   - **Dockerfile Path**: `Dockerfile` (or `server/Dockerfile` if using that one)
   - **Docker Context**: `.` (root directory)

### OR Update render.yaml:

```yaml
services:
  - type: web
    name: weaveos-backend
    env: docker
    dockerfilePath: ./Dockerfile
    dockerContext: .
    healthCheckPath: /health
```

---

## Current Setup (Files Available)

I've created THREE Dockerfile options:

1. **`/Dockerfile`** - Root-level, builds from server directory
2. **`/server/Dockerfile`** - Server-specific Dockerfile

Choose ONE approach and stick with it!

---

## Recommended: Node.js (Option 1)

**Why?**
- ✅ Simpler setup
- ✅ Faster builds
- ✅ Better for Render free tier
- ✅ No Docker complexity
- ✅ Already configured in `render.yaml`

**Just push and it works!**

---

## If Using Docker (Option 2)

**Update your Render service:**

### Via Dashboard:
1. Service Settings → Build & Deploy
2. Change **Environment** to `Docker`
3. Set **Dockerfile Path** to `Dockerfile`
4. Save changes

### Via render.yaml:
```yaml
services:
  - type: web
    name: weaveos-backend
    env: docker  # Changed from 'node'
    dockerfilePath: ./Dockerfile
    dockerContext: .
```

---

## Quick Fix (Recommended)

Since `render.yaml` is already set to use **Node.js**, just:

```bash
# 1. Commit changes
git add .
git commit -m "Fix: Configure Render for Node.js deployment"

# 2. Push to GitHub
git push origin main

# 3. Render will auto-deploy using Node.js (not Docker)
```

---

## Verify Deployment

After deployment:

```bash
# Check health endpoint
curl https://weaveos-backend.onrender.com/health

# Should return:
# {"status":"OK","timestamp":"...","environment":"production"}
```

---

## Environment Variables

Remember to set these in Render Dashboard > Environment:

- `MONGODB_URI`
- `SESSION_SECRET`
- `JWT_SECRET`
- `ALLOWED_ORIGINS`
- `ENABLE_CORS_CREDENTIALS`

See `ENV_SETUP_GUIDE.md` for complete list.

---

## Still Getting Errors?

Check Render logs:
1. Go to Render Dashboard
2. Click on your service
3. Go to "Logs" tab
4. Look for build or runtime errors

Common issues:
- Missing environment variables
- MongoDB connection issues
- Port configuration (use Render's PORT env var)
- CORS configuration

---

## Summary

✅ **render.yaml** is configured for Node.js (Option 1)
✅ **Dockerfile** is available if needed (Option 2)
✅ **Choose one approach** and configure Render accordingly
✅ **Node.js is recommended** for simplicity

Just push your code and Render will deploy using Node.js! 🚀
