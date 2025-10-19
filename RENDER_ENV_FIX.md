# Render Environment Variables Troubleshooting

## Issue: NODE_ENV shows as "undefined" on Render

### 🔍 Diagnosis

If you see:
```
📊 Environment: undefined
```

This means Render is **not loading the `NODE_ENV` environment variable** properly.

---

## ✅ Solution: Verify Render Environment Settings

### Step 1: Check Render Dashboard

1. Go to [Render Dashboard](https://dashboard.render.com/)
2. Click on your **weaveos-backend** service
3. Click **"Environment"** in the left sidebar
4. Look for `NODE_ENV` in the list

### Step 2: Verify NODE_ENV is Set

You should see:
```
NODE_ENV = production
```

**If it's missing or shows a different value:**

#### Option A: Add via Dashboard
1. Click **"Add Environment Variable"**
2. Key: `NODE_ENV`
3. Value: `production`
4. Click **"Save Changes"**
5. Service will auto-deploy

#### Option B: Set via render.yaml (Already Done!)

Your `render.yaml` already has:
```yaml
envVars:
  - key: NODE_ENV
    value: production
```

**BUT** - If you created the service manually before adding `render.yaml`, Render might not have applied these settings!

---

## 🔧 Fix: Force Render to Use render.yaml Settings

### Method 1: Manual Trigger (Recommended)

1. Go to Render Dashboard > Your Service
2. Click **"Manual Deploy"** → **"Deploy latest commit"**
3. Or make a small change and push to GitHub

### Method 2: Delete and Recreate Service

⚠️ **Use this only if Method 1 doesn't work!**

1. **BEFORE DELETING**: Copy all your environment variables from Render Dashboard
2. Delete the service
3. Create new service from GitHub repo
4. Render will read `render.yaml` and apply settings
5. Manually add sensitive env vars (MONGODB_URI, secrets, etc.)

---

## 📋 Complete Environment Variables Checklist

Verify ALL of these are set in Render Dashboard:

### Required (From render.yaml)
- [ ] `NODE_ENV` = `production`
- [ ] `PORT` = `10000`

### Required (Manual - Security Sensitive)
- [ ] `MONGODB_URI` = `mongodb+srv://...your connection string...`
- [ ] `SESSION_SECRET` = `<64-char random string>`
- [ ] `JWT_SECRET` = `<64-char random string - different from SESSION_SECRET>`
- [ ] `ALLOWED_ORIGINS` = `https://weaveos.netlify.app` (or your domain)
- [ ] `ENABLE_CORS_CREDENTIALS` = `true`

### Optional (Recommended)
- [ ] `RATE_LIMIT_WINDOW_MS` = `900000`
- [ ] `RATE_LIMIT_MAX_REQUESTS` = `500`
- [ ] `BCRYPT_ROUNDS` = `10`
- [ ] `MAX_FILE_SIZE` = `50000000`
- [ ] `GRIDFS_BUCKET_NAME` = `weave-files`
- [ ] `DEFAULT_STORAGE_QUOTA` = `5368709120`
- [ ] `LOG_LEVEL` = `info`

---

## 🧪 Test After Setting Variables

### 1. Check Startup Logs

In Render Dashboard > Logs, you should see:
```
🔧 Loading environment variables...
📊 NODE_ENV: production
🔌 PORT: 10000
🗄️  MongoDB URI configured: YES
🔐 Session secret configured: YES
🔑 JWT secret configured: YES
✅ Connected to MongoDB
🚀 Weave OS Server running on port 10000
📊 Environment: production
```

### 2. Test Health Endpoint

```bash
curl https://weaveos-backend.onrender.com/health
```

Should return:
```json
{
  "status": "OK",
  "timestamp": "2025-10-19T...",
  "environment": "production",
  "nodeVersion": "v20.x.x",
  "platform": "linux"
}
```

---

## 🚨 Common Issues

### Issue 1: Environment still shows "undefined"

**Cause**: Render hasn't picked up the environment variables

**Fix**:
1. Verify `NODE_ENV` is in Render Dashboard > Environment
2. Trigger a manual deploy
3. Check logs for "Loading environment variables" section

### Issue 2: Some variables work, others don't

**Cause**: Typo in variable name or value

**Fix**:
1. Check for spaces in variable names (should be `NODE_ENV`, not `NODE_ENV `)
2. Check for trailing spaces in values
3. Environment variable names are **case-sensitive**

### Issue 3: Variables set but server crashes

**Cause**: Invalid MongoDB URI or missing secrets

**Fix**:
1. Verify MONGODB_URI format: `mongodb+srv://user:pass@cluster.mongodb.net/database`
2. Ensure MongoDB allows connections from `0.0.0.0/0` or Render's IPs
3. Generate new SESSION_SECRET and JWT_SECRET if they're from .env file

---

## 🔐 Security Best Practices

### Generate Production Secrets

**Never use development secrets in production!**

Generate new secrets for production:

```bash
# SESSION_SECRET (run this)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# JWT_SECRET (run this separately - should be different!)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### MongoDB Security

1. **Change your MongoDB password** if it was ever in git
2. **Create a new database user** specifically for production
3. **Use strong passwords** (20+ random characters)
4. **Whitelist Render IPs** or use `0.0.0.0/0` (all IPs)

---

## 📊 Debugging Commands

### Check Environment in Render Shell

1. Go to Render Dashboard > Shell
2. Run:
```bash
echo $NODE_ENV
echo $PORT
echo $MONGODB_URI | head -c 30  # Shows first 30 chars
printenv | grep -i node
```

### Check Running Process

```bash
ps aux | grep node
```

### Check Logs for Environment Info

The updated `server/index.js` now logs:
- All environment variables status on startup
- Whether each critical variable is set

---

## ✅ Success Criteria

Your deployment is working when you see:

1. ✅ Logs show `NODE_ENV: production`
2. ✅ Health endpoint returns `"environment": "production"`
3. ✅ MongoDB connection successful
4. ✅ Server starts without errors
5. ✅ No "undefined" in logs

---

## 🆘 Still Having Issues?

### Check Render Status
- [Render Status Page](https://status.render.com/)

### Review Logs
- Render Dashboard > Logs
- Look for errors during startup
- Check for "Loading environment variables" section

### Test Locally First
```bash
cd server
NODE_ENV=production PORT=10000 npm start
```

If it works locally but not on Render, the issue is with Render's environment configuration.

---

## 📝 Quick Fix Summary

1. ✅ **Verify** `NODE_ENV=production` is in Render Dashboard > Environment
2. ✅ **Add** all required environment variables manually in dashboard
3. ✅ **Trigger** a manual deploy or push a change to GitHub
4. ✅ **Check** logs for the new environment variable logging
5. ✅ **Test** the `/health` endpoint

**After these steps, you should see `Environment: production` instead of `undefined`!**
