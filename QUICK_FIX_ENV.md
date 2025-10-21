# Quick Fix: NODE_ENV Undefined on Render

## The Problem
```
📊 Environment: undefined
```

## The Solution (2 Minutes)

### Step 1: Go to Render Dashboard
1. Open [Render Dashboard](https://dashboard.render.com/)
2. Click your **weaveos-backend** service
3. Click **"Environment"** tab (left sidebar)

### Step 2: Check if NODE_ENV Exists
Look for a variable named `NODE_ENV`

#### If NODE_ENV is Missing:
1. Click **"Add Environment Variable"**
2. **Key**: `NODE_ENV`
3. **Value**: `production`
4. Click **"Save Changes"**
5. Wait for aauto-deploy (2-3 minutes)

#### If NODE_ENV Already Exists:
The issue might be that Render created the service before `render.yaml` was pushed.

**Fix**: Trigger a manual redeploy
1. Go to **"Manual Deploy"** tab
2. Click **"Deploy latest commit"**
3. Wait for deployment

### Step 3: Push Your Latest Changes

```bash
# Push the updated code with better logging
git push origin main
```

### Step 4: Check Logs

After deployment, go to **Logs** tab and look for:

```
🔧 Loading environment variables...
📊 NODE_ENV: production  ← Should show "production" now
🔌 PORT: 10000
🗄️  MongoDB URI configured: YES
```

### Step 5: Test Health Endpoint

```bash
curl https://weaveos-backend.onrender.com/health
```

Should return:
```json
{
  "status": "OK",
  "environment": "production"  ← Fixed!
}
```

---

## ✅ All Environment Variables You Need

Make sure **ALL** of these are in Render Dashboard > Environment:

### From render.yaml (Should be auto-set)
- `NODE_ENV` = `production`
- `PORT` = `10000`

### Manual (Security-sensitive - DON'T put in render.yaml)
- `MONGODB_URI` = Your MongoDB connection string
- `SESSION_SECRET` = Random 64-char string
- `JWT_SECRET` = Random 64-char string (different!)
- `ALLOWED_ORIGINS` = `https://weaveos.netlify.app`
- `ENABLE_CORS_CREDENTIALS` = `true`

### Generate Secrets
```bash
# SESSION_SECRET
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# JWT_SECRET (run again for different value)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## What Changed?

I updated `server/index.js` to:
1. ✅ Log all environment variables on startup (for debugging)
2. ✅ Use `'development'` as default if `NODE_ENV` not set
3. ✅ Show more info in `/health` endpoint

Now you'll see exactly which variables are set when the server starts!

---

## Expected Logs After Fix

```
🔧 Loading environment variables...
📊 NODE_ENV: production
🔌 PORT: 10000
🗄️  MongoDB URI configured: YES
🔐 Session secret configured: YES
🔑 JWT secret configured: YES
✅ Connected to MongoDB
🚀 Weave OS Server running on port 10000
📊 Environment: production  ← Fixed!
🔗 API Base URL: http://localhost:10000/api
✅ Server started successfully at 2025-10-19T...
```

---

## Still Undefined?

See **RENDER_ENV_FIX.md** for detailed troubleshooting!
