import { useEffect, useRef } from 'react';
import { Heart, Bookmark, Bell, Check } from 'lucide-react';
import UserAvatar from './UserAvatar';

interface Notification {
  userId: string;
  createdAt: number;
  type: 'LIKE' | 'SAVE' | 'SYSTEM';
  actorId: string;
  actorUsername?: string;
  actorName?: string;
  actorAvatar?: string | null;
  templateId?: string;
  templateTitle?: string;
  isRead: string;
  message: string;
}

interface NotificationDropdownProps {
  notifications: Notification[];
  onClose: () => void;
  onMarkAllRead: () => void;
  onNotificationClick?: (notification: Notification) => void;
  onViewAll?: () => void;
  excludeRef?: React.RefObject<HTMLElement | null>;
}

export default function NotificationDropdown({ 
  notifications, 
  onClose, 
  onMarkAllRead,
  onNotificationClick,
  onViewAll,
  excludeRef
}: NotificationDropdownProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (dropdownRef.current && !dropdownRef.current.contains(target)) {
        // Don't close if clicking the bell button (toggle handled by parent)
        if (excludeRef?.current && excludeRef.current.contains(target)) {
          return;
        }
        onClose();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose, excludeRef]);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'LIKE':
        return <Heart className="w-4 h-4 text-red-500 fill-red-500" />;
      case 'SAVE':
        return <Bookmark className="w-4 h-4 text-[#00bcd4] fill-[#00bcd4]" />;
      default:
        return <Bell className="w-4 h-4 text-gray-400" />;
    }
  };

  const formatNotificationMessage = (notification: Notification) => {
    const { type, actorName, actorUsername, templateTitle } = notification;
    const displayName = actorName || actorUsername || 'Someone';
    
    if (type === 'LIKE' && templateTitle) {
      return (
        <span className="text-[13px] text-gray-600 leading-snug">
          <span className="font-semibold text-gray-900">{displayName}</span>
          {' '}liked your template{' '}
          <span className="font-medium text-[#00bcd4]">&quot;{templateTitle}&quot;</span>
        </span>
      );
    }
    
    if (type === 'SAVE' && templateTitle) {
      return (
        <span className="text-[13px] text-gray-600 leading-snug">
          <span className="font-semibold text-gray-900">{displayName}</span>
          {' '}saved your template{' '}
          <span className="font-medium text-[#00bcd4]">&quot;{templateTitle}&quot;</span>
        </span>
      );
    }
    
    return <span className="text-[13px] text-gray-600">{notification.message}</span>;
  };

  const formatTimeAgo = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  const unreadCount = notifications.filter(n => n.isRead === 'false').length;

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 mt-2 w-[360px] bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50"
      style={{ top: '100%' }}
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <h3 className="text-[15px] font-semibold text-gray-900">Notifications</h3>
        {unreadCount > 0 && (
          <button
            onClick={onMarkAllRead}
            className="flex items-center gap-1 text-xs text-[#00bcd4] hover:text-cyan-700 font-medium transition-colors"
          >
            <Check className="w-3.5 h-3.5" />
            Mark all read
          </button>
        )}
      </div>

      {/* Notifications List */}
      <div className="max-h-[380px] overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="px-4 py-10 text-center">
            <Bell className="w-10 h-10 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">No notifications yet</p>
          </div>
        ) : (
          <div>
            {notifications.map((notification, index) => (
              <button
                key={`${notification.userId}-${notification.createdAt}-${index}`}
                onClick={() => onNotificationClick?.(notification)}
                className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${
                  notification.isRead === 'false' ? 'bg-cyan-50/30' : ''
                } ${index < notifications.length - 1 ? 'border-b border-gray-50' : ''}`}
              >
                <div className="flex items-start gap-3">
                  {/* Avatar or Icon */}
                  <div className="flex-shrink-0 mt-0.5">
                    {(notification.actorAvatar || notification.type === 'LIKE' || notification.type === 'SAVE') && notification.type !== 'SYSTEM' ? (
                      <UserAvatar
                        src={notification.actorAvatar}
                        alt={notification.actorName || 'User'}
                        size="sm"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                        {getNotificationIcon(notification.type)}
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    {formatNotificationMessage(notification)}
                    <p className="text-[11px] text-gray-400 mt-1">
                      {formatTimeAgo(notification.createdAt)}
                    </p>
                  </div>

                  {/* Unread dot */}
                  {notification.isRead === 'false' && (
                    <div className="flex-shrink-0 mt-2">
                      <div className="w-2 h-2 bg-[#00bcd4] rounded-full"></div>
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {notifications.length > 0 && (
        <div className="border-t border-gray-100">
          <button
            onClick={onViewAll}
            className="w-full text-center text-[13px] text-gray-500 hover:text-[#00bcd4] hover:bg-gray-50 font-medium py-2.5 transition-colors"
          >
            View all notifications
          </button>
        </div>
      )}
    </div>
  );
}
