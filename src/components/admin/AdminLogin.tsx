import React, { useState } from 'react';
import { YLogo } from '../YLogo';
import { Lock, Mail, ArrowRight, ShieldCheck, KeyRound } from 'lucide-react';
import { agencyApi } from '../../services/agencyApi';
import { AgencyUser } from '../../types/admin';

interface AdminLoginProps {
  onSuccess: (user: AgencyUser) => void;
  onBackToSite: () => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onSuccess, onBackToSite }) => {
  const [email, setEmail] = useState('admin@yaawp.com');
  const [password, setPassword] = useState('yaawp_admin_2026!');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = await agencyApi.login(email, password);
      if (res.user) {
        onSuccess(res.user);
      }
    } catch (err: any) {
      setError(err?.message || 'Authentication failed. Please check credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFillDemo = () => {
    setEmail('admin@yaawp.com');
    setPassword('yaawp_admin_2026!');
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#191816] flex flex-col justify-between p-4 sm:p-8">
      {/* Top Bar */}
      <div className="max-w-6xl mx-auto w-full flex items-center justify-between pb-6 border-b border-[#E8E2D8]">
        <div className="flex items-center gap-3">
          <YLogo size="sm" />
          <span className="text-xs font-semibold uppercase tracking-wider text-[#5C5853]">
            Agency Operations
          </span>
        </div>
        <button
          onClick={onBackToSite}
          className="text-xs text-[#5C5853] hover:text-[#191816] font-medium tracking-wide transition-colors"
        >
          ← Return to public website
        </button>
      </div>

      {/* Main Login Card */}
      <div className="max-w-md w-full mx-auto my-12 bg-white border border-[#DDD7CD] p-8 sm:p-10 rounded-sm shadow-sm">
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-2.5 py-1 bg-[#581825]/10 text-[#581825] text-xs font-medium rounded-sm mb-4">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Private Agency Workspace</span>
          </div>
          <h1 className="font-serif text-3xl font-normal text-[#191816] tracking-tight mb-2">
            Director Access
          </h1>
          <p className="text-sm text-[#5C5853] font-normal leading-relaxed">
            Enter authorized credentials to manage client intake, project pipelines, and specialist delivery.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#191816] mb-1.5">
              Agency Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#8C867E] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@yaawp.com"
                className="w-full pl-9 pr-3 py-2.5 bg-[#FAF8F5] border border-[#DDD7CD] rounded-sm text-sm text-[#191816] focus:border-[#581825] focus:outline-none transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#191816] mb-1.5">
              Secure Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#8C867E] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-9 pr-3 py-2.5 bg-[#FAF8F5] border border-[#DDD7CD] rounded-sm text-sm text-[#191816] focus:border-[#581825] focus:outline-none transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full inline-flex items-center justify-center gap-2 py-3 px-6 bg-[#581825] text-white hover:bg-[#3E0E18] text-xs font-semibold uppercase tracking-wider rounded-sm transition-colors cursor-pointer disabled:opacity-50"
          >
            {isLoading ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <span>Enter Workspace</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-[#E8E2D8] bg-[#FAF8F5] -mx-8 -mb-8 p-6 rounded-b-sm">
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#581825] block mb-1">
                Demo Director Account
              </span>
              <p className="text-xs text-[#5C5853]">
                Email: <code className="text-[#191816] font-mono">admin@yaawp.com</code>
                <br />
                Pass: <code className="text-[#191816] font-mono">yaawp_admin_2026!</code>
              </p>
            </div>
            <button
              type="button"
              onClick={handleFillDemo}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#581825] hover:underline cursor-pointer"
            >
              <KeyRound className="w-3 h-3" />
              <span>Fill</span>
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="max-w-6xl mx-auto w-full text-center text-xs text-[#8C867E]">
        YAAWP Services Agency Operating System · Internal Use Only
      </div>
    </div>
  );
};
