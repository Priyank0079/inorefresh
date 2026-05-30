# 📦 INORFRESH - COMPLETE ORDER RETURN FLOW ANALYSIS

**Date:** May 29, 2026  
**Project:** InorFresh (E-commerce Platform)  
**Focus:** Understanding how customers return orders and receive refunds

---

## 🎯 OVERVIEW

The InorFresh return flow is a **multi-step verification and refund process** that involves:
- **Customer** (Retailer/Horeca user) receiving the order
- **Delivery Boy** (Rider) handling return logistics
- **Warehouse** verifying returned goods
- **Admin** approving refunds

The process takes **15-30 days** from return submission to refund completion.

---

## 📊 COMPLETE RETURN FLOW (Step-by-Step)

### PHASE 1: ORDER DELIVERY & INSPECTION WINDOW (Day 1)

#### Step 1️⃣: Order Delivered
```
Customer receives order
    ↓
Status: "Delivered"
    ↓
Order marked with:
  • returnAllowed = true
  • inspectionStartedAt = NOW
  • inspectionExpiresAt = NOW + 5-10 days
  • inspectionDurationMinutes = 600 (default)
```

**What happens:** 
- Order arrives at customer's location
- Delivery boy marks it as "Delivered"
- Inspection window opens (5-10 days to inspect and decide)

---

#### Step 2️⃣: Customer Reviews Order (Inspection Period)
```
Customer examines items
    ↓
Decision:
  ✅ Accept all items → Mark "Fully Accepted"
  ⚠️ Accept some, return some → Initiate partial return
  ❌ Return all items → Initiate full return
```

**Customer Can:**
- Keep the order (do nothing)
- Request return for selected items
- Provide return reason and comments
- Upload photos/videos of items
- Track inspection timeline

---

### PHASE 2: RETURN REQUEST SUBMISSION (Day 1-5)

#### Step 3️⃣: Customer Submits Return Request

```json
POST /api/returns/retailer/submit
{
  "orderId": "ORD123456",
  "items": [
    {
      "orderItemId": "ITEM001",
      "acceptedQuantity": 2,        // Keep 2 units
      "returnedQuantity": 1,        // Return 1 unit
      "reason": "Damaged",          // Why returning
      "comment": "Item box was crushed",
      "images": ["url1", "url2"],   // Photo evidence
      "videos": ["url3"]
    }
  ]
}
```

**Backend Processing:**
```
✓ Validate order is "Delivered" and in inspection window
✓ Check inspection hasn't expired
✓ For each returned item:
  - Create Return record with status = "REQUESTED"
  - Capture reason, description, photos, videos
  - Link to warehouse and delivery boy
✓ Update Order status:
  - If all accepted: "Delivered"
  - If partial return: "Return Under Review"
  - If all returned: "Fully Returned"
✓ Set order.isVerifiedByCustomer = true
✓ Send notifications to Warehouse & Admin
```

**Notifications Sent:**
- 🏭 **Warehouse:** "New Return Request for Order #ORD123456"
- 👑 **Admin:** "New Return Request for Order #ORD123456"

**Return Status:** `REQUESTED`

---

### PHASE 3: WAREHOUSE REVIEW (Day 2-3)

#### Step 4️⃣: Warehouse Manager Reviews Return Request

```
Warehouse receives notification
    ↓
Manager reviews return details:
  • Product name & reason
  • Customer description
  • Photos/videos of items
  • Quantity to return
    ↓
Decision:
  ✅ Approve (accept the return)
  ❌ Reject (don't accept return)
  🔼 Escalate (send to Admin)
```

**API Call:**
```json
POST /api/returns/warehouse/review/:returnId
{
  "action": "Approve",        // or "Reject" or "Escalate"
  "comment": "Damage confirmed"
}
```

**What Happens on Approval:**
```
✓ Return status → "Approved"
✓ wholesalerStatus → "Approved"
✓ Generate reverse logistics code: RET-[TIMESTAMP]
✓ Generate warehouse verification OTP: 4-digit code
✓ Notify delivery boy: "Return approved, ready for pickup"
✓ Order status updated: "Partially Returned" / "Fully Returned"
```

**What Happens on Rejection:**
```
✓ Return status → "Rejected"
✓ wholesalerStatus → "Rejected"
✓ Store rejection reason
✓ Order status reverts to: "Delivered"
✓ Notify delivery boy of rejection
```

