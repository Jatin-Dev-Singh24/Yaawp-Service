import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';

const DATA_DIR = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, 'yaawp.db');
export const db = new DatabaseSync(DB_PATH);

db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      salt TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'admin',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      email TEXT NOT NULL,
      role TEXT NOT NULL,
      created_at TEXT NOT NULL,
      expires_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS leads (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      company TEXT,
      service TEXT NOT NULL,
      budget_range TEXT,
      timeline TEXT,
      project_details TEXT,
      website_or_social TEXT,
      status TEXT NOT NULL DEFAULT 'New',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS clients (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      company TEXT,
      phone TEXT,
      notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS freelancers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      location_timezone TEXT,
      primary_skill TEXT NOT NULL,
      secondary_skills TEXT,
      portfolio_url TEXT NOT NULL,
      years_experience TEXT,
      weekly_availability TEXT,
      hourly_rate TEXT,
      bio TEXT,
      status TEXT NOT NULL DEFAULT 'New Application',
      internal_notes TEXT,
      quality_rating INTEGER DEFAULT 5,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      client_id TEXT REFERENCES clients(id) ON DELETE SET NULL,
      name TEXT NOT NULL,
      description TEXT,
      services TEXT,
      start_date TEXT,
      deadline TEXT,
      budget_value TEXT,
      status TEXT NOT NULL DEFAULT 'Planning',
      internal_notes TEXT,
      client_notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS project_freelancers (
      project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
      freelancer_id TEXT REFERENCES freelancers(id) ON DELETE CASCADE,
      role_in_project TEXT,
      created_at TEXT NOT NULL,
      PRIMARY KEY (project_id, freelancer_id)
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      description TEXT,
      assigned_freelancer_id TEXT REFERENCES freelancers(id) ON DELETE SET NULL,
      status TEXT NOT NULL DEFAULT 'Backlog',
      priority TEXT NOT NULL DEFAULT 'Medium',
      deadline TEXT,
      order_index INTEGER NOT NULL DEFAULT 0,
      revision_instructions TEXT,
      internal_notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS task_checklists (
      id TEXT PRIMARY KEY,
      task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      is_completed INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS task_comments (
      id TEXT PRIMARY KEY,
      task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
      author_name TEXT NOT NULL,
      author_role TEXT NOT NULL,
      author_id TEXT NOT NULL,
      content TEXT NOT NULL,
      is_internal INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS activity_events (
      id TEXT PRIMARY KEY,
      project_id TEXT,
      task_id TEXT,
      actor_name TEXT NOT NULL,
      action_type TEXT NOT NULL,
      description TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      recipient_role TEXT NOT NULL DEFAULT 'admin',
      recipient_id TEXT,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      link_type TEXT,
      link_id TEXT,
      is_read INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  // Lightweight schema upgrades for project files, task files, and lead internal notes
  try { db.exec(`ALTER TABLE leads ADD COLUMN internal_notes TEXT;`); } catch {}
  try { db.exec(`ALTER TABLE projects ADD COLUMN files_json TEXT;`); } catch {}
  try { db.exec(`ALTER TABLE tasks ADD COLUMN files_json TEXT;`); } catch {}
  try { db.exec(`UPDATE users SET role = 'owner' WHERE role = 'admin';`); } catch {}

  const isDev = process.env.NODE_ENV !== 'production' || process.env.DEMO_MODE === 'true';
  const hasEnvCredentials = Boolean(process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD);

  if (hasEnvCredentials) {
    const adminEmail = process.env.ADMIN_EMAIL!.trim().toLowerCase();
    const adminPassword = process.env.ADMIN_PASSWORD!;
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.scryptSync(adminPassword, salt, 64).toString('hex');
    const existingAdmin = db.prepare('SELECT id FROM users WHERE LOWER(email) = ?').get(adminEmail) as { id: string } | undefined;
    if (!existingAdmin) {
      const id = 'usr_' + crypto.randomUUID();
      db.prepare(`
        INSERT INTO users (id, email, password_hash, salt, name, role, created_at)
        VALUES (?, ?, ?, ?, ?, 'owner', ?)
      `).run(id, adminEmail, hash, salt, 'Agency Owner', new Date().toISOString());
      console.log(`[YAAWP Auth] Configured agency owner account for: ${adminEmail}`);
    } else {
      db.prepare("UPDATE users SET password_hash = ?, salt = ?, role = 'owner' WHERE id = ?").run(hash, salt, existingAdmin.id);
    }
  } else if (isDev) {
    // Only in development or demo mode
    const devEmail = 'admin@yaawp.com';
    const devPass = 'yaawp_admin_2026!';
    const existingAdmin = db.prepare('SELECT id FROM users WHERE email = ?').get(devEmail) as { id: string } | undefined;
    if (!existingAdmin) {
      const salt = crypto.randomBytes(16).toString('hex');
      const hash = crypto.scryptSync(devPass, salt, 64).toString('hex');
      const id = 'usr_' + crypto.randomUUID();
      db.prepare(`
        INSERT INTO users (id, email, password_hash, salt, name, role, created_at)
        VALUES (?, ?, ?, ?, ?, 'owner', ?)
      `).run(id, devEmail, hash, salt, 'Agency Owner (Dev)', new Date().toISOString());
      console.log('[YAAWP Auth] Development demo owner administrator initialized.');
    } else {
      db.prepare("UPDATE users SET role = 'owner' WHERE id = ?").run(existingAdmin.id);
    }
  } else {
    console.warn('[YAAWP Auth] Security notice: Production environment detected without ADMIN_EMAIL and ADMIN_PASSWORD. No default credentials created.');
  }

  // Sync Agency Notification Email without hard-coded personal email addresses
  const existingAgencyEmail = db.prepare("SELECT value FROM settings WHERE key = 'agency_notification_email'").get() as { value: string } | undefined;
  const configuredEmail = process.env.AGENCY_NOTIFICATION_EMAIL?.trim() || '';
  if (!existingAgencyEmail) {
    db.prepare("INSERT INTO settings (key, value) VALUES ('agency_notification_email', ?)").run(configuredEmail);
    db.prepare("INSERT INTO settings (key, value) VALUES ('agency_currency', 'USD')").run();
    db.prepare("INSERT INTO settings (key, value) VALUES ('notify_on_lead', 'true')").run();
    db.prepare("INSERT INTO settings (key, value) VALUES ('notify_on_review', 'true')").run();
    db.prepare("INSERT INTO settings (key, value) VALUES ('notify_on_overdue', 'true')").run();
  } else if (configuredEmail && existingAgencyEmail.value !== configuredEmail) {
    db.prepare("UPDATE settings SET value = ? WHERE key = 'agency_notification_email'").run(configuredEmail);
  }

  // Only seed fictional demo data in development / demo mode
  if (isDev) {
    seedInitialDataIfEmpty();
  } else {
    console.log('[YAAWP Database] Production environment: Preserving real data only (no fictional demo records seeded).');
  }
}

function seedInitialDataIfEmpty() {
  const leadCountRow = db.prepare('SELECT COUNT(*) as count FROM leads').get() as { count: number };
  if (leadCountRow.count > 0) return;

  const now = new Date();
  const isoNow = now.toISOString();
  const daysAgo = (days: number) => new Date(now.getTime() - days * 86400000).toISOString();
  const daysAhead = (days: number) => new Date(now.getTime() + days * 86400000).toISOString().split('T')[0];
  const daysPastDate = (days: number) => new Date(now.getTime() - days * 86400000).toISOString().split('T')[0];

  const clients = [
    { id: 'cli_aura', name: 'Clara Dupont', email: 'clara@auraceramics.com', company: 'Aura Studio', phone: '+1 (415) 882-9011', notes: 'Luxury ceramics and bespoke stoneware brand.', created_at: daysAgo(25) },
    { id: 'cli_kanso', name: 'Tobias Lindqvist', email: 'tobias@kansogroup.com', company: 'Kanso Collective', phone: '+44 20 7946 0912', notes: 'Scandinavian architectural furniture brand.', created_at: daysAgo(35) },
    { id: 'cli_monolith', name: 'Julian Thorne', email: 'julian@monolith-arch.com', company: 'Monolith Architects', phone: '+1 (212) 555-0199', notes: 'Boutique architectural practice.', created_at: daysAgo(18) },
    { id: 'cli_vanguard', name: 'Beatriz Morales', email: 'beatriz@vanguardedit.com', company: 'Vanguard Group', phone: '+1 (312) 555-4301', notes: 'Financial advisory and private equity insights firm.', created_at: daysAgo(12) },
    { id: 'cli_solas', name: 'Dr. Aris Thorne', email: 'aris@solaswellbeing.com', company: 'Solas Life', phone: '+1 (650) 412-8700', notes: 'Healthtech venture delivering preventive biometric insights.', created_at: daysAgo(45) },
  ];

  for (const c of clients) {
    db.prepare(`
      INSERT INTO clients (id, name, email, company, phone, notes, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(c.id, c.name, c.email, c.company, c.phone, c.notes, c.created_at, c.created_at);
  }

  const specialists = [
    { id: 'spc_liam', name: 'Liam O’Connor', email: 'liam.dev@yaawp-network.internal', location_timezone: 'London (UTC+1)', primary_skill: 'Full-Stack / Frontend Developer', secondary_skills: 'Next.js, TypeScript, Tailwind, GraphQL, Shopify Storefront API', portfolio_url: 'https://github.com/liamoconnor', years_experience: '8 years', weekly_availability: '25-30 hours/week', hourly_rate: '$85/hr', bio: 'Former senior engineer at high-growth studio.', status: 'Approved Network Member', internal_notes: 'Super reliable, fast turnaround, immaculate code review quality.', quality_rating: 5, created_at: daysAgo(60) },
    { id: 'spc_claire', name: 'Claire Delaunay', email: 'claire.design@yaawp-network.internal', location_timezone: 'Paris (UTC+2)', primary_skill: 'Brand Identity & Visual Designer', secondary_skills: 'Typography Systems, Art Direction, Editorial Packaging', portfolio_url: 'https://behance.net/clairedelaunay', years_experience: '7 years', weekly_availability: '15-20 hours/week', hourly_rate: '$75/hr', bio: 'Boutique art director trained in Milan and Paris.', status: 'Approved Network Member', internal_notes: 'Exquisite eye for whitespace and typography.', quality_rating: 5, created_at: daysAgo(50) },
    { id: 'spc_david', name: 'David Kalu', email: 'david.motion@yaawp-network.internal', location_timezone: 'Berlin (UTC+2)', primary_skill: 'Video & Creative Motion Specialist', secondary_skills: 'Three.js, WebGL, Framer Motion, 3D Product Interactive', portfolio_url: 'https://davidkalu.studio', years_experience: '6 years', weekly_availability: '20 hours/week', hourly_rate: '$90/hr', bio: 'Creative technologist combining WebGL shaders with subtle narrative transitions.', status: 'Approved Network Member', internal_notes: 'Best for hero interactive moments.', quality_rating: 5, created_at: daysAgo(40) },
    { id: 'spc_maya', name: 'Maya Lin', email: 'maya.ux@yaawp-network.internal', location_timezone: 'Vancouver (UTC-7)', primary_skill: 'UI/UX & Digital Product Designer', secondary_skills: 'Design Systems, Figma Variables, User Research, Accessibility', portfolio_url: 'https://mayalin.design', years_experience: '9 years', weekly_availability: '25 hours/week', hourly_rate: '$80/hr', bio: 'Product designer focusing on editorial dashboards.', status: 'Approved Network Member', internal_notes: 'Strict zero-pill discipline.', quality_rating: 5, created_at: daysAgo(35) },
    { id: 'spc_james', name: 'James Henderson', email: 'james.copy@yaawp-network.internal', location_timezone: 'Edinburgh (UTC+1)', primary_skill: 'Editorial Copywriter & Narrative Strategist', secondary_skills: 'Brand Messaging, Tone of Voice, Case Studies', portfolio_url: 'https://readjameshenderson.com', years_experience: '10 years', weekly_availability: '15 hours/week', hourly_rate: '$65/hr', bio: 'Former financial journalist and creative agency copy lead.', status: 'Approved Network Member', internal_notes: 'Excellent for manifesto decks.', quality_rating: 5, created_at: daysAgo(30) },
    { id: 'spc_soren', name: 'Soren Nielsen', email: 'soren.n@cphcode.io', location_timezone: 'Copenhagen (UTC+2)', primary_skill: 'Full-Stack / Frontend Developer', secondary_skills: 'Go, Node.js, SQLite, High-concurrency APIs', portfolio_url: 'https://sorennielsen.dev', years_experience: '5+ years', weekly_availability: '20-30 hours/week', hourly_rate: '$70/hr', bio: 'Backend and systems engineer.', status: 'New Application', internal_notes: 'Submitted via public form.', quality_rating: 4, created_at: daysAgo(2) },
    { id: 'spc_zoe', name: 'Zoe Kravitz-Vance', email: 'zoe.k@narrativestudio.co', location_timezone: 'New York (UTC-4)', primary_skill: 'Strategic Marketing & Performance Advisor', secondary_skills: 'Positioning, Editorial Distribution, B2B Growth', portfolio_url: 'https://zoenarrative.substack.com', years_experience: '6 years', weekly_availability: '15 hours/week', hourly_rate: '$85/hr', bio: 'Specialist in organic distribution.', status: 'New Application', internal_notes: 'Strong references.', quality_rating: 4, created_at: daysAgo(1) },
  ];

  for (const s of specialists) {
    db.prepare(`
      INSERT INTO freelancers (
        id, name, email, location_timezone, primary_skill, secondary_skills, portfolio_url,
        years_experience, weekly_availability, hourly_rate, bio, status, internal_notes,
        quality_rating, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      s.id, s.name, s.email, s.location_timezone, s.primary_skill, s.secondary_skills, s.portfolio_url,
      s.years_experience, s.weekly_availability, s.hourly_rate, s.bio, s.status, s.internal_notes,
      s.quality_rating, s.created_at, s.created_at
    );
  }

  // 3 New Leads (satisfying "NEW LEADS: 3")
  const leads = [
    { id: 'lead_elena', name: 'Elena Rostova', email: 'elena@vanguardfinearts.org', company: 'Vanguard Fine Arts', service: 'Web Development', budget_range: '$12,000 - $18,000', timeline: 'Within 6-8 weeks', project_details: 'Seeking bespoke portfolio and archival catalog for contemporary sculptors.', website_or_social: 'https://instagram.com/vanguardfinearts', status: 'New', created_at: daysAgo(1) },
    { id: 'lead_marcus', name: 'Marcus Vance', email: 'marcus@kansoliving.de', company: 'Kanso Living', service: 'Brand Identity & Strategy', budget_range: '$8,000 - $12,000', timeline: 'Next quarter', project_details: 'Launching minimalist Scandinavian furniture line. Need typography guidelines and digital packaging tokens.', website_or_social: 'https://kansoliving.de', status: 'New', created_at: daysAgo(2) },
    { id: 'lead_sophia', name: 'Sophia Chen', email: 'sophia@luminahealth.co', company: 'Lumina Health', service: 'UI/UX & Digital Product Design', budget_range: '$15,000 - $25,000', timeline: 'Immediate start', project_details: 'Clinical patient telemetry web app interface with high clarity and accessible typography.', website_or_social: 'https://luminahealth.co', status: 'New', created_at: daysAgo(3) },
    { id: 'lead_henri', name: 'Henri de Vries', email: 'henri@ateliermodern.nl', company: 'Atelier Modern Amsterdam', service: 'Web Development', budget_range: '$10,000 - $15,000', timeline: 'Within 4-6 weeks', project_details: 'Architectural showroom digital presence.', website_or_social: 'https://ateliermodern.nl', status: 'Contacted', created_at: daysAgo(5) },
    { id: 'lead_clara_dupont', name: 'Clara Dupont', email: 'clara@auraceramics.com', company: 'Aura Studio', service: 'Web Development', budget_range: '$15,000+', timeline: '4-8 weeks', project_details: 'Artisanal ceramic studio flagship store.', website_or_social: 'https://auraceramics.com', status: 'Converted', created_at: daysAgo(30) },
  ];

  for (const l of leads) {
    db.prepare(`
      INSERT INTO leads (
        id, name, email, company, service, budget_range, timeline,
        project_details, website_or_social, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(l.id, l.name, l.email, l.company, l.service, l.budget_range, l.timeline, l.project_details, l.website_or_social, l.status, l.created_at, l.created_at);
  }

  // 5 Active Projects (satisfying "ACTIVE PROJECTS: 5")
  const projects = [
    { id: 'prj_aura', client_id: 'cli_aura', name: 'Aura Fine Ceramics eCommerce', description: 'Headless digital boutique for artisanal stoneware.', services: 'Web Development, UI/UX Design, Creative Direction', start_date: daysAgo(20).split('T')[0], deadline: daysAhead(10), budget_value: '$16,500', status: 'In Progress', internal_notes: 'Liam handling storefront; Claire finalized packaging tokens.', client_notes: 'Milestone 2 completed.', created_at: daysAgo(20) },
    { id: 'prj_kanso', client_id: 'cli_kanso', name: 'Kanso Studio Identity & Platform', description: 'Brand repositioning, design tokens, and catalog website.', services: 'Branding, Web Development, UI/UX Design', start_date: daysAgo(15).split('T')[0], deadline: daysAhead(18), budget_value: '$14,000', status: 'In Progress', internal_notes: 'Maya delivering UI design components.', client_notes: 'Build phase underway.', created_at: daysAgo(15) },
    { id: 'prj_monolith', client_id: 'cli_monolith', name: 'Monolith Architecture Portfolio', description: 'Architectural portfolio with blueprint viewer.', services: 'Web Development, Content Strategy', start_date: daysAgo(14).split('T')[0], deadline: daysAhead(4), budget_value: '$9,500', status: 'Review', internal_notes: 'Final agency owner QA review in progress.', client_notes: 'Preview demo scheduled.', created_at: daysAgo(14) },
    { id: 'prj_vanguard', client_id: 'cli_vanguard', name: 'Vanguard Financial Editorial', description: 'Editorial intelligence platform for institutional private equity.', services: 'UI/UX Design, Editorial Copywriting', start_date: daysAgo(8).split('T')[0], deadline: daysAhead(28), budget_value: '$11,000', status: 'Planning', internal_notes: 'James drafting core editorial tone guidelines.', client_notes: 'Discovery workshop completed.', created_at: daysAgo(8) },
    { id: 'prj_solas', client_id: 'cli_solas', name: 'Solas Wellbeing Web App', description: 'Interactive dashboard for patient biometric wellness telemetry.', services: 'Full-Stack Web Development, UI/UX Design', start_date: daysAgo(40).split('T')[0], deadline: daysPastDate(1), budget_value: '$22,000', status: 'In Progress', internal_notes: 'Telemetry sync milestone overdue. Liam resolving websocket connection edge cases today.', client_notes: 'Final staging test.', created_at: daysAgo(40) },
  ];

  for (const p of projects) {
    db.prepare(`
      INSERT INTO projects (
        id, client_id, name, description, services, start_date, deadline,
        budget_value, status, internal_notes, client_notes, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(p.id, p.client_id, p.name, p.description, p.services, p.start_date, p.deadline, p.budget_value, p.status, p.internal_notes, p.client_notes, p.created_at, p.created_at);
  }

  const projectFreelancers = [
    { project_id: 'prj_aura', freelancer_id: 'spc_liam', role_in_project: 'Lead Frontend Engineer' },
    { project_id: 'prj_aura', freelancer_id: 'spc_claire', role_in_project: 'Art Director' },
    { project_id: 'prj_aura', freelancer_id: 'spc_david', role_in_project: '3D Technologist' },
    { project_id: 'prj_kanso', freelancer_id: 'spc_maya', role_in_project: 'UI/UX Lead' },
    { project_id: 'prj_kanso', freelancer_id: 'spc_claire', role_in_project: 'Brand Consultant' },
    { project_id: 'prj_monolith', freelancer_id: 'spc_liam', role_in_project: 'Full-Stack Developer' },
    { project_id: 'prj_monolith', freelancer_id: 'spc_james', role_in_project: 'Narrative Writer' },
    { project_id: 'prj_vanguard', freelancer_id: 'spc_james', role_in_project: 'Principal Strategist' },
    { project_id: 'prj_vanguard', freelancer_id: 'spc_maya', role_in_project: 'Product Designer' },
    { project_id: 'prj_solas', freelancer_id: 'spc_liam', role_in_project: 'Application Architect' },
  ];

  for (const pf of projectFreelancers) {
    db.prepare(`
      INSERT INTO project_freelancers (project_id, freelancer_id, role_in_project, created_at)
      VALUES (?, ?, ?, ?)
    `).run(pf.project_id, pf.freelancer_id, pf.role_in_project, daysAgo(10));
  }

  // 4 Tasks in Needs Review (satisfying "AWAITING REVIEW: 4") & 1 Overdue (satisfying "OVERDUE: 1")
  const tasks = [
    { id: 'tsk_rev_1', project_id: 'prj_aura', title: 'Review headless Shopify checkout integration', description: 'Liam completed headless GraphQL checkout pipeline.', assigned_freelancer_id: 'spc_liam', status: 'Needs Review', priority: 'High', deadline: daysAhead(2), order_index: 0, internal_notes: 'Verify tax calculation edge cases before final sign-off.', created_at: daysAgo(3) },
    { id: 'tsk_rev_2', project_id: 'prj_monolith', title: 'QA responsive layouts on tablet and mobile viewports', description: 'Architectural image grids and blueprint drawers need thorough inspection on iPad and mobile Safari.', assigned_freelancer_id: 'spc_liam', status: 'Needs Review', priority: 'Medium', deadline: daysAhead(3), order_index: 1, internal_notes: 'Tested on desktop Chrome, looks sharp.', created_at: daysAgo(4) },
    { id: 'tsk_rev_3', project_id: 'prj_vanguard', title: 'Editorial manifesto copy review', description: 'Draft of Vanguard macroeconomic editorial statement and narrative pillars.', assigned_freelancer_id: 'spc_james', status: 'Needs Review', priority: 'High', deadline: daysAhead(4), order_index: 2, internal_notes: 'Tone is confident and restrained.', created_at: daysAgo(2) },
    { id: 'tsk_rev_4', project_id: 'prj_aura', title: 'Review ceramic 3D interactive viewer prototype', description: 'David submitted WebGL turntable showing stoneware with tactile glaze reflection.', assigned_freelancer_id: 'spc_david', status: 'Needs Review', priority: 'Medium', deadline: daysAhead(5), order_index: 3, internal_notes: 'Check 60fps frame rate on mobile.', created_at: daysAgo(2) },
    { id: 'tsk_rev_req', project_id: 'prj_kanso', title: 'Refine typography scale in mobile navigation drawer', description: 'Mobile navigation menu links feel slightly crowded.', assigned_freelancer_id: 'spc_maya', status: 'Revisions Requested', priority: 'High', deadline: daysAhead(2), order_index: 0, internal_notes: 'Maya working on patch.', created_at: daysAgo(5) },
    { id: 'tsk_prog_overdue', project_id: 'prj_solas', title: 'Final API load testing for Solas patient telemetry dashboard', description: 'Simulate concurrent biometric data streams across 500 patient devices.', assigned_freelancer_id: 'spc_liam', status: 'In Progress', priority: 'Urgent', deadline: daysPastDate(1), order_index: 0, internal_notes: 'Overdue. Liam is resolving buffer latency on reconnects.', created_at: daysAgo(6) },
    { id: 'tsk_prog_2', project_id: 'prj_kanso', title: 'Implement component library in Tailwind CSS v4', description: 'Build reusable product showcase cards and specification tables.', assigned_freelancer_id: 'spc_maya', status: 'In Progress', priority: 'Medium', deadline: daysAhead(7), order_index: 1, internal_notes: 'Figma tokens match perfectly.', created_at: daysAgo(4) },
    { id: 'tsk_todo_1', project_id: 'prj_vanguard', title: 'Create high-contrast reading mode layout', description: 'Provide paper-tone and dark-mode reading toggle.', assigned_freelancer_id: 'spc_maya', status: 'To Do', priority: 'Low', deadline: daysAhead(12), order_index: 0, internal_notes: 'Schedule for next sprint.', created_at: daysAgo(3) },
    { id: 'tsk_backlog_1', project_id: 'prj_monolith', title: 'Interactive location map of built architectural commissions', description: 'Vector map of worldwide locations.', assigned_freelancer_id: null, status: 'Backlog', priority: 'Low', deadline: daysAhead(20), order_index: 0, internal_notes: 'Awaiting client geo-coordinates.', created_at: daysAgo(7) },
    { id: 'tsk_done_1', project_id: 'prj_aura', title: 'Art direction and packaging tokens guide', description: 'Claire finalized color formulas and digital branding palette.', assigned_freelancer_id: 'spc_claire', status: 'Approved / Done', priority: 'High', deadline: daysAgo(3), order_index: 0, internal_notes: 'Approved by Agency Director.', created_at: daysAgo(15) },
  ];

  for (const t of tasks) {
    db.prepare(`
      INSERT INTO tasks (
        id, project_id, title, description, assigned_freelancer_id, status,
        priority, deadline, order_index, revision_instructions, internal_notes, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      t.id, t.project_id, t.title, t.description, t.assigned_freelancer_id, t.status,
      t.priority, t.deadline, t.order_index, t.status === 'Revisions Requested' ? 'Scale heading links down from 28px to 22px and increase padding.' : null,
      t.internal_notes, t.created_at, t.created_at
    );
  }

  const checklists = [
    { id: 'chk_1', task_id: 'tsk_rev_1', title: 'Verify Apple Pay domain registration', is_completed: 1 },
    { id: 'chk_2', task_id: 'tsk_rev_1', title: 'Test zero-decimal currency rounding', is_completed: 1 },
    { id: 'chk_3', task_id: 'tsk_rev_1', title: 'Confirm webhook idempotency for stock reduction', is_completed: 0 },
    { id: 'chk_4', task_id: 'tsk_prog_overdue', title: 'Load test with 500 simulated devices', is_completed: 1 },
    { id: 'chk_5', task_id: 'tsk_prog_overdue', title: 'Stress test WebSocket reconnect backoff', is_completed: 0 },
  ];

  for (const chk of checklists) {
    db.prepare(`
      INSERT INTO task_checklists (id, task_id, title, is_completed, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(chk.id, chk.task_id, chk.title, chk.is_completed, daysAgo(2));
  }

  const activities = [
    { id: 'act_1', project_id: 'prj_aura', task_id: 'tsk_rev_1', actor_name: 'Liam O’Connor', action_type: 'task_submitted_review', description: 'Submitted "Review headless Shopify checkout integration" for QA review.', created_at: daysAgo(1) },
    { id: 'act_2', project_id: 'prj_kanso', task_id: 'tsk_rev_req', actor_name: 'Agency Director', action_type: 'revision_requested', description: 'Requested revisions on "Refine typography scale in mobile navigation drawer".', created_at: daysAgo(1) },
    { id: 'act_3', project_id: null, task_id: null, actor_name: 'Elena Rostova', action_type: 'lead_submitted', description: 'Submitted client inquiry for Vanguard Fine Arts ($12,000 - $18,000).', created_at: daysAgo(1) },
    { id: 'act_4', project_id: null, task_id: null, actor_name: 'Soren Nielsen', action_type: 'specialist_applied', description: 'Submitted independent specialist application for Full-Stack Development.', created_at: daysAgo(2) },
    { id: 'act_5', project_id: 'prj_aura', task_id: 'tsk_done_1', actor_name: 'Agency Director', action_type: 'task_approved', description: 'Approved deliverable: "Art direction and packaging tokens guide".', created_at: daysAgo(3) },
  ];

  for (const a of activities) {
    db.prepare(`
      INSERT INTO activity_events (id, project_id, task_id, actor_name, action_type, description, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(a.id, a.project_id, a.task_id, a.actor_name, a.action_type, a.description, a.created_at);
  }

  const notifications = [
    { id: 'notif_1', title: 'New Client Inquiry', message: 'Elena Rostova (Vanguard Fine Arts) submitted a brief for Web Development.', link_type: 'lead', link_id: 'lead_elena', is_read: 0, created_at: daysAgo(1) },
    { id: 'notif_2', title: 'New Specialist Application', message: 'Soren Nielsen applied to join the network (Full-Stack Engineer).', link_type: 'freelancer', link_id: 'spc_soren', is_read: 0, created_at: daysAgo(2) },
    { id: 'notif_3', title: 'Task Awaiting Review', message: 'Liam O’Connor marked "Review headless Shopify checkout integration" ready for review.', link_type: 'task', link_id: 'tsk_rev_1', is_read: 0, created_at: daysAgo(1) },
    { id: 'notif_4', title: 'Task Overdue Notice', message: 'Task "Final API load testing for Solas patient telemetry dashboard" is past its deadline.', link_type: 'task', link_id: 'tsk_prog_overdue', is_read: 0, created_at: isoNow },
  ];

  for (const n of notifications) {
    db.prepare(`
      INSERT INTO notifications (id, recipient_role, title, message, link_type, link_id, is_read, created_at)
      VALUES (?, 'admin', ?, ?, ?, ?, ?, ?)
    `).run(n.id, n.title, n.message, n.link_type, n.link_id, n.is_read, n.created_at);
  }
}
