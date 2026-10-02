// server.ts
import express from "express";
import path2 from "node:path";
import { fileURLToPath } from "node:url";

// server/db.ts
import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import fs from "node:fs";
import crypto from "node:crypto";
var DATA_DIR = path.resolve(process.cwd(), "data");
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
var DB_PATH = path.join(DATA_DIR, "yaawp.db");
var db = new DatabaseSync(DB_PATH);
db.exec("PRAGMA journal_mode = WAL;");
db.exec("PRAGMA foreign_keys = ON;");
function initDatabase() {
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
  try {
    db.exec(`ALTER TABLE leads ADD COLUMN internal_notes TEXT;`);
  } catch {
  }
  try {
    db.exec(`ALTER TABLE projects ADD COLUMN files_json TEXT;`);
  } catch {
  }
  try {
    db.exec(`ALTER TABLE tasks ADD COLUMN files_json TEXT;`);
  } catch {
  }
  try {
    db.exec(`UPDATE users SET role = 'owner' WHERE role = 'admin';`);
  } catch {
  }
  const isDev = process.env.NODE_ENV !== "production" || process.env.DEMO_MODE === "true";
  const hasEnvCredentials = Boolean(process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD);
  if (hasEnvCredentials) {
    const adminEmail = process.env.ADMIN_EMAIL.trim().toLowerCase();
    const adminPassword = process.env.ADMIN_PASSWORD;
    const salt = crypto.randomBytes(16).toString("hex");
    const hash = crypto.scryptSync(adminPassword, salt, 64).toString("hex");
    const existingAdmin = db.prepare("SELECT id FROM users WHERE LOWER(email) = ?").get(adminEmail);
    if (!existingAdmin) {
      const id = "usr_" + crypto.randomUUID();
      db.prepare(`
        INSERT INTO users (id, email, password_hash, salt, name, role, created_at)
        VALUES (?, ?, ?, ?, ?, 'owner', ?)
      `).run(id, adminEmail, hash, salt, "Agency Owner", (/* @__PURE__ */ new Date()).toISOString());
      console.log(`[YAAWP Auth] Configured agency owner account for: ${adminEmail}`);
    } else {
      db.prepare("UPDATE users SET password_hash = ?, salt = ?, role = 'owner' WHERE id = ?").run(hash, salt, existingAdmin.id);
    }
  } else if (isDev) {
    const devEmail = "admin@yaawp.com";
    const devPass = "yaawp_admin_2026!";
    const existingAdmin = db.prepare("SELECT id FROM users WHERE email = ?").get(devEmail);
    if (!existingAdmin) {
      const salt = crypto.randomBytes(16).toString("hex");
      const hash = crypto.scryptSync(devPass, salt, 64).toString("hex");
      const id = "usr_" + crypto.randomUUID();
      db.prepare(`
        INSERT INTO users (id, email, password_hash, salt, name, role, created_at)
        VALUES (?, ?, ?, ?, ?, 'owner', ?)
      `).run(id, devEmail, hash, salt, "Agency Owner (Dev)", (/* @__PURE__ */ new Date()).toISOString());
      console.log("[YAAWP Auth] Development demo owner administrator initialized.");
    } else {
      db.prepare("UPDATE users SET role = 'owner' WHERE id = ?").run(existingAdmin.id);
    }
  } else {
    console.warn("[YAAWP Auth] Security notice: Production environment detected without ADMIN_EMAIL and ADMIN_PASSWORD. No default credentials created.");
  }
  const existingAgencyEmail = db.prepare("SELECT value FROM settings WHERE key = 'agency_notification_email'").get();
  const configuredEmail = process.env.AGENCY_NOTIFICATION_EMAIL?.trim() || "";
  if (!existingAgencyEmail) {
    db.prepare("INSERT INTO settings (key, value) VALUES ('agency_notification_email', ?)").run(configuredEmail);
    db.prepare("INSERT INTO settings (key, value) VALUES ('agency_currency', 'USD')").run();
    db.prepare("INSERT INTO settings (key, value) VALUES ('notify_on_lead', 'true')").run();
    db.prepare("INSERT INTO settings (key, value) VALUES ('notify_on_review', 'true')").run();
    db.prepare("INSERT INTO settings (key, value) VALUES ('notify_on_overdue', 'true')").run();
  } else if (configuredEmail && existingAgencyEmail.value !== configuredEmail) {
    db.prepare("UPDATE settings SET value = ? WHERE key = 'agency_notification_email'").run(configuredEmail);
  }
  if (isDev) {
    seedInitialDataIfEmpty();
  } else {
    console.log("[YAAWP Database] Production environment: Preserving real data only (no fictional demo records seeded).");
  }
}
function seedInitialDataIfEmpty() {
  const leadCountRow = db.prepare("SELECT COUNT(*) as count FROM leads").get();
  if (leadCountRow.count > 0) return;
  const now = /* @__PURE__ */ new Date();
  const isoNow = now.toISOString();
  const daysAgo = (days) => new Date(now.getTime() - days * 864e5).toISOString();
  const daysAhead = (days) => new Date(now.getTime() + days * 864e5).toISOString().split("T")[0];
  const daysPastDate = (days) => new Date(now.getTime() - days * 864e5).toISOString().split("T")[0];
  const clients = [
    { id: "cli_aura", name: "Clara Dupont", email: "clara@auraceramics.com", company: "Aura Studio", phone: "+1 (415) 882-9011", notes: "Luxury ceramics and bespoke stoneware brand.", created_at: daysAgo(25) },
    { id: "cli_kanso", name: "Tobias Lindqvist", email: "tobias@kansogroup.com", company: "Kanso Collective", phone: "+44 20 7946 0912", notes: "Scandinavian architectural furniture brand.", created_at: daysAgo(35) },
    { id: "cli_monolith", name: "Julian Thorne", email: "julian@monolith-arch.com", company: "Monolith Architects", phone: "+1 (212) 555-0199", notes: "Boutique architectural practice.", created_at: daysAgo(18) },
    { id: "cli_vanguard", name: "Beatriz Morales", email: "beatriz@vanguardedit.com", company: "Vanguard Group", phone: "+1 (312) 555-4301", notes: "Financial advisory and private equity insights firm.", created_at: daysAgo(12) },
    { id: "cli_solas", name: "Dr. Aris Thorne", email: "aris@solaswellbeing.com", company: "Solas Life", phone: "+1 (650) 412-8700", notes: "Healthtech venture delivering preventive biometric insights.", created_at: daysAgo(45) }
  ];
  for (const c of clients) {
    db.prepare(`
      INSERT INTO clients (id, name, email, company, phone, notes, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(c.id, c.name, c.email, c.company, c.phone, c.notes, c.created_at, c.created_at);
  }
  const specialists = [
    { id: "spc_liam", name: "Liam O\u2019Connor", email: "liam.dev@yaawp-network.internal", location_timezone: "London (UTC+1)", primary_skill: "Full-Stack / Frontend Developer", secondary_skills: "Next.js, TypeScript, Tailwind, GraphQL, Shopify Storefront API", portfolio_url: "https://github.com/liamoconnor", years_experience: "8 years", weekly_availability: "25-30 hours/week", hourly_rate: "$85/hr", bio: "Former senior engineer at high-growth studio.", status: "Approved Network Member", internal_notes: "Super reliable, fast turnaround, immaculate code review quality.", quality_rating: 5, created_at: daysAgo(60) },
    { id: "spc_claire", name: "Claire Delaunay", email: "claire.design@yaawp-network.internal", location_timezone: "Paris (UTC+2)", primary_skill: "Brand Identity & Visual Designer", secondary_skills: "Typography Systems, Art Direction, Editorial Packaging", portfolio_url: "https://behance.net/clairedelaunay", years_experience: "7 years", weekly_availability: "15-20 hours/week", hourly_rate: "$75/hr", bio: "Boutique art director trained in Milan and Paris.", status: "Approved Network Member", internal_notes: "Exquisite eye for whitespace and typography.", quality_rating: 5, created_at: daysAgo(50) },
    { id: "spc_david", name: "David Kalu", email: "david.motion@yaawp-network.internal", location_timezone: "Berlin (UTC+2)", primary_skill: "Video & Creative Motion Specialist", secondary_skills: "Three.js, WebGL, Framer Motion, 3D Product Interactive", portfolio_url: "https://davidkalu.studio", years_experience: "6 years", weekly_availability: "20 hours/week", hourly_rate: "$90/hr", bio: "Creative technologist combining WebGL shaders with subtle narrative transitions.", status: "Approved Network Member", internal_notes: "Best for hero interactive moments.", quality_rating: 5, created_at: daysAgo(40) },
    { id: "spc_maya", name: "Maya Lin", email: "maya.ux@yaawp-network.internal", location_timezone: "Vancouver (UTC-7)", primary_skill: "UI/UX & Digital Product Designer", secondary_skills: "Design Systems, Figma Variables, User Research, Accessibility", portfolio_url: "https://mayalin.design", years_experience: "9 years", weekly_availability: "25 hours/week", hourly_rate: "$80/hr", bio: "Product designer focusing on editorial dashboards.", status: "Approved Network Member", internal_notes: "Strict zero-pill discipline.", quality_rating: 5, created_at: daysAgo(35) },
    { id: "spc_james", name: "James Henderson", email: "james.copy@yaawp-network.internal", location_timezone: "Edinburgh (UTC+1)", primary_skill: "Editorial Copywriter & Narrative Strategist", secondary_skills: "Brand Messaging, Tone of Voice, Case Studies", portfolio_url: "https://readjameshenderson.com", years_experience: "10 years", weekly_availability: "15 hours/week", hourly_rate: "$65/hr", bio: "Former financial journalist and creative agency copy lead.", status: "Approved Network Member", internal_notes: "Excellent for manifesto decks.", quality_rating: 5, created_at: daysAgo(30) },
    { id: "spc_soren", name: "Soren Nielsen", email: "soren.n@cphcode.io", location_timezone: "Copenhagen (UTC+2)", primary_skill: "Full-Stack / Frontend Developer", secondary_skills: "Go, Node.js, SQLite, High-concurrency APIs", portfolio_url: "https://sorennielsen.dev", years_experience: "5+ years", weekly_availability: "20-30 hours/week", hourly_rate: "$70/hr", bio: "Backend and systems engineer.", status: "New Application", internal_notes: "Submitted via public form.", quality_rating: 4, created_at: daysAgo(2) },
    { id: "spc_zoe", name: "Zoe Kravitz-Vance", email: "zoe.k@narrativestudio.co", location_timezone: "New York (UTC-4)", primary_skill: "Strategic Marketing & Performance Advisor", secondary_skills: "Positioning, Editorial Distribution, B2B Growth", portfolio_url: "https://zoenarrative.substack.com", years_experience: "6 years", weekly_availability: "15 hours/week", hourly_rate: "$85/hr", bio: "Specialist in organic distribution.", status: "New Application", internal_notes: "Strong references.", quality_rating: 4, created_at: daysAgo(1) }
  ];
  for (const s of specialists) {
    db.prepare(`
      INSERT INTO freelancers (
        id, name, email, location_timezone, primary_skill, secondary_skills, portfolio_url,
        years_experience, weekly_availability, hourly_rate, bio, status, internal_notes,
        quality_rating, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      s.id,
      s.name,
      s.email,
      s.location_timezone,
      s.primary_skill,
      s.secondary_skills,
      s.portfolio_url,
      s.years_experience,
      s.weekly_availability,
      s.hourly_rate,
      s.bio,
      s.status,
      s.internal_notes,
      s.quality_rating,
      s.created_at,
      s.created_at
    );
  }
  const leads = [
    { id: "lead_elena", name: "Elena Rostova", email: "elena@vanguardfinearts.org", company: "Vanguard Fine Arts", service: "Web Development", budget_range: "$12,000 - $18,000", timeline: "Within 6-8 weeks", project_details: "Seeking bespoke portfolio and archival catalog for contemporary sculptors.", website_or_social: "https://instagram.com/vanguardfinearts", status: "New", created_at: daysAgo(1) },
    { id: "lead_marcus", name: "Marcus Vance", email: "marcus@kansoliving.de", company: "Kanso Living", service: "Brand Identity & Strategy", budget_range: "$8,000 - $12,000", timeline: "Next quarter", project_details: "Launching minimalist Scandinavian furniture line. Need typography guidelines and digital packaging tokens.", website_or_social: "https://kansoliving.de", status: "New", created_at: daysAgo(2) },
    { id: "lead_sophia", name: "Sophia Chen", email: "sophia@luminahealth.co", company: "Lumina Health", service: "UI/UX & Digital Product Design", budget_range: "$15,000 - $25,000", timeline: "Immediate start", project_details: "Clinical patient telemetry web app interface with high clarity and accessible typography.", website_or_social: "https://luminahealth.co", status: "New", created_at: daysAgo(3) },
    { id: "lead_henri", name: "Henri de Vries", email: "henri@ateliermodern.nl", company: "Atelier Modern Amsterdam", service: "Web Development", budget_range: "$10,000 - $15,000", timeline: "Within 4-6 weeks", project_details: "Architectural showroom digital presence.", website_or_social: "https://ateliermodern.nl", status: "Contacted", created_at: daysAgo(5) },
    { id: "lead_clara_dupont", name: "Clara Dupont", email: "clara@auraceramics.com", company: "Aura Studio", service: "Web Development", budget_range: "$15,000+", timeline: "4-8 weeks", project_details: "Artisanal ceramic studio flagship store.", website_or_social: "https://auraceramics.com", status: "Converted", created_at: daysAgo(30) }
  ];
  for (const l of leads) {
    db.prepare(`
      INSERT INTO leads (
        id, name, email, company, service, budget_range, timeline,
        project_details, website_or_social, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(l.id, l.name, l.email, l.company, l.service, l.budget_range, l.timeline, l.project_details, l.website_or_social, l.status, l.created_at, l.created_at);
  }
  const projects = [
    { id: "prj_aura", client_id: "cli_aura", name: "Aura Fine Ceramics eCommerce", description: "Headless digital boutique for artisanal stoneware.", services: "Web Development, UI/UX Design, Creative Direction", start_date: daysAgo(20).split("T")[0], deadline: daysAhead(10), budget_value: "$16,500", status: "In Progress", internal_notes: "Liam handling storefront; Claire finalized packaging tokens.", client_notes: "Milestone 2 completed.", created_at: daysAgo(20) },
    { id: "prj_kanso", client_id: "cli_kanso", name: "Kanso Studio Identity & Platform", description: "Brand repositioning, design tokens, and catalog website.", services: "Branding, Web Development, UI/UX Design", start_date: daysAgo(15).split("T")[0], deadline: daysAhead(18), budget_value: "$14,000", status: "In Progress", internal_notes: "Maya delivering UI design components.", client_notes: "Build phase underway.", created_at: daysAgo(15) },
    { id: "prj_monolith", client_id: "cli_monolith", name: "Monolith Architecture Portfolio", description: "Architectural portfolio with blueprint viewer.", services: "Web Development, Content Strategy", start_date: daysAgo(14).split("T")[0], deadline: daysAhead(4), budget_value: "$9,500", status: "Review", internal_notes: "Final agency owner QA review in progress.", client_notes: "Preview demo scheduled.", created_at: daysAgo(14) },
    { id: "prj_vanguard", client_id: "cli_vanguard", name: "Vanguard Financial Editorial", description: "Editorial intelligence platform for institutional private equity.", services: "UI/UX Design, Editorial Copywriting", start_date: daysAgo(8).split("T")[0], deadline: daysAhead(28), budget_value: "$11,000", status: "Planning", internal_notes: "James drafting core editorial tone guidelines.", client_notes: "Discovery workshop completed.", created_at: daysAgo(8) },
    { id: "prj_solas", client_id: "cli_solas", name: "Solas Wellbeing Web App", description: "Interactive dashboard for patient biometric wellness telemetry.", services: "Full-Stack Web Development, UI/UX Design", start_date: daysAgo(40).split("T")[0], deadline: daysPastDate(1), budget_value: "$22,000", status: "In Progress", internal_notes: "Telemetry sync milestone overdue. Liam resolving websocket connection edge cases today.", client_notes: "Final staging test.", created_at: daysAgo(40) }
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
    { project_id: "prj_aura", freelancer_id: "spc_liam", role_in_project: "Lead Frontend Engineer" },
    { project_id: "prj_aura", freelancer_id: "spc_claire", role_in_project: "Art Director" },
    { project_id: "prj_aura", freelancer_id: "spc_david", role_in_project: "3D Technologist" },
    { project_id: "prj_kanso", freelancer_id: "spc_maya", role_in_project: "UI/UX Lead" },
    { project_id: "prj_kanso", freelancer_id: "spc_claire", role_in_project: "Brand Consultant" },
    { project_id: "prj_monolith", freelancer_id: "spc_liam", role_in_project: "Full-Stack Developer" },
    { project_id: "prj_monolith", freelancer_id: "spc_james", role_in_project: "Narrative Writer" },
    { project_id: "prj_vanguard", freelancer_id: "spc_james", role_in_project: "Principal Strategist" },
    { project_id: "prj_vanguard", freelancer_id: "spc_maya", role_in_project: "Product Designer" },
    { project_id: "prj_solas", freelancer_id: "spc_liam", role_in_project: "Application Architect" }
  ];
  for (const pf of projectFreelancers) {
    db.prepare(`
      INSERT INTO project_freelancers (project_id, freelancer_id, role_in_project, created_at)
      VALUES (?, ?, ?, ?)
    `).run(pf.project_id, pf.freelancer_id, pf.role_in_project, daysAgo(10));
  }
  const tasks = [
    { id: "tsk_rev_1", project_id: "prj_aura", title: "Review headless Shopify checkout integration", description: "Liam completed headless GraphQL checkout pipeline.", assigned_freelancer_id: "spc_liam", status: "Needs Review", priority: "High", deadline: daysAhead(2), order_index: 0, internal_notes: "Verify tax calculation edge cases before final sign-off.", created_at: daysAgo(3) },
    { id: "tsk_rev_2", project_id: "prj_monolith", title: "QA responsive layouts on tablet and mobile viewports", description: "Architectural image grids and blueprint drawers need thorough inspection on iPad and mobile Safari.", assigned_freelancer_id: "spc_liam", status: "Needs Review", priority: "Medium", deadline: daysAhead(3), order_index: 1, internal_notes: "Tested on desktop Chrome, looks sharp.", created_at: daysAgo(4) },
    { id: "tsk_rev_3", project_id: "prj_vanguard", title: "Editorial manifesto copy review", description: "Draft of Vanguard macroeconomic editorial statement and narrative pillars.", assigned_freelancer_id: "spc_james", status: "Needs Review", priority: "High", deadline: daysAhead(4), order_index: 2, internal_notes: "Tone is confident and restrained.", created_at: daysAgo(2) },
    { id: "tsk_rev_4", project_id: "prj_aura", title: "Review ceramic 3D interactive viewer prototype", description: "David submitted WebGL turntable showing stoneware with tactile glaze reflection.", assigned_freelancer_id: "spc_david", status: "Needs Review", priority: "Medium", deadline: daysAhead(5), order_index: 3, internal_notes: "Check 60fps frame rate on mobile.", created_at: daysAgo(2) },
    { id: "tsk_rev_req", project_id: "prj_kanso", title: "Refine typography scale in mobile navigation drawer", description: "Mobile navigation menu links feel slightly crowded.", assigned_freelancer_id: "spc_maya", status: "Revisions Requested", priority: "High", deadline: daysAhead(2), order_index: 0, internal_notes: "Maya working on patch.", created_at: daysAgo(5) },
    { id: "tsk_prog_overdue", project_id: "prj_solas", title: "Final API load testing for Solas patient telemetry dashboard", description: "Simulate concurrent biometric data streams across 500 patient devices.", assigned_freelancer_id: "spc_liam", status: "In Progress", priority: "Urgent", deadline: daysPastDate(1), order_index: 0, internal_notes: "Overdue. Liam is resolving buffer latency on reconnects.", created_at: daysAgo(6) },
    { id: "tsk_prog_2", project_id: "prj_kanso", title: "Implement component library in Tailwind CSS v4", description: "Build reusable product showcase cards and specification tables.", assigned_freelancer_id: "spc_maya", status: "In Progress", priority: "Medium", deadline: daysAhead(7), order_index: 1, internal_notes: "Figma tokens match perfectly.", created_at: daysAgo(4) },
    { id: "tsk_todo_1", project_id: "prj_vanguard", title: "Create high-contrast reading mode layout", description: "Provide paper-tone and dark-mode reading toggle.", assigned_freelancer_id: "spc_maya", status: "To Do", priority: "Low", deadline: daysAhead(12), order_index: 0, internal_notes: "Schedule for next sprint.", created_at: daysAgo(3) },
    { id: "tsk_backlog_1", project_id: "prj_monolith", title: "Interactive location map of built architectural commissions", description: "Vector map of worldwide locations.", assigned_freelancer_id: null, status: "Backlog", priority: "Low", deadline: daysAhead(20), order_index: 0, internal_notes: "Awaiting client geo-coordinates.", created_at: daysAgo(7) },
    { id: "tsk_done_1", project_id: "prj_aura", title: "Art direction and packaging tokens guide", description: "Claire finalized color formulas and digital branding palette.", assigned_freelancer_id: "spc_claire", status: "Approved / Done", priority: "High", deadline: daysAgo(3), order_index: 0, internal_notes: "Approved by Agency Director.", created_at: daysAgo(15) }
  ];
  for (const t of tasks) {
    db.prepare(`
      INSERT INTO tasks (
        id, project_id, title, description, assigned_freelancer_id, status,
        priority, deadline, order_index, revision_instructions, internal_notes, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      t.id,
      t.project_id,
      t.title,
      t.description,
      t.assigned_freelancer_id,
      t.status,
      t.priority,
      t.deadline,
      t.order_index,
      t.status === "Revisions Requested" ? "Scale heading links down from 28px to 22px and increase padding." : null,
      t.internal_notes,
      t.created_at,
      t.created_at
    );
  }
  const checklists = [
    { id: "chk_1", task_id: "tsk_rev_1", title: "Verify Apple Pay domain registration", is_completed: 1 },
    { id: "chk_2", task_id: "tsk_rev_1", title: "Test zero-decimal currency rounding", is_completed: 1 },
    { id: "chk_3", task_id: "tsk_rev_1", title: "Confirm webhook idempotency for stock reduction", is_completed: 0 },
    { id: "chk_4", task_id: "tsk_prog_overdue", title: "Load test with 500 simulated devices", is_completed: 1 },
    { id: "chk_5", task_id: "tsk_prog_overdue", title: "Stress test WebSocket reconnect backoff", is_completed: 0 }
  ];
  for (const chk of checklists) {
    db.prepare(`
      INSERT INTO task_checklists (id, task_id, title, is_completed, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(chk.id, chk.task_id, chk.title, chk.is_completed, daysAgo(2));
  }
  const activities = [
    { id: "act_1", project_id: "prj_aura", task_id: "tsk_rev_1", actor_name: "Liam O\u2019Connor", action_type: "task_submitted_review", description: 'Submitted "Review headless Shopify checkout integration" for QA review.', created_at: daysAgo(1) },
    { id: "act_2", project_id: "prj_kanso", task_id: "tsk_rev_req", actor_name: "Agency Director", action_type: "revision_requested", description: 'Requested revisions on "Refine typography scale in mobile navigation drawer".', created_at: daysAgo(1) },
    { id: "act_3", project_id: null, task_id: null, actor_name: "Elena Rostova", action_type: "lead_submitted", description: "Submitted client inquiry for Vanguard Fine Arts ($12,000 - $18,000).", created_at: daysAgo(1) },
    { id: "act_4", project_id: null, task_id: null, actor_name: "Soren Nielsen", action_type: "specialist_applied", description: "Submitted independent specialist application for Full-Stack Development.", created_at: daysAgo(2) },
    { id: "act_5", project_id: "prj_aura", task_id: "tsk_done_1", actor_name: "Agency Director", action_type: "task_approved", description: 'Approved deliverable: "Art direction and packaging tokens guide".', created_at: daysAgo(3) }
  ];
  for (const a of activities) {
    db.prepare(`
      INSERT INTO activity_events (id, project_id, task_id, actor_name, action_type, description, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(a.id, a.project_id, a.task_id, a.actor_name, a.action_type, a.description, a.created_at);
  }
  const notifications = [
    { id: "notif_1", title: "New Client Inquiry", message: "Elena Rostova (Vanguard Fine Arts) submitted a brief for Web Development.", link_type: "lead", link_id: "lead_elena", is_read: 0, created_at: daysAgo(1) },
    { id: "notif_2", title: "New Specialist Application", message: "Soren Nielsen applied to join the network (Full-Stack Engineer).", link_type: "freelancer", link_id: "spc_soren", is_read: 0, created_at: daysAgo(2) },
    { id: "notif_3", title: "Task Awaiting Review", message: 'Liam O\u2019Connor marked "Review headless Shopify checkout integration" ready for review.', link_type: "task", link_id: "tsk_rev_1", is_read: 0, created_at: daysAgo(1) },
    { id: "notif_4", title: "Task Overdue Notice", message: 'Task "Final API load testing for Solas patient telemetry dashboard" is past its deadline.', link_type: "task", link_id: "tsk_prog_overdue", is_read: 0, created_at: isoNow }
  ];
  for (const n of notifications) {
    db.prepare(`
      INSERT INTO notifications (id, recipient_role, title, message, link_type, link_id, is_read, created_at)
      VALUES (?, 'admin', ?, ?, ?, ?, ?, ?)
    `).run(n.id, n.title, n.message, n.link_type, n.link_id, n.is_read, n.created_at);
  }
}

// server/routes.ts
import { Router } from "express";
import crypto2 from "node:crypto";

// server/email.ts
import nodemailer from "nodemailer";
function getAgencyNotificationEmail() {
  try {
    const row = db.prepare("SELECT value FROM settings WHERE key = 'agency_notification_email'").get();
    if (row && row.value && row.value.trim().length > 0) {
      return row.value.trim();
    }
  } catch (err) {
  }
  const envEmail = process.env.AGENCY_NOTIFICATION_EMAIL?.trim();
  return envEmail && envEmail.length > 0 ? envEmail : null;
}
function getEmailConfigStatus() {
  const recipient = getAgencyNotificationEmail();
  const resendKey = process.env.RESEND_API_KEY || process.env.EMAIL_PROVIDER_API_KEY;
  const smtpHost = process.env.SMTP_HOST;
  const smtpUser = process.env.SMTP_USER;
  const fromEmail = process.env.EMAIL_FROM || (resendKey ? "YAAWP Agency <onboarding@resend.dev>" : "YAAWP Agency <notifications@yaawp.com>");
  const hasResend = Boolean(resendKey && resendKey.trim().length > 0);
  const hasSmtp = Boolean(smtpHost && smtpUser && process.env.SMTP_PASS);
  const isConfigured = Boolean(recipient && (hasResend || hasSmtp));
  return {
    configured: isConfigured,
    recipientConfigured: Boolean(recipient),
    recipientEmail: recipient || null,
    provider: hasResend ? "resend" : hasSmtp ? "smtp" : "none",
    fromEmail,
    missingFields: [
      ...!recipient ? ["AGENCY_NOTIFICATION_EMAIL"] : [],
      ...!hasResend && !hasSmtp ? ["EMAIL_PROVIDER_API_KEY or RESEND_API_KEY (or SMTP_HOST/SMTP_USER/SMTP_PASS)"] : []
    ]
  };
}
async function sendEmail(options) {
  const { to, subject, text, html } = options;
  const resendKey = process.env.RESEND_API_KEY || process.env.EMAIL_PROVIDER_API_KEY;
  const smtpHost = process.env.SMTP_HOST;
  if (resendKey && resendKey.trim().length > 0) {
    try {
      const from = process.env.EMAIL_FROM || "YAAWP Agency <onboarding@resend.dev>";
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey.trim()}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          from,
          to: [to],
          subject,
          text,
          html
        })
      });
      const resData = await res.json().catch(() => ({}));
      if (!res.ok) {
        const errorMsg = resData?.message || resData?.error || `HTTP ${res.status} ${res.statusText}`;
        console.error(`[YAAWP Email] Resend API error: ${errorMsg}`);
        return { success: false, provider: "resend", reason: "failed", error: errorMsg };
      }
      console.log(`[YAAWP Email] Email delivered via Resend. ID: ${resData?.id} to ${to}`);
      return { success: true, provider: "resend", reason: "sent", messageId: resData?.id };
    } catch (err) {
      console.error(`[YAAWP Email] Resend dispatch exception:`, err);
      return { success: false, provider: "resend", reason: "failed", error: err?.message || String(err) };
    }
  }
  if (smtpHost && process.env.SMTP_USER && process.env.SMTP_PASS) {
    try {
      const port = parseInt(process.env.SMTP_PORT || "587", 10);
      const secure = process.env.SMTP_SECURE === "true" || port === 465;
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port,
        secure,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });
      const from = process.env.EMAIL_FROM || `"YAAWP Agency" <${process.env.SMTP_USER}>`;
      const info = await transporter.sendMail({
        from,
        to,
        subject,
        text,
        html
      });
      console.log(`[YAAWP Email] Email delivered via SMTP. ID: ${info.messageId} to ${to}`);
      return { success: true, provider: "smtp", reason: "sent", messageId: info.messageId };
    } catch (err) {
      console.error(`[YAAWP Email] SMTP dispatch exception:`, err);
      return { success: false, provider: "smtp", reason: "failed", error: err?.message || String(err) };
    }
  }
  console.warn(
    `[YAAWP Email] Email notification skipped: No active email provider configured (set RESEND_API_KEY/EMAIL_PROVIDER_API_KEY or SMTP credentials). Recipient target was: ${to}`
  );
  return {
    success: false,
    provider: "none",
    reason: "unconfigured",
    error: "Email provider not configured. Set RESEND_API_KEY or SMTP variables."
  };
}
async function sendClientInquiryEmail(data, baseUrl) {
  const recipient = getAgencyNotificationEmail();
  if (!recipient) {
    console.warn(`[YAAWP Email] Cannot send inquiry email: No AGENCY_NOTIFICATION_EMAIL configured.`);
    return {
      success: false,
      provider: "none",
      reason: "unconfigured",
      error: "No AGENCY_NOTIFICATION_EMAIL recipient configured."
    };
  }
  const subject = `New YAAWP Client Inquiry \u2014 ${data.name}`;
  const workspaceUrl = `${baseUrl.replace(/\/$/, "")}/#admin`;
  const formattedTime = new Date(data.createdAt).toUTCString();
  const text = `
New YAAWP Client Inquiry \u2014 ${data.name}
==================================================

A prospective client has submitted an inquiry on the YAAWP website:

* Client Name: ${data.name}
* Email: ${data.email}
* Company: ${data.company || "Not provided"}
* Requested Service: ${data.service}
* Budget: ${data.budgetRange || "Not specified"}
* Timeline: ${data.timeline || "Not specified"}
* Project Description:
${data.projectDetails || "No additional details provided."}

* Website / Social: ${data.websiteOrSocial || "Not provided"}
* Submission Time: ${formattedTime}
* Lead ID: ${data.id}

Access Agency Workspace:
${workspaceUrl}
`.trim();
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #FAF8F5; margin: 0; padding: 24px; color: #191816; }
    .card { max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #E8E2D8; border-radius: 4px; padding: 32px; }
    .header { border-bottom: 2px solid #581825; padding-bottom: 16px; margin-bottom: 24px; }
    .header h2 { font-size: 20px; font-weight: 600; color: #581825; margin: 0 0 4px 0; }
    .header p { font-size: 13px; color: #5C5853; margin: 0; }
    .field { margin-bottom: 16px; }
    .label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600; color: #5C5853; margin-bottom: 4px; }
    .value { font-size: 14px; color: #191816; font-weight: 500; }
    .box { background: #FAF8F5; border-left: 3px solid #581825; padding: 12px 16px; margin-top: 6px; font-size: 14px; line-height: 1.5; white-space: pre-wrap; }
    .btn { display: inline-block; background-color: #581825; color: #ffffff !important; padding: 12px 24px; text-decoration: none; border-radius: 2px; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; margin-top: 24px; }
    .footer { margin-top: 32px; pt: 16px; border-top: 1px solid #E8E2D8; font-size: 12px; color: #8C867E; text-align: center; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h2>New Client Inquiry Received</h2>
      <p>YAAWP Services Agency Operating System</p>
    </div>

    <div class="field">
      <div class="label">Client Name</div>
      <div class="value">${escapeHtml(data.name)}</div>
    </div>

    <div class="field">
      <div class="label">Email Address</div>
      <div class="value"><a href="mailto:${escapeHtml(data.email)}" style="color: #581825;">${escapeHtml(data.email)}</a></div>
    </div>

    <div class="field">
      <div class="label">Company / Brand</div>
      <div class="value">${escapeHtml(data.company || "Not provided")}</div>
    </div>

    <div class="field">
      <div class="label">Requested Service</div>
      <div class="value">${escapeHtml(data.service)}</div>
    </div>

    <div style="display: flex; gap: 16px;">
      <div class="field" style="flex: 1;">
        <div class="label">Budget</div>
        <div class="value">${escapeHtml(data.budgetRange || "Not specified")}</div>
      </div>
      <div class="field" style="flex: 1;">
        <div class="label">Timeline</div>
        <div class="value">${escapeHtml(data.timeline || "Not specified")}</div>
      </div>
    </div>

    <div class="field">
      <div class="label">Project Description</div>
      <div class="box">${escapeHtml(data.projectDetails || "No project description provided.")}</div>
    </div>

    <div class="field">
      <div class="label">Website / Social Link</div>
      <div class="value">${data.websiteOrSocial ? `<a href="${escapeHtml(data.websiteOrSocial)}" target="_blank" style="color: #581825;">${escapeHtml(data.websiteOrSocial)}</a>` : "Not provided"}</div>
    </div>

    <div class="field">
      <div class="label">Submission Time</div>
      <div class="value">${formattedTime} (UTC)</div>
    </div>

    <div style="text-align: center;">
      <a href="${workspaceUrl}" class="btn">Open Agency Workspace</a>
    </div>

    <div class="footer">
      This is an automated notification from your YAAWP website client intake system.<br>
      Lead Record ID: ${escapeHtml(data.id)}
    </div>
  </div>
</body>
</html>
`.trim();
  return sendEmail({ to: recipient, subject, text, html });
}
async function sendFreelancerApplicationEmail(data, baseUrl) {
  const recipient = getAgencyNotificationEmail();
  if (!recipient) {
    console.warn(`[YAAWP Email] Cannot send application email: No AGENCY_NOTIFICATION_EMAIL configured.`);
    return {
      success: false,
      provider: "none",
      reason: "unconfigured",
      error: "No AGENCY_NOTIFICATION_EMAIL recipient configured."
    };
  }
  const subject = `New YAAWP Freelancer Application \u2014 ${data.fullName}`;
  const workspaceUrl = `${baseUrl.replace(/\/$/, "")}/#admin`;
  const formattedTime = new Date(data.createdAt).toUTCString();
  const text = `
New YAAWP Freelancer Application \u2014 ${data.fullName}
==================================================

A specialist has applied to join the YAAWP network:

* Name: ${data.fullName}
* Email: ${data.email}
* Discipline: ${data.discipline}
* Portfolio: ${data.portfolioUrl}
* Experience: ${data.yearsOfExperience || "Not specified"}
* Availability: ${data.weeklyAvailability || "Not specified"}
* Skills: ${data.primarySkills || "Not specified"}
* Bio:
${data.briefBio || "No bio provided."}

* Submission Time: ${formattedTime}
* Specialist Record ID: ${data.id}

Review Application in Agency Workspace:
${workspaceUrl}
`.trim();
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #FAF8F5; margin: 0; padding: 24px; color: #191816; }
    .card { max-width: 600px; margin: 0 auto; background: #ffffff; border: 1px solid #E8E2D8; border-radius: 4px; padding: 32px; }
    .header { border-bottom: 2px solid #581825; padding-bottom: 16px; margin-bottom: 24px; }
    .header h2 { font-size: 20px; font-weight: 600; color: #581825; margin: 0 0 4px 0; }
    .header p { font-size: 13px; color: #5C5853; margin: 0; }
    .field { margin-bottom: 16px; }
    .label { font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600; color: #5C5853; margin-bottom: 4px; }
    .value { font-size: 14px; color: #191816; font-weight: 500; }
    .box { background: #FAF8F5; border-left: 3px solid #581825; padding: 12px 16px; margin-top: 6px; font-size: 14px; line-height: 1.5; white-space: pre-wrap; }
    .btn { display: inline-block; background-color: #581825; color: #ffffff !important; padding: 12px 24px; text-decoration: none; border-radius: 2px; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; margin-top: 24px; }
    .footer { margin-top: 32px; pt: 16px; border-top: 1px solid #E8E2D8; font-size: 12px; color: #8C867E; text-align: center; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h2>New Specialist Network Application</h2>
      <p>YAAWP Services Agency Operating System</p>
    </div>

    <div class="field">
      <div class="label">Applicant Name</div>
      <div class="value">${escapeHtml(data.fullName)}</div>
    </div>

    <div class="field">
      <div class="label">Email Address</div>
      <div class="value"><a href="mailto:${escapeHtml(data.email)}" style="color: #581825;">${escapeHtml(data.email)}</a></div>
    </div>

    <div class="field">
      <div class="label">Primary Discipline</div>
      <div class="value">${escapeHtml(data.discipline)}</div>
    </div>

    <div class="field">
      <div class="label">Portfolio URL</div>
      <div class="value"><a href="${escapeHtml(data.portfolioUrl)}" target="_blank" style="color: #581825;">${escapeHtml(data.portfolioUrl)}</a></div>
    </div>

    <div style="display: flex; gap: 16px;">
      <div class="field" style="flex: 1;">
        <div class="label">Experience</div>
        <div class="value">${escapeHtml(data.yearsOfExperience || "Not specified")}</div>
      </div>
      <div class="field" style="flex: 1;">
        <div class="label">Weekly Availability</div>
        <div class="value">${escapeHtml(data.weeklyAvailability || "Not specified")}</div>
      </div>
    </div>

    <div class="field">
      <div class="label">Key Skills & Tools</div>
      <div class="value">${escapeHtml(data.primarySkills || "Not specified")}</div>
    </div>

    <div class="field">
      <div class="label">Brief Bio / Background</div>
      <div class="box">${escapeHtml(data.briefBio || "No bio provided.")}</div>
    </div>

    <div class="field">
      <div class="label">Submission Time</div>
      <div class="value">${formattedTime} (UTC)</div>
    </div>

    <div style="text-align: center;">
      <a href="${workspaceUrl}" class="btn">Review Application in Workspace</a>
    </div>

    <div class="footer">
      This is an automated notification from your YAAWP specialist intake system.<br>
      Specialist Record ID: ${escapeHtml(data.id)}
    </div>
  </div>
</body>
</html>
`.trim();
  return sendEmail({ to: recipient, subject, text, html });
}
function escapeHtml(str) {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

// server/routes.ts
var apiRouter = Router();
function getAuthToken(req) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    return authHeader.substring(7);
  }
  const cookieHeader = req.headers.cookie;
  if (cookieHeader) {
    const match = cookieHeader.match(/yaawp_token=([^;]+)/);
    if (match) return match[1];
  }
  return null;
}
function requireAdmin(req, res, next) {
  const token = getAuthToken(req);
  if (!token) {
    return res.status(401).json({ error: "Authentication required" });
  }
  const session = db.prepare(`
    SELECT user_id, email, role, expires_at FROM sessions WHERE token = ?
  `).get(token);
  if (!session) {
    return res.status(401).json({ error: "Invalid or expired session" });
  }
  if (new Date(session.expires_at) < /* @__PURE__ */ new Date()) {
    db.prepare("DELETE FROM sessions WHERE token = ?").run(token);
    return res.status(401).json({ error: "Session expired" });
  }
  req.user = session;
  next();
}
function requireOwner(req, res, next) {
  requireAdmin(req, res, () => {
    const user = req.user;
    if (user?.role !== "owner" && user?.role !== "admin") {
      return res.status(403).json({ error: "Access denied: Owner privileges required." });
    }
    next();
  });
}
function recordActivity(projectId, taskId, actorName, actionType, description) {
  const id = "act_" + crypto2.randomUUID();
  db.prepare(`
    INSERT INTO activity_events (id, project_id, task_id, actor_name, action_type, description, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, projectId, taskId, actorName, actionType, description, (/* @__PURE__ */ new Date()).toISOString());
}
function recordNotification(title, message, linkType, linkId) {
  const id = "notif_" + crypto2.randomUUID();
  db.prepare(`
    INSERT INTO notifications (id, recipient_role, title, message, link_type, link_id, is_read, created_at)
    VALUES (?, 'admin', ?, ?, ?, ?, 0, ?)
  `).run(id, title, message, linkType || null, linkId || null, (/* @__PURE__ */ new Date()).toISOString());
}
apiRouter.post("/public/inquiry", (req, res) => {
  try {
    const { name, email, company, service, budgetRange, timeline, projectDetails, websiteOrSocial } = req.body;
    if (!name || !email || !service) {
      return res.status(400).json({ error: "Name, email, and service are required." });
    }
    const id = "lead_" + crypto2.randomUUID();
    const now = (/* @__PURE__ */ new Date()).toISOString();
    db.prepare(`
      INSERT INTO leads (
        id, name, email, company, service, budget_range, timeline,
        project_details, website_or_social, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'New', ?, ?)
    `).run(
      id,
      name.trim(),
      email.trim(),
      company ? company.trim() : null,
      service.trim(),
      budgetRange || null,
      timeline || null,
      projectDetails || null,
      websiteOrSocial || null,
      now,
      now
    );
    recordActivity(null, null, name, "lead_submitted", `Submitted client inquiry for ${service} (${company || "Direct Client"})`);
    recordNotification(
      "New Client Inquiry",
      `${name} (${company || email}) submitted an inquiry for ${service}.`,
      "lead",
      id
    );
    const baseUrl = process.env.APP_URL || `${req.protocol}://${req.get("host")}`;
    sendClientInquiryEmail(
      {
        id,
        name: name.trim(),
        email: email.trim(),
        company: company ? company.trim() : null,
        service: service.trim(),
        budgetRange: budgetRange || null,
        timeline: timeline || null,
        projectDetails: projectDetails || null,
        websiteOrSocial: websiteOrSocial || null,
        createdAt: now
      },
      baseUrl
    ).catch((emailErr) => {
      console.error("[YAAWP Email] Background inquiry email dispatch error:", emailErr);
    });
    res.json({ success: true, leadId: id });
  } catch (err) {
    console.error("Error handling inquiry:", err);
    res.status(500).json({ error: "Failed to record inquiry" });
  }
});
apiRouter.post("/public/specialist-apply", (req, res) => {
  try {
    const fullName = (req.body.fullName || req.body.name || "").trim();
    const email = (req.body.email || "").trim().toLowerCase();
    const discipline = (req.body.discipline || req.body.primarySkill || "").trim();
    const portfolioUrl = (req.body.portfolioUrl || req.body.portfolio || "").trim();
    const yearsOfExperience = req.body.yearsOfExperience || req.body.yearsExperience || null;
    const weeklyAvailability = req.body.weeklyAvailability || null;
    const primarySkills = req.body.primarySkills || req.body.skills || req.body.secondarySkills || null;
    const briefBio = req.body.briefBio || req.body.bio || null;
    if (!fullName || !email || !discipline || !portfolioUrl) {
      return res.status(400).json({ error: "Full name, email, discipline, and portfolio URL are required." });
    }
    const existing = db.prepare("SELECT id FROM freelancers WHERE email = ?").get(email.trim().toLowerCase());
    if (existing) {
      return res.status(400).json({ error: "An application with this email already exists in our network." });
    }
    const id = "spc_" + crypto2.randomUUID();
    const now = (/* @__PURE__ */ new Date()).toISOString();
    db.prepare(`
      INSERT INTO freelancers (
        id, name, email, location_timezone, primary_skill, secondary_skills, portfolio_url,
        years_experience, weekly_availability, hourly_rate, bio, status, internal_notes,
        quality_rating, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'New Application', ?, 5, ?, ?)
    `).run(
      id,
      fullName.trim(),
      email.trim().toLowerCase(),
      "Pending Location",
      discipline.trim(),
      primarySkills || null,
      portfolioUrl.trim(),
      yearsOfExperience || null,
      weeklyAvailability || null,
      null,
      briefBio || null,
      "Submitted via public specialist network intake form.",
      now,
      now
    );
    recordActivity(null, null, fullName, "specialist_applied", `Submitted independent specialist application for ${discipline}`);
    recordNotification(
      "New Specialist Application",
      `${fullName} applied as a ${discipline} specialist.`,
      "freelancer",
      id
    );
    const baseUrl = process.env.APP_URL || `${req.protocol}://${req.get("host")}`;
    sendFreelancerApplicationEmail(
      {
        id,
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        discipline: discipline.trim(),
        portfolioUrl: portfolioUrl.trim(),
        yearsOfExperience: yearsOfExperience || null,
        weeklyAvailability: weeklyAvailability || null,
        primarySkills: primarySkills || null,
        briefBio: briefBio || null,
        createdAt: now
      },
      baseUrl
    ).catch((emailErr) => {
      console.error("[YAAWP Email] Background specialist email dispatch error:", emailErr);
    });
    res.json({ success: true, freelancerId: id });
  } catch (err) {
    console.error("Error submitting application:", err);
    res.status(500).json({ error: "Failed to submit application" });
  }
});
apiRouter.post("/auth/login", (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }
    const trimmedEmail = email.trim().toLowerCase();
    const user = db.prepare("SELECT * FROM users WHERE LOWER(email) = ?").get(trimmedEmail);
    if (!user) {
      return res.status(401).json({ error: "Invalid email or credentials" });
    }
    const hash = crypto2.scryptSync(password, user.salt, 64).toString("hex");
    if (hash !== user.password_hash) {
      return res.status(401).json({ error: "Invalid email or credentials" });
    }
    const token = crypto2.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1e3).toISOString();
    db.prepare(`
      INSERT INTO sessions (token, user_id, email, role, created_at, expires_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(token, user.id, user.email, user.role, (/* @__PURE__ */ new Date()).toISOString(), expiresAt);
    res.cookie("yaawp_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60 * 1e3
    });
    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Login failed" });
  }
});
apiRouter.post("/auth/logout", (req, res) => {
  const token = getAuthToken(req);
  if (token) {
    db.prepare("DELETE FROM sessions WHERE token = ?").run(token);
  }
  res.clearCookie("yaawp_token");
  res.json({ success: true });
});
apiRouter.get("/auth/me", (req, res) => {
  const token = getAuthToken(req);
  if (!token) {
    return res.status(401).json({ authenticated: false });
  }
  const session = db.prepare(`
    SELECT s.user_id, s.email, s.role, s.expires_at, u.name
    FROM sessions s
    JOIN users u ON s.user_id = u.id
    WHERE s.token = ?
  `).get(token);
  if (!session || new Date(session.expires_at) < /* @__PURE__ */ new Date()) {
    if (session) db.prepare("DELETE FROM sessions WHERE token = ?").run(token);
    res.clearCookie("yaawp_token");
    return res.status(401).json({ authenticated: false });
  }
  res.json({
    authenticated: true,
    token,
    user: {
      id: session.user_id,
      email: session.email,
      name: session.name,
      role: session.role
    }
  });
});
apiRouter.get("/auth/config", (_req, res) => {
  const isDev = process.env.NODE_ENV !== "production" || process.env.DEMO_MODE === "true";
  const adminUser = db.prepare("SELECT email FROM users WHERE role = ? LIMIT 1").get("admin");
  res.json({
    allowDemoCredentials: isDev,
    hasConfiguredAdmin: Boolean(adminUser),
    isProduction: process.env.NODE_ENV === "production"
  });
});
apiRouter.get("/admin/dashboard", requireAdmin, (_req, res) => {
  try {
    const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    const newLeadsCount = db.prepare("SELECT COUNT(*) as count FROM leads WHERE status = 'New'").get().count;
    const activeProjectsCount = db.prepare("SELECT COUNT(*) as count FROM projects WHERE status IN ('In Progress', 'Review', 'Planning')").get().count;
    const awaitingReviewCount = db.prepare("SELECT COUNT(*) as count FROM tasks WHERE status = 'Needs Review'").get().count;
    const overdueTasksCount = db.prepare("SELECT COUNT(*) as count FROM tasks WHERE status != 'Approved / Done' AND deadline IS NOT NULL AND deadline != '' AND deadline < ?").get(today).count;
    const inProgressTasksCount = db.prepare("SELECT COUNT(*) as count FROM tasks WHERE status = 'In Progress'").get().count;
    const newSpecialistCount = db.prepare("SELECT COUNT(*) as count FROM freelancers WHERE status = 'New Application'").get().count;
    const totalSpecialists = db.prepare("SELECT COUNT(*) as count FROM freelancers").get().count;
    const totalClients = db.prepare("SELECT COUNT(*) as count FROM clients").get().count;
    const upcomingTasks = db.prepare(`
      SELECT t.*, p.name as project_name, f.name as assigned_freelancer_name
      FROM tasks t
      LEFT JOIN projects p ON t.project_id = p.id
      LEFT JOIN freelancers f ON t.assigned_freelancer_id = f.id
      WHERE t.status != 'Approved / Done'
      ORDER BY
        CASE WHEN t.status = 'Needs Review' THEN 0 WHEN t.deadline < ? THEN 1 ELSE 2 END,
        t.deadline ASC
      LIMIT 8
    `).all(today);
    const upcomingProjects = db.prepare(`
      SELECT p.*, c.name as client_name, c.company as client_company,
        (SELECT COUNT(*) FROM tasks WHERE project_id = p.id) as task_count,
        (SELECT COUNT(*) FROM tasks WHERE project_id = p.id AND status = 'Approved / Done') as completed_task_count
      FROM projects p
      LEFT JOIN clients c ON p.client_id = c.id
      WHERE p.status IN ('In Progress', 'Review', 'Planning')
      ORDER BY p.deadline ASC
      LIMIT 6
    `).all();
    const recentActivity = db.prepare(`
      SELECT * FROM activity_events ORDER BY created_at DESC LIMIT 10
    `).all();
    const recentlyCompletedTasks = db.prepare(`
      SELECT t.*, p.name as project_name, f.name as assigned_freelancer_name
      FROM tasks t
      LEFT JOIN projects p ON t.project_id = p.id
      LEFT JOIN freelancers f ON t.assigned_freelancer_id = f.id
      WHERE t.status = 'Approved / Done'
      ORDER BY t.updated_at DESC
      LIMIT 5
    `).all();
    res.json({
      metrics: {
        newLeads: newLeadsCount,
        activeProjects: activeProjectsCount,
        awaitingReview: awaitingReviewCount,
        overdueTasks: overdueTasksCount,
        inProgressTasks: inProgressTasksCount,
        newSpecialists: newSpecialistCount,
        totalSpecialists,
        totalClients
      },
      upcomingTasks,
      upcomingProjects,
      recentActivity,
      recentlyCompletedTasks
    });
  } catch (err) {
    console.error("Dashboard fetch error:", err);
    res.status(500).json({ error: "Failed to load dashboard data" });
  }
});
apiRouter.get("/admin/leads", requireAdmin, (_req, res) => {
  try {
    const leads = db.prepare("SELECT * FROM leads ORDER BY created_at DESC").all();
    res.json(leads);
  } catch (err) {
    res.status(500).json({ error: "Failed to load leads" });
  }
});
apiRouter.patch("/admin/leads/:id", requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const fields = req.body;
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const allowed = [
      "name",
      "email",
      "company",
      "service",
      "budget_range",
      "timeline",
      "project_details",
      "website_or_social",
      "status",
      "internal_notes"
    ];
    const updates = ["updated_at = ?"];
    const values = [now];
    for (const key of allowed) {
      if (fields[key] !== void 0) {
        updates.push(`${key} = ?`);
        values.push(fields[key]);
      }
    }
    values.push(id);
    db.prepare(`UPDATE leads SET ${updates.join(", ")} WHERE id = ?`).run(...values);
    if (fields.status) {
      const actor = req.user?.name || "Workspace Lead";
      recordActivity(null, null, actor, "lead_status_changed", `Updated quote status to "${fields.status}" for lead ${id}`);
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to update lead" });
  }
});
apiRouter.post("/admin/leads/:id/convert", requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const {
      createProject,
      projectName,
      budget,
      projectBudget,
      deadline,
      projectDeadline,
      specialistIds,
      initialTasks,
      status
    } = req.body;
    const lead = db.prepare("SELECT * FROM leads WHERE id = ?").get(id);
    if (!lead) return res.status(404).json({ error: "Lead not found" });
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const actorName = req.user?.name || "Workspace Lead";
    let clientId;
    const existingClient = db.prepare("SELECT id FROM clients WHERE LOWER(email) = ?").get(lead.email.toLowerCase());
    if (existingClient) {
      clientId = existingClient.id;
    } else {
      clientId = "cli_" + crypto2.randomUUID();
      db.prepare(`
        INSERT INTO clients (id, name, email, company, notes, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        clientId,
        lead.name,
        lead.email,
        lead.company,
        `Converted from inquiry (${lead.service}). Brief: ${lead.project_details || "N/A"}${lead.internal_notes ? ` | Notes: ${lead.internal_notes}` : ""}`,
        now,
        now
      );
    }
    let projectId = void 0;
    if (createProject) {
      projectId = "prj_" + crypto2.randomUUID();
      const effectiveBudget = projectBudget || budget || lead.budget_range || null;
      const effectiveDeadline = projectDeadline || deadline || null;
      db.prepare(`
        INSERT INTO projects (
          id, client_id, name, description, services, deadline,
          budget_value, status, internal_notes, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 'Planning', ?, ?, ?)
      `).run(
        projectId,
        clientId,
        projectName || `${lead.company || lead.name} \u2014 ${lead.service}`,
        lead.project_details || null,
        lead.service,
        effectiveDeadline,
        effectiveBudget,
        lead.internal_notes ? `Notes from lead intake: ${lead.internal_notes}` : `Originating from quote conversion on ${(/* @__PURE__ */ new Date()).toLocaleDateString()}`,
        now,
        now
      );
      if (Array.isArray(specialistIds)) {
        for (const spcId of specialistIds) {
          if (spcId) {
            db.prepare(`
              INSERT OR IGNORE INTO project_freelancers (project_id, freelancer_id, role_in_project, created_at)
              VALUES (?, ?, 'Assigned Specialist', ?)
            `).run(projectId, spcId, now);
          }
        }
      }
      if (Array.isArray(initialTasks)) {
        let orderIdx = 0;
        for (const item of initialTasks) {
          const taskTitle = typeof item === "string" ? item.trim() : (item?.title || "").trim();
          const taskPriority = typeof item === "object" && item?.priority ? item.priority : "Medium";
          const taskSpecialistId = typeof item === "object" && (item?.freelancer_id || item?.assigned_freelancer_id) ? item.freelancer_id || item.assigned_freelancer_id : null;
          if (taskTitle) {
            const taskId = "tsk_" + crypto2.randomUUID();
            db.prepare(`
              INSERT INTO tasks (
                id, project_id, title, status, priority, assigned_freelancer_id, order_index, created_at, updated_at
              ) VALUES (?, ?, ?, 'To Do', ?, ?, ?, ?, ?)
            `).run(taskId, projectId, taskTitle, taskPriority, taskSpecialistId, orderIdx++, now, now);
          }
        }
      }
    }
    const targetStatus = status || "Accepted";
    db.prepare("UPDATE leads SET status = ?, updated_at = ? WHERE id = ?").run(targetStatus, now, id);
    recordActivity(
      projectId || null,
      null,
      actorName,
      "lead_converted",
      `Converted quote "${lead.name}" into client and initialized project workspace`
    );
    const client = db.prepare("SELECT * FROM clients WHERE id = ?").get(clientId);
    const project = projectId ? db.prepare("SELECT * FROM projects WHERE id = ?").get(projectId) : null;
    res.json({ success: true, clientId, projectId, client, project });
  } catch (err) {
    console.error("Lead conversion failed:", err);
    res.status(500).json({ error: "Failed to convert lead" });
  }
});
apiRouter.delete("/admin/leads/:id", requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    db.prepare("DELETE FROM leads WHERE id = ?").run(id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete lead" });
  }
});
apiRouter.get("/admin/clients", requireAdmin, (_req, res) => {
  try {
    const clients = db.prepare(`
      SELECT c.*,
        (SELECT COUNT(*) FROM projects WHERE client_id = c.id) as project_count,
        (SELECT COUNT(*) FROM projects WHERE client_id = c.id AND status IN ('In Progress', 'Review', 'Planning')) as active_project_count
      FROM clients c
      ORDER BY c.created_at DESC
    `).all();
    res.json(clients);
  } catch (err) {
    res.status(500).json({ error: "Failed to load clients" });
  }
});
apiRouter.post("/admin/clients", requireAdmin, (req, res) => {
  try {
    const { name, email, company, phone, notes } = req.body;
    if (!name || !email) {
      return res.status(400).json({ error: "Client name and email are required." });
    }
    const id = "cli_" + crypto2.randomUUID();
    const now = (/* @__PURE__ */ new Date()).toISOString();
    db.prepare(`
      INSERT INTO clients (id, name, email, company, phone, notes, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, name.trim(), email.trim(), company || null, phone || null, notes || null, now, now);
    recordActivity(null, null, "Agency Director", "client_created", `Added new client record: ${name} (${company || "Direct"})`);
    res.json({ success: true, id });
  } catch (err) {
    res.status(500).json({ error: "Failed to create client" });
  }
});
apiRouter.get("/admin/clients/:id", requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const client = db.prepare("SELECT * FROM clients WHERE id = ?").get(id);
    if (!client) return res.status(404).json({ error: "Client not found" });
    const projects = db.prepare(`
      SELECT p.*,
        (SELECT COUNT(*) FROM tasks WHERE project_id = p.id) as task_count,
        (SELECT COUNT(*) FROM tasks WHERE project_id = p.id AND status = 'Approved / Done') as completed_task_count
      FROM projects p
      WHERE p.client_id = ?
      ORDER BY p.created_at DESC
    `).all(id);
    res.json({ client, projects });
  } catch (err) {
    res.status(500).json({ error: "Failed to load client details" });
  }
});
apiRouter.patch("/admin/clients/:id", requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const fields = req.body;
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const allowed = ["name", "email", "company", "phone", "notes"];
    const updates = ["updated_at = ?"];
    const values = [now];
    for (const key of allowed) {
      if (fields[key] !== void 0) {
        updates.push(`${key} = ?`);
        values.push(fields[key]);
      }
    }
    values.push(id);
    db.prepare(`UPDATE clients SET ${updates.join(", ")} WHERE id = ?`).run(...values);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to update client" });
  }
});
apiRouter.delete("/admin/clients/:id", requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    db.prepare("DELETE FROM clients WHERE id = ?").run(id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete client" });
  }
});
apiRouter.get("/admin/freelancers", requireAdmin, (_req, res) => {
  try {
    const freelancers = db.prepare(`
      SELECT f.*,
        (
          SELECT COUNT(DISTINCT pf.project_id)
          FROM project_freelancers pf
          JOIN projects p ON pf.project_id = p.id
          WHERE pf.freelancer_id = f.id AND p.status IN ('In Progress', 'Review', 'Planning')
        ) as active_projects_count
      FROM freelancers f
      ORDER BY f.created_at DESC
    `).all();
    res.json(freelancers);
  } catch (err) {
    res.status(500).json({ error: "Failed to load specialists" });
  }
});
apiRouter.post("/admin/freelancers", requireAdmin, (req, res) => {
  try {
    const {
      name,
      email,
      location_timezone,
      primary_skill,
      secondary_skills,
      portfolio_url,
      years_experience,
      weekly_availability,
      hourly_rate,
      bio,
      status,
      internal_notes,
      quality_rating
    } = req.body;
    if (!name || !email || !primary_skill) {
      return res.status(400).json({ error: "Name, email, and primary skill are required." });
    }
    const id = "spc_" + crypto2.randomUUID();
    const now = (/* @__PURE__ */ new Date()).toISOString();
    db.prepare(`
      INSERT INTO freelancers (
        id, name, email, location_timezone, primary_skill, secondary_skills,
        portfolio_url, years_experience, weekly_availability, hourly_rate,
        bio, status, internal_notes, quality_rating, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      name.trim(),
      email.trim().toLowerCase(),
      location_timezone || null,
      primary_skill.trim(),
      secondary_skills || null,
      portfolio_url || "",
      years_experience || null,
      weekly_availability || null,
      hourly_rate || null,
      bio || null,
      status || "Approved Network Member",
      internal_notes || null,
      quality_rating !== void 0 ? quality_rating : 5,
      now,
      now
    );
    recordActivity(null, null, "Agency Director", "specialist_created", `Added specialist ${name} (${primary_skill})`);
    res.json({ success: true, id });
  } catch (err) {
    console.error("Failed to create specialist:", err);
    res.status(500).json({ error: "Failed to create specialist" });
  }
});
apiRouter.get("/admin/freelancers/:id", requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const specialist = db.prepare("SELECT * FROM freelancers WHERE id = ?").get(id);
    if (!specialist) return res.status(404).json({ error: "Specialist not found" });
    const projects = db.prepare(`
      SELECT p.*, pf.role_in_project
      FROM projects p
      JOIN project_freelancers pf ON p.id = pf.project_id
      WHERE pf.freelancer_id = ?
      ORDER BY p.deadline ASC
    `).all(id);
    const tasks = db.prepare(`
      SELECT t.*, p.name as project_name
      FROM tasks t
      JOIN projects p ON t.project_id = p.id
      WHERE t.assigned_freelancer_id = ?
      ORDER BY t.deadline ASC
    `).all(id);
    res.json({ specialist, projects, tasks });
  } catch (err) {
    res.status(500).json({ error: "Failed to load specialist details" });
  }
});
apiRouter.patch("/admin/freelancers/:id", requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const fields = req.body;
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const allowed = [
      "name",
      "email",
      "location_timezone",
      "primary_skill",
      "secondary_skills",
      "portfolio_url",
      "years_experience",
      "weekly_availability",
      "hourly_rate",
      "bio",
      "status",
      "internal_notes",
      "quality_rating"
    ];
    const updates = ["updated_at = ?"];
    const values = [now];
    for (const key of allowed) {
      if (fields[key] !== void 0) {
        updates.push(`${key} = ?`);
        values.push(fields[key]);
      }
    }
    values.push(id);
    db.prepare(`UPDATE freelancers SET ${updates.join(", ")} WHERE id = ?`).run(...values);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to update specialist" });
  }
});
apiRouter.delete("/admin/freelancers/:id", requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    db.prepare("DELETE FROM freelancers WHERE id = ?").run(id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete specialist" });
  }
});
apiRouter.get("/admin/projects", requireAdmin, (_req, res) => {
  try {
    const projects = db.prepare(`
      SELECT p.*,
        c.name as client_name,
        c.company as client_company,
        (SELECT COUNT(*) FROM tasks WHERE project_id = p.id) as task_count,
        (SELECT COUNT(*) FROM tasks WHERE project_id = p.id AND status = 'Approved / Done') as completed_task_count,
        (SELECT COUNT(*) FROM tasks WHERE project_id = p.id AND status = 'Needs Review') as review_task_count
      FROM projects p
      LEFT JOIN clients c ON p.client_id = c.id
      ORDER BY p.deadline ASC
    `).all();
    const projectsWithSpecialists = projects.map((p) => {
      const specialists = db.prepare(`
        SELECT f.id, f.name, f.primary_skill, pf.role_in_project
        FROM freelancers f
        JOIN project_freelancers pf ON f.id = pf.freelancer_id
        WHERE pf.project_id = ?
      `).all(p.id);
      return { ...p, specialists };
    });
    res.json(projectsWithSpecialists);
  } catch (err) {
    res.status(500).json({ error: "Failed to load projects" });
  }
});
apiRouter.post("/admin/projects", requireAdmin, (req, res) => {
  try {
    const {
      name,
      client_id,
      description,
      services,
      start_date,
      deadline,
      budget_value,
      status,
      internal_notes,
      client_notes,
      specialist_ids
    } = req.body;
    if (!name) {
      return res.status(400).json({ error: "Project name is required." });
    }
    const id = "prj_" + crypto2.randomUUID();
    const now = (/* @__PURE__ */ new Date()).toISOString();
    db.prepare(`
      INSERT INTO projects (
        id, client_id, name, description, services, start_date, deadline,
        budget_value, status, internal_notes, client_notes, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      client_id || null,
      name.trim(),
      description || null,
      services || null,
      start_date || null,
      deadline || null,
      budget_value || null,
      status || "Planning",
      internal_notes || null,
      client_notes || null,
      now,
      now
    );
    if (Array.isArray(specialist_ids)) {
      for (const spcId of specialist_ids) {
        db.prepare(`
          INSERT OR IGNORE INTO project_freelancers (project_id, freelancer_id, created_at)
          VALUES (?, ?, ?)
        `).run(id, spcId, now);
      }
    }
    recordActivity(id, null, "Agency Director", "project_created", `Created project "${name}"`);
    res.json({ success: true, id });
  } catch (err) {
    console.error("Failed to create project:", err);
    res.status(500).json({ error: "Failed to create project" });
  }
});
apiRouter.get("/admin/projects/:id", requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const project = db.prepare(`
      SELECT p.*, c.name as client_name, c.company as client_company, c.email as client_email
      FROM projects p
      LEFT JOIN clients c ON p.client_id = c.id
      WHERE p.id = ?
    `).get(id);
    if (!project) return res.status(404).json({ error: "Project not found" });
    const specialists = db.prepare(`
      SELECT f.*, pf.role_in_project
      FROM freelancers f
      JOIN project_freelancers pf ON f.id = pf.freelancer_id
      WHERE pf.project_id = ?
    `).all(id);
    const tasks = db.prepare(`
      SELECT t.*, f.name as assigned_freelancer_name
      FROM tasks t
      LEFT JOIN freelancers f ON t.assigned_freelancer_id = f.id
      WHERE t.project_id = ?
      ORDER BY t.order_index ASC, t.deadline ASC
    `).all(id);
    const activity = db.prepare(`
      SELECT * FROM activity_events
      WHERE project_id = ?
      ORDER BY created_at DESC
      LIMIT 25
    `).all(id);
    res.json({ project, specialists, tasks, activity });
  } catch (err) {
    res.status(500).json({ error: "Failed to load project details" });
  }
});
apiRouter.patch("/admin/projects/:id", requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const fields = req.body;
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const allowed = [
      "name",
      "client_id",
      "description",
      "services",
      "start_date",
      "deadline",
      "budget_value",
      "status",
      "internal_notes",
      "client_notes",
      "files_json"
    ];
    const updates = ["updated_at = ?"];
    const values = [now];
    for (const key of allowed) {
      if (fields[key] !== void 0) {
        updates.push(`${key} = ?`);
        values.push(fields[key]);
      }
    }
    values.push(id);
    db.prepare(`UPDATE projects SET ${updates.join(", ")} WHERE id = ?`).run(...values);
    if (fields.status) {
      recordActivity(id, null, "Agency Director", "project_status_changed", `Updated project status to "${fields.status}"`);
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to update project" });
  }
});
apiRouter.delete("/admin/projects/:id", requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    db.prepare("DELETE FROM projects WHERE id = ?").run(id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete project" });
  }
});
apiRouter.post("/admin/projects/:id/assign-freelancer", requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const { freelancer_id, role_in_project } = req.body;
    if (!freelancer_id) return res.status(400).json({ error: "Freelancer ID required" });
    db.prepare(`
      INSERT INTO project_freelancers (project_id, freelancer_id, role_in_project, created_at)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(project_id, freelancer_id) DO UPDATE SET role_in_project = excluded.role_in_project
    `).run(id, freelancer_id, role_in_project || null, (/* @__PURE__ */ new Date()).toISOString());
    const spc = db.prepare("SELECT name FROM freelancers WHERE id = ?").get(freelancer_id);
    recordActivity(id, null, "Agency Director", "specialist_assigned", `Assigned specialist ${spc?.name || freelancer_id} to project`);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to assign specialist" });
  }
});
apiRouter.delete("/admin/projects/:id/remove-freelancer", requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const { freelancer_id } = req.body;
    db.prepare("DELETE FROM project_freelancers WHERE project_id = ? AND freelancer_id = ?").run(id, freelancer_id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to remove specialist from project" });
  }
});
apiRouter.get("/admin/tasks", requireAdmin, (req, res) => {
  try {
    const { projectId, freelancerId, status, priority } = req.query;
    const where = ["1=1"];
    const params = [];
    if (projectId) {
      where.push("t.project_id = ?");
      params.push(projectId);
    }
    if (freelancerId) {
      where.push("t.assigned_freelancer_id = ?");
      params.push(freelancerId);
    }
    if (status) {
      where.push("t.status = ?");
      params.push(status);
    }
    if (priority) {
      where.push("t.priority = ?");
      params.push(priority);
    }
    const tasks = db.prepare(`
      SELECT t.*,
        p.name as project_name,
        f.name as assigned_freelancer_name,
        (SELECT COUNT(*) FROM task_checklists WHERE task_id = t.id) as checklist_total,
        (SELECT COUNT(*) FROM task_checklists WHERE task_id = t.id AND is_completed = 1) as checklist_completed,
        (SELECT COUNT(*) FROM task_comments WHERE task_id = t.id) as comment_count
      FROM tasks t
      LEFT JOIN projects p ON t.project_id = p.id
      LEFT JOIN freelancers f ON t.assigned_freelancer_id = f.id
      WHERE ${where.join(" AND ")}
      ORDER BY t.order_index ASC, t.deadline ASC
    `).all(...params);
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: "Failed to load tasks" });
  }
});
apiRouter.post("/admin/tasks", requireAdmin, (req, res) => {
  try {
    const rawProjectId = req.body.project_id || req.body.projectId;
    const rawFreelancerId = req.body.assigned_freelancer_id || req.body.assignedFreelancerId;
    const { title, description, status, priority, deadline, internal_notes } = req.body;
    if (!rawProjectId || !title) {
      return res.status(400).json({ error: "Project and task title are required." });
    }
    const id = "tsk_" + crypto2.randomUUID();
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const maxOrderRow = db.prepare("SELECT MAX(order_index) as max_idx FROM tasks WHERE project_id = ? AND status = ?").get(rawProjectId, status || "Backlog");
    const nextOrder = (maxOrderRow?.max_idx ?? -1) + 1;
    db.prepare(`
      INSERT INTO tasks (
        id, project_id, title, description, assigned_freelancer_id, status,
        priority, deadline, order_index, internal_notes, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      rawProjectId,
      title.trim(),
      description || null,
      rawFreelancerId || null,
      status || "Backlog",
      priority || "Medium",
      deadline || null,
      nextOrder,
      internal_notes || null,
      now,
      now
    );
    recordActivity(rawProjectId, id, "Agency Director", "task_created", `Created task "${title}"`);
    res.json({ success: true, id, taskId: id });
  } catch (err) {
    console.error("Failed to create task:", err);
    res.status(500).json({ error: "Failed to create task" });
  }
});
apiRouter.get("/admin/tasks/:id", requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const task = db.prepare(`
      SELECT t.*, p.name as project_name, f.name as assigned_freelancer_name, f.email as assigned_freelancer_email
      FROM tasks t
      LEFT JOIN projects p ON t.project_id = p.id
      LEFT JOIN freelancers f ON t.assigned_freelancer_id = f.id
      WHERE t.id = ?
    `).get(id);
    if (!task) return res.status(404).json({ error: "Task not found" });
    const checklists = db.prepare("SELECT * FROM task_checklists WHERE task_id = ? ORDER BY created_at ASC").all(id);
    const comments = db.prepare("SELECT * FROM task_comments WHERE task_id = ? ORDER BY created_at ASC").all(id);
    res.json({ task, checklists, comments });
  } catch (err) {
    res.status(500).json({ error: "Failed to load task" });
  }
});
apiRouter.patch("/admin/tasks/:id", requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const fields = req.body;
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const allowed = [
      "title",
      "description",
      "assigned_freelancer_id",
      "status",
      "priority",
      "deadline",
      "order_index",
      "revision_instructions",
      "internal_notes",
      "files_json"
    ];
    const updates = ["updated_at = ?"];
    const values = [now];
    for (const key of allowed) {
      if (fields[key] !== void 0) {
        updates.push(`${key} = ?`);
        values.push(fields[key]);
      }
    }
    values.push(id);
    db.prepare(`UPDATE tasks SET ${updates.join(", ")} WHERE id = ?`).run(...values);
    const updatedTask = db.prepare("SELECT * FROM tasks WHERE id = ?").get(id);
    if (fields.status) {
      const actorName = req.user?.name || "Workspace Lead";
      recordActivity(updatedTask.project_id, id, actorName, "task_status_changed", `Moved task "${updatedTask.title}" to "${fields.status}"`);
      if (fields.status === "Needs Review") {
        recordNotification("Task Awaiting Review", `Deliverable "${updatedTask.title}" submitted and awaiting agency review.`, "task", id);
      }
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to update task" });
  }
});
apiRouter.post("/admin/tasks/:id/request-revision", requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const revision_instructions = req.body.revision_instructions || req.body.revisionInstructions || req.body.instructions;
    const now = (/* @__PURE__ */ new Date()).toISOString();
    db.prepare(`
      UPDATE tasks
      SET status = 'Revision Requested', revision_instructions = ?, updated_at = ?
      WHERE id = ?
    `).run(revision_instructions || "Please review feedback notes and submit revision.", now, id);
    const task = db.prepare("SELECT * FROM tasks WHERE id = ?").get(id);
    recordActivity(task?.project_id || null, id, "Agency Director", "revision_requested", `Requested revisions on task "${task?.title}"`);
    res.json({ success: true, task });
  } catch (err) {
    res.status(500).json({ error: "Failed to request revision" });
  }
});
apiRouter.post("/admin/tasks/:id/revision", requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const revision_instructions = req.body.revision_instructions || req.body.revisionInstructions || req.body.instructions;
    const now = (/* @__PURE__ */ new Date()).toISOString();
    db.prepare(`
      UPDATE tasks
      SET status = 'Revision Requested', revision_instructions = ?, updated_at = ?
      WHERE id = ?
    `).run(revision_instructions || "Please review feedback notes and submit revision.", now, id);
    const task = db.prepare("SELECT * FROM tasks WHERE id = ?").get(id);
    recordActivity(task?.project_id || null, id, "Agency Director", "revision_requested", `Requested revisions on task "${task?.title}"`);
    res.json({ success: true, task });
  } catch (err) {
    res.status(500).json({ error: "Failed to request revision" });
  }
});
apiRouter.post("/admin/tasks/:id/approve", requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const now = (/* @__PURE__ */ new Date()).toISOString();
    db.prepare(`
      UPDATE tasks
      SET status = 'Approved / Done', revision_instructions = NULL, updated_at = ?
      WHERE id = ?
    `).run(now, id);
    const task = db.prepare("SELECT * FROM tasks WHERE id = ?").get(id);
    recordActivity(task?.project_id || null, id, "Agency Director", "task_approved", `Approved deliverable for "${task?.title}"`);
    res.json({ success: true, task });
  } catch (err) {
    res.status(500).json({ error: "Failed to approve task" });
  }
});
apiRouter.delete("/admin/tasks/:id", requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    db.prepare("DELETE FROM tasks WHERE id = ?").run(id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete task" });
  }
});
apiRouter.post("/admin/tasks/:id/checklists", requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const { title } = req.body;
    if (!title) return res.status(400).json({ error: "Title required" });
    const chkId = "chk_" + crypto2.randomUUID();
    db.prepare(`
      INSERT INTO task_checklists (id, task_id, title, is_completed, created_at)
      VALUES (?, ?, ?, 0, ?)
    `).run(chkId, id, title.trim(), (/* @__PURE__ */ new Date()).toISOString());
    res.json({ success: true, id: chkId });
  } catch (err) {
    res.status(500).json({ error: "Failed to add checklist item" });
  }
});
apiRouter.patch("/admin/tasks/:id/checklists/:chkId", requireAdmin, (req, res) => {
  try {
    const { chkId } = req.params;
    const { is_completed, title } = req.body;
    const updates = [];
    const values = [];
    if (is_completed !== void 0) {
      updates.push("is_completed = ?");
      values.push(is_completed ? 1 : 0);
    }
    if (title !== void 0) {
      updates.push("title = ?");
      values.push(title);
    }
    values.push(chkId);
    db.prepare(`UPDATE task_checklists SET ${updates.join(", ")} WHERE id = ?`).run(...values);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to update checklist item" });
  }
});
apiRouter.delete("/admin/tasks/:id/checklists/:chkId", requireAdmin, (req, res) => {
  try {
    const { chkId } = req.params;
    db.prepare("DELETE FROM task_checklists WHERE id = ?").run(chkId);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete checklist item" });
  }
});
apiRouter.post("/admin/tasks/:id/comments", requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const { content, is_internal } = req.body;
    if (!content) return res.status(400).json({ error: "Comment content required" });
    const user = req.user;
    const cId = "cmt_" + crypto2.randomUUID();
    db.prepare(`
      INSERT INTO task_comments (id, task_id, author_name, author_role, author_id, content, is_internal, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      cId,
      id,
      user?.name || "Agency Director",
      "admin",
      user?.user_id || "usr_admin",
      content.trim(),
      is_internal ? 1 : 0,
      (/* @__PURE__ */ new Date()).toISOString()
    );
    res.json({ success: true, id: cId });
  } catch (err) {
    res.status(500).json({ error: "Failed to add comment" });
  }
});
apiRouter.get("/admin/deadlines", requireAdmin, (_req, res) => {
  try {
    const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    const rawProjects = db.prepare(`
      SELECT id, name as title, deadline, status, client_id
      FROM projects
      WHERE deadline IS NOT NULL AND deadline != ''
      ORDER BY deadline ASC
    `).all();
    const projects = rawProjects.map((p) => {
      const daysLeft = Math.ceil((new Date(p.deadline).getTime() - new Date(today).getTime()) / (1e3 * 60 * 60 * 24));
      return {
        id: p.id,
        type: "project",
        title: p.title,
        deadline: p.deadline,
        status: p.status,
        days_left: daysLeft,
        is_overdue: daysLeft < 0 && p.status !== "Completed"
      };
    });
    const rawTasks = db.prepare(`
      SELECT t.id, t.title, t.deadline, t.status, t.priority, p.name as project_name, f.name as assigned_to
      FROM tasks t
      LEFT JOIN projects p ON t.project_id = p.id
      LEFT JOIN freelancers f ON t.assigned_freelancer_id = f.id
      WHERE t.deadline IS NOT NULL AND t.deadline != ''
      ORDER BY t.deadline ASC
    `).all();
    const tasks = rawTasks.map((t) => {
      const daysLeft = Math.ceil((new Date(t.deadline).getTime() - new Date(today).getTime()) / (1e3 * 60 * 60 * 24));
      return {
        id: t.id,
        type: "task",
        title: t.title,
        project_name: t.project_name,
        assigned_to: t.assigned_to,
        priority: t.priority,
        deadline: t.deadline,
        status: t.status,
        days_left: daysLeft,
        is_overdue: daysLeft < 0 && t.status !== "Approved / Done"
      };
    });
    res.json({ today, projects, tasks });
  } catch (err) {
    res.status(500).json({ error: "Failed to load deadlines" });
  }
});
apiRouter.get("/admin/notifications", requireAdmin, (_req, res) => {
  try {
    const notifications = db.prepare("SELECT * FROM notifications ORDER BY created_at DESC LIMIT 50").all();
    const unreadCount = db.prepare("SELECT COUNT(*) as count FROM notifications WHERE is_read = 0").get().count;
    res.json({ notifications, unreadCount });
  } catch (err) {
    res.status(500).json({ error: "Failed to load notifications" });
  }
});
apiRouter.patch("/admin/notifications/:id/read", requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    db.prepare("UPDATE notifications SET is_read = 1 WHERE id = ?").run(id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to mark notification read" });
  }
});
apiRouter.post("/admin/notifications/read-all", requireAdmin, (_req, res) => {
  try {
    db.prepare("UPDATE notifications SET is_read = 1").run();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to mark all read" });
  }
});
apiRouter.get("/admin/settings", requireAdmin, (_req, res) => {
  try {
    const rows = db.prepare("SELECT key, value FROM settings").all();
    const settings = {};
    for (const r of rows) {
      settings[r.key] = r.value;
    }
    const counts = {
      leads: db.prepare("SELECT COUNT(*) as count FROM leads").get().count,
      clients: db.prepare("SELECT COUNT(*) as count FROM clients").get().count,
      freelancers: db.prepare("SELECT COUNT(*) as count FROM freelancers").get().count,
      projects: db.prepare("SELECT COUNT(*) as count FROM projects").get().count,
      tasks: db.prepare("SELECT COUNT(*) as count FROM tasks").get().count
    };
    res.json({ settings, counts });
  } catch (err) {
    res.status(500).json({ error: "Failed to load settings" });
  }
});
apiRouter.patch("/admin/settings", requireOwner, (req, res) => {
  try {
    const { settings } = req.body;
    if (settings && typeof settings === "object") {
      for (const [key, value] of Object.entries(settings)) {
        db.prepare(`
          INSERT INTO settings (key, value) VALUES (?, ?)
          ON CONFLICT(key) DO UPDATE SET value = excluded.value
        `).run(key, String(value));
      }
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to update settings" });
  }
});
apiRouter.get("/admin/export/:type", requireAdmin, (req, res) => {
  try {
    const { type } = req.params;
    const format = req.query.format === "json" ? "json" : "csv";
    let data = [];
    switch (type) {
      case "leads":
        data = db.prepare("SELECT * FROM leads ORDER BY created_at DESC").all();
        break;
      case "clients":
        data = db.prepare("SELECT * FROM clients ORDER BY created_at DESC").all();
        break;
      case "freelancers":
        data = db.prepare("SELECT * FROM freelancers ORDER BY created_at DESC").all();
        break;
      case "projects":
        data = db.prepare("SELECT * FROM projects ORDER BY created_at DESC").all();
        break;
      case "tasks":
        data = db.prepare("SELECT * FROM tasks ORDER BY created_at DESC").all();
        break;
      default:
        return res.status(400).send("Invalid export type");
    }
    if (format === "json") {
      res.setHeader("Content-Type", "application/json");
      res.setHeader("Content-Disposition", `attachment; filename="yaawp-${type}-${(/* @__PURE__ */ new Date()).toISOString().split("T")[0]}.json"`);
      return res.send(JSON.stringify(data, null, 2));
    }
    if (data.length === 0) {
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", `attachment; filename="yaawp-${type}.csv"`);
      return res.send("no_data");
    }
    const headers = Object.keys(data[0]);
    const escapeCsv = (val) => {
      if (val === null || val === void 0) return "";
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };
    const csvLines = [
      headers.join(","),
      ...data.map((row) => headers.map((h) => escapeCsv(row[h])).join(","))
    ];
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="yaawp-${type}-${(/* @__PURE__ */ new Date()).toISOString().split("T")[0]}.csv"`);
    res.send(csvLines.join("\n"));
  } catch (err) {
    res.status(500).send("Export failed");
  }
});
apiRouter.get("/admin/system/email-status", requireAdmin, (_req, res) => {
  try {
    const status = getEmailConfigStatus();
    res.json(status);
  } catch (err) {
    res.status(500).json({ error: "Failed to inspect email configuration" });
  }
});
apiRouter.post("/admin/system/test-email", requireOwner, async (req, res) => {
  try {
    const status = getEmailConfigStatus();
    if (!status.configured) {
      return res.status(400).json({
        success: false,
        error: `Email provider not configured. Missing: ${status.missingFields.join(", ")}`
      });
    }
    const recipient = req.body?.recipient || status.recipientEmail;
    if (!recipient) {
      return res.status(400).json({ success: false, error: "No recipient email specified." });
    }
    const baseUrl = process.env.APP_URL || `${req.protocol}://${req.get("host")}`;
    const testResult = await sendClientInquiryEmail(
      {
        id: "test_" + crypto2.randomUUID().slice(0, 8),
        name: "Test Client (YAAWP Diagnostics)",
        email: recipient,
        company: "Diagnostic Test Studio",
        service: "System Verification",
        budgetRange: "$10,000+",
        timeline: "Immediate verification",
        projectDetails: "This is a verified test email sent from the YAAWP Agency Workspace.",
        websiteOrSocial: baseUrl,
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      },
      baseUrl
    );
    if (testResult.success) {
      res.json({ success: true, message: `Test email sent successfully to ${recipient}`, messageId: testResult.messageId });
    } else {
      res.status(502).json({ success: false, error: testResult.error || "Failed to dispatch test email." });
    }
  } catch (err) {
    res.status(500).json({ success: false, error: err?.message || "Exception during email test" });
  }
});
apiRouter.post("/admin/system/purge-demo-data", requireOwner, (req, res) => {
  try {
    const demoLeadIds = ["lead_elena", "lead_marcus", "lead_sophia", "lead_henri", "lead_clara_dupont"];
    const demoClientIds = ["cli_aura", "cli_kanso", "cli_monolith", "cli_vanguard", "cli_solas"];
    const demoFreelancerIds = ["spc_liam", "spc_claire", "spc_david", "spc_maya", "spc_james", "spc_soren", "spc_zoe"];
    const demoProjectIds = ["prj_aura", "prj_kanso", "prj_monolith", "prj_vanguard", "prj_solas"];
    db.exec("BEGIN TRANSACTION;");
    for (const id of demoLeadIds) db.prepare("DELETE FROM leads WHERE id = ?").run(id);
    for (const id of demoProjectIds) db.prepare("DELETE FROM projects WHERE id = ?").run(id);
    for (const id of demoFreelancerIds) db.prepare("DELETE FROM freelancers WHERE id = ?").run(id);
    for (const id of demoClientIds) db.prepare("DELETE FROM clients WHERE id = ?").run(id);
    db.exec("COMMIT;");
    const actor = req.user?.name || "Agency Owner";
    recordActivity(null, null, actor, "demo_data_purged", "Purged initial demo records for clean workspace.");
    res.json({ success: true, message: "Fictional demo records successfully removed." });
  } catch (err) {
    db.exec("ROLLBACK;");
    res.status(500).json({ error: "Failed to purge demo data" });
  }
});
apiRouter.get("/admin/team", requireOwner, (_req, res) => {
  try {
    const members = db.prepare(`
      SELECT id, email, name, role, created_at
      FROM users
      ORDER BY created_at ASC
    `).all();
    res.json(members);
  } catch (err) {
    res.status(500).json({ error: "Failed to load team members" });
  }
});
apiRouter.post("/admin/team", requireOwner, (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: "Name, email, and password are required." });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters long." });
    }
    const trimmedEmail = email.trim().toLowerCase();
    const existing = db.prepare("SELECT id FROM users WHERE LOWER(email) = ?").get(trimmedEmail);
    if (existing) {
      return res.status(400).json({ error: "A team account with this email already exists." });
    }
    const count = db.prepare("SELECT COUNT(*) as count FROM users").get().count;
    if (count >= 5) {
      return res.status(400).json({ error: "Team limit reached (maximum 5 workspace members allowed)." });
    }
    const assignedRole = role === "owner" ? "owner" : "pm";
    const salt = crypto2.randomBytes(16).toString("hex");
    const hash = crypto2.scryptSync(password, salt, 64).toString("hex");
    const id = "usr_" + crypto2.randomUUID();
    const now = (/* @__PURE__ */ new Date()).toISOString();
    db.prepare(`
      INSERT INTO users (id, email, password_hash, salt, name, role, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, trimmedEmail, hash, salt, name.trim(), assignedRole, now);
    const actor = req.user?.name || "Owner";
    recordActivity(null, null, actor, "team_member_added", `Added ${assignedRole === "owner" ? "Owner" : "Project Manager"} account: ${name} (${trimmedEmail})`);
    res.json({
      success: true,
      member: {
        id,
        email: trimmedEmail,
        name: name.trim(),
        role: assignedRole,
        created_at: now
      }
    });
  } catch (err) {
    console.error("Failed to create team member:", err);
    res.status(500).json({ error: "Failed to create team member" });
  }
});
apiRouter.patch("/admin/team/:id", requireOwner, (req, res) => {
  try {
    const { id } = req.params;
    const { name, role, password } = req.body;
    const targetUser = db.prepare("SELECT * FROM users WHERE id = ?").get(id);
    if (!targetUser) {
      return res.status(404).json({ error: "Team member not found" });
    }
    const currentUserId = req.user.user_id;
    if (name) {
      db.prepare("UPDATE users SET name = ? WHERE id = ?").run(name.trim(), id);
    }
    if (role && (role === "owner" || role === "pm")) {
      if (id === currentUserId && role !== "owner") {
        const ownerCount = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'owner'").get().count;
        if (ownerCount <= 1) {
          return res.status(400).json({ error: "Cannot remove owner role from the only workspace owner." });
        }
      }
      db.prepare("UPDATE users SET role = ? WHERE id = ?").run(role, id);
    }
    if (password && password.length >= 8) {
      const salt = crypto2.randomBytes(16).toString("hex");
      const hash = crypto2.scryptSync(password, salt, 64).toString("hex");
      db.prepare("UPDATE users SET password_hash = ?, salt = ? WHERE id = ?").run(hash, salt, id);
      db.prepare("DELETE FROM sessions WHERE user_id = ?").run(id);
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to update team member" });
  }
});
apiRouter.delete("/admin/team/:id", requireOwner, (req, res) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user.user_id;
    if (id === currentUserId) {
      return res.status(400).json({ error: "You cannot delete your own active owner account." });
    }
    const targetUser = db.prepare("SELECT * FROM users WHERE id = ?").get(id);
    if (!targetUser) {
      return res.status(404).json({ error: "Team member not found" });
    }
    db.prepare("DELETE FROM sessions WHERE user_id = ?").run(id);
    db.prepare("DELETE FROM users WHERE id = ?").run(id);
    const actor = req.user?.name || "Owner";
    recordActivity(null, null, actor, "team_member_removed", `Removed team account: ${targetUser.name} (${targetUser.email})`);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete team member" });
  }
});

// server.ts
var __filename = fileURLToPath(import.meta.url);
var __dirname = path2.dirname(__filename);
async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || "3000", 10);
  try {
    initDatabase();
    console.log("[YAAWP] SQLite database initialized successfully.");
  } catch (err) {
    console.error("[YAAWP] Error initializing database:", err);
  }
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use("/api", apiRouter);
  if (process.env.NODE_ENV === "production") {
    const distPath = path2.resolve(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path2.resolve(distPath, "index.html"));
    });
  } else {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[YAAWP] Agency server running on http://0.0.0.0:${PORT}`);
  });
}
startServer();
