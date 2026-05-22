import { useState, useEffect } from 'react';
import {
  getNotifications,
  createNotification,
  deleteNotification,
  Notification as NotificationType,
  CreateNotificationData,
} from '../../../services/api/admin/adminNotificationService';

export default function AdminNotification() {
  const [formData, setFormData] = useState({
    recipientType: 'All' as 'All' | 'Admin' | 'Warehouse' | 'Customer' | 'Delivery' | 'Port',
    title: '',
    message: '',
  });

  const [notifications, setNotifications] = useState<NotificationType[]>([]);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState('');
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [totalPages, setTotalPages] = useState(1);
  const [totalNotifications, setTotalNotifications] = useState(0);
  const [confirmDeleteNotifId, setConfirmDeleteNotifId] = useState<string | null>(null);
  const [filterRecipientType, setFilterRecipientType] = useState<string>('All');

  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    fetchNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, rowsPerPage, filterRecipientType]);

  const fetchNotifications = async () => {
    setLoading(true);
    setError('');
    try {
      const params: any = {
        page: currentPage,
        limit: rowsPerPage,
      };

      if (filterRecipientType !== 'All') {
        params.recipientType = filterRecipientType;
      }

      const response = await getNotifications(params);

      if (response.success && response.data) {
        setNotifications(response.data);
        if (response.pagination) {
          setTotalPages(response.pagination.pages);
          setTotalNotifications(response.pagination.total);
        }
      } else {
        setError(response.message || 'Failed to fetch notifications');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error fetching notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!formData.title.trim() || !formData.message.trim()) {
      setError('Please enter a title and a message');
      return;
    }

    setLoading(true);
    try {
      const notificationData: CreateNotificationData = {
        recipientType: formData.recipientType,
        title: formData.title.trim(),
        message: formData.message.trim(),
        type: 'Info',
        priority: 'Medium',
      };

      const response = await createNotification(notificationData);

      if (response.success) {
        setSuccessMessage('Notification sent successfully!');
        setFormData({
          recipientType: 'All',
          title: '',
          message: '',
        });
        fetchNotifications();
      } else {
        setError(response.message || 'Failed to send notification');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error sending notification');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id: string) => {
    setConfirmDeleteNotifId(id);
  };

  const handleConfirmDeleteNotif = async () => {
    if (!confirmDeleteNotifId) return;
    const id = confirmDeleteNotifId;
    setConfirmDeleteNotifId(null);
    setLoading(true);
    setError('');
    setSuccessMessage('');
    try {
      const response = await deleteNotification(id);
      if (response.success) {
        setSuccessMessage('Notification deleted successfully!');
        fetchNotifications();
      } else {
        setError(response.message || 'Failed to delete notification');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error deleting notification');
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  const SortIcon = ({ column }: { column: string }) => (
    <span className="text-neutral-400 text-xs ml-1">
      {sortColumn === column ? (sortDirection === 'asc' ? '↑' : '↓') : '⇅'}
    </span>
  );

  let filteredNotifications = notifications;
  if (searchTerm) {
    const searchLower = searchTerm.toLowerCase();
    filteredNotifications = filteredNotifications.filter((notification) =>
      notification.title.toLowerCase().includes(searchLower) ||
      notification.message.toLowerCase().includes(searchLower) ||
      notification.recipientType.toLowerCase().includes(searchLower)
    );
  }

  let sortedNotifications = [...filteredNotifications];
  if (sortColumn) {
    sortedNotifications = [...filteredNotifications].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortColumn) {
        case 'recipientType':
          aValue = a.recipientType;
          bValue = b.recipientType;
          break;
        case 'title':
          aValue = a.title;
          bValue = b.title;
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt || 0).getTime();
          bValue = new Date(b.createdAt || 0).getTime();
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }

  const displayedNotifications = sortedNotifications;
  const startIndex = (currentPage - 1) * rowsPerPage;

  const formatDate = (dateString?: string): string => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: true
    });
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 text-sm">
      <div className="flex-1 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <h1 className="text-2xl font-semibold text-neutral-800">Notifications</h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[350px_1fr] gap-6 items-start h-full">
          {/* Send Notification Card */}
          <div className="bg-white rounded-xl shadow-sm border border-neutral-200 sticky top-4">
            <div className="bg-gradient-to-r from-[#12b2a2] to-[#0d9488] text-white px-5 py-3 rounded-t-xl">
              <h2 className="font-semibold">Send Notification</h2>
            </div>
            
            <div className="p-5">
              {error && (
                <div className="mb-4 p-3 bg-red-50 text-red-700 text-xs rounded flex justify-between">
                  <span>{error}</span>
                  <button onClick={() => setError('')} className="font-bold ml-2">×</button>
                </div>
              )}
              {successMessage && (
                <div className="mb-4 p-3 bg-teal-50 text-teal-700 text-xs rounded flex justify-between">
                  <span>{successMessage}</span>
                  <button onClick={() => setSuccessMessage('')} className="font-bold ml-2">×</button>
                </div>
              )}

              <form onSubmit={handleSendNotification} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">Select User Type</label>
                  <select
                    name="recipientType"
                    value={formData.recipientType}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-neutral-300 rounded focus:ring-1 focus:ring-[#12b2a2] focus:border-[#12b2a2] outline-none bg-white text-sm"
                  >
                    <option value="All">All Users</option>
                    <option value="Admin">Admin</option>
                    <option value="Warehouse">Warehouse</option>
                    <option value="Customer">Customer</option>
                    <option value="Delivery">Delivery</option>
                    <option value="Port">Port</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">Title *</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter Title"
                    className="w-full px-3 py-2 border border-neutral-300 rounded focus:ring-1 focus:ring-[#12b2a2] focus:border-[#12b2a2] outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1">Message *</label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter Message"
                    rows={4}
                    className="w-full px-3 py-2 border border-neutral-300 rounded focus:ring-1 focus:ring-[#12b2a2] focus:border-[#12b2a2] outline-none resize-none text-sm"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#12b2a2] hover:bg-[#0e8f82] disabled:opacity-50 text-white px-4 py-2 rounded font-semibold transition-colors mt-2"
                >
                  {loading ? 'Sending...' : 'Send Notification'}
                </button>
              </form>
            </div>
          </div>

          {/* Manage Notifications Table */}
          <div className="bg-white rounded-xl shadow-sm border border-neutral-200 flex flex-col min-h-[600px]">
            <div className="px-5 py-3 border-b border-neutral-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <h2 className="font-semibold text-neutral-800 text-lg">Manage Notifications</h2>
              <div className="flex flex-wrap gap-2 items-center">
                <select
                  value={filterRecipientType}
                  onChange={(e) => {
                    setFilterRecipientType(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="border border-neutral-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[#12b2a2]"
                >
                  <option value="All">All Types</option>
                  <option value="Admin">Admin</option>
                  <option value="Warehouse">Warehouse</option>
                  <option value="Customer">Customer</option>
                  <option value="Delivery">Delivery</option>
                  <option value="Port">Port</option>
                </select>
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="border border-neutral-300 rounded px-3 py-1 focus:outline-none focus:ring-1 focus:ring-[#12b2a2] w-40 sm:w-48"
                />
              </div>
            </div>

            {loading ? (
              <div className="flex-1 flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#12b2a2]"></div>
              </div>
            ) : (
              <div className="overflow-x-auto flex-1">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-neutral-50 text-xs font-bold text-neutral-600 uppercase border-b border-neutral-200 tracking-wider">
                      <th className="px-5 py-3">#</th>
                      <th className="px-5 py-3 cursor-pointer hover:text-neutral-900" onClick={() => handleSort('recipientType')}>
                        Audience <SortIcon column="recipientType" />
                      </th>
                      <th className="px-5 py-3">Notification</th>
                      <th className="px-5 py-3 cursor-pointer hover:text-neutral-900" onClick={() => handleSort('createdAt')}>
                        Date <SortIcon column="createdAt" />
                      </th>
                      <th className="px-5 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {displayedNotifications.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-neutral-500">No notifications found.</td>
                      </tr>
                    ) : (
                      displayedNotifications.map((notification, index) => (
                        <tr key={notification._id} className="hover:bg-neutral-50 border-b border-neutral-100 last:border-0">
                          <td className="px-5 py-3 text-neutral-500">{startIndex + index + 1}</td>
                          <td className="px-5 py-3 font-medium text-neutral-700">
                            <span className="bg-neutral-100 text-neutral-700 px-2.5 py-0.5 rounded-full text-xs">
                              {notification.recipientType}
                            </span>
                          </td>
                          <td className="px-5 py-3">
                            <div className="font-semibold text-neutral-800">{notification.title}</div>
                            <div className="text-neutral-500 text-xs mt-0.5 line-clamp-2" title={notification.message}>{notification.message}</div>
                          </td>
                          <td className="px-5 py-3 text-neutral-500 whitespace-nowrap">{formatDate(notification.createdAt)}</td>
                          <td className="px-5 py-3 text-right">
                            <button
                              onClick={() => handleDelete(notification._id)}
                              className="text-red-500 hover:text-red-700 transition-colors p-1.5 hover:bg-red-50 rounded"
                              title="Delete"
                            >
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                              </svg>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {!loading && totalPages > 1 && (
              <div className="px-5 py-3 border-t border-neutral-200 flex flex-col sm:flex-row items-center justify-between gap-3 bg-neutral-50/50 rounded-b-xl">
                <div className="text-xs text-neutral-500">
                  Showing {displayedNotifications.length > 0 ? startIndex + 1 : 0} to {Math.min(startIndex + displayedNotifications.length, totalNotifications)} of {totalNotifications}
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-1.5 border border-neutral-200 rounded text-neutral-600 disabled:opacity-50 hover:bg-white bg-white"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
                  </button>
                  <span className="px-3 py-1.5 text-xs font-semibold text-neutral-700">Page {currentPage} of {totalPages}</span>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-1.5 border border-neutral-200 rounded text-neutral-600 disabled:opacity-50 hover:bg-white bg-white"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {confirmDeleteNotifId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setConfirmDeleteNotifId(null)} />
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl relative z-10 text-center">
            <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-3">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </div>
            <h4 className="font-bold text-neutral-800 mb-1">Delete Notification?</h4>
            <p className="text-sm text-neutral-500 mb-4">Are you sure you want to delete this notification?</p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmDeleteNotifId(null)} className="flex-1 py-2 rounded-lg text-sm font-semibold bg-neutral-100 text-neutral-600 hover:bg-neutral-200 transition-colors">Cancel</button>
              <button onClick={handleConfirmDeleteNotif} className="flex-1 py-2 rounded-lg text-sm font-semibold bg-red-500 text-white hover:bg-red-600 transition-colors">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
