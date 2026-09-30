import React, { useState } from 'react';
import {
  CalendarDays,
  AlertTriangle,
  Clock,
  CheckCircle2,
  FolderKanban,
  CheckSquare,
  ArrowRight,
  Filter,
} from 'lucide-react';
import { DeadlineItem } from '../../types/admin';

interface AdminDeadlinesProps {
  deadlines: {
    today: string;
    projects: DeadlineItem[];
    tasks: DeadlineItem[];
  } | null;
  onSelectProject?: (projectId: string) => void;
  onSelectTask?: (taskId: string) => void;
}

export const AdminDeadlines: React.FC<AdminDeadlinesProps> = ({
  deadlines,
  onSelectProject,
  onSelectTask,
}) => {
  const [filterType, setFilterType] = useState<'all' | 'projects' | 'tasks'>('all');
  const [showOnlyOverdue, setShowOnlyOverdue] = useState(false);

  const today = deadlines?.today || new Date().toISOString().split('T')[0];

  const allItems: DeadlineItem[] = [
    ...(deadlines?.projects || []),
    ...(deadlines?.tasks || []),
  ].sort((a, b) => (a.deadline > b.deadline ? 1 : -1));

  const filteredItems = allItems.filter((item) => {
    if (filterType === 'projects' && item.item_type !== 'project') return false;
    if (filterType === 'tasks' && item.item_type !== 'task') return false;
    if (showOnlyOverdue && !item.is_overdue) return false;
    return true;
  });

  const overdueItems = allItems.filter((i) => i.is_overdue);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E8E2D8]">
        <div>
          <span className="text-xs font-semibold uppercase tracking-widest text-[#581825] block mb-1">
            Timeline Tracking
          </span>
          <h1 className="font-serif text-3xl font-normal text-[#191816] tracking-tight">
            Deadlines & Delivery Schedule
          </h1>
          <p className="text-xs text-[#6B665F] mt-1">
            Centralized calendar tracking of all project milestones and specialist task commitments.
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex items-center gap-2">
          <div className="bg-white border border-[#DDD7CD] p-1 rounded-sm flex items-center gap-1 text-xs">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1 rounded-xs font-semibold transition-colors cursor-pointer ${
                filterType === 'all'
                  ? 'bg-[#191816] text-white'
                  : 'text-[#5C5853] hover:text-[#191816]'
              }`}
            >
              All Items
            </button>
            <button
              onClick={() => setFilterType('projects')}
              className={`px-3 py-1 rounded-xs font-semibold transition-colors cursor-pointer ${
                filterType === 'projects'
                  ? 'bg-[#191816] text-white'
                  : 'text-[#5C5853] hover:text-[#191816]'
              }`}
            >
              Projects Only
            </button>
            <button
              onClick={() => setFilterType('tasks')}
              className={`px-3 py-1 rounded-xs font-semibold transition-colors cursor-pointer ${
                filterType === 'tasks'
                  ? 'bg-[#191816] text-white'
                  : 'text-[#5C5853] hover:text-[#191816]'
              }`}
            >
              Tasks Only
            </button>
          </div>

          <label className="flex items-center gap-1.5 p-2 bg-white border border-[#DDD7CD] rounded-sm text-xs cursor-pointer">
            <input
              type="checkbox"
              checked={showOnlyOverdue}
              onChange={(e) => setShowOnlyOverdue(e.target.checked)}
              className="rounded text-red-600 focus:ring-red-500 h-3.5 w-3.5"
            />
            <span
              className={`text-[11px] font-semibold ${
                showOnlyOverdue ? 'text-red-700' : 'text-[#5C5853]'
              }`}
            >
              Overdue ({overdueItems.length})
            </span>
          </label>
        </div>
      </div>

      {/* Overdue Warning Alert Box */}
      {overdueItems.length > 0 && !showOnlyOverdue && (
        <div className="p-4 bg-red-50/70 border border-red-300 rounded-sm flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="text-xs text-red-900">
            <strong className="font-semibold block mb-0.5">
              {overdueItems.length} Commitment{overdueItems.length > 1 ? 's' : ''} Past Target Date
            </strong>
            <span>
              Review overdue deliverables below and coordinate with assigned specialists to unblock or reset client expectations.
            </span>
          </div>
        </div>
      )}

      {/* Deadlines List */}
      {filteredItems.length === 0 ? (
        <div className="bg-white border border-[#E2DDD5] p-12 text-center rounded-sm">
          <CalendarDays className="w-8 h-8 text-[#8C867E] mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-[#191816]">No deadlines recorded</h3>
          <p className="text-xs text-[#6B665F] mt-1">All items are either completed or have no date set.</p>
        </div>
      ) : (
        <div className="bg-white border border-[#E2DDD5] rounded-sm shadow-2xs overflow-hidden">
          <div className="divide-y divide-[#F0EBE1]">
            {filteredItems.map((item) => {
              const isProject = item.item_type === 'project';
              const daysDiff = Math.ceil(
                (new Date(item.deadline).getTime() - new Date(today).getTime()) / (1000 * 3600 * 24)
              );

              return (
                <div
                  key={`${item.item_type}_${item.id}`}
                  className={`p-4 flex items-center justify-between gap-4 transition-colors ${
                    item.is_overdue
                      ? 'bg-red-50/40 hover:bg-red-50/80'
                      : 'hover:bg-[#FAF8F5]'
                  }`}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div
                      className={`p-2 rounded-sm shrink-0 ${
                        isProject
                          ? 'bg-[#191816] text-white'
                          : 'bg-[#581825] text-white'
                      }`}
                    >
                      {isProject ? (
                        <FolderKanban className="w-4 h-4" />
                      ) : (
                        <CheckSquare className="w-4 h-4" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-[#8C867E]">
                          {isProject ? 'Project Milestone' : 'Task Deliverable'}
                        </span>
                        {item.client_company && (
                          <span className="text-[10px] text-[#581825] font-semibold">
                            · {item.client_company}
                          </span>
                        )}
                        {item.project_name && (
                          <span className="text-[10px] text-[#581825] font-semibold truncate">
                            · {item.project_name}
                          </span>
                        )}
                      </div>

                      <h4 className="text-xs font-semibold text-[#191816] mt-0.5 truncate">
                        {item.title}
                      </h4>

                      <div className="text-[11px] text-[#8C867E] mt-1 flex items-center gap-3">
                        {item.specialist_name && (
                          <span>Assigned: <strong>{item.specialist_name}</strong></span>
                        )}
                        {item.status && <span>Status: {item.status}</span>}
                        {item.priority && <span>Priority: {item.priority}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0 text-right">
                    <div>
                      <span
                        className={`text-xs font-semibold block ${
                          item.is_overdue ? 'text-red-700' : 'text-[#191816]'
                        }`}
                      >
                        {item.deadline}
                      </span>
                      <span
                        className={`text-[10px] block font-medium ${
                          item.is_overdue
                            ? 'text-red-700 font-semibold'
                            : daysDiff === 0
                            ? 'text-[#581825] font-semibold'
                            : 'text-[#8C867E]'
                        }`}
                      >
                        {item.is_overdue
                          ? `${Math.abs(daysDiff)} day${Math.abs(daysDiff) === 1 ? '' : 's'} overdue`
                          : daysDiff === 0
                          ? 'Due today'
                          : `In ${daysDiff} day${daysDiff === 1 ? '' : 's'}`}
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        if (isProject && onSelectProject) onSelectProject(item.id);
                        if (!isProject && onSelectTask) onSelectTask(item.id);
                      }}
                      className="px-3 py-1.5 border border-[#DDD7CD] hover:border-[#191816] text-[#191816] text-xs font-semibold uppercase tracking-wider rounded-sm transition-colors cursor-pointer"
                    >
                      Inspect →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