**Return Status:** `Approved` or `Rejected`

---

### PHASE 4: LOGISTICS - RETURN COLLECTION (Day 3-5)

#### Step 5️⃣: Delivery Boy Collects Return from Customer

```
Delivery boy notified of approved return
    ↓
Routes to customer location
    ↓
Collects returned items with:
  • Proof of pickup (photos)
  • Rider remarks (condition notes)
    ↓
Status: IN_TRANSIT_TO_WAREHOUSE
```

**API Call:**
```json
POST /api/returns/rider/collect/:returnId
{
  "proofOfPickupEvidence": ["photo1.jpg", "photo2.jpg"],
  "riderRemarks": "Items collected in good condition, packaging sealed"
}
```

**Backend:**
```
✓ Validate return is "Approved"
✓ Require at least 1 proof photo
✓ Update return status → "IN_TRANSIT_TO_WAREHOUSE"
✓ Store proof photos & rider remarks
✓ Notify warehouse: "Return is in transit"
```

**Return Status:** `IN_TRANSIT_TO_WAREHOUSE`

---

#### Step 6️⃣: Delivery Boy Arrives at Warehouse & Sends OTP

```
Delivery boy arrives at warehouse
    ↓
Requests OTP from warehouse manager
    ↓
Backend generates & sends OTP via SMS
    ↓
Warehouse receives: "Return OTP: 4567"
```

**API Call:**
```json
POST /api/returns/rider/send-otp/:returnId
```

**SMS Received by Warehouse:**
```
"InoFresh Return OTP: 4567. Rider has arrived to deliver 
returned goods for Order #ORD123456. Share this OTP to 
confirm receipt."
```

**Return Status:** Still `IN_TRANSIT_TO_WAREHOUSE` (OTP sent)

---

### PHASE 5: WAREHOUSE RECEIPT VERIFICATION (Day 5)

#### Step 7️⃣: Warehouse Verifies Receipt with OTP

```
Warehouse manager scans/inspects items
    ↓
Enters OTP received in SMS
    ↓
Confirms receipt in system
```

**API Call (Rider makes this on behalf of warehouse):**
```json
POST /api/returns/rider/verify-otp/:returnId
{
  "otp": "4567"
}
```

**Atomic Transaction:**
```
1. Validate OTP matches
2. Check warehouse has sufficient balance
3. Update return status → "RECEIVED_AT_WAREHOUSE"
4. Mark OTP as verified
5. Adjust inventory:
   - Decrease sellable stock
   - Increase returned/quarantined stock
6. ATOMIC REFUND (Warehouse → Customer):
   - Deduct from warehouse balance
   - Credit to customer (retailer) wallet
7. Create wallet transaction record
8. Notify customer: "Refund processed"
9. Notify warehouse of balance change
```

**Return Status:** `RECEIVED_AT_WAREHOUSE`  
**Order Status:** `Fully Returned` or `Return Under Review`

---

### PHASE 6: ADMIN REFUND APPROVAL (Day 5-10)

#### Step 8️⃣: Admin Reviews & Approves Refund

```
Admin dashboard shows pending returns
    ↓
Admin reviews:
  • Return reason & description
  • Photos/evidence
  • Warehouse confirmation
  • Refund amount calculation
    ↓
Decision:
  ✅ Approve refund
  ❌ Reject refund (hold/investigate)
```

**API Call:**
```json
POST /api/returns/admin/refund/:returnId
{
  "action": "Approve",
  "amount": 1500                    // Refund amount in rupees
}
```

**What Happens:**
```
✓ Return status → "REFUNDED"
✓ Store refund amount
✓ Already refunded to customer wallet in Step 7
✓ Lock return record (no further changes)
✓ Generate refund transaction ID
```

**Return Status:** `REFUNDED`

---

## 📋 COMPLETE RETURN STATUS LIFECYCLE

```
REQUESTED
   ↓ (Warehouse approves)
UNDER_REVIEW / Approved
   ↓ (Delivery boy collects)
IN_TRANSIT_TO_WAREHOUSE
   ↓ (OTP verified)
RECEIVED_AT_WAREHOUSE
   ↓ (Admin approves)
REFUNDED ✅

OR at any stage:
Rejected ❌ (Warehouse/Admin rejects)
```

---

## 💰 REFUND PROCESS - WHO PAYS WHAT?

