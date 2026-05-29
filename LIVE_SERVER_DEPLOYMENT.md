# 🚀 LIVE SERVER DEPLOYMENT GUIDE

**Status:** Code pushed to GitHub
**Branch:** main
**Commits:** 3 new commits with notification fixes

---

## 📦 What's Being Deployed

### Changes Pushed:
1. ✅ **Interactive Notifications Section** - Enhanced UI with hover actions
2. ✅ **Warehouse Notification Fixes** - Comprehensive debug logging
3. ✅ **Debug Logging** - Payment routes, socket connections, audio playback

---

## 🛠️ Live Server Deployment Steps

### Step 1: SSH into Live Server
```bash
# Connect to your live server
ssh your_user@your_domain.com

# OR if using IP:
ssh your_user@your_server_ip
```

### Step 2: Navigate to Project Directory
```bash
# Go to your project folder
cd /path/to/inorefresh  # or wherever your project is

# Verify current branch and commits
git branch -v
git log --oneline -5
```

### Step 3: Pull Latest Changes from GitHub
```bash
# Pull the latest code from GitHub
git pull origin main

# Verify the 3 new commits were pulled
git log --oneline -5
# You should see:
# - "Add warehouse notification debugging documentation"
# - "Add comprehensive debug logging for warehouse notifications"
# - "Make notifications section fully interactive with hover actions"
```

### Step 4: Install/Update Dependencies (if needed)
```bash
# For backend
cd backend
npm install  # or npm ci for exact versions

# For frontend
cd ../frontend
npm install  # or npm ci
```

### Step 5: Build Frontend (if using production build)
```bash
cd frontend
npm run build
# This creates dist/ folder with optimized production build
```

### Step 6: Restart Services

#### Option A: Using PM2 (Recommended)
```bash
# If backend is running via PM2
pm2 restart inorefresh-backend --update-env
pm2 restart inorefresh-frontend --update-env
pm2 save

# Or by app name if different
pm2 restart all --update-env
pm2 save

# Check status
pm2 status
pm2 logs inorefresh-backend
```

#### Option B: Using systemd (if services are registered)
```bash
# Restart backend service
sudo systemctl restart inorefresh-backend

# Restart frontend service  
sudo systemctl restart inorefresh-frontend

# Check status
sudo systemctl status inorefresh-backend
sudo systemctl status inorefresh-frontend
```

#### Option C: Manual Restart
```bash
# Kill existing processes
pkill -f "npm run dev|node.*server"
sleep 2

# Start backend
cd /path/to/inorefresh/backend
npm run dev > backend.log 2>&1 &

# Start frontend (or serve with nginx/apache)
cd /path/to/inorefresh/frontend
npm run dev > frontend.log 2>&1 &

# Or use production:
npm run build
npm run preview > frontend.log 2>&1 &
```

### Step 7: Verify Services Are Running
```bash
# Check if ports are listening
netstat -tlnp | grep 7000  # Backend should be on 7000
netstat -tlnp | grep 5173  # Frontend dev on 5173 (or 80/443 if served via nginx)

# Or using lsof
lsof -i :7000
lsof -i :5173
```

### Step 8: Check Logs for Errors
```bash
# Watch backend logs in real-time
tail -f /path/to/inorefresh/backend.log | grep -E "error|ERROR|Error|warehouse|notification"

# Or if using PM2
pm2 logs inorefresh-backend --lines 50

# Check for these startup messages:
# ✓ MongoDB connected
# ✓ Socket.io initialized
# ✓ Server started on port 7000
```

---

## ✅ Testing Notifications on Live Server

### Quick Test (2 minutes)

**Step 1: Test Warehouse Notification**
```bash
# Open warehouse dashboard
Browser 1: https://yourdomain.com/warehouse
- Login as warehouse user
- Watch browser console (F12) for socket connection logs

# Create test order
Browser 2: https://yourdomain.com
- Login as customer
- Add products to cart (ensure they have warehouse assignments)
- Checkout
- Select "Online Payment"
- Complete payment

# Expected result in Browser 1:
✅ Popup notification appears
✅ Shows order details
✅ Accept/Reject buttons work
🔊 Audio plays (if volume enabled)
```

### Detailed Test (5 minutes)

**Check Debug Logs:**
```bash
# Tail backend logs
tail -f backend.log | grep -i "warehouse\|notification\|payment"

# Should see:
🔍 DEBUG: Order structure after payment verification
📦 About to notify warehouses
🔔 Notifying X warehouses
✅ Emitted socket notification
```

**Check Frontend Console:**
```
Browser console (F12) → Console tab:
✅ Warehouse connected to socket server
🏭 Emitting join-warehouse-room
✅ Joined warehouse notification room
🔔 New warehouse notification received
✅ Sound played successfully
```

---

## 🔍 Troubleshooting on Live Server

### If Backend Won't Start
```bash
# Check if port 7000 is in use
lsof -i :7000

# Kill existing process and restart
pkill -f "node.*server"
sleep 2
cd backend && npm run dev

# Check for MongoDB connection issues
# Verify MONGODB_URI environment variable is set
echo $MONGODB_URI

# Verify JWT_SECRET is set
echo $JWT_SECRET | head -c 20
```

