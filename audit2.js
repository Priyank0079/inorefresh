const fs = require('fs');

const issues = [];
const ok = [];

function r(p) { try { return fs.readFileSync(p, 'utf8'); } catch (e) { return ''; } }
function check(label, cond, detail) { cond ? ok.push({ label, detail }) : issues.push({ label, detail }); }

// ── 1. SOCKET SERVICE ─────────────────────────────────────────────────────────
const sockSvc = r('backend/src/socket/socketService.ts');
check('Socket: initializeSocket exported', sockSvc.includes('export const initializeSocket'), 'socketService.ts');
check('Socket: getIO exported', sockSvc.includes('export const getIO'), 'socketService.ts');
check('Socket: join-warehouse-room handler', sockSvc.includes('join-warehouse-room'), 'socketService.ts');
check('Socket: join-delivery-notifications handler', sockSvc.includes('join-delivery-notifications'), 'socketService.ts');
check('Socket: join-customer-room handler', sockSvc.includes('join-customer-room'), 'socketService.ts');
check('Socket: join-admin-room handler', sockSvc.includes('join-admin-room'), 'socketService.ts');
check('Socket: join-port-room handler', sockSvc.includes('join-port-room'), 'socketService.ts');
check('Socket: CORS allows inorfresh.com', sockSvc.includes('inorfresh.com'), 'socketService.ts');
check('Socket: transports websocket+polling', sockSvc.includes('websocket') && sockSvc.includes('polling'), 'socketService.ts');
check('Socket: pingTimeout configured', sockSvc.includes('pingTimeout'), 'socketService.ts');
check('Socket: JWT_SECRET in auth middleware', sockSvc.includes('JWT_SECRET'), 'socketService.ts');
check('Socket: FRONTEND_URL in CORS', sockSvc.includes('FRONTEND_URL'), 'socketService.ts');

// ── 2. SERVER WIRING ──────────────────────────────────────────────────────────
const server = r('backend/src/server.ts');
check('Server: initializeSocket called', server.includes('initializeSocket'), 'server.ts');

const routes = r('backend/src/routes/index.ts');
check('Routes/index: warehouse routes mounted', routes.includes('/warehouse'), 'routes/index.ts');
check('Routes/index: delivery routes mounted', routes.includes('/delivery'), 'routes/index.ts');
check('Routes/index: customer routes mounted', routes.includes('/customer'), 'routes/index.ts');
check('Routes/index: payment routes mounted', routes.includes('/payment'), 'routes/index.ts');
check('Routes/index: returns routes mounted', routes.includes('/returns'), 'routes/index.ts');
check('Routes/index: admin routes mounted', routes.includes('/admin'), 'routes/index.ts');
check('Routes/index: returnWorkflowRoutes mounted', routes.includes('returnWorkflowRoutes'), 'routes/index.ts');

// ── 3. WAREHOUSE NOTIFICATION SERVICE ────────────────────────────────────────
const whNotif = r('backend/src/services/warehouseNotificationService.ts');
check('WHNotif: emits warehouse-notification event', whNotif.includes('warehouse-notification'), 'warehouseNotificationService.ts');
check('WHNotif: targets warehouse-ID room', whNotif.includes('warehouse-${warehouseId}'), 'warehouseNotificationService.ts');
check('WHNotif: emits new-order-admin to admin room', whNotif.includes('admin-notifications'), 'warehouseNotificationService.ts');
check('WHNotif: persists admin notification on NEW_ORDER', whNotif.includes('NEW_ORDER'), 'warehouseNotificationService.ts');

// ── 4. ORDER NOTIFICATION SERVICE ─────────────────────────────────────────────
const orderNotif = r('backend/src/services/orderNotificationService.ts');
check('OrderNotif: broadcasts to delivery-notifications', orderNotif.includes('delivery-notifications'), 'orderNotificationService.ts');
check('OrderNotif: emits new-order event', orderNotif.includes('new-order'), 'orderNotificationService.ts');
check('OrderNotif: emits order-accepted event', orderNotif.includes('order-accepted'), 'orderNotificationService.ts');
check('OrderNotif: notificationStates in-memory map', orderNotif.includes('notificationStates'), 'orderNotificationService.ts');
check('OrderNotif: no dead earningProcessingService', !orderNotif.includes('earningProcessingService'), 'orderNotificationService.ts');