### Return Refund Flow:

```
Customer Order: ₹1500
    ↓
Return Request: 1 item (₹500)
    ↓
WAREHOUSE → CUSTOMER (Retailer/Horeca user)
Payment Route:
  • Warehouse balance -₹500
  • Customer wallet +₹500
  ↓
Customer receives credit in digital wallet
    ↓
Can use for future purchases OR withdraw
```

### Example:
```
Order: ₹2000 (2 items × ₹1000 each)
Return: 1 damaged item
Refund: ₹1000 to customer wallet
Result: Customer can buy ₹1000 worth of products or request withdrawal
```

---

## 🎯 INSPECTION WINDOW DETAILS

```
Order Delivered at: 2:00 PM
Inspection Starts: 2:00 PM
Inspection Duration: 10 days (configurable)
Inspection Expires: Day 10 at 2:00 PM
    ↓
If no return submitted by Day 10 @ 2:00 PM:
  → inspectionExpiresAt timestamp reached
  → auto-close verification
  → returnAllowed = false
  → Order status locked
  → No more returns accepted
```

**In Settings:** `AppSettings.inspectionDurationMinutes` (default: 600 mins = 10 days)

---

## 📱 CUSTOMER PERSPECTIVE (Retailer/Horeca User)

### What Customer Sees:

**Day 1: Order Delivered**
```
Order Status: ✅ Delivered
Inspection Timer: ⏱️ 10 days remaining
Actions:
  → Review Items
  → Accept All
  → Request Return for Items
  → View Photos/Proof of Delivery
```

**Day 2-5: Return Submission**
```
Order Status: ⏳ Return Under Review
Return Request: Submitted
Actions:
  → View Return Status
  → See Inspection Progress
  → Track Warehouse Response
```

**Day 5-10: Warehouse Processing**
```
Order Status: 🔄 Return Under Review
Warehouse Status: Reviewing / Approved
Actions:
  → See Warehouse Decision
  → Track Rider Pickup
  → Monitor Reverse Shipment
```

**Day 10-15: Refund**
```
Order Status: ✅ Return Complete
Refund Status: ✅ Credited to Wallet
Actions:
  → See Refund Amount
  → Check Wallet Balance
  → Request Withdrawal
  → Use for New Order
```

---

## 🔔 NOTIFICATIONS SENT DURING RETURN

| Stage | To | Message | Status |
|-------|----|-----------|----|
| Return Submitted | Warehouse | "New Return Request for Order #ORD123" | High Priority |
| Return Submitted | Admin | "New Return Request for Order #ORD123" | High Priority |
| Warehouse Reviews | Delivery Boy | "Return for Order #ORD123 has been Approved/Rejected" | High Priority |
| Ready for Pickup | Delivery Boy | "Return is approved, ready for collection" | Info |
| In Transit | Warehouse | "Return package in transit from customer" | Info |
| OTP Sent | Warehouse Manager | SMS with 4-digit OTP | Critical |
| Verified & Refunded | Customer | "Refund of ₹500 credited to wallet" | Success |
| Admin Decision | Customer | "Your return for Order #ORD123 has been processed" | Info |

---

## ⚠️ EDGE CASES & EXCEPTIONS

### 1. Inspection Window Expired
```
Customer: Can no longer submit return request
Solution: Manual intervention by admin needed
Action: Admin can manually extend window if valid reason
```

### 2. Warehouse Balance Negative
```
If warehouse balance < refund amount:
  ✓ Refund still processed (warehouse goes negative)
  ✓ System alerts admin
  ✓ Admin must settle warehouse balance later
  ✓ Warehouse flagged in refund exceptions dashboard
```

### 3. Return Stuck in Transit
```
If return not delivered for 2+ hours:
  Status: IN_TRANSIT_TO_WAREHOUSE (stuck)
  Alert: Admin refund exceptions dashboard
  Action: Admin investigates & manually approve/reject
  Prevents: Customer left hanging
```

### 4. Invalid OTP Multiple Times
```
Rider tries wrong OTP 3+ times
  → System locks OTP entry
  → Requires manual warehouse/admin intervention
  → Prevents brute force attacks
```

---

## 🏗️ TECHNICAL ARCHITECTURE

### Database Models:

