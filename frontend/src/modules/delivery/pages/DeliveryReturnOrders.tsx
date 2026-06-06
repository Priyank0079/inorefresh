import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import DeliveryHeader from '../components/DeliveryHeader';
import DeliveryBottomNav from '../components/DeliveryBottomNav';
import api from '../../../services/api/config';

async function fetchReturnData() {
  const res = await api.get('/delivery/orders/returns');
  return {
    orders: res.data.data || [],
    pickups: res.data.returnPickups || [],
  };
}

export default function DeliveryReturnOrders() {
  const navigate = useNavigate();
  const [returnOrders, setReturnOrders] = useState<any[]>([]);
  const [returnPickups, setReturnPickups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const { orders, pickups } = await fetchReturnData();
        setReturnOrders(orders);
        setReturnPickups(pickups);
      } catch (err: any) {
        setError(err.message || 'Failed to load return orders');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Cancelled':
      case 'Returned':
      case 'Fully Returned':
        return 'bg-red-100 text-red-700';
      case 'Partially Returned':
        return 'bg-orange-100 text-orange-700';
      case 'Rejected':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-neutral-100 text-neutral-700';
    }
  };

  const backBtn = (
    <button
      onClick={() => navigate(-1)}
      className="mr-3 p-2 hover:bg-neutral-200 rounded-full transition-colors"
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-100 pb-20">
        <DeliveryHeader />
        <div className="px-4 py-4">
          <div className="flex items-center mb-4">
            <div className="mr-3 w-9 h-9 rounded-full bg-neutral-200 animate-pulse" />
            <div className="h-6 w-44 bg-neutral-200 rounded-lg animate-pulse" />
          </div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-xl p-4 shadow-sm border border-neutral-200">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-28 bg-neutral-200 rounded animate-pulse" />
                    <div className="h-3 w-36 bg-neutral-200 rounded animate-pulse" />
                  </div>
                  <div className="h-6 w-20 bg-neutral-200 rounded-full animate-pulse" />
                </div>
                <div className="border-t border-neutral-200 pt-3 mt-3 space-y-2">
                  <div className="h-3 w-full bg-neutral-200 rounded animate-pulse" />
                  <div className="flex justify-between">
                    <div className="h-3 w-16 bg-neutral-200 rounded animate-pulse" />
                    <div className="h-4 w-20 bg-neutral-200 rounded animate-pulse" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <DeliveryBottomNav />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-neutral-100 flex items-center justify-center pb-20">
        <p className="text-red-500">{error}</p>
        <DeliveryBottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-100 pb-20">
      <DeliveryHeader />
      <div className="px-4 py-4">
        <div className="flex items-center mb-4">
          {backBtn}
          <h2 className="text-neutral-900 text-xl font-semibold">Return Orders</h2>
        </div>

        {/* Return Pickup Items (from Return model) */}
        {returnPickups.length > 0 && (
          <div className="mb-4">
            <h3 className="text-neutral-700 text-sm font-semibold mb-2 px-1">
              Return Items to Collect ({returnPickups.length})
            </h3>
            <div className="space-y-3">
              {returnPickups.map((item) => (
                <div
                  key={item.id}
                  className="bg-white rounded-xl p-4 shadow-sm border border-orange-200"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <p className="text-neutral-900 font-semibold text-sm mb-1">{item.orderId}</p>
                      <p className="text-neutral-600 text-xs mb-1">{item.customerName}</p>
                      {item.customerPhone && <p className="text-neutral-500 text-xs">{item.customerPhone}</p>}
                    </div>
                    <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded-full text-xs font-medium">
                      Return Pickup
                    </span>
                  </div>
                  {item.address && (
                    <p className="text-neutral-600 text-xs mb-2 line-clamp-2">{item.address}</p>
                  )}
                  <div className="flex items-center justify-between text-xs text-neutral-500 mt-1">
                    <span>Qty: {item.quantity}</span>
                    <span>Reason: {item.reason}</span>
                  </div>
                  <p className="text-neutral-400 text-xs mt-2">
                    {new Date(item.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Return Orders (from Order model) */}
        <h3 className="text-neutral-700 text-sm font-semibold mb-2 px-1">
          Returned Orders {returnOrders.length > 0 ? `(${returnOrders.length})` : ''}
        </h3>
        {returnOrders.length > 0 ? (
          <div className="space-y-3">
            {returnOrders.map((order) => (
              <div key={order.id} className="bg-white rounded-xl p-4 shadow-sm border border-neutral-200">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <p className="text-neutral-900 font-semibold text-sm mb-1">{order.orderId}</p>
                    <p className="text-neutral-600 text-xs mb-1">{order.customerName}</p>
                    <p className="text-neutral-500 text-xs">{order.customerPhone}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                </div>
                <div className="border-t border-neutral-200 pt-3 mt-3">
                  <p className="text-neutral-600 text-xs mb-2 line-clamp-2">{order.address}</p>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-neutral-500 text-xs">
                      {order.items.length} item{order.items.length > 1 ? 's' : ''}
                    </p>
                    <p className="text-neutral-900 font-bold">₹ {order.totalAmount}</p>
                  </div>
                  <p className="text-neutral-400 text-xs mt-2">
                    {new Date(order.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl p-8 flex items-center justify-center shadow-sm border border-neutral-200">
            <p className="text-neutral-500 text-sm">No returned orders</p>
          </div>
        )}
      </div>
      <DeliveryBottomNav />
    </div>
  );
}

