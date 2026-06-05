import { ReactNode, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DeliveryBottomNav from './DeliveryBottomNav';
import { DeliveryStatusProvider, useDeliveryStatus } from '../context/DeliveryStatusContext';
import { DeliveryUserProvider, useDeliveryUser } from '../context/DeliveryUserContext';
import { getDeliveryProfile } from '../../../services/api/delivery/deliveryService';
import { useDeliveryOrderNotifications } from '../../../hooks/useDeliveryOrderNotifications';
import OrderNotificationCard from './OrderNotificationCard';
import DeliveryReturnPickupAlert from './DeliveryReturnPickupAlert';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from '../../../context/AuthContext';
import { registerFCMToken, setupForegroundNotificationHandler } from '../../../services/pushNotificationService';

interface DeliveryLayoutContentProps {
  children: ReactNode;
}

function DeliveryLayoutContent({ children }: DeliveryLayoutContentProps) {
  const navigate = useNavigate();
  const { isOnline } = useDeliveryStatus();
  const { setUserName } = useDeliveryUser();
  const { isAuthenticated, user } = useAuth();
  const {
    currentNotification,
    acceptOrder,
    rejectOrder,
    returnPickupAlert,
    clearReturnPickupAlert,
    isConnected,
    error: socketError,
  } = useDeliveryOrderNotifications();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const profile = await getDeliveryProfile();
        if (profile?.name) {
          setUserName(profile.name);
        }
      } catch (error) {
        console.error('Failed to fetch profile in layout:', error);
      }
    };

    fetchProfile();
  }, [setUserName]);

  // ── FCM Push Notification Registration ─────────────────────────────────
  // Registers the browser's FCM token with the backend so this delivery boy
  // receives push notifications when a new order arrives (even if tab is
  // in the background or the socket reconnects).
  useEffect(() => {
    if (!isAuthenticated || user?.userType !== 'Delivery' || !user?.id) return;

    const userId = String(user.id);

    // Force re-registration when a different delivery boy logs in on the same device
    const savedUserId = localStorage.getItem('fcm_token_user_id');
    const forceUpdate = savedUserId !== userId;

    registerFCMToken(forceUpdate)
      .then((token) => {
        if (token) {
          localStorage.setItem('fcm_token_user_id', userId);
          console.log('📲 FCM token registered for delivery boy:', userId);
        }
      })
      .catch((err) => {
        console.warn('⚠️ FCM token registration failed:', err);
      });

    // Wire up the Firebase foreground message handler so pushes that arrive
    // while the tab is open (socket momentarily down) still trigger the popup.
    setupForegroundNotificationHandler((payload) => {
      const type = payload.data?.type;
      if (type === 'return_pickup') {
        window.dispatchEvent(new CustomEvent('fcm:return-pickup', { detail: payload.data }));
      } else if (type === 'new_order') {
        // New-order foreground push: socket normally handles this, but dispatch
        // a fallback refresh event so dashboard counts stay accurate.
        window.dispatchEvent(new CustomEvent('delivery:orders-changed'));
      }
    });
  }, [isAuthenticated, user?.id, user?.userType]);
  // ────────────────────────────────────────────────────────────────────────

  return (
    <div className={`flex flex-col min-h-screen bg-neutral-100 transition-all duration-300 ${!isOnline ? 'grayscale' : ''}`}>

      <main className="flex-1 overflow-y-auto scrollbar-hide pb-20">
        {children}
      </main>

      {/* Socket connection status — shown when disconnected so driver knows notifications may be delayed */}
      <AnimatePresence>
        {!isConnected && isOnline && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-20 left-3 right-3 z-40"
          >
            <div className="bg-amber-600 text-white rounded-xl px-4 py-2.5 flex items-center gap-2 shadow-lg text-xs font-medium">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <span className="flex-1">
                {socketError ?? 'Reconnecting to order notifications…'}
              </span>
              <span className="flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-amber-300 opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-200"></span>
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Order Notification Card */}
      <AnimatePresence>
        {currentNotification && (
          <OrderNotificationCard
            key={currentNotification.orderId}
            notification={currentNotification}
            onAccept={(orderId) => acceptOrder(orderId, navigate)}
            onReject={rejectOrder}
          />
        )}
      </AnimatePresence>

      {/* Return pickup popup (warehouse approved a return → go collect) */}
      <DeliveryReturnPickupAlert
        alert={returnPickupAlert}
        onClose={clearReturnPickupAlert}
      />
    </div>
  );
}

interface DeliveryLayoutProps {
  children: ReactNode;
}

export default function DeliveryLayout({ children }: DeliveryLayoutProps) {
  return (
    <DeliveryStatusProvider>
      <DeliveryUserProvider>
        <DeliveryLayoutContent>{children}</DeliveryLayoutContent>
      </DeliveryUserProvider>
    </DeliveryStatusProvider>
  );
}