**Return Model:**
```
{
  orderId: ObjectId (linked to Order)
  orderItemId: ObjectId (which product)
  customerId: ObjectId (who returned it)
  
  Status: REQUESTED → UNDER_REVIEW → APPROVED → 
          IN_TRANSIT_TO_WAREHOUSE → RECEIVED_AT_WAREHOUSE → REFUNDED
  
  Logistics:
    - reverseLogisticsCode: RET-[timestamp]
    - warehouseVerificationOtp: 4-digit
    - proofOfPickupEvidence: [photos]
    - warehouse: ObjectId
    - deliveryBoy: ObjectId
  
  Refund:
    - refundAmount: number
    - status: REFUND_PENDING → REFUND_APPROVED → REFUNDED
}
```

**Order Model Updates:**
```
{
  returnAllowed: boolean
  inspectionStartedAt: Date
  inspectionExpiresAt: Date
  inspectionDurationMinutes: number
  isVerifiedByCustomer: boolean
  riderStatusDuringInspection: WAITING_FOR_RETURN_APPROVAL | NORMAL_DELIVERY | IDLE
}
```

### Key API Endpoints:

```
Customer Routes:
  POST   /api/returns/retailer/submit
  GET    /api/returns/order/:orderId

Delivery Boy Routes:
  POST   /api/returns/rider/collect/:returnId
  POST   /api/returns/rider/send-otp/:returnId
  POST   /api/returns/rider/verify-otp/:returnId

Warehouse Routes:
  POST   /api/returns/warehouse/review/:returnId
  POST   /api/returns/warehouse/verify/:returnId

Admin Routes:
  POST   /api/returns/admin/refund/:returnId
  GET    /api/returns/admin/refund-exceptions
```

---

## 📊 TIMELINE SUMMARY

| Day | Phase | Actor | Action |
|-----|-------|-------|--------|
| 1 | Delivery | Delivery Boy | Deliver order |
| 1 | Inspection Opens | Customer | Review items, decide return |
| 1-5 | Return Request | Customer | Submit return request |
| 2-3 | Warehouse Review | Warehouse Manager | Approve/Reject return |
| 3-5 | Collection | Delivery Boy | Collect items from customer |
| 5 | Transit | Logistics | Item in transit to warehouse |
| 5 | Verification | Warehouse Manager | Verify receipt with OTP |
| 5-10 | Admin Review | Admin | Approve refund |
| 10+ | Refunded | Customer | Credit to wallet |
| 11-30 | Withdrawal | Customer | Can withdraw or use for purchase |

---

## ✅ SUCCESS CRITERIA

Return is successful when:
```
✓ Customer submitted return request
✓ Warehouse approved
✓ Delivery boy collected with proof
✓ Warehouse verified receipt with OTP
✓ Inventory adjusted (quarantine stock)
✓ Refund amount credited to wallet
✓ Admin approved final refund
✓ Customer notified of completion
✓ Return record locked (status: REFUNDED)
```

---

## ❌ FAILURE SCENARIOS

Return can fail if:
```
❌ Inspection window expired (Day 10+) → No return accepted
❌ Warehouse rejects return → Order stays "Delivered"
❌ Rider can't collect → Return stuck, needs manual intervention
❌ Invalid OTP → Warehouse can't verify receipt
❌ Warehouse balance negative → Return stuck pending settlement
❌ Admin rejects refund → Return marked "Rejected"
```

---

## 💡 KEY FEATURES

1. **Inspection Period:** Customers have limited time (5-10 days) to decide
2. **Photo Evidence:** Returns require visual proof from both customer and rider
3. **OTP Verification:** Warehouse manager confirms receipt with SMS OTP
4. **Atomic Refunds:** Wallet transaction is atomic (all-or-nothing)
5. **Negative Balance Handling:** System tracks warehouse negative balances
6. **Auto-Close:** Inspection window auto-closes after expiry
7. **Notification Trail:** Every step sends notifications to relevant parties
8. **Admin Exceptions Dashboard:** Shows stuck returns and negative warehouses

---

## 📝 SUMMARY

The InorFresh return flow is a **complete end-to-end reverse logistics system** that:
- Gives customers a clear 5-10 day inspection window
- Involves warehouse verification at every step
- Uses OTP for security in final handoff
- Processes refunds atomically to wallets
- Includes admin oversight for exceptions
- Maintains audit trail of all decisions

The process typically takes **5-15 days** from submission to refund, ensuring both customer confidence and platform security.