### If Frontend Won't Load
```bash
# Check frontend service status
# If on development mode (npm run dev):
lsof -i :5173

# If served via nginx, check nginx logs:
tail -f /var/log/nginx/error.log
tail -f /var/log/nginx/access.log

# Verify VITE_API_URL is correct in .env
cat frontend/.env | grep VITE_API_URL
```

### If Notifications Don't Work
```bash
# 1. Check warehouse socket connection
# Open browser console, should see:
# ✅ Warehouse connected to socket server: [socketId]

# 2. Check backend logs during payment
tail -f backend.log | grep -E "Notifying|warehouse|emission"

# 3. Check if products are assigned to warehouses
# Go to admin, check product assignments

# 4. Check browser autoplay policy
# Make sure user has interacted with page first
# Or check browser audio permissions
```

---

## 📊 Monitoring Commands

### Monitor Real-Time Logs
```bash
# Backend notifications flow
tail -f backend.log | grep -E "warehouse|notification|payment|DEBUG|Notifying|Emitted"

# All errors
tail -f backend.log | grep -i "error"

# Socket connections
tail -f backend.log | grep -E "✅|❌|Socket|connected"
```

### Check Service Health
```bash
# Every service running?
ps aux | grep "npm\|node\|pm2"

# Ports listening?
netstat -tlnp | grep -E "7000|5173|80|443"

# MongoDB connected?
tail -f backend.log | grep -i "mongodb\|database"

# Socket.io initialized?
tail -f backend.log | grep -i "socket"
```

---

## 🚨 Emergency Rollback

If something goes wrong:

```bash
# See previous commits
git log --oneline -10

# Rollback to previous version
git revert HEAD~2  # Reverts last 2 commits
git push origin main

# Or reset to previous commit (WARNING: destructive)
git reset --hard HEAD~2
git push origin main --force

# Restart services
pm2 restart all
```

---

## 📋 Deployment Checklist

After deploying, verify:

- [ ] Code pulled from GitHub successfully
- [ ] No merge conflicts
- [ ] Dependencies installed (npm install completed)
- [ ] Backend starts without errors
- [ ] Frontend builds/starts without errors
- [ ] MongoDB connection verified
- [ ] Socket.io initialized (check logs)
- [ ] All ports accessible (7000, 5173, 80, 443)
- [ ] Warehouse socket connection works
- [ ] Notification popup appears after payment
- [ ] Sound plays (or error logged)
- [ ] Debug logs show correct flow
- [ ] No 404 or 500 errors in logs

---

## 📞 Support

If deployment fails:

1. **Check logs first:**
   ```bash
   tail -f backend.log | head -50
   tail -f frontend.log | head -50
   ```

2. **Verify environment variables:**
   ```bash
   echo "MONGODB_URI: $MONGODB_URI"
   echo "JWT_SECRET: ${JWT_SECRET:0:20}..."
   echo "RAZORPAY_KEY_ID: $RAZORPAY_KEY_ID"
   ```

3. **Restart from scratch:**
   ```bash
   pkill -f "npm\|node"
   sleep 2
   cd backend && npm run dev &
   cd ../frontend && npm run dev &
   ```

4. **Check network connectivity:**
   ```bash
   # Can backend reach MongoDB?
   ping your_mongodb_host
   
   # Can frontend reach backend API?
   curl -s http://localhost:7000/api/customer/categories | jq .
   ```

---

## 🎉 Success Indicators

When everything is deployed correctly, you should see:

**In Backend Logs:**
```
✓ MongoDB connected
✓ Socket.io initialized  
✓ Server started on http://localhost:7000
🔌 Socket.io initialized
```

**In Browser Console:**
```
✅ Warehouse connected to socket server
✅ Joined warehouse notification room
```

**After Payment:**
```
🔍 DEBUG: Order structure (items shown)
📦 About to notify warehouses
✅ Emitted socket notification
🔔 New warehouse notification received
✅ Sound played successfully
```

**Visually:**
- ✅ Notification popup appears
- ✅ Shows correct order number
- ✅ Shows customer name and address
- ✅ Shows order items
- ✅ Accept/Reject buttons work
- 🔊 Sound plays

---

## 📝 Deployment Log Template

Save this log after deployment:

```
Deployment Date: [DATE]
Deployed By: [YOUR_NAME]
Environment: [PRODUCTION/STAGING]
Commits Deployed: 3

Changes:
1. Interactive notifications section
2. Warehouse notification debug logging
3. Payment verification logging

Test Results:
- Backend logs: ✅ All expected logs present
- Socket connection: ✅ Warehouse connected
- Notification popup: ✅ Appeared after payment
- Audio: ✅ Played successfully
- Overall: ✅ PASSED

Issues Found: [NONE/DESCRIBE]
Resolution: [IF NEEDED]
Status: ✅ READY FOR USE
```