// ── 5. NOTIFICATION SERVICE ───────────────────────────────────────────────────
const notifSvc = r('backend/src/services/notificationService.ts');
check('NotifSvc: sendNotification exported', notifSvc.includes('export const sendNotification'), 'notificationService.ts');
check('NotifSvc: emits new-notification via socket', notifSvc.includes('new-notification'), 'notificationService.ts');
check('NotifSvc: room mapping for Warehouse', notifSvc.includes('Warehouse'), 'notificationService.ts');
check('NotifSvc: room mapping for Customer', notifSvc.includes('Customer'), 'notificationService.ts');
check('NotifSvc: room mapping for Delivery', notifSvc.includes('Delivery'), 'notificationService.ts');
check('NotifSvc: Firebase push sendNotificationToUser', notifSvc.includes('sendNotificationToUser'), 'notificationService.ts');

// ── 6. RETURN WORKFLOW CONTROLLER ─────────────────────────────────────────────
const returnCtrl = r('backend/src/controllers/returnWorkflowController.ts');
check('Return: no dead earningProcessingService', !returnCtrl.includes('earningProcessingService'), 'returnWorkflowController.ts');
check('Return: no bad require(services/socketService)', !returnCtrl.includes("require('../services/socketService')"), 'returnWorkflowController.ts');
check('Return: getIO imported from socket/socketService', returnCtrl.includes('socket/socketService'), 'returnWorkflowController.ts');
check('Return: submitReturnRequest emits return-request-alert', returnCtrl.includes('return-request-alert'), 'returnWorkflowController.ts');
check('Return: sendWarehouseOtp emits return-otp-alert', returnCtrl.includes('return-otp-alert'), 'returnWorkflowController.ts');
check('Return: reviewReturnRequest emits return-pickup-alert to rider', returnCtrl.includes('return-pickup-alert'), 'returnWorkflowController.ts');
check('Return: executeReturnRefund atomic withTransaction', returnCtrl.includes('withTransaction'), 'returnWorkflowController.ts');
check('Return: idempotency guard ALREADY_REFUNDED', returnCtrl.includes('ALREADY_REFUNDED'), 'returnWorkflowController.ts');
check('Return: resolveBuyer handles HorecaUser+RetailerUser', returnCtrl.includes('HorecaUser') && returnCtrl.includes('RetailerUser'), 'returnWorkflowController.ts');
check('Return: COD vs PLATFORM funding split', returnCtrl.includes('WAREHOUSE') && returnCtrl.includes('PLATFORM'), 'returnWorkflowController.ts');
check('Return: taxBreakdown in refund calc', returnCtrl.includes('taxBreakdown'), 'returnWorkflowController.ts');
check('Return: timeoutAcceptDelivery uses top-level getIO()', returnCtrl.includes('const io = getIO()'), 'returnWorkflowController.ts');
check('Return: notifyRefundParties called on both refund paths', (returnCtrl.match(/notifyRefundParties/g) || []).length >= 2, 'returnWorkflowController.ts');
check('Return: checkAndAutoCloseVerification notifies rider', returnCtrl.includes('Verification Timeout'), 'returnWorkflowController.ts');

// ── 7. CUSTOMER ORDER CONTROLLER ──────────────────────────────────────────────
const custOrder = r('backend/src/modules/customer/controllers/customerOrderController.ts');
check('CustOrder: notifyWarehousesOfOrderUpdate NEW_ORDER', custOrder.includes('NEW_ORDER'), 'customerOrderController.ts');
check('CustOrder: notifyWarehousesOfOrderUpdate ORDER_CANCELLED', custOrder.includes('ORDER_CANCELLED'), 'customerOrderController.ts');
check('CustOrder: imports warehouseNotificationService', custOrder.includes('warehouseNotificationService'), 'customerOrderController.ts');

// ── 8. PAYMENT ROUTE ──────────────────────────────────────────────────────────
const payRoute = r('backend/src/routes/paymentRoutes.ts');
check('Payment: notifyWarehousesOfOrderUpdate on paid order', payRoute.includes('notifyWarehousesOfOrderUpdate'), 'paymentRoutes.ts');

// ── 9. DELIVERY ORDER CONTROLLER ──────────────────────────────────────────────
const delivCtrl = r('backend/src/modules/delivery/controllers/deliveryOrderController.ts');
check('DelivCtrl: notifyWarehousesOfOrderUpdate STATUS_UPDATE', delivCtrl.includes('STATUS_UPDATE'), 'deliveryOrderController.ts');
check('DelivCtrl: no dead earningProcessingService', !delivCtrl.includes('earningProcessingService'), 'deliveryOrderController.ts');

