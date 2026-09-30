import React, { useState, useEffect } from 'react';
import {
  Search,
  Plus,
  AlertTriangle,
  Calendar,
  User2,
  MessageSquare,
  ListTodo,
  X,
  Trash2,
  Check,
  RotateCcw,
  ArrowRight,
  ArrowLeft,
  Send,
} from 'lucide-react';
import { Freelancer, Project, TaskChecklist, TaskComment, TaskItem, TaskPriority, TaskStatus } from '../../types/admin';

interface AdminKanbanProps {
  tasks: TaskItem[];
  projects: Project[];
  freelancers: Freelancer[];
  onCreateTask: (data: any) => Promise<void>;
  onUpdateTask: (id: string, data: Partial<TaskItem>) => Promise<void>;
  onApproveTask: (id: string) => Promise<void>;
  onRequestRevision: (id: string, instructions: string) => Promise<void>;
  onDeleteTask: (id: string) => Promise<void>;
  onAddChecklist: (taskId: string, title: string) => Promise<void>;
  onToggleChecklist: (taskId: string, checklistId: string, isCompleted: boolean) => Promise<void>;
  onDeleteChecklist: (taskId: string, checklistId: string) => Promise<void>;
  onAddComment: (taskId: string, content: string, isInternal: boolean) => Promise<void>;
  initialInspectingTaskId?: string | null;
  onClearInitialTask?: () => void;
}

const KANBAN_COLUMNS: { id: TaskStatus; label: string; description: string; headerColor: string }[] = [
  { id: 'Backlog', label: 'Backlog', description: 'Queued deliverables', headerColor: 'border-t-neutral-400' },
  { id: 'To Do', label: 'To Do', description: 'Ready for specialist', headerColor: 'border-t-blue-500' },
  { id: 'In Progress', label: 'In Progress', description: 'Under active execution', headerColor: 'border-t-amber-500' },
  { id: 'Needs Review', label: 'Needs Review', description: 'Awaiting agency QA', headerColor: 'border-t-[#581825]' },
  { id: 'Revisions Requested', label: 'Revisions Requested', description: 'Feedback sent back', headerColor: 'border-t-orange-600' },
  { id: 'Approved / Done', label: 'Approved / Done', description: 'Verified & completed', headerColor: 'border-t-emerald-600' },
];

