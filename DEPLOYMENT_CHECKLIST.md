# Post-Deployment Checklist

## ✅ Completed

- [x] Removed `.env.production` and `server/.env` from git tracking
- [x] Updated `.gitignore` to block all `.env` files
- [x] Created `server/.env.example` template
- [x] Updated `render.yaml` with deployment instructions
- [x] Added `.dockerignore` files to prevent env leaks
- [x] Created comprehensive documentation

## 🔧 ACTION REQUIRED - Before Pushing to GitHub

### 1. Verify No Env Files Are Tracked
```bash
git ls-files | grep "\.env"
# Should ONLY show: .env.example and server/.env.example
```

### 2. Push to GitHub
```bash
git push origin main
```

## 🚀 ACTION REQUIRED - Render Setup

After pushing to GitHub, configure Render:

### 1. Set Environment Variables in Render Dashboard

Go to your service → Environment → Add Environment Variable:

#### Required Variables (MUST SET THESE!)

```bash
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/weaveos

# Security Secrets (Generate new ones!)
SESSION_SECRET=<run: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))">
JWT_SECRET=<run: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))">

# CORS (Update with YOUR Netlify domain!)
ALLOWED_ORIGINS=https://YOUR-APP.netlify.app
ENABLE_CORS_CREDENTIALS=true
```

#### Optional Variables
```bash
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
LOG_LEVEL=info
```

### 2. Trigger Redeploy
After setting environment variables, Render will automatically redeploy.

### 3. Update Netlify Configuration (if needed)

In your Netlify site settings, verify:
- `VITE_API_BASE_URL` points to your Render service URL
- Example: `https://weaveos-backend.onrender.com/api`

## 🧪 Testing After Deployment

### 1. Test Backend Health
```bash
curl https://YOUR-SERVICE.onrender.com/health
# Should return: {"status":"OK","timestamp":"...","environment":"production"}
```

### 2. Test Frontend Connection
- Open your Netlify site
- Open browser DevTools → Console
- Try to login/register
- Check for CORS errors

### 3. Check Logs
- **Render**: Dashboard → Logs
- **Netlify**: Deploys → [latest] → Deploy log

## 🔒 Security Verification

- [ ] No `.env` files in GitHub repository
- [ ] Environment variables set in Render Dashboard
- [ ] Different secrets for SESSION_SECRET and JWT_SECRET
- [ ] ALLOWED_ORIGINS includes only your domains
- [ ] MongoDB connection uses authentication
- [ ] Secrets are not hardcoded anywhere in code

## 📚 Documentation

- [ENV_SETUP_GUIDE.md](./ENV_SETUP_GUIDE.md) - Complete environment setup
- [RENDER_DEPLOYMENT.md](./RENDER_DEPLOYMENT.md) - Render-specific guide
- [server/.env.example](./server/.env.example) - Environment variables template

## ⚠️ Troubleshooting

### Build fails on Render?
- Verify `server/package.json` exists
- Check build logs for missing dependencies

### Can't connect to database?
- Verify MONGODB_URI is correct
- Check MongoDB allows connections from `0.0.0.0/0` or Render's IPs
- Test connection string with MongoDB Compass

### CORS errors in browser?
- Add your Netlify domain to ALLOWED_ORIGINS
- Include protocol: `https://`, not `http://`
- Check browser console for exact origin being blocked

### Frontend shows API errors?
- Verify Netlify's VITE_API_BASE_URL is correct
- Check Render service is running (not sleeping)
- Test health endpoint directly

## 🎉 Success Criteria

Your deployment is successful when:
1. ✅ Backend health check returns 200 OK
2. ✅ Frontend loads without errors
3. ✅ Can register/login successfully
4. ✅ No CORS errors in browser console
5. ✅ Database operations work (create/read files)
6. ✅ No `.env` files in GitHub

---

**Next Steps**: 
1. Push your code to GitHub
2. Set environment variables in Render
3. Test your deployed application
4. Monitor logs for any issues
