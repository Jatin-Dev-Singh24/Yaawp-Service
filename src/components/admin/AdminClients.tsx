import React, { useState } from 'react';
import {
  Briefcase,
  Search,
  Plus,
  Mail,
  Phone,
  Edit2,
  Trash2,
  X,
} from 'lucide-react';
import { Client, Project } from '../../types/admin';

interface AdminClientsProps {
  clients: Client[];
  projects: Project[];
  onCreateClient: (data: Partial<Client>) => Promise<void>;
  onUpdateClient: (id: string, data: Partial<Client>) => Promise<void>;
  onDeleteClient: (id: string) => Promise<void>;
  onSelectProject: (projectId: string) => void;
  onOpenNewProjectForClient?: (clientId: string) => void;
}

export const AdminClients: React.FC<AdminClientsProps> = ({
  clients,
  projects,
  onCreateClient,
  onUpdateClient,
  onDeleteClient,
  onSelectProject,
  onOpenNewProjectForClient,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isCreatingClient, setIsCreatingClient] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredClients = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.company && c.company.toLowerCase().includes(searchQuery.toLowerCase())) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenCreateModal = () => {
    setName('');
    setEmail('');
    setCompany('');
    setPhone('');
    setNotes('');
    setIsCreatingClient(true);
  };

  const handleOpenEditModal = (client: Client) => {
    setEditingClient(client);
    setName(client.name);
    setEmail(client.email);
    setCompany(client.company || '');
    setPhone(client.phone || '');
    setNotes(client.notes || '');
  };

  const handleSubmitSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingClient) {
        await onUpdateClient(editingClient.id, { name, email, company, phone, notes });
        setEditingClient(null);
      } else {
        await onCreateClient({ name, email, company, phone, notes });
        setIsCreatingClient(false);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const getClientProjects = (clientId: string) => {
    return projects.filter((p) => p.client_id === clientId);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E8E2D8]">
        <div>
          <span className="text-xs font-semibold uppercase tracking-widest text-[#581825] block mb-1">
            Accounts & Relationships
          </span>
          <h1 className="font-serif text-3xl font-normal text-[#191816] tracking-tight">
            Client Directory
          </h1>
          <p className="text-xs text-[#6B665F] mt-1">
            Client records, contact details, notes, and associated project pipelines.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-full sm:w-64 relative">
            <Search className="w-4 h-4 text-[#8C867E] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search clients..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white border border-[#DDD7CD] rounded-sm text-xs text-[#191816] focus:border-[#581825] focus:outline-none"
            />
          </div>

          <button
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#581825] hover:bg-[#3E0E18] text-white text-xs font-semibold uppercase tracking-wider rounded-sm transition-colors cursor-pointer shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Client</span>
          </button>
        </div>
      </div>

      {filteredClients.length === 0 ? (
        <div className="bg-white border border-[#E2DDD5] p-12 text-center rounded-sm">
          <Briefcase className="w-8 h-8 text-[#8C867E] mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-[#191816]">No clients found</h3>
          <p className="text-xs text-[#6B665F] mt-1">
            {searchQuery ? 'Try adjusting your search.' : 'Add your first client to start tracking projects.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredClients.map((client) => {
            const clientProjects = getClientProjects(client.id);
            const activeCount = clientProjects.filter((p) =>
              ['Planning', 'In Progress', 'Review'].includes(p.status)
            ).length;

            return (
              <div
                key={client.id}
                className="bg-white border border-[#E2DDD5] p-5 rounded-sm hover:border-[#581825] transition-all flex flex-col justify-between shadow-2xs group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-[#8C867E]">
                        {client.company || 'Direct Client'}
                      </span>
                      <h3 className="text-base font-semibold text-[#191816]">{client.name}</h3>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEditModal(client)}
                        title="Edit client"
                        className="p-1 text-[#8C867E] hover:text-[#191816] transition-colors cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteClient(client.id)}
                        title="Delete client"
                        className="p-1 text-[#8C867E] hover:text-red-700 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs text-[#5C5853] mb-4">
                    <a
                      href={`mailto:${client.email}`}
                      className="flex items-center gap-2 hover:text-[#581825] truncate"
                    >
                      <Mail className="w-3.5 h-3.5 text-[#8C867E] shrink-0" />
                      <span className="truncate">{client.email}</span>
                    </a>
                    {client.phone && (
                      <div className="flex items-center gap-2 text-[#5C5853]">
                        <Phone className="w-3.5 h-3.5 text-[#8C867E] shrink-0" />
                        <span>{client.phone}</span>
                      </div>
                    )}
                  </div>

                  {client.notes && (
                    <p className="text-xs text-[#6B665F] bg-[#FAF8F5] p-2.5 rounded-sm border border-[#E8E2D8] mb-4 line-clamp-2 italic">
                      "{client.notes}"
                    </p>
                  )}
                </div>

                <div>
                  <div className="pt-3 border-t border-[#F0EBE1] flex items-center justify-between text-xs mb-3">
                    <span className="text-[#8C867E]">Active Projects:</span>
                    <span className="font-semibold text-[#191816]">
                      {activeCount} active ({clientProjects.length} total)
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedClient(client)}
                      className="flex-1 py-1.5 text-center text-xs font-semibold uppercase tracking-wider border border-[#DDD7CD] hover:border-[#191816] text-[#191816] rounded-sm transition-colors cursor-pointer"
                    >
                      View Profile
                    </button>
                    {onOpenNewProjectForClient && (
                      <button
                        onClick={() => onOpenNewProjectForClient(client.id)}
                        className="py-1.5 px-2.5 text-center text-xs font-semibold bg-[#FAF8F5] hover:bg-[#581825] hover:text-white border border-[#DDD7CD] text-[#191816] rounded-sm transition-colors cursor-pointer"
                        title="New project for this client"
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

      {selectedClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white border border-[#DDD7CD] max-w-2xl w-full p-6 sm:p-8 rounded-sm shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-[#E8E2D8] mb-6">
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[#581825]">
                  Client Profile
                </span>
                <h3 className="font-serif text-2xl text-[#191816] font-normal">
                  {selectedClient.name}
                </h3>
                <span className="text-xs text-[#8C867E]">
                  {selectedClient.company || 'Independent'} · Added on{' '}
                  {new Date(selectedClient.created_at).toLocaleDateString()}
                </span>
              </div>
              <button
                onClick={() => setSelectedClient(null)}
                className="p-1 text-[#8C867E] hover:text-[#191816] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6 text-xs">
              <div className="grid grid-cols-2 gap-4 bg-[#FAF8F5] p-4 rounded-sm border border-[#E8E2D8]">
                <div>
                  <span className="text-[#8C867E] font-medium block">Email:</span>
                  <a
                    href={`mailto:${selectedClient.email}`}
                    className="text-[#581825] font-semibold hover:underline"
                  >
                    {selectedClient.email}
                  </a>
                </div>
                <div>
                  <span className="text-[#8C867E] font-medium block">Phone:</span>
                  <span className="text-[#191816] font-semibold">
                    {selectedClient.phone || 'Not recorded'}
                  </span>
                </div>
              </div>

              {selectedClient.notes && (
                <div>
                  <span className="text-[#8C867E] font-medium block mb-1">Account Notes:</span>
                  <div className="p-3 bg-[#FAF8F5] border border-[#E8E2D8] rounded-sm text-[#191816] leading-relaxed">
                    {selectedClient.notes}
                  </div>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-sm uppercase tracking-wider text-[#191816]">
                    Associated Projects ({getClientProjects(selectedClient.id).length})
                  </h4>
                  {onOpenNewProjectForClient && (
                    <button
                      onClick={() => {
                        onOpenNewProjectForClient(selectedClient.id);
                        setSelectedClient(null);
                      }}
                      className="text-xs font-semibold text-[#581825] hover:underline inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Create Project</span>
                    </button>
                  )}
                </div>

                {getClientProjects(selectedClient.id).length === 0 ? (
                  <p className="text-xs text-[#8C867E] py-4 bg-[#FAF8F5] text-center rounded-sm border border-[#E8E2D8]">
                    No projects created for this client yet.
                  </p>
                ) : (
                  <div className="divide-y divide-[#F0EBE1] border border-[#E8E2D8] rounded-sm">
                    {getClientProjects(selectedClient.id).map((p) => (
                      <div
                        key={p.id}
                        className="p-3 flex items-center justify-between hover:bg-[#FAF8F5] transition-colors"
                      >
                        <div>
                          <div className="font-semibold text-[#191816] text-xs">{p.name}</div>
                          <div className="text-[#8C867E] text-[11px] mt-0.5">
                            Budget: {p.budget_value || 'TBD'} · Due: {p.deadline || 'Ongoing'}
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="px-2 py-0.5 text-[10px] font-semibold bg-[#FAF8F5] border border-[#DDD7CD] rounded-sm text-[#191816]">
                            {p.status}
                          </span>
                          <button
                            onClick={() => {
                              onSelectProject(p.id);
                              setSelectedClient(null);
                            }}
                            className="text-xs font-semibold text-[#581825] hover:underline"
                          >
                            Inspect →
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-[#E8E2D8] flex items-center justify-between">
                <button
                  onClick={() => {
                    handleOpenEditModal(selectedClient);
                    setSelectedClient(null);
                  }}
                  className="px-4 py-2 border border-[#DDD7CD] hover:border-[#191816] text-[#191816] text-xs font-semibold uppercase tracking-wider rounded-sm transition-colors cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit Profile</span>
                </button>

                <button
                  onClick={() => setSelectedClient(null)}
                  className="px-4 py-2 bg-[#191816] text-white text-xs font-semibold uppercase tracking-wider rounded-sm cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {(isCreatingClient || editingClient) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white border border-[#DDD7CD] max-w-md w-full p-6 sm:p-8 rounded-sm shadow-xl">
            <div className="flex items-center justify-between pb-4 border-b border-[#E8E2D8] mb-5">
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[#581825]">
                  {editingClient ? 'Update Profile' : 'New Client Account'}
                </span>
                <h3 className="font-serif text-xl text-[#191816] font-normal">
                  {editingClient ? `Edit ${editingClient.name}` : 'Add Client'}
                </h3>
              </div>
              <button
                onClick={() => {
                  setIsCreatingClient(false);
                  setEditingClient(null);
                }}
                className="p-1 text-[#8C867E] hover:text-[#191816] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitSave} className="space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#191816] mb-1">
                  Primary Contact Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Clara Dupont"
                  className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#DDD7CD] rounded-sm text-xs text-[#191816] focus:border-[#581825] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#191816] mb-1">
                  Company / Organization
                </label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="e.g. Aura Studio"
                  className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#DDD7CD] rounded-sm text-xs text-[#191816] focus:border-[#581825] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#191816] mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="clara@auraceramics.com"
                    className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#DDD7CD] rounded-sm text-xs text-[#191816] focus:border-[#581825] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#191816] mb-1">
                    Phone
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (555) 012-3456"
                    className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#DDD7CD] rounded-sm text-xs text-[#191816] focus:border-[#581825] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#191816] mb-1">
                  Internal Notes & Context
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Key preferences, billing details, brand tone..."
                  className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#DDD7CD] rounded-sm text-xs text-[#191816] focus:border-[#581825] focus:outline-none"
                />
              </div>

              <div className="pt-4 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreatingClient(false);
                    setEditingClient(null);
                  }}
                  className="px-4 py-2 border border-[#DDD7CD] hover:border-[#191816] text-[#191816] text-xs font-semibold uppercase tracking-wider rounded-sm transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-[#581825] hover:bg-[#3E0E18] text-white text-xs font-semibold uppercase tracking-wider rounded-sm transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : editingClient ? 'Update Client' : 'Create Client'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
