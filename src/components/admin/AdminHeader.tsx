import React from 'react';
import { YLogo } from '../YLogo';
import {
  LayoutDashboard,
  Inbox,
  Briefcase,
  Users2,
  FolderKanban,
  CheckSquare,
  CalendarDays,
  Bell,
  Settings,
  ExternalLink,
  LogOut,
  AlertTriangle,
} from 'lucide-react';
import { AgencyUser, DashboardMetrics } from '../../types/admin';

export type AdminTab =
  | 'dashboard'
  | 'leads'
  | 'clients'
  | 'freelancers'
  | 'projects'
  | 'tasks'
  | 'deadlines'
  | 'notifications'
  | 'settings';

interface AdminHeaderProps {
  currentTab: AdminTab;
  onSelectTab: (tab: AdminTab) => void;
  metrics: DashboardMetrics | null;
  unreadNotifications: number;
  user: AgencyUser;
  onLogout: () => void;
  onReturnToPublic: () => void;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({
  currentTab,
  onSelectTab,
  metrics,
  unreadNotifications,
  user,
  onLogout,
  onReturnToPublic,
}) => {
  const isOwner = user.role === 'owner' || user.role === 'admin';

  const tabs = [
    { id: 'dashboard' as AdminTab, label: 'Dashboard', icon: LayoutDashboard, badge: null },
    {
      id: 'leads' as AdminTab,
      label: 'Quotes / Leads',
      icon: Inbox,
      badge: metrics?.newLeads ? `${metrics.newLeads}` : null,
      badgeColor: 'bg-[#581825] text-white',
    },
    { id: 'clients' as AdminTab, label: 'Clients', icon: Briefcase, badge: null },
    {
      id: 'freelancers' as AdminTab,
      label: 'Freelancers',
      icon: Users2,
      badge: metrics?.newSpecialistApplications ? `${metrics.newSpecialistApplications}` : null,
      badgeColor: 'bg-[#8B5E3C] text-white',
    },
    {
      id: 'projects' as AdminTab,
      label: 'Projects',
      icon: FolderKanban,
      badge: metrics?.activeProjects ? `${metrics.activeProjects}` : null,
      badgeColor: 'bg-[#2B2824] text-white',
    },
    {
      id: 'tasks' as AdminTab,
      label: 'Tasks / Kanban',
      icon: CheckSquare,
      badge: metrics?.tasksAwaitingReview ? `${metrics.tasksAwaitingReview}` : null,
      badgeColor: 'bg-[#C2410C] text-white animate-pulse',
    },
    {
      id: 'deadlines' as AdminTab,
      label: 'Deadlines',
      icon: CalendarDays,
      badge: metrics?.tasksOverdue ? `${metrics.tasksOverdue}` : null,
      badgeColor: 'bg-red-700 text-white',
    },
    {
      id: 'notifications' as AdminTab,
      label: 'Notifications',
      icon: Bell,
      badge: unreadNotifications > 0 ? `${unreadNotifications}` : null,
      badgeColor: 'bg-[#581825] text-white',
    },
    {
      id: 'settings' as AdminTab,
      label: isOwner ? 'Settings' : 'Settings (Restricted)',
      icon: Settings,
      badge: null,
    },
  ];

  return (
    <header className="bg-white border-b border-[#E8E2D8] sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 border-b border-[#F0EBE1] py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <YLogo size="xs" />
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#191816]">
              YAAWP Operations
            </span>
            <span className="text-[10px] px-1.5 py-0.5 bg-[#FAF8F5] border border-[#E2DDD5] text-[#5C5853] font-mono rounded">
              Internal Workspace
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {metrics && metrics.tasksOverdue > 0 && (
            <button
              onClick={() => onSelectTab('deadlines')}
              className="hidden sm:inline-flex items-center gap-1.5 px-2 py-1 bg-red-50 border border-red-200 text-red-700 text-[11px] font-medium rounded-sm cursor-pointer hover:bg-red-100 transition-colors"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
              <span>{metrics.tasksOverdue} Overdue</span>
            </button>
          )}

          {metrics && metrics.tasksAwaitingReview > 0 && (
            <button
              onClick={() => onSelectTab('tasks')}
              className="hidden sm:inline-flex items-center gap-1.5 px-2 py-1 bg-[#581825]/10 border border-[#581825]/20 text-[#581825] text-[11px] font-medium rounded-sm cursor-pointer hover:bg-[#581825]/20 transition-colors"
            >
              <span>{metrics.tasksAwaitingReview} In QA Review</span>
            </button>
          )}

          <div className="h-4 w-px bg-[#E8E2D8] hidden sm:block" />

          <button
            onClick={onReturnToPublic}
            className="inline-flex items-center gap-1.5 text-xs text-[#5C5853] hover:text-[#191816] font-medium transition-colors cursor-pointer"
          >
            <span>Public Site</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>

          <div className="h-4 w-px bg-[#E8E2D8]" />

          <div className="flex items-center gap-3">
            <div className="text-right hidden md:block">
              <div className="flex items-center justify-end gap-1.5 leading-none">
                <span className="text-xs font-semibold text-[#191816]">{user.name}</span>
                <span
                  className={`text-[9px] uppercase tracking-wider font-semibold px-1.5 py-0.2 rounded ${
                    isOwner
                      ? 'bg-[#581825]/10 text-[#581825] border border-[#581825]/20'
                      : 'bg-amber-100 text-amber-900 border border-amber-200'
                  }`}
                >
                  {isOwner ? 'Owner' : 'Project Manager'}
                </span>
              </div>
              <div className="text-[10px] text-[#8C867E] leading-none mt-1">{user.email}</div>
            </div>
            <button
              onClick={onLogout}
              title="Sign Out"
              className="p-1.5 text-[#8C867E] hover:text-[#581825] hover:bg-[#FAF8F5] rounded transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 overflow-x-auto scrollbar-none">
        <nav className="flex space-x-1 py-1" aria-label="Tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onSelectTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold tracking-wide whitespace-nowrap border-b-2 transition-all cursor-pointer ${
                  isActive
                    ? 'border-[#581825] text-[#581825] bg-[#FAF8F5]'
                    : 'border-transparent text-[#5C5853] hover:text-[#191816] hover:bg-[#FAF8F5]'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#581825]' : 'text-[#8C867E]'}`} />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span
                    className={`ml-1 text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                      tab.badgeColor || 'bg-[#581825] text-white'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