export const AdminKanban: React.FC<AdminKanbanProps> = ({
  tasks,
  projects,
  freelancers,
  onCreateTask,
  onUpdateTask,
  onApproveTask,
  onRequestRevision,
  onDeleteTask,
  onAddChecklist,
  onToggleChecklist,
  onDeleteChecklist,
  onAddComment,
  initialInspectingTaskId,
  onClearInitialTask,
}) => {
  const [selectedProjectId, setSelectedProjectId] = useState<string>('ALL');
  const [selectedSpecialistId, setSelectedSpecialistId] = useState<string>('ALL');
  const [selectedPriority, setSelectedPriority] = useState<string>('ALL');
  const [onlyOverdue, setOnlyOverdue] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [inspectingTask, setInspectingTask] = useState<TaskItem | null>(null);
  const [taskChecklists, setTaskChecklists] = useState<TaskChecklist[]>([]);
  const [taskComments, setTaskComments] = useState<TaskComment[]>([]);
  const [newChecklistTitle, setNewChecklistTitle] = useState('');
  const [newCommentContent, setNewCommentContent] = useState('');

  const [revisionModalTask, setRevisionModalTask] = useState<TaskItem | null>(null);
  const [revisionInstructions, setRevisionInstructions] = useState('');

  const [isCreatingModal, setIsCreatingModal] = useState(false);
  const [createProjectId, setCreateProjectId] = useState(projects[0]?.id || '');
  const [createTitle, setCreateTitle] = useState('');
  const [createDescription, setCreateDescription] = useState('');
  const [createSpecialistId, setCreateSpecialistId] = useState('');
  const [createStatus, setCreateStatus] = useState<TaskStatus>('To Do');
  const [createPriority, setCreatePriority] = useState<TaskPriority>('Medium');
  const [createDeadline, setCreateDeadline] = useState(
    new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
  );
  const [createChecklistInput, setCreateChecklistInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialInspectingTaskId) {
      const match = tasks.find((t) => t.id === initialInspectingTaskId);
      if (match) openInspectTask(match);
      if (onClearInitialTask) onClearInitialTask();
    }
  }, [initialInspectingTaskId]);

  const openInspectTask = async (task: TaskItem) => {
    setInspectingTask(task);
    try {
      const res = await fetch(`/api/admin/tasks/${task.id}`);
      if (res.ok) {
        const data = await res.json();
        setTaskChecklists(data.checklists || []);
        setTaskComments(data.comments || []);
      }
    } catch {
      // fallback
    }
  };

  const today = new Date().toISOString().split('T')[0];
  const filteredTasks = tasks.filter((t) => {
    const matchesProject = selectedProjectId === 'ALL' || t.project_id === selectedProjectId;
    const matchesSpecialist =
      selectedSpecialistId === 'ALL' || t.assigned_freelancer_id === selectedSpecialistId;
    const matchesPriority = selectedPriority === 'ALL' || t.priority === selectedPriority;
    const isOverdue = t.deadline && t.deadline < today && t.status !== 'Approved / Done';
    const matchesOverdue = !onlyOverdue || isOverdue;
    const matchesSearch =
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.project_name && t.project_name.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesProject && matchesSpecialist && matchesPriority && matchesOverdue && matchesSearch;
  });

  const getPriorityBadge = (priority: TaskPriority) => {
    switch (priority) {
      case 'Urgent':
        return 'bg-red-700 text-white';
      case 'High':
        return 'bg-[#581825] text-white';
      case 'Medium':
        return 'bg-[#8B5E3C] text-white';
      case 'Low':
        return 'bg-[#78716C] text-white';
      default:
        return 'bg-[#E8E2D8] text-[#191816]';
    }
  };

  const handleMoveColumn = async (task: TaskItem, direction: 'prev' | 'next') => {
    const currentIndex = KANBAN_COLUMNS.findIndex((c) => c.id === task.status);
    let newIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
    if (newIndex >= 0 && newIndex < KANBAN_COLUMNS.length) {
      const nextStatus = KANBAN_COLUMNS[newIndex].id;
      await onUpdateTask(task.id, { status: nextStatus });
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const checklistsArray = createChecklistInput.split('\n').map((s) => s.trim()).filter(Boolean);
      await onCreateTask({
        project_id: createProjectId,
        title: createTitle,
        description: createDescription,
        assigned_freelancer_id: createSpecialistId || null,
        status: createStatus,
        priority: createPriority,
        deadline: createDeadline,
        checklists: checklistsArray,
      });
      setIsCreatingModal(false);
      setCreateTitle('');
      setCreateDescription('');
      setCreateChecklistInput('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddChecklistItem = async () => {
    if (!inspectingTask || !newChecklistTitle.trim()) return;
    await onAddChecklist(inspectingTask.id, newChecklistTitle.trim());
    setTaskChecklists([
      ...taskChecklists,
      {
        id: 'chk_' + Date.now(),
        task_id: inspectingTask.id,
        title: newChecklistTitle.trim(),
        is_completed: 0,
        created_at: new Date().toISOString(),
      },
    ]);
    setNewChecklistTitle('');
  };

  const handleToggleCheck = async (checklistId: string, currentVal: number) => {
    if (!inspectingTask) return;
    const newVal = currentVal === 1 ? false : true;
    await onToggleChecklist(inspectingTask.id, checklistId, newVal);
    setTaskChecklists(
      taskChecklists.map((c) => (c.id === checklistId ? { ...c, is_completed: newVal ? 1 : 0 } : c))
    );
  };

  const handleAddCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inspectingTask || !newCommentContent.trim()) return;
    await onAddComment(inspectingTask.id, newCommentContent.trim(), false);
    setTaskComments([
      ...taskComments,
      {
        id: 'com_' + Date.now(),
        task_id: inspectingTask.id,
        author_name: 'Agency Director',
        author_role: 'admin',
        author_id: 'admin',
        content: newCommentContent.trim(),
        is_internal: 0,
        created_at: new Date().toISOString(),
      },
    ]);
    setNewCommentContent('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E8E2D8]">
        <div>
          <span className="text-xs font-semibold uppercase tracking-widest text-[#581825] block mb-1">
            Task Kanban & Quality Assurance
          </span>
          <h1 className="font-serif text-3xl font-normal text-[#191816] tracking-tight">
            Agency Task Board
          </h1>
          <p className="text-xs text-[#6B665F] mt-1">
            Delivery flow across all six stages: Backlog, To Do, In Progress, Needs Review, Revisions Requested, Approved.
          </p>
        </div>

        <button
          onClick={() => {
            if (projects.length > 0 && !createProjectId) setCreateProjectId(projects[0].id);
            setIsCreatingModal(true);
          }}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#581825] hover:bg-[#3E0E18] text-white text-xs font-semibold uppercase tracking-wider rounded-sm transition-colors cursor-pointer shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Create Task</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-[#E2DDD5] p-3 rounded-sm shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-[#8C867E] text-[11px] font-semibold uppercase">Project:</span>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="px-2 py-1 bg-[#FAF8F5] border border-[#DDD7CD] rounded-sm text-xs text-[#191816] max-w-44 truncate"
            >
              <option value="ALL">All Projects ({projects.length})</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[#8C867E] text-[11px] font-semibold uppercase">Specialist:</span>
            <select
              value={selectedSpecialistId}
              onChange={(e) => setSelectedSpecialistId(e.target.value)}
              className="px-2 py-1 bg-[#FAF8F5] border border-[#DDD7CD] rounded-sm text-xs text-[#191816] max-w-40 truncate"
            >
              <option value="ALL">All Specialists</option>
              {freelancers.map((f) => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[#8C867E] text-[11px] font-semibold uppercase">Priority:</span>
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="px-2 py-1 bg-[#FAF8F5] border border-[#DDD7CD] rounded-sm text-xs text-[#191816]"
            >
              <option value="ALL">All Priorities</option>
              <option value="Urgent">Urgent</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          <label className="flex items-center gap-1.5 cursor-pointer ml-1">
            <input
              type="checkbox"
              checked={onlyOverdue}
              onChange={(e) => setOnlyOverdue(e.target.checked)}
              className="rounded text-red-600 focus:ring-red-500 h-3.5 w-3.5"
            />
            <span className={`text-[11px] font-semibold ${onlyOverdue ? 'text-red-700' : 'text-[#5C5853]'}`}>
              Overdue Only
            </span>
          </label>
        </div>

        <div className="w-full sm:w-48 relative">
          <Search className="w-3.5 h-3.5 text-[#8C867E] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Filter tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-2.5 py-1 bg-[#FAF8F5] border border-[#DDD7CD] rounded-sm text-xs text-[#191816] focus:border-[#581825] focus:outline-none"
          />
        </div>
      </div>

      {/* 6 Column Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 items-start overflow-x-auto pb-6">
        {KANBAN_COLUMNS.map((col) => {
          const colTasks = filteredTasks.filter((t) => t.status === col.id);
          const isReviewCol = col.id === 'Needs Review';

          return (
            <div
              key={col.id}
              className={`bg-[#F5F2ED] rounded-sm border border-[#E2DDD5] border-t-4 ${col.headerColor} flex flex-col min-h-[500px] shadow-2xs`}
            >
              {/* Column Header */}
              <div className="p-3 border-b border-[#E8E2D8] flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-xs text-[#191816] tracking-wide flex items-center gap-1.5">
                    <span>{col.label}</span>
                    {isReviewCol && colTasks.length > 0 && (
                      <span className="w-2 h-2 rounded-full bg-[#581825] animate-ping" />
                    )}
                  </h3>
                  <span className="text-[10px] text-[#8C867E] block">{col.description}</span>
                </div>

                <span
                  className={`text-[11px] font-bold px-1.5 py-0.2 rounded-full ${
                    isReviewCol && colTasks.length > 0 ? 'bg-[#581825] text-white' : 'bg-[#DDD7CD] text-[#191816]'
                  }`}
                >
                  {colTasks.length}
                </span>
              </div>

              {/* Tasks List */}
              <div className="p-2 space-y-2.5 flex-1 overflow-y-auto max-h-[75vh]">
                {colTasks.length === 0 ? (
                  <div className="p-4 text-center text-[#8C867E] text-[11px] italic">
                    No tasks in {col.label.toLowerCase()}
                  </div>
                ) : (
                  colTasks.map((task) => {
                    const isTaskOverdue =
                      task.deadline && task.deadline < today && task.status !== 'Approved / Done';

                    return (
                      <div
                        key={task.id}
                        className={`bg-white p-3 rounded-sm border transition-all shadow-2xs ${
                          isReviewCol
                            ? 'border-[#581825]/40 hover:border-[#581825]'
                            : isTaskOverdue
                            ? 'border-red-300 hover:border-red-500'
                            : 'border-[#DDD7CD] hover:border-[#191816]'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1 mb-1.5">
                          <span className="text-[9px] font-semibold uppercase tracking-wider text-[#8C867E] truncate max-w-[120px]">
                            {task.project_name}
                          </span>
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.2 rounded-xs uppercase tracking-wider shrink-0 ${getPriorityBadge(
                              task.priority
                            )}`}
                          >
                            {task.priority}
                          </span>
                        </div>

                        <h4
                          onClick={() => openInspectTask(task)}
                          className="font-medium text-xs text-[#191816] hover:text-[#581825] cursor-pointer line-clamp-2 mb-2 leading-snug"
                        >
                          {task.title}
                        </h4>

                        {task.status === 'Revisions Requested' && task.revision_instructions && (
                          <div className="p-1.5 bg-orange-50 border border-orange-200 text-orange-800 text-[10px] rounded-xs mb-2 line-clamp-2">
                            <strong>Note:</strong> {task.revision_instructions}
                          </div>
                        )}

                        <div className="text-[11px] text-[#6B665F] space-y-1 mb-2.5">
                          <div className="flex items-center gap-1.5 truncate">
                            <User2 className="w-3 h-3 text-[#8C867E] shrink-0" />
                            <span className="truncate">{task.assigned_specialist_name || 'Unassigned'}</span>
                          </div>

                          <div className="flex items-center justify-between text-[10px]">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-[#8C867E]" />
                              <span className={isTaskOverdue ? 'text-red-700 font-semibold' : 'text-[#8C867E]'}>
                                {task.deadline || 'No date'}
                              </span>
                            </div>

                            {task.checklist_total !== undefined && task.checklist_total > 0 && (
                              <div className="flex items-center gap-1 text-[#8C867E]">
                                <ListTodo className="w-3 h-3" />
                                <span>{task.checklist_completed}/{task.checklist_total}</span>
                              </div>
                            )}

                            {task.comment_count !== undefined && task.comment_count > 0 && (
                              <div className="flex items-center gap-1 text-[#8C867E]">
                                <MessageSquare className="w-3 h-3" />
                                <span>{task.comment_count}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Quick QA Actions for Needs Review */}
                        {isReviewCol && (
                          <div className="pt-2 border-t border-[#F0EBE1] flex items-center gap-1 mb-2">
                            <button
                              onClick={() => onApproveTask(task.id)}
                              className="flex-1 py-1 text-[10px] font-semibold bg-[#2E5E3A] hover:bg-[#204529] text-white rounded-xs transition-colors cursor-pointer inline-flex items-center justify-center gap-1"
                            >
                              <Check className="w-3 h-3" />
                              <span>Approve</span>
                            </button>
                            <button
                              onClick={() => {
                                setRevisionModalTask(task);
                                setRevisionInstructions('');
                              }}
                              className="flex-1 py-1 text-[10px] font-semibold bg-[#581825] hover:bg-[#3E0E18] text-white rounded-xs transition-colors cursor-pointer inline-flex items-center justify-center gap-1"
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span>Revisions</span>
                            </button>
                          </div>
                        )}

                        {/* Column Shifter Arrows */}
                        <div className="flex items-center justify-between text-[10px] pt-1.5 border-t border-[#F5F2ED] text-[#8C867E]">
                          <button
                            onClick={() => handleMoveColumn(task, 'prev')}
                            disabled={task.status === 'Backlog'}
                            className="p-1 hover:text-[#191816] disabled:opacity-20 cursor-pointer"
                          >
                            <ArrowLeft className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => openInspectTask(task)}
                            className="font-semibold text-[#581825] hover:underline"
                          >
                            Inspect
                          </button>
                          <button
                            onClick={() => handleMoveColumn(task, 'next')}
                            disabled={task.status === 'Approved / Done'}
                            className="p-1 hover:text-[#191816] disabled:opacity-20 cursor-pointer"
                          >
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Task Inspect & QA Modal */}
      {inspectingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white border border-[#DDD7CD] max-w-2xl w-full p-6 sm:p-8 rounded-sm shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-[#E8E2D8] mb-5">
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[#581825]">
                  {inspectingTask.project_name} · Task #{inspectingTask.id.slice(-6)}
                </span>
                <h3 className="font-serif text-2xl text-[#191816] font-normal mt-0.5">
                  {inspectingTask.title}
                </h3>
              </div>
              <button
                onClick={() => setInspectingTask(null)}
                className="p-1 text-[#8C867E] hover:text-[#191816] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#FAF8F5] p-3 rounded-sm border border-[#E8E2D8]">
                <div>
                  <label className="text-[#8C867E] text-[10px] font-semibold uppercase block">Status</label>
                  <select
                    value={inspectingTask.status}
                    onChange={(e) => {
                      const newSt = e.target.value as TaskStatus;
                      onUpdateTask(inspectingTask.id, { status: newSt }).then(() => {
                        setInspectingTask({ ...inspectingTask, status: newSt });
                      });
                    }}
                    className="w-full mt-1 font-semibold text-[#191816] bg-transparent border-b border-[#DDD7CD] focus:outline-none"
                  >
                    {KANBAN_COLUMNS.map((c) => (
                      <option key={c.id} value={c.id}>{c.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[#8C867E] text-[10px] font-semibold uppercase block">Specialist</label>
                  <select
                    value={inspectingTask.assigned_freelancer_id || ''}
                    onChange={(e) => {
                      const fid = e.target.value || null;
                      onUpdateTask(inspectingTask.id, { assigned_freelancer_id: fid }).then(() => {
                        const sp = freelancers.find((f) => f.id === fid);
                        setInspectingTask({
                          ...inspectingTask,
                          assigned_freelancer_id: fid,
                          assigned_specialist_name: sp ? sp.name : undefined,
                        });
                      });
                    }}
                    className="w-full mt-1 font-semibold text-[#191816] bg-transparent border-b border-[#DDD7CD] focus:outline-none truncate"
                  >
                    <option value="">Unassigned</option>
                    {freelancers.map((f) => (
                      <option key={f.id} value={f.id}>{f.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[#8C867E] text-[10px] font-semibold uppercase block">Priority</label>
                  <select
                    value={inspectingTask.priority}
                    onChange={(e) => {
                      const p = e.target.value as TaskPriority;
                      onUpdateTask(inspectingTask.id, { priority: p }).then(() => {
                        setInspectingTask({ ...inspectingTask, priority: p });
                      });
                    }}
                    className="w-full mt-1 font-semibold text-[#191816] bg-transparent border-b border-[#DDD7CD] focus:outline-none"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="text-[#8C867E] text-[10px] font-semibold uppercase block">Deadline</label>
                  <input
                    type="date"
                    value={inspectingTask.deadline || ''}
                    onChange={(e) => {
                      const d = e.target.value;
                      onUpdateTask(inspectingTask.id, { deadline: d }).then(() => {
                        setInspectingTask({ ...inspectingTask, deadline: d });
                      });
                    }}
                    className="w-full mt-1 font-semibold text-[#191816] bg-transparent border-b border-[#DDD7CD] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <span className="text-[#8C867E] font-medium block mb-1">Deliverable Instructions:</span>
                <p className="p-3 bg-[#FAF8F5] border border-[#E8E2D8] rounded-sm text-[#191816] leading-relaxed">
                  {inspectingTask.description || 'No specific instructions logged for this task.'}
                </p>
              </div>

              {inspectingTask.revision_instructions && (
                <div className="p-3.5 bg-orange-50/80 border border-orange-200 rounded-sm">
                  <span className="font-semibold text-orange-900 block mb-1">Agency QA Feedback:</span>
                  <p className="text-orange-900 leading-relaxed">{inspectingTask.revision_instructions}</p>
                </div>
              )}

              {/* Direct QA Approval / Revision Actions */}
              <div className="p-4 bg-[#FAF5F6] border border-[#581825]/25 rounded-sm flex items-center justify-between gap-3">
                <div>
                  <span className="font-semibold text-sm text-[#191816] block">Agency QA Verification</span>
                  <span className="text-[11px] text-[#6B665F]">Sign off on deliverable or request revisions</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setRevisionModalTask(inspectingTask);
                      setRevisionInstructions('');
                    }}
                    className="px-3.5 py-1.5 bg-[#581825] hover:bg-[#3E0E18] text-white font-semibold rounded-sm transition-colors cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Request Revision</span>
                  </button>
                  <button
                    onClick={() => {
                      onApproveTask(inspectingTask.id).then(() => {
                        setInspectingTask({ ...inspectingTask, status: 'Approved / Done' });
                      });
                    }}
                    className="px-3.5 py-1.5 bg-[#2E5E3A] hover:bg-[#204529] text-white font-semibold rounded-sm transition-colors cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Approve Task</span>
                  </button>
                </div>
              </div>

              {/* Checklists */}
              <div>
                <span className="font-semibold text-sm uppercase tracking-wider text-[#191816] block mb-2">
                  Checklist ({taskChecklists.filter((c) => c.is_completed === 1).length}/{taskChecklists.length})
                </span>
                <div className="space-y-1.5 border border-[#E8E2D8] p-3 rounded-sm bg-[#FAF8F5]">
                  {taskChecklists.map((chk) => (
                    <div key={chk.id} className="flex items-center justify-between gap-2 p-1.5 hover:bg-white rounded transition-colors">
                      <label className="flex items-center gap-2 cursor-pointer min-w-0 flex-1">
                        <input
                          type="checkbox"
                          checked={chk.is_completed === 1}
                          onChange={() => handleToggleCheck(chk.id, chk.is_completed)}
                          className="rounded text-[#581825] focus:ring-[#581825] h-3.5 w-3.5"
                        />
                        <span className={`truncate text-xs ${chk.is_completed === 1 ? 'line-through text-[#8C867E]' : 'text-[#191816]'}`}>
                          {chk.title}
                        </span>
                      </label>
                      <button
                        onClick={() => {
                          onDeleteChecklist(inspectingTask.id, chk.id).then(() => {
                            setTaskChecklists(taskChecklists.filter((c) => c.id !== chk.id));
                          });
                        }}
                        className="text-[#8C867E] hover:text-red-700 p-0.5 cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}

                  <div className="flex items-center gap-2 pt-2 border-t border-[#EAE5DC]">
                    <input
                      type="text"
                      placeholder="Add sub-task item..."
                      value={newChecklistTitle}
                      onChange={(e) => setNewChecklistTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddChecklistItem();
                        }
                      }}
                      className="flex-1 px-2.5 py-1 bg-white border border-[#DDD7CD] rounded-sm text-xs text-[#191816] focus:border-[#581825] focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleAddChecklistItem}
                      className="px-2.5 py-1 bg-[#191816] text-white rounded-sm text-xs font-semibold cursor-pointer"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>

              {/* Comments Thread */}
              <div>
                <span className="font-semibold text-sm uppercase tracking-wider text-[#191816] block mb-2">
                  QA Notes & Communication ({taskComments.length})
                </span>
                <div className="space-y-2 max-h-48 overflow-y-auto p-3 border border-[#E8E2D8] rounded-sm bg-[#FAF8F5] mb-3">
                  {taskComments.length === 0 ? (
                    <p className="text-[#8C867E] text-[11px] italic">No notes recorded.</p>
                  ) : (
                    taskComments.map((com) => (
                      <div key={com.id} className="p-2.5 rounded-sm border bg-white border-[#E2DDD5]">
                        <div className="flex items-center justify-between text-[10px] text-[#8C867E] mb-1">
                          <span className="font-semibold text-[#191816]">{com.author_name}</span>
                          <span>{new Date(com.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <p className="text-xs text-[#191816] leading-relaxed">{com.content}</p>
                      </div>
                    ))
                  )}
                </div>

                <form onSubmit={handleAddCommentSubmit} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Log QA observation or note..."
                    value={newCommentContent}
                    onChange={(e) => setNewCommentContent(e.target.value)}
                    className="flex-1 px-3 py-1.5 bg-[#FAF8F5] border border-[#DDD7CD] rounded-sm text-xs text-[#191816] focus:border-[#581825] focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="px-3.5 py-1.5 bg-[#581825] hover:bg-[#3E0E18] text-white text-xs font-semibold rounded-sm transition-colors cursor-pointer inline-flex items-center gap-1"
                  >
                    <Send className="w-3 h-3" />
                    <span>Post</span>
                  </button>
                </form>
              </div>

              <div className="pt-4 border-t border-[#E8E2D8] flex items-center justify-between">
                <button
                  onClick={() => onDeleteTask(inspectingTask.id).then(() => setInspectingTask(null))}
                  className="text-red-700 hover:text-red-900 text-xs font-medium cursor-pointer inline-flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Task</span>
                </button>
                <button
                  onClick={() => setInspectingTask(null)}
                  className="px-5 py-2 bg-[#191816] text-white text-xs font-semibold uppercase tracking-wider rounded-sm cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Revision Request Feedback Modal */}
      {revisionModalTask && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white border border-[#DDD7CD] max-w-md w-full p-6 rounded-sm shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#E8E2D8] mb-4">
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[#581825]">QA Feedback</span>
                <h3 className="font-serif text-lg text-[#191816] font-normal">Request Revisions</h3>
              </div>
              <button onClick={() => setRevisionModalTask(null)} className="p-1 text-[#8C867E] hover:text-[#191816] cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-[#5C5853] mb-3">
              Explain precisely what adjustments are needed for <strong>{revisionModalTask.title}</strong>.
            </p>
            <textarea
              rows={4}
              required
              value={revisionInstructions}
              onChange={(e) => setRevisionInstructions(e.target.value)}
              placeholder="e.g. Check mobile Safari padding, scale down drawer typography..."
              className="w-full p-2.5 bg-[#FAF8F5] border border-[#DDD7CD] rounded-sm text-xs text-[#191816] focus:border-[#581825] focus:outline-none mb-4"
            />
            <div className="flex items-center justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setRevisionModalTask(null)}
                className="px-4 py-2 border border-[#DDD7CD] hover:border-[#191816] text-[#191816] rounded-sm font-semibold uppercase tracking-wider cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!revisionInstructions.trim()}
                onClick={() => {
                  onRequestRevision(revisionModalTask.id, revisionInstructions.trim()).then(() => {
                    setRevisionModalTask(null);
                    if (inspectingTask?.id === revisionModalTask.id) {
                      setInspectingTask({
                        ...inspectingTask,
                        status: 'Revisions Requested',
                        revision_instructions: revisionInstructions.trim(),
                      });
                    }
                  });
                }}
                className="px-4 py-2 bg-[#581825] hover:bg-[#3E0E18] text-white rounded-sm font-semibold uppercase tracking-wider cursor-pointer disabled:opacity-40"
              >
                Dispatch Revisions
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Task Modal */}
      {isCreatingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white border border-[#DDD7CD] max-w-lg w-full p-6 sm:p-8 rounded-sm shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-[#E8E2D8] mb-5">
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[#581825]">Task Allocation</span>
                <h3 className="font-serif text-xl text-[#191816] font-normal">Create Deliverable Task</h3>
              </div>
              <button onClick={() => setIsCreatingModal(false)} className="p-1 text-[#8C867E] hover:text-[#191816] cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#191816] mb-1">Project *</label>
                <select
                  required
                  value={createProjectId}
                  onChange={(e) => setCreateProjectId(e.target.value)}
                  className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#DDD7CD] rounded-sm text-xs text-[#191816] focus:border-[#581825] focus:outline-none"
                >
                  <option value="">Select project...</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#191816] mb-1">Task Title *</label>
                <input
                  type="text"
                  required
                  value={createTitle}
                  onChange={(e) => setCreateTitle(e.target.value)}
                  placeholder="e.g. Implement headless Shopify checkout"
                  className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#DDD7CD] rounded-sm text-xs text-[#191816] focus:border-[#581825] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#191816] mb-1">Assign Specialist</label>
                  <select
                    value={createSpecialistId}
                    onChange={(e) => setCreateSpecialistId(e.target.value)}
                    className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#DDD7CD] rounded-sm text-xs text-[#191816] focus:border-[#581825] focus:outline-none"
                  >
                    <option value="">Unassigned</option>
                    {freelancers
                      .filter((f) => f.status === 'Approved Network Member')
                      .map((f) => (
                        <option key={f.id} value={f.id}>{f.name} ({f.primary_skill.split('/')[0].trim()})</option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#191816] mb-1">Initial Column</label>
                  <select
                    value={createStatus}
                    onChange={(e) => setCreateStatus(e.target.value as TaskStatus)}
                    className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#DDD7CD] rounded-sm text-xs text-[#191816] focus:border-[#581825] focus:outline-none"
                  >
                    <option value="Backlog">Backlog</option>
                    <option value="To Do">To Do</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Needs Review">Needs Review</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#191816] mb-1">Priority</label>
                  <select
                    value={createPriority}
                    onChange={(e) => setCreatePriority(e.target.value as TaskPriority)}
                    className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#DDD7CD] rounded-sm text-xs text-[#191816] focus:border-[#581825] focus:outline-none"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#191816] mb-1">Target Deadline</label>
                  <input
                    type="date"
                    value={createDeadline}
                    onChange={(e) => setCreateDeadline(e.target.value)}
                    className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#DDD7CD] rounded-sm text-xs text-[#191816] focus:border-[#581825] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#191816] mb-1">Deliverable Instructions</label>
                <textarea
                  rows={3}
                  value={createDescription}
                  onChange={(e) => setCreateDescription(e.target.value)}
                  placeholder="Detailed criteria, design references, edge cases..."
                  className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#DDD7CD] rounded-sm text-xs text-[#191816] focus:border-[#581825] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#191816] mb-1">Sub-tasks / Checklists (one per line)</label>
                <textarea
                  rows={2}
                  value={createChecklistInput}
                  onChange={(e) => setCreateChecklistInput(e.target.value)}
                  placeholder="Check Apple Pay registration&#10;Verify mobile responsiveness"
                  className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#DDD7CD] rounded-sm text-xs text-[#191816] focus:border-[#581825] focus:outline-none font-mono"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreatingModal(false)}
                  className="px-4 py-2 border border-[#DDD7CD] hover:border-[#191816] text-[#191816] text-xs font-semibold uppercase tracking-wider rounded-sm transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-[#581825] hover:bg-[#3E0E18] text-white text-xs font-semibold uppercase tracking-wider rounded-sm transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Creating...' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
