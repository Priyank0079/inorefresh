# 🧪 Testing Warehouse Notifications After Payment

**Purpose:** Verify that warehouse notifications are sent with sound after customer payment verification.

---

## 📋 Pre-Test Checklist

- [ ] Backend server running on port 7000
- [ ] Frontend running on port 5173  
- [ ] Test user account with Warehouse role created
- [ ] Test customer account created
- [ ] Products with warehouse assignments exist
- [ ] Browser DevTools open (F12)

---

## 🚀 Step 1: Start Backend with Visible Logs

**Terminal 1 (Backend):**
```bash
cd backend
npm run dev 2>&1 | tee backend.log
```

Watch for these logs during payment:
- `🏭 DEBUG: Emitting join-warehouse-room`
- `🔍 DEBUG: Order structure after payment verification`
- `📦 About to notify warehouses`
- `✅ Emitted socket notification to room`
- `📤 About to emit warehouse-notification to room`

---

## 🖥️ Step 2: Open Warehouse Dashboard

**Browser Tab 1:**
1. Go to `http://localhost:5173/warehouse`
2. Login as Warehouse user
3. Open DevTools (F12) → Console tab
4. Look for:
   ```
   ✅ Warehouse connected to socket server: [socketId]
   🏭 DEBUG: Emitting join-warehouse-room
   ✅ Joined warehouse notification room
   ```

**Keep this tab open and watch the console!**

---

## 🛒 Step 3: Create Order as Customer

**Browser Tab 2:**
1. Go to `http://localhost:5173` (customer app)
2. Login as Customer
3. Add products to cart (ensure they're from warehouses)
4. Go to checkout
5. Select delivery address
6. Choose **"Online Payment (Razorpay)"** as payment method
7. Complete the order (this creates order with status "Pending" payment)

**Expected backend logs:**
```
DEBUG: Order creation request: {...}
Order placed successfully
🕐 Online payment order - warehouse notification deferred until payment verified
```

---

## 💳 Step 4: Complete Payment

Still in **Browser Tab 2:**
1. Razorpay popup appears
2. Use test credentials:
   - Card: `4111 1111 1111 1111`
   - Expiry: `12/99`
   - CVV: `123`
   - OTP: `123456` (or any 6 digits)
3. Click "Pay"

**Expected backend logs (watch Terminal 1):**
```
🔍 DEBUG: Order structure after payment verification: {
  orderId: "...",
  orderNumber: "ORD...",
  paymentStatus: "Paid",
  itemsCount: 3,
  itemDetails: [
    { itemId: "...", productName: "...", warehouse: "...", warehouseExists: true }
  ]
}

📦 About to notify warehouses for paid order: ORD...
🔔 Notifying X warehouses about NEW_ORDER for order ORD...: {
  warehouseIds: ["...warehouse-id..."],
  itemsCount: 3,
  ioConnected: true
}

📤 About to emit warehouse-notification to room: warehouse-[ID]
✅ Emitted socket notification to room: warehouse-[ID]
✅ Warehouses notified of new paid order ORD...
```

---

## 🔔 Step 5: Check Warehouse Notification

In **Browser Tab 1 (Warehouse Dashboard):**

Look for in console:
```
🔔 New warehouse notification received: {
  type: "NEW_ORDER",
  orderNumber: "ORD...",
  orderId: "...",
  timestamp: "2026-05-29T..."
}
```

**Also should see:**
- ✅ **Popup notification modal appears** on screen
- 🔊 **Sound plays** (if browser allows autoplay)
- Order details displayed in popup
- Accept/Reject buttons available

---

## ✅ Success Indicators

When everything works properly, you should see:

### Backend Console (Terminal 1):
```
✅ Warehouses notified of new paid order ORD...
📤 About to emit warehouse-notification to room: warehouse-[ID]
✅ Emitted socket notification to room: warehouse-[ID]
```

### Warehouse Browser (Tab 1):
```
✅ Joined warehouse notification room: [warehouseId]
🔔 New warehouse notification received: {type: "NEW_ORDER", ...}
✅ Sound played successfully
```

### Visual:
- Popup appears on warehouse screen
- Shows customer name, address, order items
- Sound icon active if audio enabled
- Accept/Reject buttons clickable

---

## ❌ Troubleshooting

### Issue: Backend logs show "No warehouses found"
```
⚠️ WARNING: No warehouses found for order items!
```

**Fix:** Ensure products are assigned to a warehouse:
1. Go to admin dashboard
2. Edit product
3. Assign to Warehouse

---

### Issue: Backend logs show "Socket.io instance not found"
```
❌ Socket.io instance not found on req.app!
```

**Fix:** Restart backend server:
```bash
# Kill process and restart
npm run dev
```

---

### Issue: Warehouse console shows "Warehouse socket connection error"
```
❌ Warehouse socket connection error: ...
```

**Fix:** Check:
1. Backend is running on port 7000
2. Warehouse user is logged in
3. Browser DevTools Network tab - WebSocket connection should show as "101 Switching Protocols"

---

### Issue: Sound doesn't play
```
❌ Error playing sound: NotAllowedError
```

**Fix:** Browser autoplay policy issue:
1. Click anywhere on the page to enable audio
2. Or manually click the notification to trigger sound
3. Check browser audio settings

---

## 📊 Log Collection for Support

If notifications don't work, collect these logs:

**Backend:**
```bash
# Copy backend logs to file
npm run dev 2>&1 | grep -E "warehouse|notification|payment|DEBUG|Notifying" > warehouse_debug.log
```

**Frontend:**
1. Open DevTools Console
2. Right-click → Save as... → warehouse_console.txt
3. Filter messages with keywords: warehouse, notification, socket, error

**Share both files for debugging**

---

## 🔄 Quick Reset for Multiple Tests

To test again:
1. Clear warehouse browser cache (or use incognito)
2. Create new order with different product
3. Complete payment again
4. Watch logs and notification

---

## 📝 Final Verification Checklist

After completing all steps:

- [ ] Backend shows `✅ Warehouses notified` log
- [ ] Warehouse browser shows notification popup
- [ ] Notification includes correct order number
- [ ] Customer name and address displayed
- [ ] Order items listed with quantities
- [ ] Accept/Reject buttons are clickable
- [ ] Sound played (or attempted to play)
- [ ] Modal can be dismissed with close button
- [ ] No JavaScript errors in console

**If all items checked:** ✅ Warehouse notifications are working properly!

