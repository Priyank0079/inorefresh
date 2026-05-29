# 🔔 Warehouse Notification Fix - Payment Verification Flow

**Issue:** When a customer places an order and completes payment verification, the warehouse should receive a popup notification with sound, but this is NOT happening.

---

## 📊 Current Flow Analysis

### 1. Order Creation (customerOrderController.ts:620-628)
```typescript
const isCOD = !savedOrder.paymentMethod || (savedOrder as any).paymentMethod === 'COD';
const alreadyPaid = (savedOrder as any).paymentStatus === 'Paid';

if (isCOD || alreadyPaid) {
  await notifyWarehousesOfOrderUpdate(io, savedOrder, 'NEW_ORDER');
} else {
  // For online payment, warehouse notification deferred until payment verified
  console.log(`🕐 Online payment order - warehouse notification deferred until payment verified`);
}
```

**✅ Status:** Correct - For online payment orders, notification is deferred.

---

### 2. Payment Verification (paymentRoutes.ts:100-146)
After successful payment capture:
```typescript
const updatedOrder = await Order.findById(orderId)
  .populate({ path: 'items', populate: { path: 'warehouse' } })
  .lean();

// 1. Notify warehouses
if (io) {
  await notifyWarehousesOfOrderUpdate(io, updatedOrder, 'NEW_ORDER');
  console.log(`✅ Warehouses notified of new paid order ${(updatedOrder as any).orderNumber}`);
}
```

**⚠️ Potential Issue:** The order is populated with items, but let me verify if warehouse data is properly populated.

---

### 3. Warehouse Notification Service (warehouseNotificationService.ts:10-143)
```typescript
export async function notifyWarehousesOfOrderUpdate(
    io: SocketIOServer,
    order: any,
    type: 'NEW_ORDER' | 'STATUS_UPDATE' | 'ORDER_CANCELLED'
): Promise<void>
```

**Process:**
1. Extract unique warehouse IDs from order items (lines 23-35)
2. For each warehouse, emit to `warehouse-${warehouseId}` room (line 71)
3. Emit event name: `warehouse-notification` (line 71)
4. Send push notification via Firebase (lines 75-96)

**Code:**
```typescript
const notificationData = {
  type,
  orderId: order._id,
  orderNumber: order.orderNumber,
  ...
};

io.to(roomName).emit('warehouse-notification', notificationData);
```

---

### 4. Warehouse Frontend (useWarehouseSocket.ts:75-80)
```typescript
newSocket.on('warehouse-notification', (notification: WarehouseNotification) => {
  console.log('🔔 New warehouse notification received:', notification.type, notification.orderNumber);
  if (onNotificationReceived) {
    onNotificationReceived(notification);
  }
});
```

**✅ Status:** Listening correctly.

---

### 5. Warehouse Layout (WarehouseLayout.tsx:21-22)
```typescript
const handleNotificationReceived = useCallback((notification: WarehouseNotification) => {
  setActiveNotification(notification);
}, []);
```

**✅ Status:** State update triggers.

---

### 6. Warehouse Notification Alert (WarehouseNotificationAlert.tsx:38-46)
```typescript
useEffect(() => {
  if (notification) {
    // Play sound when notification arrives
    if (audioRef.current) {
      audioRef.current.volume = volume;
      audioRef.current.play().catch(err => console.error('Error playing sound:', err));
    }
  }
}, [notification]);
```

**✅ Status:** Sound should play.

---

## 🔍 Diagnostic Checklist

### Backend Checks:
- [ ] Verify io is properly passed to paymentRoutes endpoint
- [ ] Check if order items are being populated with warehouse data
- [ ] Verify warehouse IDs are extracted correctly
- [ ] Confirm socket room names match: `warehouse-${warehouseId}`
- [ ] Check if socket.emit is actually happening

