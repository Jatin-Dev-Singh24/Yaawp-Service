import React, { useState } from 'react';
import {
  Users2,
  Search,
  Plus,
  ExternalLink,
  Star,
  CheckCircle2,
  MapPin,
  X,
  Trash2,
} from 'lucide-react';
import { Freelancer, FreelancerStatus, Project } from '../../types/admin';

interface AdminFreelancersProps {
  freelancers: Freelancer[];
  projects: Project[];
  onCreateFreelancer: (data: Partial<Freelancer>) => Promise<void>;
  onUpdateFreelancer: (id: string, data: Partial<Freelancer>) => Promise<void>;
  onDeleteFreelancer: (id: string) => Promise<void>;
  onSelectProject?: (projectId: string) => void;
}

export const AdminFreelancers: React.FC<AdminFreelancersProps> = ({
  freelancers,
  onCreateFreelancer,
  onUpdateFreelancer,
  onDeleteFreelancer,
}) => {
  const [selectedDiscipline, setSelectedDiscipline] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [inspectingSpecialist, setInspectingSpecialist] = useState<Freelancer | null>(null);
  const [isCreatingModal, setIsCreatingModal] = useState(false);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [locationTimezone, setLocationTimezone] = useState('');
  const [primarySkill, setPrimarySkill] = useState('Full-Stack / Frontend Developer');
  const [secondarySkills, setSecondarySkills] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [yearsExperience, setYearsExperience] = useState('6+ years');
  const [weeklyAvailability, setWeeklyAvailability] = useState('20-30 hours/week');
  const [hourlyRate, setHourlyRate] = useState('$85/hr');
  const [bio, setBio] = useState('');
  const [status, setStatus] = useState<FreelancerStatus>('Approved Network Member');
  const [internalNotes, setInternalNotes] = useState('');
  const [qualityRating, setQualityRating] = useState(5);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredSpecialists = freelancers.filter((f) => {
    const matchesDiscipline = selectedDiscipline === 'ALL' || f.primary_skill.includes(selectedDiscipline);
    const matchesStatus = selectedStatus === 'ALL' || f.status === selectedStatus;
    const matchesSearch =
      f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.primary_skill.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (f.secondary_skills && f.secondary_skills.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesDiscipline && matchesStatus && matchesSearch;
  });

  const getStatusBadge = (st: FreelancerStatus) => {
    switch (st) {
      case 'Approved Network Member':
        return 'bg-[#2E5E3A] text-white';
      case 'New Application':
        return 'bg-[#581825] text-white';
      case 'On Hold':
        return 'bg-[#D97706] text-white';
      case 'Rejected':
        return 'bg-red-800 text-white';
      case 'Inactive':
        return 'bg-neutral-600 text-white';
      default:
        return 'bg-neutral-200 text-neutral-800';
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onCreateFreelancer({
        name,
        email,
        location_timezone: locationTimezone,
        primary_skill: primarySkill,
        secondary_skills: secondarySkills,
        portfolio_url: portfolioUrl,
        years_experience: yearsExperience,
        weekly_availability: weeklyAvailability,
        hourly_rate: hourlyRate,
        bio,
        status,
        internal_notes: internalNotes,
        quality_rating: qualityRating,
      });
      setIsCreatingModal(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E8E2D8]">
        <div>
          <span className="text-xs font-semibold uppercase tracking-widest text-[#581825] block mb-1">
            Curated Network Management
          </span>
          <h1 className="font-serif text-3xl font-normal text-[#191816] tracking-tight">
            Specialist Network
          </h1>
          <p className="text-xs text-[#6B665F] mt-1">
            Vetted independent designers, engineers, and strategists deployed to client projects.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-full sm:w-64 relative">
            <Search className="w-4 h-4 text-[#8C867E] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search specialists..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white border border-[#DDD7CD] rounded-sm text-xs text-[#191816] focus:border-[#581825] focus:outline-none"
            />
          </div>

          <button
            onClick={() => setIsCreatingModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#581825] hover:bg-[#3E0E18] text-white text-xs font-semibold uppercase tracking-wider rounded-sm transition-colors cursor-pointer shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Specialist</span>
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E8E2D8] pb-3 text-xs">
        <div className="flex flex-wrap gap-1.5">
          {['ALL', 'Developer', 'Designer', 'Brand', 'Motion', 'Copywriter'].map((d) => (
            <button
              key={d}
              onClick={() => setSelectedDiscipline(d)}
              className={`px-3 py-1.5 rounded-sm font-semibold tracking-wide transition-colors cursor-pointer ${
                selectedDiscipline === d
                  ? 'bg-[#191816] text-white'
                  : 'bg-white border border-[#E2DDD5] text-[#5C5853] hover:text-[#191816]'
              }`}
            >
              {d === 'ALL' ? 'All Disciplines' : d}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[#8C867E] text-[11px] font-medium uppercase tracking-wider">Status:</span>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-2.5 py-1 bg-white border border-[#DDD7CD] rounded-sm text-xs text-[#191816] cursor-pointer"
          >
            <option value="ALL">All Statuses ({freelancers.length})</option>
            <option value="New Application">New Applications</option>
            <option value="Approved Network Member">Approved Members</option>
            <option value="On Hold">On Hold</option>
            <option value="Rejected">Rejected</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
      </div>

      {filteredSpecialists.length === 0 ? (
        <div className="bg-white border border-[#E2DDD5] p-12 text-center rounded-sm">
          <Users2 className="w-8 h-8 text-[#8C867E] mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-[#191816]">No specialists match filters</h3>
          <p className="text-xs text-[#6B665F] mt-1">Try resetting search criteria or status filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredSpecialists.map((spc) => (
            <div
              key={spc.id}
              className="bg-white border border-[#E2DDD5] p-5 rounded-sm hover:border-[#581825] transition-all flex flex-col justify-between shadow-2xs group"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-[#581825] block">
                      {spc.primary_skill}
                    </span>
                    <h3 className="text-base font-semibold text-[#191816] leading-tight">{spc.name}</h3>
                  </div>

                  <select
                    value={spc.status}
                    onChange={(e) =>
                      onUpdateFreelancer(spc.id, { status: e.target.value as FreelancerStatus })
                    }
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-sm border-none cursor-pointer ${getStatusBadge(
                      spc.status
                    )}`}
                  >
                    <option value="New Application" className="bg-white text-black">New Application</option>
                    <option value="Approved Network Member" className="bg-white text-black">Approved Member</option>
                    <option value="On Hold" className="bg-white text-black">On Hold</option>
                    <option value="Rejected" className="bg-white text-black">Rejected</option>
                    <option value="Inactive" className="bg-white text-black">Inactive</option>
                  </select>
                </div>

                <div className="flex items-center gap-3 text-xs text-[#6B665F] mb-3">
                  <div className="flex items-center text-[#8B5E3C]">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3 h-3 ${
                          i < spc.quality_rating ? 'fill-[#8B5E3C] text-[#8B5E3C]' : 'text-neutral-300'
                        }`}
                      />
                    ))}
                  </div>
                  {spc.location_timezone && (
                    <span className="flex items-center gap-1 text-[11px] text-[#8C867E]">
                      <MapPin className="w-3 h-3" />
                      <span>{spc.location_timezone}</span>
                    </span>
                  )}
                </div>

                {spc.secondary_skills && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {spc.secondary_skills.split(',').slice(0, 3).map((s: string, i: number) => (
                      <span
                        key={i}
                        className="text-[10px] px-1.5 py-0.5 bg-[#FAF8F5] border border-[#E8E2D8] text-[#5C5853] rounded-sm truncate"
                      >
                        {s.trim()}
                      </span>
                    ))}
                  </div>
                )}

                {spc.bio && (
                  <p className="text-xs text-[#5C5853] line-clamp-2 leading-relaxed mb-3">
                    {spc.bio}
                  </p>
                )}

                {spc.internal_notes && (
                  <div className="bg-[#FAF8F5] p-2 rounded-sm border border-[#E8E2D8] text-[11px] text-[#6B665F] mb-3 italic line-clamp-1">
                    "{spc.internal_notes}"
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-[#F0EBE1] text-xs">
                <div className="grid grid-cols-2 gap-2 mb-3 text-[11px] text-[#5C5853]">
                  <div>
                    <span className="text-[#8C867E] block">Availability:</span>
                    <span className="font-semibold text-[#191816] truncate block">
                      {spc.weekly_availability || 'Flexible'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#8C867E] block">Rate Range:</span>
                    <span className="font-semibold text-[#191816] truncate block">
                      {spc.hourly_rate || 'Negotiated'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={spc.portfolio_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 border border-[#DDD7CD] hover:border-[#191816] text-[#191816] rounded-sm transition-colors"
                    title="Open portfolio"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>

                  <button
                    onClick={() => setInspectingSpecialist(spc)}
                    className="flex-1 py-1.5 text-xs font-semibold uppercase tracking-wider border border-[#DDD7CD] hover:border-[#191816] text-[#191816] rounded-sm transition-colors cursor-pointer text-center"
                  >
                    Inspect Profile
                  </button>

                  {spc.status === 'New Application' && (
                    <button
                      onClick={() =>
                        onUpdateFreelancer(spc.id, { status: 'Approved Network Member' })
                      }
                      className="px-2.5 py-1.5 text-[11px] font-semibold bg-[#2E5E3A] hover:bg-[#204529] text-white rounded-sm transition-colors cursor-pointer"
                      title="Approve to network"
                    >
                      Approve
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {inspectingSpecialist && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white border border-[#DDD7CD] max-w-xl w-full p-6 sm:p-8 rounded-sm shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-[#E8E2D8] mb-6">
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[#581825]">
                  Specialist Dossier
                </span>
                <h3 className="font-serif text-2xl text-[#191816] font-normal">
                  {inspectingSpecialist.name}
                </h3>
                <span className="text-xs text-[#8C867E]">
                  {inspectingSpecialist.primary_skill} · Joined{' '}
                  {new Date(inspectingSpecialist.created_at).toLocaleDateString()}
                </span>
              </div>
              <button
                onClick={() => setInspectingSpecialist(null)}
                className="p-1 text-[#8C867E] hover:text-[#191816] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-5 text-xs">
              <div className="grid grid-cols-2 gap-4 bg-[#FAF8F5] p-4 rounded-sm border border-[#E8E2D8]">
                <div>
                  <span className="text-[#8C867E] font-medium block">Email:</span>
                  <a href={`mailto:${inspectingSpecialist.email}`} className="text-[#581825] font-semibold hover:underline">
                    {inspectingSpecialist.email}
                  </a>
                </div>
                <div>
                  <span className="text-[#8C867E] font-medium block">Timezone:</span>
                  <span className="text-[#191816] font-semibold">
                    {inspectingSpecialist.location_timezone || 'Remote'}
                  </span>
                </div>
                <div>
                  <span className="text-[#8C867E] font-medium block">Experience:</span>
                  <span className="text-[#191816] font-semibold">
                    {inspectingSpecialist.years_experience || 'Not stated'}
                  </span>
                </div>
                <div>
                  <span className="text-[#8C867E] font-medium block">Rate:</span>
                  <span className="text-[#191816] font-semibold">
                    {inspectingSpecialist.hourly_rate || 'To be agreed'}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-[#8C867E] font-medium block mb-1">Portfolio Link:</span>
                <a
                  href={inspectingSpecialist.portfolio_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#581825] font-semibold hover:underline flex items-center gap-1.5"
                >
                  <span>{inspectingSpecialist.portfolio_url}</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              {inspectingSpecialist.secondary_skills && (
                <div>
                  <span className="text-[#8C867E] font-medium block mb-1">Technical Stack:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {inspectingSpecialist.secondary_skills.split(',').map((s: string, i: number) => (
                      <span key={i} className="px-2 py-1 bg-[#FAF8F5] border border-[#DDD7CD] rounded-sm text-[#191816]">
                        {s.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {inspectingSpecialist.bio && (
                <div>
                  <span className="text-[#8C867E] font-medium block mb-1">Bio:</span>
                  <p className="p-3 bg-[#FAF8F5] border border-[#E8E2D8] rounded-sm text-[#191816] leading-relaxed">
                    {inspectingSpecialist.bio}
                  </p>
                </div>
              )}

              <div>
                <span className="text-[#8C867E] font-medium block mb-1">
                  Private Agency Notes & Observations:
                </span>
                <textarea
                  rows={2}
                  defaultValue={inspectingSpecialist.internal_notes || ''}
                  onBlur={(e) =>
                    onUpdateFreelancer(inspectingSpecialist.id, { internal_notes: e.target.value })
                  }
                  className="w-full p-2.5 bg-[#FAF8F5] border border-[#DDD7CD] rounded-sm text-xs text-[#191816] focus:border-[#581825] focus:outline-none"
                />
              </div>

              <div className="pt-4 border-t border-[#E8E2D8] flex items-center justify-between">
                <button
                  onClick={() =>
                    onDeleteFreelancer(inspectingSpecialist.id).then(() => setInspectingSpecialist(null))
                  }
                  className="text-red-700 hover:text-red-900 text-xs font-medium cursor-pointer inline-flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove Specialist</span>
                </button>

                <div className="flex items-center gap-2">
                  {inspectingSpecialist.status !== 'Approved Network Member' && (
                    <button
                      onClick={() => {
                        onUpdateFreelancer(inspectingSpecialist.id, { status: 'Approved Network Member' });
                        setInspectingSpecialist({ ...inspectingSpecialist, status: 'Approved Network Member' });
                      }}
                      className="px-4 py-2 bg-[#2E5E3A] hover:bg-[#204529] text-white text-xs font-semibold uppercase tracking-wider rounded-sm transition-colors cursor-pointer inline-flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Approve to Network</span>
                    </button>
                  )}

                  <button
                    onClick={() => setInspectingSpecialist(null)}
                    className="px-4 py-2 bg-[#191816] text-white text-xs font-semibold uppercase tracking-wider rounded-sm cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {isCreatingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white border border-[#DDD7CD] max-w-lg w-full p-6 sm:p-8 rounded-sm shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-[#E8E2D8] mb-5">
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-[#581825]">
                  Network Roster
                </span>
                <h3 className="font-serif text-xl text-[#191816] font-normal">
                  Add Independent Specialist
                </h3>
              </div>
              <button onClick={() => setIsCreatingModal(false)} className="p-1 text-[#8C867E] hover:text-[#191816] cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#191816] mb-1">
                    Specialist Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Liam O'Connor"
                    className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#DDD7CD] rounded-sm text-xs text-[#191816] focus:border-[#581825] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#191816] mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="liam@domain.com"
                    className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#DDD7CD] rounded-sm text-xs text-[#191816] focus:border-[#581825] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#191816] mb-1">
                    Primary Discipline *
                  </label>
                  <select
                    value={primarySkill}
                    onChange={(e) => setPrimarySkill(e.target.value)}
                    className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#DDD7CD] rounded-sm text-xs text-[#191816] focus:border-[#581825] focus:outline-none"
                  >
                    <option value="Full-Stack / Frontend Developer">Full-Stack / Frontend Developer</option>
                    <option value="UI/UX & Digital Product Designer">UI/UX & Digital Product Designer</option>
                    <option value="Brand Identity & Visual Designer">Brand Identity & Visual Designer</option>
                    <option value="Strategic Marketing & Performance Advisor">Strategic Marketing & Performance</option>
                    <option value="Editorial Copywriter & Narrative Strategist">Editorial Copywriter & Narrative</option>
                    <option value="Video & Creative Motion Specialist">Video & Creative Motion Specialist</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#191816] mb-1">
                    Location & Timezone
                  </label>
                  <input
                    type="text"
                    value={locationTimezone}
                    onChange={(e) => setLocationTimezone(e.target.value)}
                    placeholder="London (UTC+1)"
                    className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#DDD7CD] rounded-sm text-xs text-[#191816] focus:border-[#581825] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#191816] mb-1">
                  Portfolio / Repository URL *
                </label>
                <input
                  type="url"
                  required
                  value={portfolioUrl}
                  onChange={(e) => setPortfolioUrl(e.target.value)}
                  placeholder="https://github.com/..."
                  className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#DDD7CD] rounded-sm text-xs text-[#191816] focus:border-[#581825] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#191816] mb-1">
                  Secondary Skills / Stack
                </label>
                <input
                  type="text"
                  value={secondarySkills}
                  onChange={(e) => setSecondarySkills(e.target.value)}
                  placeholder="React, Next.js, Tailwind, GraphQL, Shopify"
                  className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#DDD7CD] rounded-sm text-xs text-[#191816] focus:border-[#581825] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#191816] mb-1">
                    Hourly / Day Rate
                  </label>
                  <input
                    type="text"
                    value={hourlyRate}
                    onChange={(e) => setHourlyRate(e.target.value)}
                    placeholder="$85/hr"
                    className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#DDD7CD] rounded-sm text-xs text-[#191816] focus:border-[#581825] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#191816] mb-1">
                    Weekly Availability
                  </label>
                  <input
                    type="text"
                    value={weeklyAvailability}
                    onChange={(e) => setWeeklyAvailability(e.target.value)}
                    placeholder="20-30 hours/week"
                    className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#DDD7CD] rounded-sm text-xs text-[#191816] focus:border-[#581825] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold uppercase tracking-wider text-[#191816] mb-1">
                  Private Agency Notes
                </label>
                <textarea
                  rows={2}
                  value={internalNotes}
                  onChange={(e) => setInternalNotes(e.target.value)}
                  placeholder="Notes about craft, reliability, communication style..."
                  className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#DDD7CD] rounded-sm text-xs text-[#191816] focus:border-[#581825] focus:outline-none"
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
                  {isSubmitting ? 'Saving...' : 'Add Specialist'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
