import React from 'react';
import {
  Inbox,
  FolderKanban,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ArrowRight,
  Plus,
  Check,
} from 'lucide-react';
import { DashboardMetrics } from '../../types/admin';
import { AdminTab } from './AdminHeader';

interface AdminDashboardProps {
  metrics: DashboardMetrics | null;
  upcomingTasks: any[];
  upcomingProjects: any[];
  recentActivity: any[];
  recentlyCompletedTasks: any[];
  onSelectTab: (tab: AdminTab) => void;
  onOpenNewProject: () => void;
  onOpenNewTask: () => void;
  onApproveTask: (taskId: string) => Promise<void>;
  onInspectTask: (taskId: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  metrics,
  upcomingTasks,
  upcomingProjects,
  recentActivity,
  recentlyCompletedTasks,
  onSelectTab,
  onOpenNewProject,
  onOpenNewTask,
  onApproveTask,
  onInspectTask,
}) => {
  return (
    <div className="space-y-8">
      {/* Welcome & Quick Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E8E2D8]">
        <div>
          <span className="text-xs font-semibold uppercase tracking-widest text-[#581825] block mb-1">
            Executive Overview
          </span>
          <h1 className="font-serif text-3xl font-normal text-[#191816] tracking-tight">
            Agency Operating Workspace
          </h1>
          <p className="text-xs text-[#6B665F] mt-1">
            Live triage of client inquiries, active project delivery, and specialist quality assurance.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onOpenNewTask}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white border border-[#DDD7CD] hover:border-[#191816] text-[#191816] text-xs font-semibold uppercase tracking-wider rounded-sm transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Task</span>
          </button>
          <button
            onClick={onOpenNewProject}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#581825] hover:bg-[#3E0E18] text-white text-xs font-semibold uppercase tracking-wider rounded-sm transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Project</span>
          </button>
        </div>
      </div>

      {/* Actionable Metrics Grid (Exact requirements: New Leads, Active Projects, Awaiting Review, Overdue) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* NEW LEADS */}
        <div
          onClick={() => onSelectTab('leads')}
          className="bg-white border border-[#E2DDD5] p-5 rounded-sm hover:border-[#581825] transition-all cursor-pointer group shadow-2xs"
        >
          <div className="flex items-center justify-between text-xs text-[#6B665F] font-semibold uppercase tracking-wider mb-2">
            <span>New Leads</span>
            <Inbox className="w-4 h-4 text-[#581825] group-hover:translate-x-0.5 transition-transform" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-serif text-4xl text-[#191816]">
              {metrics ? metrics.newLeads : '—'}
            </span>
            <span className="text-xs text-[#5C5853]">awaiting response</span>
          </div>
          <div className="mt-4 pt-3 border-t border-[#F0EBE1] flex items-center justify-between text-[11px] text-[#581825] font-semibold">
            <span>Review inquiries</span>
            <ArrowRight className="w-3 h-3" />
          </div>
        </div>

        {/* ACTIVE PROJECTS */}
        <div
          onClick={() => onSelectTab('projects')}
          className="bg-white border border-[#E2DDD5] p-5 rounded-sm hover:border-[#191816] transition-all cursor-pointer group shadow-2xs"
        >
          <div className="flex items-center justify-between text-xs text-[#6B665F] font-semibold uppercase tracking-wider mb-2">
            <span>Active Projects</span>
            <FolderKanban className="w-4 h-4 text-[#2B2824] group-hover:translate-x-0.5 transition-transform" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-serif text-4xl text-[#191816]">
              {metrics ? metrics.activeProjects : '—'}
            </span>
            <span className="text-xs text-[#5C5853]">in flight</span>
          </div>
          <div className="mt-4 pt-3 border-t border-[#F0EBE1] flex items-center justify-between text-[11px] text-[#191816] font-semibold">
            <span>Manage pipelines</span>
            <ArrowRight className="w-3 h-3" />
          </div>
        </div>

        {/* AWAITING REVIEW */}
        <div
          onClick={() => onSelectTab('tasks')}
          className="bg-white border-2 border-[#581825]/40 p-5 rounded-sm hover:border-[#581825] transition-all cursor-pointer group bg-[#FAF5F6]/40 shadow-2xs"
        >
          <div className="flex items-center justify-between text-xs text-[#581825] font-semibold uppercase tracking-wider mb-2">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#581825] animate-ping" />
              <span>Awaiting Review</span>
            </span>
            <Clock className="w-4 h-4 text-[#581825]" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-serif text-4xl text-[#581825] font-medium">
              {metrics ? metrics.tasksAwaitingReview : '—'}
            </span>
            <span className="text-xs text-[#581825]/80">specialist deliverables</span>
          </div>
          <div className="mt-4 pt-3 border-t border-[#581825]/15 flex items-center justify-between text-[11px] text-[#581825] font-semibold">
            <span>QA deliverables</span>
            <ArrowRight className="w-3 h-3" />
          </div>
        </div>

        {/* OVERDUE */}
        <div
          onClick={() => onSelectTab('deadlines')}
          className={`p-5 rounded-sm transition-all cursor-pointer group shadow-2xs ${
            metrics && metrics.tasksOverdue > 0
              ? 'bg-red-50/60 border-2 border-red-300 hover:border-red-500'
              : 'bg-white border border-[#E2DDD5] hover:border-[#191816]'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider mb-2">
            <span className={metrics && metrics.tasksOverdue > 0 ? 'text-red-700' : 'text-[#6B665F]'}>
              Overdue
            </span>
            <AlertTriangle
              className={`w-4 h-4 ${
                metrics && metrics.tasksOverdue > 0 ? 'text-red-600' : 'text-[#8C867E]'
              }`}
            />
          </div>
          <div className="flex items-baseline gap-2">
            <span
              className={`font-serif text-4xl ${
                metrics && metrics.tasksOverdue > 0 ? 'text-red-700 font-semibold' : 'text-[#191816]'
              }`}
            >
              {metrics ? metrics.tasksOverdue : '0'}
            </span>
            <span className="text-xs text-[#5C5853]">past deadline</span>
          </div>
          <div className="mt-4 pt-3 border-t border-[#F0EBE1] flex items-center justify-between text-[11px] font-semibold text-red-700">
            <span>Resolve delays</span>
            <ArrowRight className="w-3 h-3" />
          </div>
        </div>
      </div>

      {/* Secondary Quick Triage & Special Attention Block */}
      {metrics && metrics.tasksAwaitingReview > 0 && (
        <div className="bg-[#FAF5F6] border border-[#581825]/25 p-5 rounded-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-[#581825] text-white flex items-center justify-center text-xs font-bold">
                {metrics.tasksAwaitingReview}
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[#191816]">
                  Specialist Deliverables Requiring Agency QA
                </h3>
                <p className="text-xs text-[#6B665F]">
                  Independent specialists completed these tasks. Review code/design and approve or send revision notes.
                </p>
              </div>
            </div>
            <button
              onClick={() => onSelectTab('tasks')}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#581825] hover:underline"
            >
              <span>View full Kanban board</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {upcomingTasks
              .filter((t) => t.status === 'Needs Review')
              .slice(0, 4)
              .map((task) => (
                <div
                  key={task.id}
                  className="bg-white border border-[#E8E2D8] p-3.5 rounded-sm flex items-start justify-between gap-3 hover:border-[#581825] transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-[#581825] block truncate">
                      {task.project_name} · {task.specialist_name || 'Specialist'}
                    </span>
                    <h4 className="text-xs font-semibold text-[#191816] mt-0.5 line-clamp-1">
                      {task.title}
                    </h4>
                    <span className="text-[11px] text-[#8C867E] block mt-1">
                      Due: {task.deadline || 'No deadline'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => onInspectTask(task.id)}
                      className="px-2.5 py-1 text-[11px] font-medium border border-[#DDD7CD] hover:border-[#191816] text-[#191816] rounded-sm transition-colors cursor-pointer"
                    >
                      Inspect
                    </button>
                    <button
                      onClick={() => onApproveTask(task.id)}
                      className="px-2.5 py-1 text-[11px] font-semibold bg-[#2E5E3A] hover:bg-[#204529] text-white rounded-sm transition-colors cursor-pointer inline-flex items-center gap-1"
                    >
                      <Check className="w-3 h-3" />
                      <span>Approve</span>
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Two Column Layout: Deadlines & Live Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-[#E2DDD5] p-6 rounded-sm shadow-2xs">
            <div className="flex items-center justify-between pb-4 border-b border-[#F0EBE1] mb-4">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-[#191816]">
                  Active Project Timelines
                </h3>
                <span className="text-xs text-[#8C867E]">
                  Upcoming delivery commitments and client checkpoints
                </span>
              </div>
              <button
                onClick={() => onSelectTab('projects')}
                className="text-xs font-semibold text-[#581825] hover:underline cursor-pointer"
              >
                View all projects →
              </button>
            </div>

            <div className="divide-y divide-[#F0EBE1]">
              {upcomingProjects.map((p) => {
                const isOverdue = p.deadline && new Date(p.deadline) < new Date();
                return (
                  <div key={p.id} className="py-3 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-[#8C867E]">
                        {p.client_company || 'Client'}
                      </span>
                      <h4 className="text-xs font-semibold text-[#191816] truncate">
                        {p.name}
                      </h4>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span
                        className={`text-[11px] font-medium px-2 py-0.5 rounded-sm ${
                          p.status === 'Review'
                            ? 'bg-[#FAF5F6] text-[#581825] border border-[#581825]/20'
                            : 'bg-[#FAF8F5] text-[#5C5853] border border-[#E8E2D8]'
                        }`}
                      >
                        {p.status}
                      </span>
                      <div className="text-right">
                        <span
                          className={`text-xs font-medium block ${
                            isOverdue ? 'text-red-700 font-semibold' : 'text-[#191816]'
                          }`}
                        >
                          {p.deadline || 'Ongoing'}
                        </span>
                        {isOverdue && (
                          <span className="text-[10px] text-red-600 block leading-tight font-semibold">
                            Overdue
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white border border-[#E2DDD5] p-6 rounded-sm shadow-2xs">
            <div className="flex items-center justify-between pb-4 border-b border-[#F0EBE1] mb-4">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-[#191816]">
                  Recently Completed Deliverables
                </h3>
                <span className="text-xs text-[#8C867E]">
                  Tasks signed off by agency leadership
                </span>
              </div>
              <button
                onClick={() => onSelectTab('tasks')}
                className="text-xs font-semibold text-[#581825] hover:underline cursor-pointer"
              >
                View tasks →
              </button>
            </div>

            {recentlyCompletedTasks.length === 0 ? (
              <p className="text-xs text-[#8C867E] py-4 text-center">No tasks approved yet.</p>
            ) : (
              <div className="divide-y divide-[#F0EBE1]">
                {recentlyCompletedTasks.map((t) => (
                  <div key={t.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2 truncate">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#2E5E3A] shrink-0" />
                      <span className="font-medium text-[#191816] truncate">{t.title}</span>
                      <span className="text-[#8C867E] text-[11px] truncate">
                        ({t.project_name})
                      </span>
                    </div>
                    <span className="text-[11px] text-[#8C867E] shrink-0">
                      {t.specialist_name || 'Specialist'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white border border-[#E2DDD5] p-6 rounded-sm shadow-2xs">
            <div className="flex items-center justify-between pb-4 border-b border-[#F0EBE1] mb-4">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-[#191816]">
                Agency Activity Log
              </h3>
              <span className="text-[11px] text-[#8C867E]">Real-time events</span>
            </div>

            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
              {recentActivity.map((act) => (
                <div key={act.id} className="text-xs flex items-start gap-2.5 pb-3 border-b border-[#F5F2ED] last:border-none">
                  <div className="w-2 h-2 rounded-full bg-[#581825] mt-1.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[#191816] font-normal leading-relaxed">
                      {act.description}
                    </p>
                    <span className="text-[10px] text-[#8C867E] mt-0.5 block">
                      {new Date(act.created_at).toLocaleDateString()} at{' '}
                      {new Date(act.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
