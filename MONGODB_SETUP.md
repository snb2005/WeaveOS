# MongoDB Atlas Setup Guide for Weave OS

## 1. Create MongoDB Atlas Account
- Go to https://www.mongodb.com/atlas
- Click "Try Free" and sign up
- Verify your email

## 2. Create a New Cluster
- Choose "Build a Database"
- Select "M0 Sandbox" (Free tier)
- Choose your preferred cloud provider and region
- Name your cluster (e.g., "weave-os-cluster")
- Click "Create Deployment"

## 3. Create Database User
- In the "Security" tab, click "Database Access"
- Click "Add New Database User"
- Choose "Password" authentication
- Create a username and strong password
- Set permissions to "Atlas Admin" or "Read and write to any database"
- Click "Add User"

## 4. Configure Network Access
- In the "Security" tab, click "Network Access"
- Click "Add IP Address"
- Either:
  - Add your current IP address
  - Or click "Allow Access from Anywhere" (0.0.0.0/0) for development
- Click "Confirm"

## 5. Get Connection String
- Go to "Database" tab
- Click "Connect" on your cluster
- Choose "Drivers"
- Select "Node.js" and version "4.1 or later"
- Copy the connection string
- It will look like: `mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority`

## 6. Update Your .env File
Replace the MONGODB_URI in your .env file with:
```
MONGODB_URI=mongodb+srv://your-username:your-password@your-cluster.mongodb.net/weave-os?retryWrites=true&w=majority
```

Make sure to:
- Replace `your-username` with your database username
- Replace `your-password` with your database password
- Replace `your-cluster` with your actual cluster name
- Add `/weave-os` before the `?` to specify the database name

## 7. Test Connection
After updating your .env file, run:
```bash
cd /home/snb/Desktop/Weave/server
node test-connection.js
```

## Example Connection String
```
MONGODB_URI=mongodb+srv://weaveuser:MySecurePassword123@weave-cluster.ab1cd.mongodb.net/weave-os?retryWrites=true&w=majority
```

## Troubleshooting
- If you get authentication errors, check your username/password
- If you get network errors, check your IP whitelist in Network Access
- If you get timeout errors, try a different region for your cluster
- Make sure there are no extra spaces in your connection string