// ── 10. ADMIN ORDER CONTROLLER ────────────────────────────────────────────────
const adminOrder = r('backend/src/modules/admin/controllers/adminOrderController.ts');
check('AdminOrder: notifyDeliveryBoysOfNewOrder called', adminOrder.includes('notifyDeliveryBoysOfNewOrder'), 'adminOrderController.ts');
check('AdminOrder: notifyWarehousesOfOrderUpdate called', adminOrder.includes('notifyWarehousesOfOrderUpdate'), 'adminOrderController.ts');

// ── 11. FRONTEND — NOTIFICATION CONTEXT ───────────────────────────────────────
const notifCtx = r('frontend/src/context/NotificationContext.tsx');
check('NotifCtx: connects socket on login', notifCtx.includes('io(socketUrl'), 'NotificationContext.tsx');
check('NotifCtx: joins warehouse room', notifCtx.includes('join-warehouse-room'), 'NotificationContext.tsx');
check('NotifCtx: joins admin room', notifCtx.includes('join-admin-room'), 'NotificationContext.tsx');
check('NotifCtx: joins customer room', notifCtx.includes('join-customer-room'), 'NotificationContext.tsx');
check('NotifCtx: joins delivery room', notifCtx.includes('join-delivery-notifications'), 'NotificationContext.tsx');
check('NotifCtx: listens to new-notification', notifCtx.includes('new-notification'), 'NotificationContext.tsx');
check('NotifCtx: plays audio beep on notification', notifCtx.includes('AudioContext'), 'NotificationContext.tsx');
check('NotifCtx: TTS speech on notification', notifCtx.includes('speechSynthesis'), 'NotificationContext.tsx');
check('NotifCtx: fetchNotifications on mount', notifCtx.includes('fetchNotifications'), 'NotificationContext.tsx');

// ── 12. FRONTEND — WAREHOUSE SOCKET HOOK ──────────────────────────────────────
const whSock = r('frontend/src/modules/warehouse/hooks/useWarehouseSocket.ts');
check('WHSocket: guards Warehouse userType only', whSock.includes("userType !== 'Warehouse'"), 'useWarehouseSocket.ts');
check('WHSocket: emits join-warehouse-room with user.id', whSock.includes('join-warehouse-room'), 'useWarehouseSocket.ts');
check('WHSocket: listens to warehouse-notification', whSock.includes('warehouse-notification'), 'useWarehouseSocket.ts');
check('WHSocket: listens to return-otp-alert', whSock.includes('return-otp-alert'), 'useWarehouseSocket.ts');
check('WHSocket: listens to return-request-alert', whSock.includes('return-request-alert'), 'useWarehouseSocket.ts');
check('WHSocket: reconnect catch-up for missed new orders', whSock.includes('/warehouse/notifications?limit=5'), 'useWarehouseSocket.ts');
check('WHSocket: reconnect catch-up for pending returns', whSock.includes('/returns?status=All Status'), 'useWarehouseSocket.ts');
check('WHSocket: reconnectionAttempts 20', whSock.includes('reconnectionAttempts: 20'), 'useWarehouseSocket.ts');

// ── 13. FRONTEND — DELIVERY SOCKET HOOK ───────────────────────────────────────
const delivNotif = r('frontend/src/hooks/useDeliveryOrderNotifications.ts');
check('DelivSocket: listens to new-order', delivNotif.includes('new-order'), 'useDeliveryOrderNotifications.ts');
check('DelivSocket: listens to order-accepted', delivNotif.includes('order-accepted'), 'useDeliveryOrderNotifications.ts');
check('DelivSocket: emits join-delivery-notifications', delivNotif.includes('join-delivery-notifications'), 'useDeliveryOrderNotifications.ts');

// ── 14. FRONTEND — ADMIN SOCKET HOOK ──────────────────────────────────────────
const adminSock = r('frontend/src/modules/admin/hooks/useAdminSocket.ts');
check('AdminSocket: emits join-admin-room', adminSock.includes('join-admin-room'), 'useAdminSocket.ts');
check('AdminSocket: listens to new-order-admin', adminSock.includes('new-order-admin'), 'useAdminSocket.ts');

