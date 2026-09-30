import React, { useState } from 'react';
import {
  FolderKanban,
  Search,
  Plus,
  AlertTriangle,
  X,
  Trash2,
} from 'lucide-react';
import { Client, Freelancer, Project, ProjectSpecialistLink, ProjectStatus, TaskItem } from '../../types/admin';

interface AdminProjectsProps {
  projects: Project[];
  clients: Client[];
  freelancers: Freelancer[];
  tasks: TaskItem[];
  onCreateProject: (data: any) => Promise<void>;
  onUpdateProject: (id: string, data: Partial<Project>) => Promise<void>;
  onDeleteProject: (id: string) => Promise<void>;
  onAssignSpecialistToProject: (projectId: string, specialistId: string, role?: string) => Promise<void>;
  onRemoveSpecialistFromProject: (projectId: string, specialistId: string) => Promise<void>;
  onSelectTask?: (taskId: string) => void;
  onOpenNewTaskForProject?: (projectId: string) => void;
}

export const AdminProjects: React.FC<AdminProjectsProps> = ({
  projects,
  clients,
  freelancers,
  tasks,
  onCreateProject,
  onUpdateProject,
  onDeleteProject,
  onAssignSpecialistToProject,
  onRemoveSpecialistFromProject,
  onSelectTask,
  onOpenNewTaskForProject,
}) => {
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [inspectingProject, setInspectingProject] = useState<Project | null>(null);
  const [isCreatingModal, setIsCreatingModal] = useState(false);

  const [name, setName] = useState('');
  const [clientId, setClientId] = useState('');
  const [description, setDescription] = useState('');
  const [services, setServices] = useState('Web Development');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [deadline, setDeadline] = useState(
    new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]
  );
  const [budgetValue, setBudgetValue] = useState('$15,000');
  const [status, setStatus] = useState<ProjectStatus>('Planning');
  const [internalNotes, setInternalNotes] = useState('');
  const [clientNotes, setClientNotes] = useState('');
  const [selectedSpecialistIds, setSelectedSpecialistIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [assigningSpecialistId, setAssigningSpecialistId] = useState('');
  const [assigningRole, setAssigningRole] = useState('Contributor');

  const filteredProjects = projects.filter((p) => {
    const matchesStatus = selectedStatus === 'ALL' || p.status === selectedStatus;
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.client_company && p.client_company.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.services && p.services.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesStatus && matchesSearch;
  });

  const getStatusBadge = (st: ProjectStatus) => {
    switch (st) {
      case 'Planning':
        return 'bg-[#2B2824] text-white';
      case 'In Progress':
        return 'bg-[#1E3A8A] text-white';
      case 'Review':
        return 'bg-[#581825] text-white';
      case 'Completed':
        return 'bg-[#2E5E3A] text-white';
      case 'On Hold':
        return 'bg-[#D97706] text-white';
      case 'Cancelled':
        return 'bg-neutral-600 text-white';
      default:
        return 'bg-neutral-200 text-neutral-800';
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onCreateProject({
        name,
        client_id: clientId || null,
        description,
        services,
        start_date: startDate,
        deadline,
        budget_value: budgetValue,
        status,
        internal_notes: internalNotes,
        client_notes: clientNotes,
        freelancer_ids: selectedSpecialistIds,
      });
      setIsCreatingModal(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getProjectTasks = (projectId: string) => {
    return tasks.filter((t) => t.project_id === projectId);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E8E2D8]">
        <div>
          <span className="text-xs font-semibold uppercase tracking-widest text-[#581825] block mb-1">
            Delivery Pipelines
          </span>
          <h1 className="font-serif text-3xl font-normal text-[#191816] tracking-tight">
            Client Projects
          </h1>
          <p className="text-xs text-[#6B665F] mt-1">
            Active client engagements, assigned specialists, delivery progress, and deadlines.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-full sm:w-64 relative">
            <Search className="w-4 h-4 text-[#8C867E] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white border border-[#DDD7CD] rounded-sm text-xs text-[#191816] focus:border-[#581825] focus:outline-none"
            />
          </div>

          <button
            onClick={() => {
              if (clients.length > 0 && !clientId) setClientId(clients[0].id);
              setIsCreatingModal(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#581825] hover:bg-[#3E0E18] text-white text-xs font-semibold uppercase tracking-wider rounded-sm transition-colors cursor-pointer shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Project</span>
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-[#E8E2D8] pb-3 text-xs">
        {['ALL', 'Planning', 'In Progress', 'Review', 'Completed', 'On Hold'].map((st) => {
          const count = st === 'ALL' ? projects.length : projects.filter((p) => p.status === st).length;
          return (
            <button
              key={st}
              onClick={() => setSelectedStatus(st)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm font-semibold tracking-wide transition-colors cursor-pointer ${
                selectedStatus === st
                  ? 'bg-[#191816] text-white'
                  : 'bg-white border border-[#E2DDD5] text-[#5C5853] hover:text-[#191816]'
              }`}
            >
              <span>{st === 'ALL' ? 'All Projects' : st}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  selectedStatus === st ? 'bg-white/20 text-white' : 'bg-[#F0EBE1] text-[#5C5853]'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {filteredProjects.length === 0 ? (
        <div className="bg-white border border-[#E2DDD5] p-12 text-center rounded-sm">
          <FolderKanban className="w-8 h-8 text-[#8C867E] mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-[#191816]">No projects found</h3>
          <p className="text-xs text-[#6B665F] mt-1">
            {searchQuery ? 'Try adjusting your search.' : 'Create a new project to start delivery.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProjects.map((prj) => {
            const prjTasks = getProjectTasks(prj.id);
            const completedCount = prjTasks.filter((t) => t.status === 'Approved / Done').length;
            const reviewCount = prjTasks.filter((t) => t.status === 'Needs Review').length;
            const isOverdue = prj.deadline && new Date(prj.deadline) < new Date() && prj.status !== 'Completed';

            return (
              <div
                key={prj.id}
                className="bg-white border border-[#E2DDD5] p-5 rounded-sm hover:border-[#581825] transition-all flex flex-col justify-between shadow-2xs group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-[#8C867E]">
                        {prj.client_company || prj.client_name || 'Direct Client'}
                      </span>
                      <h3 className="text-base font-semibold text-[#191816] leading-tight mt-0.5">
                        {prj.name}
                      </h3>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-sm shrink-0 ${getStatusBadge(
                        prj.status
                      )}`}
                    >
                      {prj.status}
                    </span>
                  </div>

                  {prj.services && (
                    <div className="text-[11px] text-[#581825] font-medium mb-3">
                      {prj.services}
                    </div>
                  )}

                  {prj.description && (
                    <p className="text-xs text-[#5C5853] line-clamp-2 leading-relaxed mb-4">
                      {prj.description}
                    </p>
                  )}

                  <div className="mb-4">
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-[#8C867E] block mb-1">
                      Specialists ({prj.specialists?.length || 0}):
                    </span>
                    {prj.specialists && prj.specialists.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {prj.specialists.map((s: ProjectSpecialistLink) => (
                          <span
                            key={s.id}
                            className="text-[10px] px-2 py-0.5 bg-[#FAF8F5] border border-[#DDD7CD] rounded-sm text-[#191816]"
                          >
                            {s.name}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-[11px] text-[#8C867E] italic">
                        No specialists assigned yet
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <div className="pt-3 border-t border-[#F0EBE1] text-xs space-y-2 mb-4">
                    <div className="flex items-center justify-between text-[#5C5853]">
                      <span>Progress:</span>
                      <span className="font-semibold text-[#191816]">
                        {completedCount}/{prjTasks.length} Done
                        {reviewCount > 0 && (
                          <span className="text-[#581825] ml-1.5">({reviewCount} in QA)</span>
                        )}
                      </span>
                    </div>

                    <div className="w-full bg-[#EAE5DC] h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-[#581825] h-full transition-all"
                        style={{
                          width: `${prjTasks.length > 0 ? (completedCount / prjTasks.length) * 100 : 0}%`,
                        }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] pt-1">
                      <span className="text-[#8C867E]">Budget: {prj.budget_value || 'TBD'}</span>
                      <div className="flex items-center gap-1">
                        <span
                          className={`font-semibold ${
                            isOverdue ? 'text-red-700' : 'text-[#191816]'
                          }`}
                        >
                          Due: {prj.deadline || 'Ongoing'}
                        </span>
                        {isOverdue && <AlertTriangle className="w-3 h-3 text-red-600" />}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setInspectingProject(prj)}
                      className="flex-1 py-1.5 text-xs font-semibold uppercase tracking-wider border border-[#DDD7CD] hover:border-[#191816] text-[#191816] rounded-sm transition-colors cursor-pointer text-center"
                    >
                      Project Hub
                    </button>
                    {onOpenNewTaskForProject && (
                      <button
                        onClick={() => onOpenNewTaskForProject(prj.id)}
                        className="py-1.5 px-2.5 text-xs font-semibold bg-[#FAF8F5] hover:bg-[#581825] hover:text-white border border-[#DDD7CD] text-[#191816] rounded-sm transition-colors cursor-pointer"
                        title="Add task"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {inspectingProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white border border-[#DDD7CD] max-w-3xl w-full p-6 sm:p-8 rounded-sm shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-[#E8E2D8] mb-6">
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[#581825]">
                  Project Command
                </span>
                <h3 className="font-serif text-2xl text-[#191816] font-normal">
                  {inspectingProject.name}
                </h3>
                <span className="text-xs text-[#8C867E]">
                  Client: {inspectingProject.client_company || inspectingProject.client_name || 'N/A'} · Budget: {inspectingProject.budget_value || 'TBD'}
                </span>
              </div>
              <button
                onClick={() => setInspectingProject(null)}
                className="p-1 text-[#8C867E] hover:text-[#191816] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#FAF8F5] p-3.5 rounded-sm border border-[#E8E2D8]">
                <div>
                  <span className="text-[#8C867E] font-medium block">Status:</span>
                  <select
                    value={inspectingProject.status}
                    onChange={(e) =>
                      onUpdateProject(inspectingProject.id, {
                        status: e.target.value as ProjectStatus,
                      }).then(() =>
                        setInspectingProject({
                          ...inspectingProject,
                          status: e.target.value as ProjectStatus,
                        })
                      )
                    }
                    className="font-semibold text-[#191816] bg-transparent border-b border-[#DDD7CD] focus:outline-none"
                  >
                    <option value="Planning">Planning</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Review">Review</option>
                    <option value="Completed">Completed</option>
                    <option value="On Hold">On Hold</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
                <div>
                  <span className="text-[#8C867E] font-medium block">Start Date:</span>
                  <span className="font-semibold text-[#191816]">
                    {inspectingProject.start_date || 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-[#8C867E] font-medium block">Target Deadline:</span>
                  <span className="font-semibold text-[#191816]">
                    {inspectingProject.deadline || 'Ongoing'}
                  </span>
                </div>
                <div>
                  <span className="text-[#8C867E] font-medium block">Engagement Value:</span>
                  <span className="font-semibold text-[#191816]">
                    {inspectingProject.budget_value || 'TBD'}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-[#8C867E] font-medium block mb-1">Project Brief & Scope:</span>
                <p className="p-3 bg-[#FAF8F5] border border-[#E8E2D8] rounded-sm text-[#191816] leading-relaxed">
                  {inspectingProject.description || 'No description provided.'}
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-sm uppercase tracking-wider text-[#191816] mb-2">
                  Assigned Independent Specialists
                </h4>

                <div className="p-3 bg-[#FAF8F5] border border-[#E8E2D8] rounded-sm space-y-3">
                  {inspectingProject.specialists && inspectingProject.specialists.length > 0 ? (
                    <div className="divide-y divide-[#EAE5DC]">
                      {inspectingProject.specialists.map((spc: ProjectSpecialistLink) => (
                        <div key={spc.id} className="py-2 flex items-center justify-between">
                          <div>
                            <span className="font-semibold text-[#191816] block">{spc.name}</span>
                            <span className="text-[11px] text-[#8C867E]">
                              {spc.primary_skill} · Role: {spc.role_in_project || 'Contributor'}
                            </span>
                          </div>
                          <button
                            onClick={() =>
                              onRemoveSpecialistFromProject(inspectingProject.id, spc.id).then(() => {
                                setInspectingProject({
                                  ...inspectingProject,
                                  specialists: inspectingProject.specialists?.filter(
                                    (s: ProjectSpecialistLink) => s.id !== spc.id
                                  ),
                                });
                              })
                            }
                            className="text-xs text-red-700 hover:underline cursor-pointer"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-[#8C867E]">No specialists assigned yet.</p>
                  )}

                  <div className="pt-2 border-t border-[#EAE5DC] flex items-center gap-2">
                    <select
                      value={assigningSpecialistId}
                      onChange={(e) => setAssigningSpecialistId(e.target.value)}
                      className="flex-1 px-2.5 py-1.5 bg-white border border-[#DDD7CD] rounded-sm text-xs text-[#191816]"
                    >
                      <option value="">Select approved specialist to assign...</option>
                      {freelancers
                        .filter(
                          (f) =>
                            f.status === 'Approved Network Member' &&
                            !inspectingProject.specialists?.some((s: ProjectSpecialistLink) => s.id === f.id)
                        )
                        .map((f) => (
                          <option key={f.id} value={f.id}>
                            {f.name} ({f.primary_skill})
                          </option>
                        ))}
                    </select>
                    <input
                      type="text"
                      placeholder="Role (e.g. Lead Dev)"
                      value={assigningRole}
                      onChange={(e) => setAssigningRole(e.target.value)}
                      className="w-32 px-2.5 py-1.5 bg-white border border-[#DDD7CD] rounded-sm text-xs text-[#191816]"
                    />
                    <button
                      type="button"
                      disabled={!assigningSpecialistId}
                      onClick={() => {
                        if (!assigningSpecialistId) return;
                        const spcObj = freelancers.find((f) => f.id === assigningSpecialistId);
                        onAssignSpecialistToProject(
                          inspectingProject.id,
                          assigningSpecialistId,
                          assigningRole
                        ).then(() => {
                          if (spcObj) {
                            setInspectingProject({
                              ...inspectingProject,
                              specialists: [
                                ...(inspectingProject.specialists || []),
                                {
                                  id: spcObj.id,
                                  name: spcObj.name,
                                  primary_skill: spcObj.primary_skill,
                                  role_in_project: assigningRole,
                                },
                              ],
                            });
                          }
                          setAssigningSpecialistId('');
                        });
                      }}
                      className="px-3 py-1.5 bg-[#581825] hover:bg-[#3E0E18] text-white text-xs font-semibold rounded-sm transition-colors cursor-pointer disabled:opacity-40"
                    >
                      Assign
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-sm uppercase tracking-wider text-[#191816]">
                    Project Tasks ({getProjectTasks(inspectingProject.id).length})
                  </h4>
                  {onOpenNewTaskForProject && (
                    <button
                      onClick={() => onOpenNewTaskForProject(inspectingProject.id)}
                      className="text-xs font-semibold text-[#581825] hover:underline inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Add Task</span>
                    </button>
                  )}
                </div>

                <div className="divide-y divide-[#EAE5DC] border border-[#E8E2D8] rounded-sm">
                  {getProjectTasks(inspectingProject.id).map((t) => (
                    <div
                      key={t.id}
                      className="p-3 flex items-center justify-between hover:bg-[#FAF8F5] transition-colors"
                    >
                      <div>
                        <span className="font-semibold text-[#191816] text-xs block">{t.title}</span>
                        <span className="text-[11px] text-[#8C867E]">
                          Assigned: {t.assigned_specialist_name || 'Unassigned'} · Due: {t.deadline || 'None'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-sm ${
                            t.status === 'Needs Review'
                              ? 'bg-[#581825] text-white animate-pulse'
                              : 'bg-[#FAF8F5] border border-[#DDD7CD] text-[#191816]'
                          }`}
                        >
                          {t.status}
                        </span>
                        {onSelectTask && (
                          <button
                            onClick={() => {
                              onSelectTask(t.id);
                              setInspectingProject(null);
                            }}
                            className="text-xs font-semibold text-[#581825] hover:underline"
                          >
                            Inspect →
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <span className="text-[#8C867E] font-medium block mb-1">
                    Internal Agency Notes (Private):
                  </span>
                  <textarea
                    rows={3}
                    defaultValue={inspectingProject.internal_notes || ''}
                    onBlur={(e) =>
                      onUpdateProject(inspectingProject.id, { internal_notes: e.target.value })
                    }
                    className="w-full p-2.5 bg-[#FAF8F5] border border-[#DDD7CD] rounded-sm text-xs text-[#191816] focus:border-[#581825] focus:outline-none"
                  />
                </div>
                <div>
                  <span className="text-[#8C867E] font-medium block mb-1">
                    Client-Facing Summary Notes:
                  </span>
                  <textarea
                    rows={3}
                    defaultValue={inspectingProject.client_notes || ''}
                    onBlur={(e) =>
                      onUpdateProject(inspectingProject.id, { client_notes: e.target.value })
                    }
                    className="w-full p-2.5 bg-[#FAF8F5] border border-[#DDD7CD] rounded-sm text-xs text-[#191816] focus:border-[#581825] focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-[#E8E2D8] flex items-center justify-between">
                <button
                  onClick={() =>
                    onDeleteProject(inspectingProject.id).then(() => setInspectingProject(null))
                  }
                  className="text-red-700 hover:text-red-900 text-xs font-medium cursor-pointer inline-flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Project</span>
                </button>

                <button
                  onClick={() => setInspectingProject(null)}
                  className="px-5 py-2 bg-[#191816] text-white text-xs font-semibold uppercase tracking-wider rounded-sm cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isCreatingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white border border-[#DDD7CD] max-w-xl w-full p-6 sm:p-8 rounded-sm shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-[#E8E2D8] mb-5">
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[#581825]">
                  Agency Pipeline
                </span>
                <h3 className="font-serif text-xl text-[#191816] font-normal">
                  Initiate Client Project
                </h3>
              </div>
              <button onClick={() => setIsCreatingModal(false)} className="p-1 text-[#8C867E] hover:text-[#191816] cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#191816] mb-1">
                  Project Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Aura Fine Ceramics eCommerce"
                  className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#DDD7CD] rounded-sm text-xs text-[#191816] focus:border-[#581825] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#191816] mb-1">
                    Client Organization *
                  </label>
                  <select
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                    className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#DDD7CD] rounded-sm text-xs text-[#191816] focus:border-[#581825] focus:outline-none"
                  >
                    <option value="">Select client...</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.company ? `${c.company} (${c.name})` : c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#191816] mb-1">
                    Initial Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as ProjectStatus)}
                    className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#DDD7CD] rounded-sm text-xs text-[#191816] focus:border-[#581825] focus:outline-none"
                  >
                    <option value="Planning">Planning</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Review">Review</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#191816] mb-1">
                  Services Involved
                </label>
                <input
                  type="text"
                  value={services}
                  onChange={(e) => setServices(e.target.value)}
                  placeholder="Web Development, UI/UX Design"
                  className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#DDD7CD] rounded-sm text-xs text-[#191816] focus:border-[#581825] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#191816] mb-1">
                    Budget Value
                  </label>
                  <input
                    type="text"
                    value={budgetValue}
                    onChange={(e) => setBudgetValue(e.target.value)}
                    placeholder="$15,000"
                    className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#DDD7CD] rounded-sm text-xs text-[#191816] focus:border-[#581825] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#191816] mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#DDD7CD] rounded-sm text-xs text-[#191816] focus:border-[#581825] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#191816] mb-1">
                    Deadline
                  </label>
                  <input
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#DDD7CD] rounded-sm text-xs text-[#191816] focus:border-[#581825] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#191816] mb-1">
                  Project Description / Brief
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Key objectives, deliverables, brand requirements..."
                  className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#DDD7CD] rounded-sm text-xs text-[#191816] focus:border-[#581825] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#191816] mb-1">
                  Assign Specialists (Approved Members)
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto p-2 bg-[#FAF8F5] border border-[#DDD7CD] rounded-sm">
                  {freelancers
                    .filter((f) => f.status === 'Approved Network Member')
                    .map((f) => (
                      <label key={f.id} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedSpecialistIds.includes(f.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedSpecialistIds([...selectedSpecialistIds, f.id]);
                            } else {
                              setSelectedSpecialistIds(
                                selectedSpecialistIds.filter((id) => id !== f.id)
                              );
                            }
                          }}
                          className="rounded text-[#581825] focus:ring-[#581825] h-3.5 w-3.5"
                        />
                        <span className="truncate">{f.name}</span>
                      </label>
                    ))}
                </div>
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
                  {isSubmitting ? 'Creating...' : 'Initiate Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
