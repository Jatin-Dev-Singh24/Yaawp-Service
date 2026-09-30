import React, { useState, useEffect } from 'react';
import { Settings, Download, Database, Mail, Bell, Check, ShieldCheck, Send, AlertCircle, Trash2 } from 'lucide-react';
import { agencyApi } from '../../services/agencyApi';

interface AdminSettingsProps {
  settings: Record<string, string>;
  counts: Record<string, number>;
  onUpdateSettings: (settings: Record<string, string>) => Promise<void>;
  onReloadData?: () => Promise<void>;
}

export const AdminSettings: React.FC<AdminSettingsProps> = ({
  settings,
  counts,
  onUpdateSettings,
  onReloadData,
}) => {
  const [notificationEmail, setNotificationEmail] = useState(
    settings['agency_notification_email'] || ''
  );
  const [notifyOnLead, setNotifyOnLead] = useState(settings['notify_on_lead'] !== 'false');
  const [notifyOnReview, setNotifyOnReview] = useState(settings['notify_on_review'] !== 'false');
  const [notifyOnOverdue, setNotifyOnOverdue] = useState(settings['notify_on_overdue'] !== 'false');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Email provider diagnostics state
  const [emailStatus, setEmailStatus] = useState<{
    configured: boolean;
    recipientConfigured: boolean;
    recipientEmail: string | null;
    provider: string;
    fromEmail: string;
    missingFields: string[];
  } | null>(null);
  const [testingEmail, setTestingEmail] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [purgingDemo, setPurgingDemo] = useState(false);
  const [purgeResult, setPurgeResult] = useState<string | null>(null);

  useEffect(() => {
    agencyApi
      .getEmailStatus()
      .then((st) => setEmailStatus(st))
      .catch(() => {});
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onUpdateSettings({
        agency_notification_email: notificationEmail.trim(),
        notify_on_lead: String(notifyOnLead),
        notify_on_review: String(notifyOnReview),
        notify_on_overdue: String(notifyOnOverdue),
      });
      setSavedSuccess(true);
      const updatedStatus = await agencyApi.getEmailStatus();
      setEmailStatus(updatedStatus);
      setTimeout(() => setSavedSuccess(false), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestEmail = async () => {
    setTestingEmail(true);
    setTestResult(null);
    try {
      const res = await agencyApi.testEmail(notificationEmail.trim());
      setTestResult({
        success: res.success,
        message: res.message || 'Test email dispatched successfully.',
      });
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err?.message || 'Failed to dispatch test email. Ensure provider credentials are set.',
      });
    } finally {
      setTestingEmail(false);
    }
  };

  const handlePurgeDemoData = async () => {
    if (!window.confirm('Are you sure you want to remove all initial fictional demo clients, leads, and projects? This will leave your workspace clean for real customer data.')) {
      return;
    }
    setPurgingDemo(true);
    try {
      const res = await agencyApi.purgeDemoData();
      setPurgeResult(res.message);
      if (onReloadData) {
        await onReloadData();
      }
      setTimeout(() => setPurgeResult(null), 4000);
    } catch (err: any) {
      setPurgeResult('Failed to purge demo data: ' + err.message);
    } finally {
      setPurgingDemo(false);
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

      {/* Email Provider Diagnostics & Verification */}
      <div className="bg-white border border-[#E2DDD5] p-6 rounded-sm shadow-2xs">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-[#191816] flex items-center gap-2">
            <Mail className="w-4 h-4 text-[#581825]" />
            <span>Email Provider Integration Status</span>
          </h3>
          <span
            className={`px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider rounded-sm ${
              emailStatus?.configured
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-amber-100 text-amber-800'
            }`}
          >
            {emailStatus?.configured ? `Active (${emailStatus.provider.toUpperCase()})` : 'Provider Unconfigured'}
          </span>
        </div>
        <p className="text-xs text-[#6B665F] mb-4">
          Client inquiries and specialist applications trigger automated server-side email notifications to your receiving inbox.
        </p>

        <div className="p-4 bg-[#FAF8F5] border border-[#E8E2D8] rounded-sm space-y-3 mb-4 text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-[#EAE4D9] pb-2">
            <span className="text-[#6B665F] font-medium">Configured Recipient:</span>
            <span className="font-mono text-[#191816] font-semibold">
              {emailStatus?.recipientEmail || 'None configured (Set AGENCY_NOTIFICATION_EMAIL)'}
            </span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-[#EAE4D9] pb-2">
            <span className="text-[#6B665F] font-medium">Active Dispatch Provider:</span>
            <span className="font-mono text-[#191816]">
              {emailStatus?.provider === 'resend'
                ? 'Resend API'
                : emailStatus?.provider === 'smtp'
                ? 'SMTP Relay'
                : 'None (Simulation / Local Logs)'}
            </span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <span className="text-[#6B665F] font-medium">Sender Identity (From):</span>
            <span className="font-mono text-[#191816] text-[11px]">{emailStatus?.fromEmail}</span>
          </div>
        </div>

        {emailStatus && !emailStatus.configured && (
          <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 text-xs rounded-sm mb-4 space-y-1">
            <div className="font-semibold flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-amber-700" />
              <span>Production Email Setup Required:</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              To physically receive inbox notifications when clients quote or freelancers apply, configure these server environment secrets:
            </p>
            <ul className="list-disc list-inside text-[11px] font-mono text-amber-950 mt-1">
              <li>AGENCY_NOTIFICATION_EMAIL="your-receiving-inbox@gmail.com"</li>
              <li>RESEND_API_KEY="re_..." (or SMTP_HOST, SMTP_USER, SMTP_PASS)</li>
            </ul>
          </div>
        )}

        {testResult && (
          <div
            className={`p-3 text-xs rounded-sm mb-4 border flex items-start gap-2 ${
              testResult.success
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-red-50 border-red-200 text-red-700'
            }`}
          >
            {testResult.success ? <Check className="w-4 h-4 mt-0.5 text-emerald-600 shrink-0" /> : <AlertCircle className="w-4 h-4 mt-0.5 text-red-600 shrink-0" />}
            <div>{testResult.message}</div>
          </div>
        )}

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleTestEmail}
            disabled={testingEmail}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#FAF8F5] border border-[#DDD7CD] hover:border-[#581825] text-xs font-semibold uppercase tracking-wider text-[#191816] rounded-sm transition-colors cursor-pointer disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5 text-[#581825]" />
            <span>{testingEmail ? 'Sending Test...' : 'Send Live Test Email'}</span>
          </button>
        </div>
      </div>

      {/* Database Summary Telemetry & Production Clean State */}
      <div className="bg-white border border-[#E2DDD5] p-6 rounded-sm shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-[#191816] flex items-center gap-2">
            <Database className="w-4 h-4 text-[#191816]" />
            <span>Database & Record Telemetry</span>
          </h3>
          <button
            type="button"
            onClick={handlePurgeDemoData}
            disabled={purgingDemo}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-800 hover:text-rose-950 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-sm cursor-pointer transition-colors"
            title="Clean out fictional demo leads, clients, and projects for a clean production workspace"
          >
            <Trash2 className="w-3 h-3 text-rose-700" />
            <span>{purgingDemo ? 'Cleaning...' : 'Clear Fictional Demo Records'}</span>
          </button>
        </div>
        <p className="text-xs text-[#6B665F] mb-4">
          Synchronized SQLite storage with WAL journaling mode for instant, real-time data persistence.
        </p>

        {purgeResult && (
          <div className="p-2.5 bg-blue-50 border border-blue-200 text-blue-900 text-xs rounded-sm mb-4">
            {purgeResult}
          </div>
        )}

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
