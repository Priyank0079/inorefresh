import React from 'react';
import PageTitle from '../../components/common/PageTitle';

const Notifications = () => {
  const notifications = [
    { id: 1, type: 'requirement', title: 'New Requirement Received', desc: 'Warehouse Mangrol Storage has posted a new requirement for Pomfret (500 KG).', time: '10 mins ago', isUnread: true },
    { id: 2, type: 'approval', title: 'Offer Approved', desc: 'Your offer for Requirement REQ-042 has been approved by the warehouse manager.', time: '1 hour ago', isUnread: true },
    { id: 3, type: 'order', title: 'New Order Confirmed', desc: 'Order ORD-882 has been confirmed. Please prepare the stock for pickup.', time: '3 hours ago', isUnread: false },
    { id: 4, type: 'negotiation', title: 'Negotiation Update', desc: 'Warehouse Hubli has countered your offer with a new price of ₹820/kg.', time: 'Yesterday', isUnread: false },
    { id: 5, type: 'system', title: 'Profile Verified', desc: 'Your port documentation has been verified by the system administrator.', time: '2 days ago', isUnread: false }
  ];

  const getIcon = (type) => {
    switch (type) {
      case 'requirement': return { icon: 'assignment', color: 'bg-blue-100 text-blue-600' };
      case 'approval': return { icon: 'verified', color: 'bg-emerald-100 text-emerald-600' };
      case 'order': return { icon: 'shopping_cart', color: 'bg-amber-100 text-amber-600' };
      case 'negotiation': return { icon: 'handshake', color: 'bg-violet-100 text-violet-600' };
      default: return { icon: 'notifications', color: 'bg-slate-100 text-slate-600' };
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <PageTitle 
        title="Notification Center" 
        subtitle="Stay updated with requirements, offers and orders"
        actions={
          <button className="text-teal-600 text-sm font-bold hover:underline">Mark all as read</button>
        }
      />

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 divide-y divide-slate-100">
        {notifications.map((notif) => {
          const { icon, color } = getIcon(notif.type);
          return (
            <div key={notif.id} className={`p-6 flex gap-4 transition-colors hover:bg-slate-50/50 ${notif.isUnread ? 'bg-teal-50/20' : ''}`}>
              <div className={`w-12 h-12 rounded-xl flex-shrink-0 flex items-center justify-center ${color}`}>
                <span className="material-icons-outlined text-2xl">{icon}</span>
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-sm font-bold text-slate-800">{notif.title}</h4>
                  <span className="text-xs text-slate-400 font-medium">{notif.time}</span>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">{notif.desc}</p>
                <div className="mt-3 flex items-center gap-4">
                  <button className="text-xs font-bold text-teal-600 hover:underline">View Details</button>
                  <button className="text-xs font-bold text-slate-400 hover:text-slate-600">Dismiss</button>
                </div>
              </div>
              {notif.isUnread && (
                <div className="w-2 h-2 bg-teal-500 rounded-full mt-2"></div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Notifications;
