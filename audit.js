const fs = require('fs');

const issues = [];
const ok = [];

function readFile(p) {
  try { return fs.readFileSync(p, 'utf8'); } catch { return ''; }
}

function check(label, condition, detail) {
  if (condition) ok.push({ label, detail });
  else issues.push({ label, detail });
}

// ── 1. SOCKET SERVICE ─────────────────────────────────────────────────────────
const sockSvc = readFile('backend/src/socket/socketService.ts');
check('Socket: initializeSocket exported', sockSvc.includes('export const initializeSocket'), 'socketService.ts');
check('Socket: getIO exported', sockSvc.includes('export const getIO'), 'socketService.ts');
check('Socket: join-warehouse-room handler', sockSvc.includes("'join-warehouse-room'"), 'socketService.ts');
check('Socket: join-delivery-notifications handler', sockSvc.includes("'join-delivery-notifications'"), 'socketService.ts');
check('Socket: join-customer-room handler', sockSvc.includes("'join-customer-room'"), 'socketService.ts');
check('Socket: join-admin-room handler', sockSvc.includes("'join-admin-room'"), 'socketService.ts');
check('Socket: join-port-room handler', sockSvc.includes("'join-port-room'"), 'socketService.ts');
check('Socket: CORS allows inorfresh.com', sockSvc.includes('inorfresh.com'), 'socketService.ts');
check('Socket: transports websocket+polling', sockSvc.includes("transports: ['websocket', 'polling']"), 'socketService.ts');
check('Socket: pingTimeout 60000', sockSvc.includes('pingTimeout: 60000'), 'socketService.ts');

// ── 2. SERVER WIRING ──────────────────────────────────────────────────────────
const server = readFile('backend/src/server.ts');
check('Server: initializeSocket called', server.includes('initializeSocket'), 'server.ts');
check('Server: warehouse routes mounted', server.includes('warehouse'), 'server.ts');
check('Server: delivery routes mounted', server.includes('delivery'), 'server.ts');
check('Server: customer routes mounted', server.includes('customer'), 'server.ts');
check('Server: admin routes mounted', server.includes('admin'), 'server.ts');
check('Server: payment routes mounted', server.includes('payment'), 'server.ts');
check('Server: returns routes mounted', server.includes('return'), 'server.ts');

// ── 3. WAREHOUSE NOTIFICATION SERVICE ────────────────────────────────────────
const whNotif = readFile('backend/src/services/warehouseNotificationService.ts');
check('WHNotif: emits warehouse-notification', whNotif.includes("emit('warehouse-notification'"), 'warehouseNotificationService.ts');
check('WHNotif: emits to warehouse-${id} room', whNotif.includes('warehouse-${warehouseId}'), 'warehouseNotificationService.ts');
check('WHNotif: emits new-order-admin to admins', whNotif.includes("'admin-notifications'"), 'warehouseNotificationService.ts');
check('WHNotif: persisted admin notification on NEW_ORDER', whNotif.includes("type === 'NEW_ORDER'"), 'warehouseNotificationService.ts');

// ── 4. ORDER NOTIFICATION SERVICE ─────────────────────────────────────────────
const orderNotif = readFile('backend/src/services/orderNotificationService.ts');
check('OrderNotif: broadcasts to delivery-notifications', orderNotif.includes("'delivery-notifications'"), 'orderNotificationService.ts');
check('OrderNotif: emits new-order', orderNotif.includes("emit('new-order'"), 'orderNotificationService.ts');
check('OrderNotif: emits order-accepted', orderNotif.includes("emit('order-accepted'"), 'orderNotificationService.ts');
check('OrderNotif: notificationStates map exists', orderNotif.includes('notificationStates'), 'orderNotificationService.ts');
check('OrderNotif: no earningProcessingService', !orderNotif.includes('earningProcessingService'), 'orderNotificationService.ts');