// ── 15. FRONTEND — SOCKET URL CONFIG ──────────────────────────────────────────
const apiCfg = r('frontend/src/services/api/config.ts');
check('ApiCfg: getSocketBaseURL exported', apiCfg.includes('getSocketBaseURL'), 'config.ts');
check('ApiCfg: strips /api/v1 from socket URL', apiCfg.includes('/api/v1'), 'config.ts');
check('ApiCfg: falls back to api.inorfresh.com', apiCfg.includes('api.inorfresh.com'), 'config.ts');

// ── 16. ORDER MODEL ───────────────────────────────────────────────────────────
const orderModel = r('backend/src/models/Order.ts');
check('Order model: deliveryBoy field', orderModel.includes('deliveryBoy'), 'Order.ts');
check('Order model: inspectionExpiresAt field', orderModel.includes('inspectionExpiresAt'), 'Order.ts');
check('Order model: riderStatusDuringInspection field', orderModel.includes('riderStatusDuringInspection'), 'Order.ts');
check('Order model: isVerifiedByCustomer field', orderModel.includes('isVerifiedByCustomer'), 'Order.ts');
check('Order model: returnAllowed field', orderModel.includes('returnAllowed'), 'Order.ts');

// ── 17. RETURN MODEL ──────────────────────────────────────────────────────────
const returnModel = r('backend/src/models/Return.ts');
check('Return model: warehouseVerificationOtp field', returnModel.includes('warehouseVerificationOtp'), 'Return.ts');
check('Return model: status includes REFUNDED', returnModel.includes('REFUNDED'), 'Return.ts');
check('Return model: refundFundedBy field', returnModel.includes('refundFundedBy'), 'Return.ts');
check('Return model: proofOfPickupEvidence field', returnModel.includes('proofOfPickupEvidence'), 'Return.ts');

// ── 18. PORT SOCKET ────────────────────────────────────────────────────────────
const portSock = r('frontend/src/modules/port/hooks/usePortSocket.ts');
check('PortSocket: emits join-port-room', portSock.includes('join-port-room'), 'usePortSocket.ts');

// ── 19. WAREHOUSE LAYOUT — POPUP WIRING ───────────────────────────────────────
const whLayout = r('frontend/src/modules/warehouse/components/WarehouseLayout.tsx');
check('WHLayout: useWarehouseSocket called', whLayout.includes('useWarehouseSocket'), 'WarehouseLayout.tsx');
check('WHLayout: WarehouseNotificationAlert rendered', whLayout.includes('WarehouseNotificationAlert'), 'WarehouseLayout.tsx');
check('WHLayout: WarehouseReturnOtpAlert rendered', whLayout.includes('WarehouseReturnOtpAlert'), 'WarehouseLayout.tsx');
check('WHLayout: WarehouseReturnRequestAlert rendered', whLayout.includes('WarehouseReturnRequestAlert'), 'WarehouseLayout.tsx');

// ── 20. TYPESCRIPT — ZERO COMPILE ERRORS ─────────────────────────────────────
const { execSync } = require('child_process');
let tscBackend = '', tscFrontend = '';
try { execSync('npx tsc --noEmit', { cwd: 'backend', stdio: 'pipe' }); tscBackend = 'ok'; } catch (e) { tscBackend = e.stdout ? e.stdout.toString().trim().slice(0, 200) : String(e); }
try { execSync('npx tsc --noEmit', { cwd: 'frontend', stdio: 'pipe' }); tscFrontend = 'ok'; } catch (e) { tscFrontend = e.stdout ? e.stdout.toString().trim().slice(0, 200) : String(e); }
check('TypeScript: backend compiles with zero errors', tscBackend === 'ok', tscBackend === 'ok' ? 'backend' : tscBackend);
check('TypeScript: frontend compiles with zero errors', tscFrontend === 'ok', tscFrontend === 'ok' ? 'frontend' : tscFrontend);

// ── RESULTS ───────────────────────────────────────────────────────────────────
console.log('\n========================================');
console.log('     INORFRESH FULL AUDIT RESULTS');
console.log('========================================\n');
console.log('PASS (' + ok.length + ')');
ok.forEach(function(i) { console.log('  ✅  ' + i.label); });
if (issues.length > 0) {
  console.log('\nFAIL (' + issues.length + ')');
  issues.forEach(function(i) { console.log('  ❌  ' + i.label + '  [' + i.detail + ']'); });
} else {
  console.log('\n  ✅  ALL ' + ok.length + ' CHECKS PASSED — SAFE TO PUSH');
}
console.log('\n========================================\n');
