import React, { useState } from 'react';
import {
  Inbox,
  Search,
  Building,
  UserCheck,
  Archive,
  Trash2,
  X,
  ExternalLink,
  FileText,
  Clock,
  CheckCircle2,
  DollarSign,
  Users2,
  ListTodo,
  Save,
} from 'lucide-react';
import { Lead, LeadStatus, Freelancer } from '../../types/admin';

interface AdminLeadsProps {
  leads: Lead[];
  freelancers?: Freelancer[];
  onUpdateLeadStatus: (leadId: string, status: LeadStatus) => Promise<void>;
  onUpdateLeadNotes: (leadId: string, notes: string) => Promise<void>;
  onConvertLead: (
    leadId: string,
    options: {
      createProject: boolean;
      projectName?: string;
      budget?: string;
      deadline?: string;
      specialistIds?: string[];
      initialTasks?: string[];
      status?: string;
    }
  ) => Promise<void>;
  onArchiveLead: (leadId: string) => Promise<void>;
  onDeleteLead: (leadId: string) => Promise<void>;
}

export const AdminLeads: React.FC<AdminLeadsProps> = ({
  leads,
  freelancers = [],
  onUpdateLeadStatus,
  onUpdateLeadNotes,
  onConvertLead,
  onArchiveLead,
  onDeleteLead,
}) => {
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [inspectingLead, setInspectingLead] = useState<Lead | null>(null);
  const [inspectingNotes, setInspectingNotes] = useState('');
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [notesSaveNotice, setNotesSaveNotice] = useState(false);

  // Conversion Modal State
  const [convertingLead, setConvertingLead] = useState<Lead | null>(null);
  const [createProject, setCreateProject] = useState(true);
  const [projectName, setProjectName] = useState('');
  const [projectBudget, setProjectBudget] = useState('');
  const [projectDeadline, setProjectDeadline] = useState('');
  const [selectedSpecialistIds, setSelectedSpecialistIds] = useState<string[]>([]);
  const [initialTasksInput, setInitialTasksInput] = useState(
    'Discovery brief & technical scope confirmation\nDesign architecture & editorial layout\nDeliverable execution & QA review\nFinal review & client handover'
  );
  const [isSubmittingConvert, setIsSubmittingConvert] = useState(false);

  const statusOptions: { label: string; value: string; count: number }[] = [
    { label: 'All Quotes', value: 'ALL', count: leads.length },
    { label: 'New', value: 'New', count: leads.filter((l) => l.status === 'New').length },
    { label: 'Reviewing', value: 'Reviewing', count: leads.filter((l) => l.status === 'Reviewing' || l.status === 'Contacted' || l.status === 'In Discussion').length },
    { label: 'Accepted', value: 'Accepted', count: leads.filter((l) => l.status === 'Accepted' || l.status === 'Converted').length },
    { label: 'Rejected', value: 'Rejected', count: leads.filter((l) => l.status === 'Rejected').length },
    { label: 'Archived', value: 'Archived', count: leads.filter((l) => l.status === 'Archived').length },
  ];

  const filteredLeads = leads.filter((l) => {
    let matchesStatus = true;
    if (selectedStatus === 'Reviewing') {
      matchesStatus = l.status === 'Reviewing' || l.status === 'Contacted' || l.status === 'In Discussion';
    } else if (selectedStatus === 'Accepted') {
      matchesStatus = l.status === 'Accepted' || l.status === 'Converted';
    } else if (selectedStatus !== 'ALL') {
      matchesStatus = l.status === selectedStatus;
    }

    const matchesSearch =
      l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (l.company && l.company.toLowerCase().includes(searchQuery.toLowerCase())) ||
      l.service.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (l.project_details && l.project_details.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesStatus && matchesSearch;
  });

  const handleOpenInspect = (lead: Lead) => {
    setInspectingLead(lead);
    setInspectingNotes(lead.internal_notes || '');
    setNotesSaveNotice(false);
  };

  const handleSaveNotes = async () => {
    if (!inspectingLead) return;
    setIsSavingNotes(true);
    try {
      await onUpdateLeadNotes(inspectingLead.id, inspectingNotes);
      setInspectingLead({ ...inspectingLead, internal_notes: inspectingNotes });
      setNotesSaveNotice(true);
      setTimeout(() => setNotesSaveNotice(false), 3000);
    } finally {
      setIsSavingNotes(false);
    }
  };

  const handleOpenConvertModal = (lead: Lead) => {
    setConvertingLead(lead);
    setProjectName(`${lead.company || lead.name} — ${lead.service}`);
    setProjectBudget(lead.budget_range || '$15,000');
    const date30 = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];
    setProjectDeadline(date30);
    setSelectedSpecialistIds([]);
  };

  const toggleSpecialistSelection = (id: string) => {
    setSelectedSpecialistIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleExecuteConvert = async () => {
    if (!convertingLead) return;
    setIsSubmittingConvert(true);
    try {
      const initialTasks = initialTasksInput
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);

      await onConvertLead(convertingLead.id, {
        createProject,
        projectName: createProject ? projectName : undefined,
        budget: createProject ? projectBudget : undefined,
        deadline: createProject ? projectDeadline : undefined,
        specialistIds: selectedSpecialistIds,
        initialTasks,
        status: 'Accepted',
      });

      setConvertingLead(null);
      if (inspectingLead?.id === convertingLead.id) {
        setInspectingLead({ ...inspectingLead, status: 'Accepted' });
      }
    } finally {
      setIsSubmittingConvert(false);
    }
  };

  const getStatusBadge = (status: LeadStatus) => {
    switch (status) {
      case 'New':
        return 'bg-[#581825] text-white';
      case 'Reviewing':
      case 'Contacted':
      case 'In Discussion':
        return 'bg-[#1E3A8A] text-white';
      case 'Accepted':
      case 'Converted':
        return 'bg-[#2E5E3A] text-white';
      case 'Rejected':
        return 'bg-red-800 text-white';
      case 'Archived':
        return 'bg-[#78716C] text-white';
      default:
        return 'bg-[#E8E2D8] text-[#191816]';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E8E2D8]">
        <div>
          <span className="text-xs font-semibold uppercase tracking-widest text-[#581825] block mb-1">
            Primary Intake Flow
          </span>
          <h1 className="font-serif text-3xl font-normal text-[#191816] tracking-tight">
            Quotes / Leads
          </h1>
          <p className="text-xs text-[#6B665F] mt-1">
            Review prospective client project briefs, manage quote status, add internal notes, and convert accepted inquiries into active projects.
          </p>
        </div>

        <div className="w-full sm:w-72 relative">
          <Search className="w-4 h-4 text-[#8C867E] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search client brief or company..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white border border-[#DDD7CD] rounded-sm text-xs text-[#191816] focus:border-[#581825] focus:outline-none"
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-[#E8E2D8] pb-3">
        {statusOptions.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setSelectedStatus(opt.value)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-xs font-semibold tracking-wide transition-colors cursor-pointer ${
              selectedStatus === opt.value
                ? 'bg-[#191816] text-white'
                : 'bg-white border border-[#E2DDD5] text-[#5C5853] hover:text-[#191816]'
            }`}
          >
            <span>{opt.label}</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                selectedStatus === opt.value
                  ? 'bg-white/20 text-white'
                  : 'bg-[#F0EBE1] text-[#5C5853]'
              }`}
            >
              {opt.count}
            </span>
          </button>
        ))}
      </div>

      {/* Leads Table */}
      {filteredLeads.length === 0 ? (
        <div className="bg-white border border-[#E2DDD5] p-12 text-center rounded-sm">
          <Inbox className="w-8 h-8 text-[#8C867E] mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-[#191816]">No client inquiries found</h3>
          <p className="text-xs text-[#6B665F] mt-1">
            {searchQuery ? 'Try adjusting your search criteria.' : 'No quotes match this status filter.'}
          </p>
        </div>
      ) : (
        <div className="bg-white border border-[#E2DDD5] rounded-sm shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#FAF8F5] border-b border-[#E8E2D8] text-[#5C5853] uppercase font-semibold text-[10px] tracking-wider">
                  <th className="py-3 px-4">Client & Organization</th>
                  <th className="py-3 px-4">Requested Service & Scope</th>
                  <th className="py-3 px-4">Budget & Timeline</th>
                  <th className="py-3 px-4">Submission Date</th>
                  <th className="py-3 px-4">Quote Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0EBE1]">
                {filteredLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-[#FAF8F5]/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-[#191816] text-xs flex items-center gap-1.5">
                        <span>{lead.name}</span>
                        {lead.internal_notes && (
                          <span
                            title="Internal notes recorded"
                            className="w-1.5 h-1.5 bg-[#581825] rounded-full inline-block"
                          />
                        )}
                      </div>
                      <div className="text-[#6B665F] text-[11px] flex items-center gap-1 mt-0.5">
                        <Building className="w-3 h-3 text-[#8C867E]" />
                        <span>{lead.company || 'Direct Client'}</span>
                      </div>
                      <a
                        href={`mailto:${lead.email}`}
                        className="text-[#581825] hover:underline text-[11px] block mt-0.5"
                      >
                        {lead.email}
                      </a>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-medium text-[#191816] block">{lead.service}</span>
                      {lead.project_details && (
                        <p className="text-[#6B665F] text-[11px] line-clamp-1 max-w-xs mt-0.5">
                          {lead.project_details}
                        </p>
                      )}
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="text-[#191816] font-medium">{lead.budget_range || 'Flexible'}</div>
                      <div className="text-[#8C867E] text-[11px]">{lead.timeline || 'Standard timeline'}</div>
                    </td>

                    <td className="py-3.5 px-4 text-[#8C867E] whitespace-nowrap">
                      <div className="flex items-center gap-1 text-[11px]">
                        <Clock className="w-3 h-3 text-[#8C867E]" />
                        <span>{new Date(lead.created_at).toLocaleDateString()}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <select
                        value={lead.status}
                        onChange={(e) => onUpdateLeadStatus(lead.id, e.target.value as LeadStatus)}
                        className={`text-[11px] font-semibold px-2 py-1 rounded-sm border-none focus:ring-1 focus:ring-[#581825] cursor-pointer ${getStatusBadge(
                          lead.status
                        )}`}
                      >
                        <option value="New" className="bg-white text-black">New</option>
                        <option value="Reviewing" className="bg-white text-black">Reviewing</option>
                        <option value="Accepted" className="bg-white text-black">Accepted</option>
                        <option value="Rejected" className="bg-white text-black">Rejected</option>
                        <option value="Archived" className="bg-white text-black">Archived</option>
                      </select>
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenInspect(lead)}
                          className="px-2.5 py-1 text-[11px] font-medium border border-[#DDD7CD] hover:border-[#191816] text-[#191816] rounded-sm transition-colors cursor-pointer"
                        >
                          Review Brief
                        </button>

                        {lead.status !== 'Accepted' && lead.status !== 'Converted' && (
                          <button
                            onClick={() => handleOpenConvertModal(lead)}
                            className="px-2.5 py-1 text-[11px] font-semibold bg-[#2E5E3A] hover:bg-[#204529] text-white rounded-sm transition-colors cursor-pointer inline-flex items-center gap-1"
                          >
                            <UserCheck className="w-3 h-3" />
                            <span>Convert</span>
                          </button>
                        )}

                        <button
                          onClick={() => onArchiveLead(lead.id)}
                          title="Archive Quote"
                          className="p-1 text-[#8C867E] hover:text-[#191816] transition-colors cursor-pointer"
                        >
                          <Archive className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Complete Inquiry Review Drawer / Modal */}
      {inspectingLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white border border-[#DDD7CD] max-w-2xl w-full p-6 sm:p-8 rounded-sm shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-[#E8E2D8] mb-6">
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[#581825]">
                  Client Inquiry Brief · ID: {inspectingLead.id}
                </span>
                <h3 className="font-serif text-2xl text-[#191816] font-normal">
                  {inspectingLead.name}
                </h3>
              </div>
              <button
                onClick={() => setInspectingLead(null)}
                className="p-1 text-[#8C867E] hover:text-[#191816] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-5 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#FAF8F5] p-4 rounded-sm border border-[#E8E2D8]">
                <div>
                  <span className="text-[#8C867E] font-medium block">Company:</span>
                  <span className="text-[#191816] font-semibold">
                    {inspectingLead.company || 'Direct Client'}
                  </span>
                </div>
                <div>
                  <span className="text-[#8C867E] font-medium block">Email:</span>
                  <a href={`mailto:${inspectingLead.email}`} className="text-[#581825] font-semibold hover:underline">
                    {inspectingLead.email}
                  </a>
                </div>
                <div>
                  <span className="text-[#8C867E] font-medium block">Service:</span>
                  <span className="text-[#191816] font-semibold">{inspectingLead.service}</span>
                </div>
                <div>
                  <span className="text-[#8C867E] font-medium block">Budget:</span>
                  <span className="text-[#191816] font-semibold">{inspectingLead.budget_range || 'Flexible'}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-[#FAF8F5] p-3 rounded-sm border border-[#E8E2D8]">
                <div>
                  <span className="text-[#8C867E] font-medium block">Timeline:</span>
                  <span className="text-[#191816] font-medium">{inspectingLead.timeline || 'Standard timeline'}</span>
                </div>
                <div>
                  <span className="text-[#8C867E] font-medium block">Submitted Date & Time:</span>
                  <span className="text-[#191816] font-mono text-[11px]">
                    {new Date(inspectingLead.created_at).toLocaleString()}
                  </span>
                </div>
              </div>

              {inspectingLead.website_or_social && (
                <div>
                  <span className="text-[#8C867E] font-medium block mb-1">Website or Social Link:</span>
                  <a
                    href={inspectingLead.website_or_social}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#581825] hover:underline flex items-center gap-1 font-medium bg-[#FAF8F5] p-2.5 rounded-sm border border-[#E8E2D8]"
                  >
                    <span>{inspectingLead.website_or_social}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}

              <div>
                <span className="text-[#8C867E] font-medium block mb-1">Full Project Brief:</span>
                <div className="bg-[#FAF8F5] p-4 rounded-sm border border-[#E8E2D8] text-[#191816] font-normal leading-relaxed whitespace-pre-wrap">
                  {inspectingLead.project_details || 'No additional brief text provided by client.'}
                </div>
              </div>

              {/* Internal Notes Section */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-semibold uppercase tracking-wider text-[#191816] text-[11px] flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-[#581825]" />
                    <span>Owner / PM Internal Notes</span>
                  </span>
                  {notesSaveNotice && (
                    <span className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Notes saved</span>
                    </span>
                  )}
                </div>
                <textarea
                  value={inspectingNotes}
                  onChange={(e) => setInspectingNotes(e.target.value)}
                  placeholder="Record private thoughts, vetting impressions, client communications, or recommended specialists..."
                  rows={3}
                  className="w-full p-3 bg-[#FAF8F5] border border-[#DDD7CD] rounded-sm text-xs text-[#191816] focus:border-[#581825] focus:outline-none"
                />
                <div className="mt-1.5 flex justify-end">
                  <button
                    onClick={handleSaveNotes}
                    disabled={isSavingNotes}
                    className="px-3 py-1.5 bg-[#FAF8F5] border border-[#DDD7CD] hover:border-[#191816] text-[#191816] rounded-sm text-xs font-semibold cursor-pointer inline-flex items-center gap-1 disabled:opacity-50"
                  >
                    <Save className="w-3 h-3 text-[#581825]" />
                    <span>{isSavingNotes ? 'Saving...' : 'Save Internal Notes'}</span>
                  </button>
                </div>
              </div>

              {/* Status Update In Drawer */}
              <div className="pt-3 border-t border-[#E8E2D8] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[#8C867E] font-medium">Update Status:</span>
                  <select
                    value={inspectingLead.status}
                    onChange={(e) => {
                      const next = e.target.value as LeadStatus;
                      onUpdateLeadStatus(inspectingLead.id, next);
                      setInspectingLead({ ...inspectingLead, status: next });
                    }}
                    className="px-2.5 py-1.5 border border-[#DDD7CD] rounded-sm bg-white font-medium text-xs text-[#191816]"
                  >
                    <option value="New">New</option>
                    <option value="Reviewing">Reviewing</option>
                    <option value="Accepted">Accepted</option>
                    <option value="Rejected">Rejected</option>
                    <option value="Archived">Archived</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      handleOpenConvertModal(inspectingLead);
                      setInspectingLead(null);
                    }}
                    className="px-4 py-2 bg-[#2E5E3A] hover:bg-[#204529] text-white text-xs font-semibold uppercase tracking-wider rounded-sm transition-colors cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <UserCheck className="w-4 h-4" />
                    <span>Convert to Client & Project</span>
                  </button>
                  <button
                    onClick={() => setInspectingLead(null)}
                    className="px-4 py-2 border border-[#DDD7CD] hover:border-[#191816] text-[#191816] text-xs font-semibold uppercase tracking-wider rounded-sm transition-colors cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Conversion to Client & Project Modal */}
      {convertingLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white border border-[#DDD7CD] max-w-lg w-full p-6 sm:p-8 rounded-sm shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-[#E8E2D8] mb-5">
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[#2E5E3A]">
                  Client & Project Conversion
                </span>
                <h3 className="font-serif text-xl text-[#191816] font-normal">
                  Convert Quote: {convertingLead.name}
                </h3>
              </div>
              <button
                onClick={() => setConvertingLead(null)}
                className="p-1 text-[#8C867E] hover:text-[#191816] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-3 bg-[#FAF8F5] border border-[#E8E2D8] rounded-sm space-y-1">
                <div className="font-medium text-[#191816]">Client Account Details:</div>
                <div className="text-[#5C5853]">
                  Name: <span className="font-semibold text-[#191816]">{convertingLead.name}</span> · Company:{' '}
                  <span className="font-semibold text-[#191816]">{convertingLead.company || 'Independent'}</span>
                </div>
                <div className="text-[#5C5853]">
                  Email: <span className="font-semibold text-[#581825]">{convertingLead.email}</span>
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer font-medium text-[#191816]">
                  <input
                    type="checkbox"
                    checked={createProject}
                    onChange={(e) => setCreateProject(e.target.checked)}
                    className="rounded text-[#581825] focus:ring-[#581825] h-4 w-4"
                  />
                  <span>Initialize active project pipeline immediately</span>
                </label>
              </div>

              {createProject && (
                <div className="space-y-3.5 pl-6 border-l-2 border-[#581825]/30">
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#191816] mb-1">
                      Project Name
                    </label>
                    <input
                      type="text"
                      required
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                      className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#DDD7CD] rounded-sm text-xs text-[#191816] focus:border-[#581825] focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#191816] mb-1">
                        Budget Value
                      </label>
                      <input
                        type="text"
                        value={projectBudget}
                        onChange={(e) => setProjectBudget(e.target.value)}
                        className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#DDD7CD] rounded-sm text-xs text-[#191816] focus:border-[#581825] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#191816] mb-1">
                        Target Deadline
                      </label>
                      <input
                        type="date"
                        value={projectDeadline}
                        onChange={(e) => setProjectDeadline(e.target.value)}
                        className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#DDD7CD] rounded-sm text-xs text-[#191816] focus:border-[#581825] focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Assign Freelancers Immediately */}
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#191816] mb-1 flex items-center gap-1">
                      <Users2 className="w-3.5 h-3.5 text-[#581825]" />
                      <span>Assign Specialist(s)</span>
                    </label>
                    {freelancers.length === 0 ? (
                      <div className="text-[11px] text-[#8C867E]">No approved specialists in network roster yet.</div>
                    ) : (
                      <div className="max-h-28 overflow-y-auto border border-[#DDD7CD] p-2 bg-[#FAF8F5] rounded-sm space-y-1">
                        {freelancers.map((f) => (
                          <label key={f.id} className="flex items-center gap-2 cursor-pointer hover:bg-white p-1 rounded">
                            <input
                              type="checkbox"
                              checked={selectedSpecialistIds.includes(f.id)}
                              onChange={() => toggleSpecialistSelection(f.id)}
                              className="rounded text-[#581825] h-3.5 w-3.5"
                            />
                            <span className="font-semibold text-[#191816] text-[11px]">{f.name}</span>
                            <span className="text-[#8C867E] text-[10px]">({f.primary_skill})</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Initial Tasks */}
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#191816] mb-1 flex items-center gap-1">
                      <ListTodo className="w-3.5 h-3.5 text-[#581825]" />
                      <span>Initial Deliverable Tasks (one per line)</span>
                    </label>
                    <textarea
                      value={initialTasksInput}
                      onChange={(e) => setInitialTasksInput(e.target.value)}
                      rows={3}
                      className="w-full p-2.5 bg-[#FAF8F5] border border-[#DDD7CD] rounded-sm text-xs text-[#191816] focus:border-[#581825] focus:outline-none"
                      placeholder="Task 1&#10;Task 2&#10;Task 3"
                    />
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-[#E8E2D8] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setConvertingLead(null)}
                  className="px-4 py-2 border border-[#DDD7CD] hover:border-[#191816] text-[#191816] text-xs font-semibold uppercase tracking-wider rounded-sm transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isSubmittingConvert}
                  onClick={handleExecuteConvert}
                  className="px-5 py-2 bg-[#2E5E3A] hover:bg-[#204529] text-white text-xs font-semibold uppercase tracking-wider rounded-sm transition-colors cursor-pointer disabled:opacity-50 inline-flex items-center gap-1.5"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>{isSubmittingConvert ? 'Converting...' : 'Confirm & Initialize'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