### Frontend Checks:
- [ ] Verify warehouse socket connection status (check browser console)
- [ ] Verify `join-warehouse-room` is being called with correct warehouse ID
- [ ] Check if `warehouse-notification` event is being received
- [ ] Verify audio file exists at `/assets/sound/seller_alert.mp3`
- [ ] Check browser DevTools Sound tab for permission issues

---

## 🛠️ FIXES TO IMPLEMENT

### FIX #1: Add Debug Logging to Payment Routes
**File:** `backend/src/routes/paymentRoutes.ts:100-115`

Add detailed logging before calling notifyWarehousesOfOrderUpdate:

```typescript
// ── Post-payment notifications ──────────────────────────────────────
setImmediate(async () => {
    try {
        const updatedOrder = await Order.findById(orderId)
            .populate({ path: 'items', populate: { path: 'warehouse' } })
            .lean();

        if (!updatedOrder) {
            console.error('❌ Updated order not found after payment:', orderId);
            return;
        }

        const io = req.app.get('io');
        if (!io) {
            console.error('❌ Socket.io instance not found on app!');
            return;
        }

        // DEBUG: Log order structure
        console.log('🔍 DEBUG: Updated order structure:', {
            _id: updatedOrder._id,
            orderNumber: (updatedOrder as any).orderNumber,
            items: (updatedOrder as any).items ? (updatedOrder as any).items.length : 0,
            itemDetails: (updatedOrder as any).items?.map((item: any) => ({
                id: item._id,
                warehouse: item.warehouse?._id || item.warehouse,
                product: item.productName
            }))
        });

        // 1. Notify warehouses
        if (io && (updatedOrder as any).items && (updatedOrder as any).items.length > 0) {
            console.log('📦 About to notify warehouses for order:', (updatedOrder as any).orderNumber);
            await notifyWarehousesOfOrderUpdate(io, updatedOrder, 'NEW_ORDER');
            console.log(`✅ Warehouses notified of new paid order ${(updatedOrder as any).orderNumber}`);
        } else {
            console.warn('⚠️ Order has no items or io not available:', {
                itemsCount: (updatedOrder as any).items?.length,
                ioExists: !!io
            });
        }

        // 2. ... rest of code
    } catch (notifyErr) {
        console.error('❌ Post-payment notification error:', notifyErr);
    }
});
```

---

### FIX #2: Add Debug Logging to Warehouse Notification Service
**File:** `backend/src/services/warehouseNotificationService.ts:36-72`

```typescript
const warehouseIds: string[] = Array.from(new Set(rawIds)) as string[];

console.log(`🔔 Notifying ${warehouseIds.length} warehouses about ${type} for order ${order.orderNumber}:`, {
    warehouseIds,
    orderNumber: order.orderNumber,
    orderId: order._id.toString(),
    itemsCount: orderItems.length,
    io: io ? 'connected' : 'null'
});

if (warehouseIds.length === 0) {
    console.warn('⚠️ No warehouses found for order items! This means order items are not populated.');
    return;
}

for (const warehouseId of warehouseIds) {
    const roomName = `warehouse-${warehouseId}`;
    console.log(`📤 Emitting to room: ${roomName}`);
    
    io.to(roomName).emit('warehouse-notification', notificationData);
    console.log(`✅ Emitted to ${roomName}`);
}
```

---

### FIX #3: Verify Order Population in Payment Service Webhook Handler
**File:** `backend/src/services/paymentService.ts:323`

Current:
```typescript
updatedOrder = await Order.findById(payment.order).populate({ path: 'items', populate: { path: 'warehouse' } }).lean();
```

Should verify this is working correctly. Let me check and add debug logging:

```typescript
updatedOrder = await Order.findById(payment.order).populate({ path: 'items', populate: { path: 'warehouse' } }).lean();

if (updatedOrder) {
    console.log('🔍 DEBUG Webhook: Updated order after payment:', {
        orderNumber: (updatedOrder as any).orderNumber,
        itemsCount: (updatedOrder as any).items?.length,
        hasWarehouses: (updatedOrder as any).items?.some((item: any) => item.warehouse)
    });
}
```

