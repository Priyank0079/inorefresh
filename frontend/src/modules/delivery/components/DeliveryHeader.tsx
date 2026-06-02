import { useDeliveryStatus } from '../context/DeliveryStatusContext';
import { useDeliveryUser } from '../context/DeliveryUserContext';
import { useThemeContext } from '../../../context/ThemeContext';

interface DeliveryHeaderProps {
  userName?: string;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export default function DeliveryHeader({ userName, onRefresh, isRefreshing }: DeliveryHeaderProps) {
  const { isOnline, setIsOnline } = useDeliveryStatus();
  const { userName: contextUserName } = useDeliveryUser();
  const { currentTheme } = useThemeContext();
  const displayName = userName || contextUserName;

  return (
    <div className="bg-white shadow-sm">
      {/* Offline Banner */}
      {!isOnline && (
        <div className="px-4 py-2 bg-neutral-500 text-white text-xs font-medium text-center">
          Offline
        </div>
      )}

      {/* Header Content */}
      <div className="px-4 py-3">
        {/* App Title */}
        <h1
          className="text-xl font-bold text-center mb-3 transition-colors"
          style={{ color: isOnline ? currentTheme.primary[3] : '#737373' }}
        >
          Delivery App
        </h1>

        {/* User Info Bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Profile Icon */}
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center transition-colors"
              style={{ backgroundColor: isOnline ? currentTheme.primary[3] : '#a3a3a3' }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="8" r="4" stroke="white" strokeWidth="2" fill="none" />
                <path d="M4 20c0-4 3.5-7 8-7s8 3 8 7" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none" />
              </svg>
            </div>
            <div className="flex flex-col">
              <span className="text-neutral-700 text-sm">Hello</span>
              <span className="text-neutral-900 text-xs font-medium">{displayName}</span>
            </div>
          </div>

          {/* Actions: Refresh & Toggle */}
          <div className="flex items-center gap-3">
            {/* Refresh always available — uses page handler if given, else reloads */}
            <button
              onClick={onRefresh ? onRefresh : () => window.location.reload()}
              disabled={isRefreshing}
              aria-label="Refresh"
              title="Refresh"
              className={`p-2 rounded-full bg-neutral-100 text-neutral-600 active:bg-neutral-200 transition-all ${isRefreshing ? 'animate-spin' : ''}`}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 4v6h-6M1 20v-6h6M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
              </svg>
            </button>

            {/* Toggle Switch */}
            <button
              onClick={() => setIsOnline(!isOnline)}
              className="relative w-12 h-6 rounded-full transition-colors"
              style={{ backgroundColor: isOnline ? currentTheme.primary[3] : '#d4d4d4' }}
            >
              <div
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${isOnline ? 'translate-x-6' : 'translate-x-0'
                  }`}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}