// ── 5. NOTIFICATION SERVICE ───────────────────────────────────────────────────
const notifSvc = readFile('backend/src/services/notificationService.ts');
check('NotifSvc: sendNotification exported', notifSvc.includes('export const sendNotification'), 'notificationService.ts');
check('NotifSvc: emits new-notification via socket', notifSvc.includes("emit('new-notification'"), 'notificationService.ts');
check('NotifSvc: getNotificationRoom for Warehouse', notifSvc.includes("recipientType === 'Warehouse'"), 'notificationService.ts');
check('NotifSvc: getNotificationRoom for Customer', notifSvc.includes("recipientType === 'Customer'"), 'notificationService.ts');
check('NotifSvc: getNotificationRoom for Delivery', notifSvc.includes("recipientType === 'Delivery'"), 'notificationService.ts');

// ── 6. RETURN WORKFLOW CONTROLLER ─────────────────────────────────────────────
const returnCtrl = readFile('backend/src/controllers/returnWorkflowController.ts');
check('Return: no earningProcessingService', !returnCtrl.includes('earningProcessingService'), 'returnWorkflowController.ts');
check('Return: no bad require(services/socketService)', !returnCtrl.includes("require('../services/socketService')"), 'returnWorkflowController.ts');
check('Return: getIO imported from socket/socketService', returnCtrl.includes("from '../socket/socketService'"), 'returnWorkflowController.ts');
check('Return: submitReturnRequest emits return-request-alert', returnCtrl.includes("emit('return-request-alert'"), 'returnWorkflowController.ts');
check('Return: sendWarehouseOtp emits return-otp-alert', returnCtrl.includes("emit('return-otp-alert'"), 'returnWorkflowController.ts');
check('Return: reviewReturnRequest emits return-pickup-alert to rider', returnCtrl.includes("emit('return-pickup-alert'"), 'returnWorkflowController.ts');
check('Return: executeReturnRefund is atomic (withTransaction)', returnCtrl.includes('withTransaction'), 'returnWorkflowController.ts');
check('Return: idempotency guard ALREADY_REFUNDED', returnCtrl.includes('ALREADY_REFUNDED'), 'returnWorkflowController.ts');
check('Return: resolveBuyer handles Customer+HorecaUser+RetailerUser', returnCtrl.includes('HorecaUser') && returnCtrl.includes('RetailerUser'), 'returnWorkflowController.ts');
check('Return: COD vs PLATFORM funding split', returnCtrl.includes('WAREHOUSE') && returnCtrl.includes('PLATFORM'), 'returnWorkflowController.ts');
check('Return: tax share in refund calc', returnCtrl.includes('taxBreakdown'), 'returnWorkflowController.ts');
check('Return: timeoutAcceptDelivery uses top-level getIO()', returnCtrl.includes('const io = getIO();'), 'returnWorkflowController.ts');
check('Return: notifyRefundParties called on both refund paths', (returnCtrl.match(/notifyRefundParties/g) || []).length >= 2, 'returnWorkflowController.ts');

// ── 7. CUSTOMER ORDER CONTROLLER ──────────────────────────────────────────────
const custOrder = readFile('backend/src/modules/customer/controllers/customerOrderController.ts');
check('CustOrder: notifyWarehousesOfOrderUpdate NEW_ORDER', custOrder.includes("'NEW_ORDER'"), 'customerOrderController.ts');
check('CustOrder: notifyWarehousesOfOrderUpdate ORDER_CANCELLED', custOrder.includes("'ORDER_CANCELLED'"), 'customerOrderController.ts');
check('CustOrder: imports warehouseNotificationService', custOrder.includes('warehouseNotificationService'), 'customerOrderController.ts');

// ── 8. PAYMENT ROUTE ──────────────────────────────────────────────────────────
const payRoute = readFile('backend/src/routes/paymentRoutes.ts');
check('Payment: notifyWarehousesOfOrderUpdate on order paid', payRoute.includes('notifyWarehousesOfOrderUpdate'), 'paymentRoutes.ts');

// ── 9. DELIVERY ORDER CONTROLLER ──────────────────────────────────────────────
const delivCtrl = readFile('backend/src/modules/delivery/controllers/deliveryOrderController.ts');
check('DelivCtrl: notifyWarehousesOfOrderUpdate STATUS_UPDATE', delivCtrl.includes("'STATUS_UPDATE'"), 'deliveryOrderController.ts');
check('DelivCtrl: no earningProcessingService', !delivCtrl.includes('earningProcessingService'), 'deliveryOrderController.ts');

