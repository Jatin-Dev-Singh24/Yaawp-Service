import React from 'react';
import { Bell, CheckCheck, Inbox, Users2, CheckSquare, Clock, ArrowRight } from 'lucide-react';
import { NotificationItem } from '../../types/admin';
import { AdminTab } from './AdminHeader';

interface AdminNotificationsProps {
  notifications: NotificationItem[];
  unreadCount: number;
  onMarkRead: (id: string) => Promise<void>;
  onMarkAllRead: () => Promise<void>;
  onNavigateToItem: (linkType: string | null, linkId: string | null) => void;
}

export const AdminNotifications: React.FC<AdminNotificationsProps> = ({
  notifications,
  unreadCount,
  onMarkRead,
  onMarkAllRead,
  onNavigateToItem,
}) => {
  const getIcon = (linkType: string | null) => {
    switch (linkType) {
      case 'lead':
        return <Inbox className="w-4 h-4 text-[#581825]" />;
      case 'freelancer':
        return <Users2 className="w-4 h-4 text-[#8B5E3C]" />;
      case 'task':
        return <CheckSquare className="w-4 h-4 text-[#2E5E3A]" />;
      default:
        return <Clock className="w-4 h-4 text-[#8C867E]" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E8E2D8]">
        <div>
          <span className="text-xs font-semibold uppercase tracking-widest text-[#581825] block mb-1">
            System Alerts & Activity
          </span>
          <h1 className="font-serif text-3xl font-normal text-[#191816] tracking-tight">
            Agency Activity Feed
          </h1>
          <p className="text-xs text-[#6B665F] mt-1">
            Real-time notifications for incoming inquiries, specialist submissions, and QA triggers.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={onMarkAllRead}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-[#DDD7CD] hover:border-[#191816] text-[#191816] text-xs font-semibold uppercase tracking-wider rounded-sm transition-colors cursor-pointer"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            <span>Mark All as Read ({unreadCount})</span>
          </button>
        )}
      </div>

      {/* Notifications List */}
      {notifications.length === 0 ? (
        <div className="bg-white border border-[#E2DDD5] p-12 text-center rounded-sm">
          <Bell className="w-8 h-8 text-[#8C867E] mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-[#191816]">No notifications in feed</h3>
          <p className="text-xs text-[#6B665F] mt-1">All agency operations are up to date.</p>
        </div>
      ) : (
        <div className="bg-white border border-[#E2DDD5] rounded-sm shadow-2xs divide-y divide-[#F0EBE1] overflow-hidden">
          {notifications.map((notif) => (
            <div
              key={notif.id}
              className={`p-4 flex items-start justify-between gap-4 transition-colors ${
                notif.is_read === 0 ? 'bg-[#FAF5F6]/60 hover:bg-[#FAF5F6]' : 'hover:bg-[#FAF8F5]'
              }`}
            >
              <div className="flex items-start gap-3 min-w-0">
                <div className="p-2 rounded-sm bg-[#FAF8F5] border border-[#E8E2D8] shrink-0 mt-0.5">
                  {getIcon(notif.link_type)}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-semibold text-[#191816]">{notif.title}</h4>
                    {notif.is_read === 0 && (
                      <span className="w-2 h-2 rounded-full bg-[#581825]" />
                    )}
                  </div>

                  <p className="text-xs text-[#5C5853] mt-1 leading-relaxed">{notif.message}</p>

                  <span className="text-[10px] text-[#8C867E] mt-1.5 block">
                    {new Date(notif.created_at).toLocaleDateString()} at{' '}
                    {new Date(notif.created_at).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {notif.link_type && (
                  <button
                    onClick={() => {
                      if (notif.is_read === 0) onMarkRead(notif.id);
                      onNavigateToItem(notif.link_type, notif.link_id);
                    }}
                    className="px-2.5 py-1 text-[11px] font-semibold text-[#581825] hover:underline inline-flex items-center gap-1 cursor-pointer"
                  >
                    <span>View</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}

                {notif.is_read === 0 && (
                  <button
                    onClick={() => onMarkRead(notif.id)}
                    className="p-1 text-[#8C867E] hover:text-[#191816] transition-colors cursor-pointer text-[11px]"
                    title="Mark as read"
                  >
                    Dismiss
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
