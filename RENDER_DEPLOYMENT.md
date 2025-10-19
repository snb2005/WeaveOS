# Render Deployment Configuration

This file configures the automatic deployment of Weave OS backend on Render.

## Service Configuration

- **Service Type**: Web Service
- **Environment**: Node.js
- **Build Command**: `cd server && npm install`
- **Start Command**: `cd server && npm start`
- **Health Check**: `/health` endpoint

## Environment Variables

⚠️ **IMPORTANT**: Environment variables are NOT stored in this file for security reasons.

You must manually configure the following environment variables in the Render Dashboard:

### Required Variables

1. **MONGODB_URI** - Your MongoDB connection string
   - Example: `mongodb+srv://user:pass@cluster.mongodb.net/weaveos`
   - Get from MongoDB Atlas or your MongoDB provider

2. **SESSION_SECRET** - Strong random secret for session encryption
   - Generate with: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`

3. **JWT_SECRET** - Strong random secret for JWT signing (different from SESSION_SECRET)
   - Generate with: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`

4. **ALLOWED_ORIGINS** - Comma-separated list of allowed frontend domains
   - Example: `https://weaveos.netlify.app,https://your-custom-domain.com`

### Optional Variables

- **ENABLE_CORS_CREDENTIALS**: `true`
- **RATE_LIMIT_WINDOW_MS**: `900000` (15 minutes)
- **RATE_LIMIT_MAX_REQUESTS**: `100`
- **LOG_LEVEL**: `info`

### If Using Cloudinary

- **CLOUDINARY_CLOUD_NAME**: Your Cloudinary cloud name
- **CLOUDINARY_API_KEY**: Your Cloudinary API key
- **CLOUDINARY_API_SECRET**: Your Cloudinary API secret

## How to Set Environment Variables on Render

1. Go to your service dashboard on Render
2. Click on "Environment" in the left sidebar
3. Click "Add Environment Variable"
4. Enter the key and value
5. Click "Save Changes"

The service will automatically redeploy with the new environment variables.

## Deployment Process

1. Push code to GitHub (this file is tracked)
2. Render automatically detects changes
3. Render runs the build command
4. Render starts the service with your environment variables
5. Health check endpoint is monitored at `/health`

## Monitoring

- **Logs**: Available in Render Dashboard > Logs
- **Metrics**: Available in Render Dashboard > Metrics
- **Health**: Monitor at `https://your-service.onrender.com/health`

## Troubleshooting

### Build Fails
- Check that `server/package.json` exists
- Verify Node.js version compatibility
- Review build logs in Render Dashboard

### Service Won't Start
- Verify all required environment variables are set
- Check that MongoDB is accessible from Render's IPs
- Review service logs for error messages

### CORS Errors
- Add your frontend domain to ALLOWED_ORIGINS
- Ensure ENABLE_CORS_CREDENTIALS is set correctly
- Verify the protocol (http vs https) in ALLOWED_ORIGINS

## Security Notes

- Never commit environment variables to git
- Use strong, unique secrets for SESSION_SECRET and JWT_SECRET
- Regularly rotate secrets
- Use MongoDB with authentication enabled
- Enable IP whitelisting on MongoDB when possible
- Monitor logs for suspicious activity

## Related Documentation

- [ENV_SETUP_GUIDE.md](./ENV_SETUP_GUIDE.md) - Complete environment setup guide
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Full deployment documentation
- [server/.env.example](./server/.env.example) - Template for environment variables