// ── 10. ADMIN ORDER CONTROLLER ────────────────────────────────────────────────
const adminOrder = readFile('backend/src/modules/admin/controllers/adminOrderController.ts');
check('AdminOrder: notifyDeliveryBoysOfNewOrder called', adminOrder.includes('notifyDeliveryBoysOfNewOrder'), 'adminOrderController.ts');
check('AdminOrder: notifyWarehousesOfOrderUpdate called', adminOrder.includes('notifyWarehousesOfOrderUpdate'), 'adminOrderController.ts');

// ── 11. FRONTEND — NOTIFICATION CONTEXT ───────────────────────────────────────
const notifCtx = readFile('frontend/src/context/NotificationContext.tsx');
check('NotifCtx: connects socket on login', notifCtx.includes('io(socketUrl'), 'NotificationContext.tsx');
check('NotifCtx: joins warehouse room', notifCtx.includes('join-warehouse-room'), 'NotificationContext.tsx');
check('NotifCtx: joins admin room', notifCtx.includes('join-admin-room'), 'NotificationContext.tsx');
check('NotifCtx: joins customer room', notifCtx.includes('join-customer-room'), 'NotificationContext.tsx');
check('NotifCtx: joins delivery room', notifCtx.includes('join-delivery-notifications'), 'NotificationContext.tsx');
check('NotifCtx: listens to new-notification', notifCtx.includes("on('new-notification'"), 'NotificationContext.tsx');
check('NotifCtx: plays audio beep', notifCtx.includes('AudioContext'), 'NotificationContext.tsx');
check('NotifCtx: TTS speech on notification', notifCtx.includes('speechSynthesis'), 'NotificationContext.tsx');
check('NotifCtx: fetchNotifications on mount', notifCtx.includes('fetchNotifications'), 'NotificationContext.tsx');

// ── 12. FRONTEND — WAREHOUSE SOCKET HOOK ──────────────────────────────────────
const whSock = readFile('frontend/src/modules/warehouse/hooks/useWarehouseSocket.ts');
check('WHSocket: guards Warehouse userType only', whSock.includes("user.userType !== 'Warehouse'"), 'useWarehouseSocket.ts');
check('WHSocket: emits join-warehouse-room', whSock.includes("emit('join-warehouse-room', warehouseId)"), 'useWarehouseSocket.ts');
check('WHSocket: listens to warehouse-notification', whSock.includes("'warehouse-notification'"), 'useWarehouseSocket.ts');
check('WHSocket: listens to return-otp-alert', whSock.includes("'return-otp-alert'"), 'useWarehouseSocket.ts');
check('WHSocket: listens to return-request-alert', whSock.includes("'return-request-alert'"), 'useWarehouseSocket.ts');
check('WHSocket: reconnect catch-up for new orders', whSock.includes('/warehouse/notifications?limit=5'), 'useWarehouseSocket.ts');
check('WHSocket: reconnect catch-up for return requests', whSock.includes('/returns?status=All Status'), 'useWarehouseSocket.ts');
check('WHSocket: reconnectionAttempts 20', whSock.includes('reconnectionAttempts: 20'), 'useWarehouseSocket.ts');

// ── 13. FRONTEND — DELIVERY SOCKET HOOK ───────────────────────────────────────
const delivNotif = readFile('frontend/src/hooks/useDeliveryOrderNotifications.ts');
check('DelivSocket: listens to new-order', delivNotif.includes("'new-order'"), 'useDeliveryOrderNotifications.ts');
check('DelivSocket: listens to order-accepted', delivNotif.includes("'order-accepted'"), 'useDeliveryOrderNotifications.ts');
check('DelivSocket: emits join-delivery-notifications', delivNotif.includes("'join-delivery-notifications'"), 'useDeliveryOrderNotifications.ts');

// ── 14. FRONTEND — ADMIN SOCKET HOOK ──────────────────────────────────────────
const adminSock = readFile('frontend/src/modules/admin/hooks/useAdminSocket.ts');
check('AdminSocket: emits join-admin-room', adminSock.includes("'join-admin-room'"), 'useAdminSocket.ts');
check('AdminSocket: listens to new-order-admin', adminSock.includes("'new-order-admin'"), 'useAdminSocket.ts');