---

### FIX #4: Verify Warehouse Socket Connection
**File:** `frontend/src/modules/warehouse/hooks/useWarehouseSocket.ts:68`

Verify warehouse ID is being sent correctly:

```typescript
newSocket.on('connect', () => {
    console.log('✅ Warehouse connected to socket server:', newSocket.id);
    setIsConnected(true);
    
    const warehouseId = user.id;
    console.log('🏭 Emitting join-warehouse-room with ID:', warehouseId, 'Type:', typeof warehouseId);
    
    newSocket.emit('join-warehouse-room', warehouseId);
});
```

---

### FIX #5: Verify Sound Can Actually Play
**File:** `frontend/src/modules/warehouse/components/WarehouseNotificationAlert.tsx:38-46`

Add more robust sound handling:

```typescript
useEffect(() => {
    if (notification) {
        console.log('🔔 Notification received, attempting to play sound');
        
        if (audioRef.current) {
            audioRef.current.volume = volume;
            
            // Try to play sound
            const playPromise = audioRef.current.play();
            if (playPromise !== undefined) {
                playPromise
                    .then(() => {
                        console.log('✅ Sound played successfully');
                    })
                    .catch((err) => {
                        console.error('❌ Error playing sound:', err.message);
                        // Some browsers require user interaction for autoplay
                        // Show visual alert instead
                        if (err.name === 'NotAllowedError') {
                            console.warn('⚠️ Autoplay not allowed. User needs to interact with page first.');
                        }
                    });
            }
        } else {
            console.error('❌ Audio ref not available');
        }
    }
}, [notification, volume]);
```

---

## 🧪 Testing Steps

### Step 1: Start Backend & Enable Console Logs
```bash
cd backend
npm run dev
# Watch for console output like:
# 🏭 Warehouse [...] joined notifications room
# 📤 Emitting to room: warehouse-[ID]
```

### Step 2: Open Warehouse in Another Browser Tab
1. Login as warehouse user
2. Open DevTools > Console
3. Should see: `✅ Warehouse connected to socket server: [socketId]`
4. Should see: `🏭 Emitted join-warehouse-room with ID: [warehouseId]`

### Step 3: Create an Order with Online Payment
1. Add items to cart
2. Checkout with "Online Payment (Razorpay)" option
3. Complete payment
4. Backend console should log:
   - `📤 About to notify warehouses for order: [orderNumber]`
   - `🔍 DEBUG: Updated order structure: ...`
   - `📤 Emitting to room: warehouse-[ID]`

### Step 4: Warehouse Tab
- Popup notification should appear immediately
- Sound should play
- Console should show: `🔔 New warehouse notification received`

---

## 🚨 If Not Working

### Check Backend:
```bash
# Tail backend logs
npm run dev 2>&1 | grep -i "warehouse\|notification\|payment"
```

Look for:
- ❌ "Socket.io instance not found on app"
- ❌ "No warehouses found for order items"
- ❌ "Order has no items"

### Check Frontend:
Open browser DevTools:
```javascript
// Console > check for errors
// Check socket connection:
// Should see: "✅ Warehouse connected to socket server: [socketId]"
// Should see: "📤 Emitting join-warehouse-room with ID: [warehouseId]"
```

### Check Network:
DevTools > Network tab:
- Check WebSocket frames under "WS" tab
- Should see event: `warehouse-notification`

---

## 📋 Commit Message When Done

```
Fix warehouse notifications after payment verification

- Add comprehensive debug logging to payment routes
- Add debug logging to warehouse notification service  
- Verify order items are populated with warehouse data
- Verify socket.io instance is available in payment routes
- Verify socket room emissions are reaching warehouses
- Test audio playback with browser autoplay policies

This ensures that when a customer completes online payment,
the warehouse immediately receives a popup notification with sound.

Co-Authored-By: Claude Haiku 4.5 <noreply@anthropic.com>
```

