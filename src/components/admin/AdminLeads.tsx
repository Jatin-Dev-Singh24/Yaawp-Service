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
} from 'lucide-react';
import { Lead, LeadStatus } from '../../types/admin';

interface AdminLeadsProps {
  leads: Lead[];
  onUpdateLeadStatus: (leadId: string, status: LeadStatus) => Promise<void>;
  onUpdateLeadNotes: (leadId: string, notes: string) => Promise<void>;
  onConvertLead: (
    leadId: string,
    options: { createProject: boolean; projectName?: string; budget?: string; deadline?: string }
  ) => Promise<void>;
  onArchiveLead: (leadId: string) => Promise<void>;
  onDeleteLead: (leadId: string) => Promise<void>;
}

export const AdminLeads: React.FC<AdminLeadsProps> = ({
  leads,
  onUpdateLeadStatus,
  onConvertLead,
  onArchiveLead,
  onDeleteLead,
}) => {
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [inspectingLead, setInspectingLead] = useState<Lead | null>(null);

  const [convertingLead, setConvertingLead] = useState<Lead | null>(null);
  const [createProject, setCreateProject] = useState(true);
  const [projectName, setProjectName] = useState('');
  const [projectBudget, setProjectBudget] = useState('');
  const [projectDeadline, setProjectDeadline] = useState('');
  const [isSubmittingConvert, setIsSubmittingConvert] = useState(false);

  const statusOptions: { label: string; value: string; count: number }[] = [
    { label: 'All Inquiries', value: 'ALL', count: leads.length },
    { label: 'New', value: 'New', count: leads.filter((l) => l.status === 'New').length },
    { label: 'Contacted', value: 'Contacted', count: leads.filter((l) => l.status === 'Contacted').length },
    { label: 'In Discussion', value: 'In Discussion', count: leads.filter((l) => l.status === 'In Discussion').length },
    { label: 'Converted', value: 'Converted', count: leads.filter((l) => l.status === 'Converted').length },
    { label: 'Archived', value: 'Archived', count: leads.filter((l) => l.status === 'Archived').length },
  ];

  const filteredLeads = leads.filter((l) => {
    const matchesStatus = selectedStatus === 'ALL' || l.status === selectedStatus;
    const matchesSearch =
      l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (l.company && l.company.toLowerCase().includes(searchQuery.toLowerCase())) ||
      l.service.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.email.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const handleOpenConvertModal = (lead: Lead) => {
    setConvertingLead(lead);
    setProjectName(`${lead.company || lead.name} — ${lead.service}`);
    setProjectBudget(lead.budget_range || '$12,000');
    const date30 = new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0];
    setProjectDeadline(date30);
  };

  const handleExecuteConvert = async () => {
    if (!convertingLead) return;
    setIsSubmittingConvert(true);
    try {
      await onConvertLead(convertingLead.id, {
        createProject,
        projectName: createProject ? projectName : undefined,
        budget: createProject ? projectBudget : undefined,
        deadline: createProject ? projectDeadline : undefined,
      });
      setConvertingLead(null);
      if (inspectingLead?.id === convertingLead.id) {
        setInspectingLead({ ...inspectingLead, status: 'Converted' });
      }
    } finally {
      setIsSubmittingConvert(false);
    }
  };

  const getStatusBadge = (status: LeadStatus) => {
    switch (status) {
      case 'New':
        return 'bg-[#581825] text-white';
      case 'Contacted':
        return 'bg-[#1E3A8A] text-white';
      case 'In Discussion':
        return 'bg-[#D97706] text-white';
      case 'Converted':
        return 'bg-[#2E5E3A] text-white';
      case 'Archived':
        return 'bg-[#78716C] text-white';
      default:
        return 'bg-[#E8E2D8] text-[#191816]';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E8E2D8]">
        <div>
          <span className="text-xs font-semibold uppercase tracking-widest text-[#581825] block mb-1">
            Client Inquiries & Briefs
          </span>
          <h1 className="font-serif text-3xl font-normal text-[#191816] tracking-tight">
            Client Leads
          </h1>
          <p className="text-xs text-[#6B665F] mt-1">
            All brief submissions from the public website contact form automatically ingest here.
          </p>
        </div>

        <div className="w-full sm:w-72 relative">
          <Search className="w-4 h-4 text-[#8C867E] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search leads..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-white border border-[#DDD7CD] rounded-sm text-xs text-[#191816] focus:border-[#581825] focus:outline-none"
          />
        </div>
      </div>

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

      {filteredLeads.length === 0 ? (
        <div className="bg-white border border-[#E2DDD5] p-12 text-center rounded-sm">
          <Inbox className="w-8 h-8 text-[#8C867E] mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-[#191816]">No leads found</h3>
          <p className="text-xs text-[#6B665F] mt-1">
            {searchQuery ? 'Try adjusting your search criteria.' : 'No inquiries match this status filter.'}
          </p>
        </div>
      ) : (
        <div className="bg-white border border-[#E2DDD5] rounded-sm shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#FAF8F5] border-b border-[#E8E2D8] text-[#5C5853] uppercase font-semibold text-[10px] tracking-wider">
                  <th className="py-3 px-4">Contact & Organization</th>
                  <th className="py-3 px-4">Requested Service</th>
                  <th className="py-3 px-4">Budget & Timeline</th>
                  <th className="py-3 px-4">Submitted</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0EBE1]">
                {filteredLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-[#FAF8F5]/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-[#191816] text-xs">{lead.name}</div>
                      <div className="text-[#6B665F] text-[11px] flex items-center gap-1 mt-0.5">
                        <Building className="w-3 h-3 text-[#8C867E]" />
                        <span>{lead.company || 'Independent'}</span>
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
                      <div className="text-[#8C867E] text-[11px]">{lead.timeline || 'Standard'}</div>
                    </td>

                    <td className="py-3.5 px-4 text-[#8C867E] whitespace-nowrap">
                      {new Date(lead.created_at).toLocaleDateString()}
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
                        <option value="Contacted" className="bg-white text-black">Contacted</option>
                        <option value="In Discussion" className="bg-white text-black">In Discussion</option>
                        <option value="Converted" className="bg-white text-black">Converted</option>
                        <option value="Archived" className="bg-white text-black">Archived</option>
                      </select>
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setInspectingLead(lead)}
                          className="px-2.5 py-1 text-[11px] font-medium border border-[#DDD7CD] hover:border-[#191816] text-[#191816] rounded-sm transition-colors cursor-pointer"
                        >
                          View Details
                        </button>

                        {lead.status !== 'Converted' && (
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
                          title="Archive Lead"
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

      {inspectingLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white border border-[#DDD7CD] max-w-xl w-full p-6 sm:p-8 rounded-sm shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-[#E8E2D8] mb-6">
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[#581825]">
                  Inquiry Brief #{inspectingLead.id.slice(-6)}
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

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4 bg-[#FAF8F5] p-4 rounded-sm border border-[#E8E2D8]">
                <div>
                  <span className="text-[#8C867E] font-medium block">Organization:</span>
                  <span className="text-[#191816] font-semibold">
                    {inspectingLead.company || 'Independent'}
                  </span>
                </div>
                <div>
                  <span className="text-[#8C867E] font-medium block">Email:</span>
                  <a href={`mailto:${inspectingLead.email}`} className="text-[#581825] font-semibold hover:underline">
                    {inspectingLead.email}
                  </a>
                </div>
                <div>
                  <span className="text-[#8C867E] font-medium block">Service Requested:</span>
                  <span className="text-[#191816] font-semibold">{inspectingLead.service}</span>
                </div>
                <div>
                  <span className="text-[#8C867E] font-medium block">Budget Estimate:</span>
                  <span className="text-[#191816] font-semibold">{inspectingLead.budget_range || 'Flexible'}</span>
                </div>
              </div>

              {inspectingLead.website_or_social && (
                <div>
                  <span className="text-[#8C867E] font-medium block mb-1">Website / Social:</span>
                  <a
                    href={inspectingLead.website_or_social}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#581825] hover:underline flex items-center gap-1 font-medium"
                  >
                    <span>{inspectingLead.website_or_social}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}

              <div>
                <span className="text-[#8C867E] font-medium block mb-1">Project Brief / Details:</span>
                <div className="bg-[#FAF8F5] p-3.5 rounded-sm border border-[#E8E2D8] text-[#191816] font-normal leading-relaxed whitespace-pre-wrap">
                  {inspectingLead.project_details || 'No additional text supplied with this brief.'}
                </div>
              </div>

              <div className="pt-6 border-t border-[#E8E2D8] flex items-center justify-between gap-3">
                <button
                  onClick={() => onDeleteLead(inspectingLead.id).then(() => setInspectingLead(null))}
                  className="text-red-700 hover:text-red-900 text-xs font-medium cursor-pointer inline-flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete inquiry</span>
                </button>

                <div className="flex items-center gap-2">
                  {inspectingLead.status !== 'Converted' && (
                    <button
                      onClick={() => handleOpenConvertModal(inspectingLead)}
                      className="px-4 py-2 bg-[#2E5E3A] hover:bg-[#204529] text-white text-xs font-semibold uppercase tracking-wider rounded-sm transition-colors cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <UserCheck className="w-4 h-4" />
                      <span>Convert to Client</span>
                    </button>
                  )}
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

      {convertingLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white border border-[#DDD7CD] max-w-md w-full p-6 sm:p-8 rounded-sm shadow-xl">
            <div className="flex items-center justify-between pb-4 border-b border-[#E8E2D8] mb-5">
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[#2E5E3A]">
                  Client Account Conversion
                </span>
                <h3 className="font-serif text-xl text-[#191816] font-normal">
                  Convert {convertingLead.name}
                </h3>
              </div>
              <button onClick={() => setConvertingLead(null)} className="p-1 text-[#8C867E] hover:text-[#191816] cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-[#5C5853] mb-4">
              Create a client account for <strong>{convertingLead.company || convertingLead.name}</strong>.
            </p>

            <div className="space-y-4">
              <label className="flex items-center gap-2.5 p-3 bg-[#FAF8F5] border border-[#E8E2D8] rounded-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={createProject}
                  onChange={(e) => setCreateProject(e.target.checked)}
                  className="rounded text-[#581825] focus:ring-[#581825] h-4 w-4"
                />
                <div className="text-xs">
                  <span className="font-semibold text-[#191816] block">
                    Automatically initiate active project
                  </span>
                  <span className="text-[#6B665F]">Create project pipeline record</span>
                </div>
              </label>

              {createProject && (
                <div className="space-y-3 pt-2">
                  <div>
                    <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#191816] mb-1">
                      Project Name
                    </label>
                    <input
                      type="text"
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
                        Deadline
                      </label>
                      <input
                        type="date"
                        value={projectDeadline}
                        onChange={(e) => setProjectDeadline(e.target.value)}
                        className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#DDD7CD] rounded-sm text-xs text-[#191816] focus:border-[#581825] focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-4 flex items-center justify-end gap-2">
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
                  className="px-5 py-2 bg-[#2E5E3A] hover:bg-[#204529] text-white text-xs font-semibold uppercase tracking-wider rounded-sm transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingConvert ? 'Converting...' : 'Confirm Conversion'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
