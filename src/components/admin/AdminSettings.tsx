import React, { useState } from 'react';
import { Settings, Download, Database, Mail, Bell, Check, ShieldCheck } from 'lucide-react';
import { agencyApi } from '../../services/agencyApi';

interface AdminSettingsProps {
  settings: Record<string, string>;
  counts: Record<string, number>;
  onUpdateSettings: (settings: Record<string, string>) => Promise<void>;
}

export const AdminSettings: React.FC<AdminSettingsProps> = ({
  settings,
  counts,
  onUpdateSettings,
}) => {
  const [notificationEmail, setNotificationEmail] = useState(
    settings['agency_notification_email'] || 'retroindian644@gmail.com'
  );
  const [notifyOnLead, setNotifyOnLead] = useState(settings['notify_on_lead'] !== 'false');
  const [notifyOnReview, setNotifyOnReview] = useState(settings['notify_on_review'] !== 'false');
  const [notifyOnOverdue, setNotifyOnOverdue] = useState(settings['notify_on_overdue'] !== 'false');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onUpdateSettings({
        agency_notification_email: notificationEmail,
        notify_on_lead: String(notifyOnLead),
        notify_on_review: String(notifyOnReview),
        notify_on_overdue: String(notifyOnOverdue),
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleExport = (type: string, format: 'csv' | 'json') => {
    window.location.href = agencyApi.getExportUrl(type, format);
  };

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div className="pb-6 border-b border-[#E8E2D8]">
        <span className="text-xs font-semibold uppercase tracking-widest text-[#581825] block mb-1">
          System Configuration
        </span>
        <h1 className="font-serif text-3xl font-normal text-[#191816] tracking-tight">
          Agency Settings & Exports
        </h1>
        <p className="text-xs text-[#6B665F] mt-1">
          Notification preferences, system telemetry, and one-click data backup exports.
        </p>
      </div>

      {savedSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium rounded-sm flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>Agency settings updated successfully.</span>
        </div>
      )}

      {/* Notifications Configuration */}
      <div className="bg-white border border-[#E2DDD5] p-6 rounded-sm shadow-2xs">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-[#191816] mb-1 flex items-center gap-2">
          <Mail className="w-4 h-4 text-[#581825]" />
          <span>Agency Notification Routing</span>
        </h3>
        <p className="text-xs text-[#6B665F] mb-6">
          Specify destination email for new client briefs and urgent project review alerts.
        </p>

        <form onSubmit={handleSave} className="space-y-5 text-xs">
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#191816] mb-1.5">
              Director Alert Email Address
            </label>
            <input
              type="email"
              required
              value={notificationEmail}
              onChange={(e) => setNotificationEmail(e.target.value)}
              className="max-w-md w-full px-3 py-2 bg-[#FAF8F5] border border-[#DDD7CD] rounded-sm text-xs text-[#191816] focus:border-[#581825] focus:outline-none"
            />
          </div>

          <div className="space-y-2.5 pt-2 border-t border-[#F0EBE1]">
            <span className="block text-[11px] font-semibold uppercase tracking-wider text-[#191816] mb-2">
              Alert Trigger Preferences
            </span>

            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={notifyOnLead}
                onChange={(e) => setNotifyOnLead(e.target.checked)}
                className="rounded text-[#581825] focus:ring-[#581825] h-4 w-4"
              />
              <span className="text-[#191816]">Notify immediately when a new client lead arrives via public site</span>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={notifyOnReview}
                onChange={(e) => setNotifyOnReview(e.target.checked)}
                className="rounded text-[#581825] focus:ring-[#581825] h-4 w-4"
              />
              <span className="text-[#191816]">Notify when an independent specialist marks a task ready for QA Review</span>
            </label>

            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={notifyOnOverdue}
                onChange={(e) => setNotifyOnOverdue(e.target.checked)}
                className="rounded text-[#581825] focus:ring-[#581825] h-4 w-4"
              />
              <span className="text-[#191816]">Highlight and flag tasks and milestones exceeding deadline</span>
            </label>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 bg-[#581825] hover:bg-[#3E0E18] text-white text-xs font-semibold uppercase tracking-wider rounded-sm transition-colors cursor-pointer disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>

      {/* Database Summary Telemetry */}
      <div className="bg-white border border-[#E2DDD5] p-6 rounded-sm shadow-2xs">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-[#191816] mb-1 flex items-center gap-2">
          <Database className="w-4 h-4 text-[#191816]" />
          <span>Database & Record Telemetry</span>
        </h3>
        <p className="text-xs text-[#6B665F] mb-6">
          Synchronized SQLite storage with WAL journaling mode for instant data persistence.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="p-3.5 bg-[#FAF8F5] border border-[#E8E2D8] rounded-sm text-center">
            <span className="text-[10px] font-semibold uppercase text-[#8C867E] block">Leads</span>
            <span className="font-serif text-2xl text-[#191816]">{counts.leads || 0}</span>
          </div>
          <div className="p-3.5 bg-[#FAF8F5] border border-[#E8E2D8] rounded-sm text-center">
            <span className="text-[10px] font-semibold uppercase text-[#8C867E] block">Clients</span>
            <span className="font-serif text-2xl text-[#191816]">{counts.clients || 0}</span>
          </div>
          <div className="p-3.5 bg-[#FAF8F5] border border-[#E8E2D8] rounded-sm text-center">
            <span className="text-[10px] font-semibold uppercase text-[#8C867E] block">Specialists</span>
            <span className="font-serif text-2xl text-[#191816]">{counts.freelancers || 0}</span>
          </div>
          <div className="p-3.5 bg-[#FAF8F5] border border-[#E8E2D8] rounded-sm text-center">
            <span className="text-[10px] font-semibold uppercase text-[#8C867E] block">Projects</span>
            <span className="font-serif text-2xl text-[#191816]">{counts.projects || 0}</span>
          </div>
          <div className="p-3.5 bg-[#FAF8F5] border border-[#E8E2D8] rounded-sm text-center">
            <span className="text-[10px] font-semibold uppercase text-[#8C867E] block">Tasks</span>
            <span className="font-serif text-2xl text-[#191816]">{counts.tasks || 0}</span>
          </div>
        </div>
      </div>

      {/* One-Click Data Export */}
      <div className="bg-white border border-[#E2DDD5] p-6 rounded-sm shadow-2xs">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-[#191816] mb-1 flex items-center gap-2">
          <Download className="w-4 h-4 text-[#581825]" />
          <span>One-Click Agency Backup & Data Export</span>
        </h3>
        <p className="text-xs text-[#6B665F] mb-6">
          Download records directly as structured CSV spreadsheets or raw JSON files for reporting or offline backup.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { id: 'leads', label: 'Client Leads & Briefs', desc: 'All incoming inquiries with status and budgets' },
            { id: 'clients', label: 'Client Accounts', desc: 'Client contacts, organizations, and project totals' },
            { id: 'freelancers', label: 'Specialist Network Roster', desc: 'Vetted freelancers with skills, rates, and portfolio URLs' },
            { id: 'projects', label: 'Projects & Pipelines', desc: 'Active and completed client project scopes' },
            { id: 'tasks', label: 'Kanban Tasks & QA', desc: 'All deliverable tasks with priorities and deadlines' },
          ].map((item) => (
            <div
              key={item.id}
              className="p-4 bg-[#FAF8F5] border border-[#E8E2D8] rounded-sm flex items-center justify-between gap-3"
            >
              <div>
                <h4 className="text-xs font-semibold text-[#191816]">{item.label}</h4>
                <p className="text-[11px] text-[#8C867E] mt-0.5">{item.desc}</p>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => handleExport(item.id, 'csv')}
                  className="px-2.5 py-1 text-[11px] font-semibold bg-white border border-[#DDD7CD] hover:border-[#191816] text-[#191816] rounded-sm transition-colors cursor-pointer"
                  title="Export as CSV spreadsheet"
                >
                  CSV
                </button>
                <button
                  onClick={() => handleExport(item.id, 'json')}
                  className="px-2.5 py-1 text-[11px] font-semibold bg-white border border-[#DDD7CD] hover:border-[#191816] text-[#191816] rounded-sm transition-colors cursor-pointer"
                  title="Export as JSON raw dataset"
                >
                  JSON
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