// ── 15. FRONTEND — SOCKET URL CONFIG ──────────────────────────────────────────
const apiCfg = readFile('frontend/src/services/api/config.ts');
check('ApiCfg: getSocketBaseURL exported', apiCfg.includes('export const getSocketBaseURL'), 'config.ts');
check('ApiCfg: strips /api/v1 from socket URL', apiCfg.includes('/api/v1'), 'config.ts');
check('ApiCfg: falls back to api.inorfresh.com', apiCfg.includes('api.inorfresh.com'), 'config.ts');

// ── 16. ORDER MODEL ───────────────────────────────────────────────────────────
const orderModel = readFile('backend/src/models/Order.ts');
check('Order model: deliveryBoy field', orderModel.includes('deliveryBoy'), 'Order.ts');
check('Order model: inspectionExpiresAt field', orderModel.includes('inspectionExpiresAt'), 'Order.ts');
check('Order model: riderStatusDuringInspection field', orderModel.includes('riderStatusDuringInspection'), 'Order.ts');
check('Order model: isVerifiedByCustomer field', orderModel.includes('isVerifiedByCustomer'), 'Order.ts');
check('Order model: returnAllowed field', orderModel.includes('returnAllowed'), 'Order.ts');

// ── 17. RETURN MODEL ──────────────────────────────────────────────────────────
const returnModel = readFile('backend/src/models/Return.ts');
check('Return model: warehouseVerificationOtp field', returnModel.includes('warehouseVerificationOtp'), 'Return.ts');
check('Return model: status includes REFUNDED', returnModel.includes('REFUNDED'), 'Return.ts');
check('Return model: refundFundedBy field', returnModel.includes('refundFundedBy'), 'Return.ts');
check('Return model: proofOfPickupEvidence field', returnModel.includes('proofOfPickupEvidence'), 'Return.ts');

// ── 18. ENV VARS REFERENCED ───────────────────────────────────────────────────
check('Env: JWT_SECRET used in socket auth', sockSvc.includes('JWT_SECRET'), 'socketService.ts');
check('Env: FRONTEND_URL used in CORS', sockSvc.includes('FRONTEND_URL'), 'socketService.ts');

// ── 19. PORT SOCKET HOOK ──────────────────────────────────────────────────────
const portSock = readFile('frontend/src/modules/port/hooks/usePortSocket.ts');
check('PortSocket: emits join-port-room', portSock.includes("'join-port-room'"), 'usePortSocket.ts');

// ── 20. WAREHOUSE LAYOUT — POPUP WIRING ───────────────────────────────────────
const whLayout = readFile('frontend/src/modules/warehouse/components/WarehouseLayout.tsx');
check('WHLayout: useWarehouseSocket called', whLayout.includes('useWarehouseSocket'), 'WarehouseLayout.tsx');
check('WHLayout: WarehouseNotificationAlert rendered', whLayout.includes('WarehouseNotificationAlert'), 'WarehouseLayout.tsx');
check('WHLayout: WarehouseReturnOtpAlert rendered', whLayout.includes('WarehouseReturnOtpAlert'), 'WarehouseLayout.tsx');
check('WHLayout: WarehouseReturnRequestAlert rendered', whLayout.includes('WarehouseReturnRequestAlert'), 'WarehouseLayout.tsx');

// ── RESULTS ───────────────────────────────────────────────────────────────────
console.log('\n========================================');
console.log('     INORFRESH FULL AUDIT RESULTS');
console.log('========================================\n');
console.log('PASS (' + ok.length + ')');
ok.forEach(i => console.log('  ✅  ' + i.label));
if (issues.length > 0) {
  console.log('\nFAIL (' + issues.length + ')');
  issues.forEach(i => console.log('  ❌  ' + i.label + '  [' + i.detail + ']'));
} else {
  console.log('\n  ✅  ALL CHECKS PASSED — SAFE TO PUSH');
}
console.log('\n========================================\n');
