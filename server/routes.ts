import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import crypto from 'node:crypto';
import { db } from './db.ts';
import {
  sendClientInquiryEmail,
  sendFreelancerApplicationEmail,
  getEmailConfigStatus,
  getAgencyNotificationEmail,
} from './email.ts';

export const apiRouter = Router();

// ==========================================
// AUTH MIDDLEWARE & HELPERS
// ==========================================

function getAuthToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  const cookieHeader = req.headers.cookie;
  if (cookieHeader) {
    const match = cookieHeader.match(/yaawp_token=([^;]+)/);
    if (match) return match[1];
  }
  return null;
}

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const token = getAuthToken(req);
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const session = db.prepare(`
    SELECT user_id, email, role, expires_at FROM sessions WHERE token = ?
  `).get(token) as { user_id: string; email: string; role: string; expires_at: string } | undefined;

  if (!session) {
    return res.status(401).json({ error: 'Invalid or expired session' });
  }

  if (new Date(session.expires_at) < new Date()) {
    db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
    return res.status(401).json({ error: 'Session expired' });
  }

  (req as any).user = session;
  next();
}

function requireOwner(req: Request, res: Response, next: NextFunction) {
  requireAdmin(req, res, () => {
    const user = (req as any).user;
    if (user?.role !== 'owner' && user?.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied: Owner privileges required.' });
    }
    next();
  });
}

function recordActivity(projectId: string | null, taskId: string | null, actorName: string, actionType: string, description: string) {
  const id = 'act_' + crypto.randomUUID();
  db.prepare(`
    INSERT INTO activity_events (id, project_id, task_id, actor_name, action_type, description, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(id, projectId, taskId, actorName, actionType, description, new Date().toISOString());
}

function recordNotification(title: string, message: string, linkType?: string, linkId?: string) {
  const id = 'notif_' + crypto.randomUUID();
  db.prepare(`
    INSERT INTO notifications (id, recipient_role, title, message, link_type, link_id, is_read, created_at)
    VALUES (?, 'admin', ?, ?, ?, ?, 0, ?)
  `).run(id, title, message, linkType || null, linkId || null, new Date().toISOString());
}

// ==========================================
// 1. PUBLIC INTAKE ROUTES (From Existing Forms)
// ==========================================

apiRouter.post('/public/inquiry', (req: Request, res: Response) => {
  try {
    const { name, email, company, service, budgetRange, timeline, projectDetails, websiteOrSocial } = req.body;
    if (!name || !email || !service) {
      return res.status(400).json({ error: 'Name, email, and service are required.' });
    }

    const id = 'lead_' + crypto.randomUUID();
    const now = new Date().toISOString();

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

    recordActivity(null, null, name, 'lead_submitted', `Submitted client inquiry for ${service} (${company || 'Direct Client'})`);
    recordNotification(
      'New Client Inquiry',
      `${name} (${company || email}) submitted an inquiry for ${service}.`,
      'lead',
      id
    );

    // Asynchronously dispatch email notification without blocking HTTP response
    const baseUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
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
        createdAt: now,
      },
      baseUrl
    ).catch((emailErr) => {
      console.error('[YAAWP Email] Background inquiry email dispatch error:', emailErr);
    });

    res.json({ success: true, leadId: id });
  } catch (err: any) {
    console.error('Error handling inquiry:', err);
    res.status(500).json({ error: 'Failed to record inquiry' });
  }
});

apiRouter.post('/public/specialist-apply', (req: Request, res: Response) => {
  try {
    const fullName = (req.body.fullName || req.body.name || '').trim();
    const email = (req.body.email || '').trim().toLowerCase();
    const discipline = (req.body.discipline || req.body.primarySkill || '').trim();
    const portfolioUrl = (req.body.portfolioUrl || req.body.portfolio || '').trim();
    const yearsOfExperience = req.body.yearsOfExperience || req.body.yearsExperience || null;
    const weeklyAvailability = req.body.weeklyAvailability || null;
    const primarySkills = req.body.primarySkills || req.body.skills || req.body.secondarySkills || null;
    const briefBio = req.body.briefBio || req.body.bio || null;

    if (!fullName || !email || !discipline || !portfolioUrl) {
      return res.status(400).json({ error: 'Full name, email, discipline, and portfolio URL are required.' });
    }

    const existing = db.prepare('SELECT id FROM freelancers WHERE email = ?').get(email.trim().toLowerCase());
    if (existing) {
      return res.status(400).json({ error: 'An application with this email already exists in our network.' });
    }

    const id = 'spc_' + crypto.randomUUID();
    const now = new Date().toISOString();

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
      'Pending Location',
      discipline.trim(),
      primarySkills || null,
      portfolioUrl.trim(),
      yearsOfExperience || null,
      weeklyAvailability || null,
      null,
      briefBio || null,
      'Submitted via public specialist network intake form.',
      now,
      now
    );

    recordActivity(null, null, fullName, 'specialist_applied', `Submitted independent specialist application for ${discipline}`);
    recordNotification(
      'New Specialist Application',
      `${fullName} applied as a ${discipline} specialist.`,
      'freelancer',
      id
    );

    // Asynchronously dispatch email notification without blocking HTTP response
    const baseUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
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
        createdAt: now,
      },
      baseUrl
    ).catch((emailErr) => {
      console.error('[YAAWP Email] Background specialist email dispatch error:', emailErr);
    });

    res.json({ success: true, freelancerId: id });
  } catch (err: any) {
    console.error('Error submitting application:', err);
    res.status(500).json({ error: 'Failed to submit application' });
  }
});

// ==========================================
// 2. AUTHENTICATION ROUTES
// ==========================================

apiRouter.post('/auth/login', (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const trimmedEmail = email.trim().toLowerCase();
    const user = db.prepare('SELECT * FROM users WHERE LOWER(email) = ?').get(trimmedEmail) as any;

    if (!user) {
      const totalUsers = (db.prepare('SELECT count(*) as c FROM users').get() as any)?.c || 0;
      if (totalUsers === 0) {
        return res.status(401).json({
          error: 'No administrator accounts have been initialized. Please configure ADMIN_EMAIL and ADMIN_PASSWORD in environment variables/secrets and restart the deployment.',
        });
      }
      return res.status(401).json({ error: 'Invalid email or credentials' });
    }

    const hash = crypto.scryptSync(password, user.salt, 64).toString('hex');
    if (hash !== user.password_hash) {
      return res.status(401).json({ error: 'Invalid email or credentials' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // 30 days

    db.prepare(`
      INSERT INTO sessions (token, user_id, email, role, created_at, expires_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(token, user.id, user.email, user.role, new Date().toISOString(), expiresAt);

    res.cookie('yaawp_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (err: any) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

apiRouter.post('/auth/logout', (req: Request, res: Response) => {
  const token = getAuthToken(req);
  if (token) {
    db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
  }
  res.clearCookie('yaawp_token');
  res.json({ success: true });
});

apiRouter.get('/auth/me', (req: Request, res: Response) => {
  const token = getAuthToken(req);
  if (!token) {
    return res.status(401).json({ authenticated: false });
  }

  const session = db.prepare(`
    SELECT s.user_id, s.email, s.role, s.expires_at, u.name
    FROM sessions s
    JOIN users u ON s.user_id = u.id
    WHERE s.token = ?
  `).get(token) as any;

  if (!session || new Date(session.expires_at) < new Date()) {
    if (session) db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
    res.clearCookie('yaawp_token');
    return res.status(401).json({ authenticated: false });
  }

  res.json({
    authenticated: true,
    token,
    user: {
      id: session.user_id,
      email: session.email,
      name: session.name,
      role: session.role,
    },
  });
});

apiRouter.get('/auth/config', (_req: Request, res: Response) => {
  const isDev = process.env.NODE_ENV !== 'production' || process.env.DEMO_MODE === 'true';
  const adminUser = db.prepare("SELECT email FROM users WHERE role = 'owner' ORDER BY created_at DESC LIMIT 1").get() as { email: string } | undefined;
  res.json({
    allowDemoCredentials: isDev,
    hasConfiguredAdmin: Boolean(adminUser),
    configuredEmail: adminUser?.email || null,
    isProduction: process.env.NODE_ENV === 'production',
  });
});

// ==========================================
// 3. ADMIN DASHBOARD & METRICS
// ==========================================

apiRouter.get('/admin/dashboard', requireAdmin, (_req: Request, res: Response) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const newLeadsCount = (db.prepare("SELECT COUNT(*) as count FROM leads WHERE status = 'New'").get() as any).count;
    const activeProjectsCount = (db.prepare("SELECT COUNT(*) as count FROM projects WHERE status IN ('In Progress', 'Review', 'Planning')").get() as any).count;
    const awaitingReviewCount = (db.prepare("SELECT COUNT(*) as count FROM tasks WHERE status = 'Needs Review'").get() as any).count;
    const overdueTasksCount = (db.prepare("SELECT COUNT(*) as count FROM tasks WHERE status != 'Approved / Done' AND deadline IS NOT NULL AND deadline != '' AND deadline < ?").get(today) as any).count;
    const inProgressTasksCount = (db.prepare("SELECT COUNT(*) as count FROM tasks WHERE status = 'In Progress'").get() as any).count;
    const newSpecialistCount = (db.prepare("SELECT COUNT(*) as count FROM freelancers WHERE status = 'New Application'").get() as any).count;
    const totalSpecialists = (db.prepare("SELECT COUNT(*) as count FROM freelancers").get() as any).count;
    const totalClients = (db.prepare("SELECT COUNT(*) as count FROM clients").get() as any).count;

    // Upcoming urgent tasks
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
    `).all(today) as any[];

    // Upcoming active projects
    const upcomingProjects = db.prepare(`
      SELECT p.*, c.name as client_name, c.company as client_company,
        (SELECT COUNT(*) FROM tasks WHERE project_id = p.id) as task_count,
        (SELECT COUNT(*) FROM tasks WHERE project_id = p.id AND status = 'Approved / Done') as completed_task_count
      FROM projects p
      LEFT JOIN clients c ON p.client_id = c.id
      WHERE p.status IN ('In Progress', 'Review', 'Planning')
      ORDER BY p.deadline ASC
      LIMIT 6
    `).all() as any[];

    // Recent activity
    const recentActivity = db.prepare(`
      SELECT * FROM activity_events ORDER BY created_at DESC LIMIT 10
    `).all() as any[];

    // Recently completed tasks
    const recentlyCompletedTasks = db.prepare(`
      SELECT t.*, p.name as project_name, f.name as assigned_freelancer_name
      FROM tasks t
      LEFT JOIN projects p ON t.project_id = p.id
      LEFT JOIN freelancers f ON t.assigned_freelancer_id = f.id
      WHERE t.status = 'Approved / Done'
      ORDER BY t.updated_at DESC
      LIMIT 5
    `).all() as any[];

    res.json({
      metrics: {
        newLeads: newLeadsCount,
        activeProjects: activeProjectsCount,
        awaitingReview: awaitingReviewCount,
        overdueTasks: overdueTasksCount,
        inProgressTasks: inProgressTasksCount,
        newSpecialists: newSpecialistCount,
        totalSpecialists,
        totalClients,
      },
      upcomingTasks,
      upcomingProjects,
      recentActivity,
      recentlyCompletedTasks,
    });
  } catch (err: any) {
    console.error('Dashboard fetch error:', err);
    res.status(500).json({ error: 'Failed to load dashboard data' });
  }
});

// ==========================================
// 4. CLIENT LEADS CRUD
// ==========================================

apiRouter.get('/admin/leads', requireAdmin, (_req: Request, res: Response) => {
  try {
    const leads = db.prepare('SELECT * FROM leads ORDER BY created_at DESC').all();
    res.json(leads);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to load leads' });
  }
});

apiRouter.patch('/admin/leads/:id', requireAdmin, (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const fields = req.body;
    const now = new Date().toISOString();

    const allowed = [
      'name', 'email', 'company', 'service', 'budget_range',
      'timeline', 'project_details', 'website_or_social', 'status', 'internal_notes'
    ];
    const updates: string[] = ['updated_at = ?'];
    const values: any[] = [now];

    for (const key of allowed) {
      if (fields[key] !== undefined) {
        updates.push(`${key} = ?`);
        values.push(fields[key]);
      }
    }

    values.push(id);
    db.prepare(`UPDATE leads SET ${updates.join(', ')} WHERE id = ?`).run(...values);

    if (fields.status) {
      const actor = (req as any).user?.name || 'Workspace Lead';
      recordActivity(null, null, actor, 'lead_status_changed', `Updated quote status to "${fields.status}" for lead ${id}`);
    }

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update lead' });
  }
});

apiRouter.post('/admin/leads/:id/convert', requireAdmin, (req: Request, res: Response) => {
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

    const lead = db.prepare('SELECT * FROM leads WHERE id = ?').get(id) as any;
    if (!lead) return res.status(404).json({ error: 'Lead not found' });

    const now = new Date().toISOString();
    const actorName = (req as any).user?.name || 'Workspace Lead';

    // Check if client already exists with same email
    let clientId: string;
    const existingClient = db.prepare('SELECT id FROM clients WHERE LOWER(email) = ?').get(lead.email.toLowerCase()) as any;
    if (existingClient) {
      clientId = existingClient.id;
    } else {
      clientId = 'cli_' + crypto.randomUUID();
      db.prepare(`
        INSERT INTO clients (id, name, email, company, notes, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        clientId,
        lead.name,
        lead.email,
        lead.company,
        `Converted from inquiry (${lead.service}). Brief: ${lead.project_details || 'N/A'}${lead.internal_notes ? ` | Notes: ${lead.internal_notes}` : ''}`,
        now,
        now
      );
    }

    let projectId: string | undefined = undefined;
    if (createProject) {
      projectId = 'prj_' + crypto.randomUUID();
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
        projectName || `${lead.company || lead.name} — ${lead.service}`,
        lead.project_details || null,
        lead.service,
        effectiveDeadline,
        effectiveBudget,
        lead.internal_notes ? `Notes from lead intake: ${lead.internal_notes}` : `Originating from quote conversion on ${new Date().toLocaleDateString()}`,
        now,
        now
      );

      // Assign initial specialists if provided
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

      // Create initial deliverable tasks if provided
      if (Array.isArray(initialTasks)) {
        let orderIdx = 0;
        for (const item of initialTasks) {
          const taskTitle = typeof item === 'string' ? item.trim() : (item?.title || '').trim();
          const taskPriority = typeof item === 'object' && item?.priority ? item.priority : 'Medium';
          const taskSpecialistId = typeof item === 'object' && (item?.freelancer_id || item?.assigned_freelancer_id) ? (item.freelancer_id || item.assigned_freelancer_id) : null;
          
          if (taskTitle) {
            const taskId = 'tsk_' + crypto.randomUUID();
            db.prepare(`
              INSERT INTO tasks (
                id, project_id, title, status, priority, assigned_freelancer_id, order_index, created_at, updated_at
              ) VALUES (?, ?, ?, 'To Do', ?, ?, ?, ?, ?)
            `).run(taskId, projectId, taskTitle, taskPriority, taskSpecialistId, orderIdx++, now, now);
          }
        }
      }
    }

    // Mark lead as Accepted (or Converted)
    const targetStatus = status || 'Accepted';
    db.prepare("UPDATE leads SET status = ?, updated_at = ? WHERE id = ?").run(targetStatus, now, id);

    recordActivity(
      projectId || null,
      null,
      actorName,
      'lead_converted',
      `Converted quote "${lead.name}" into client and initialized project workspace`
    );

    const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(clientId);
    const project = projectId ? db.prepare('SELECT * FROM projects WHERE id = ?').get(projectId) : null;

    res.json({ success: true, clientId, projectId, client, project });
  } catch (err: any) {
    console.error('Lead conversion failed:', err);
    res.status(500).json({ error: 'Failed to convert lead' });
  }
});

apiRouter.delete('/admin/leads/:id', requireAdmin, (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM leads WHERE id = ?').run(id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete lead' });
  }
});

// ==========================================
// 5. CLIENTS CRUD
// ==========================================

apiRouter.get('/admin/clients', requireAdmin, (_req: Request, res: Response) => {
  try {
    const clients = db.prepare(`
      SELECT c.*,
        (SELECT COUNT(*) FROM projects WHERE client_id = c.id) as project_count,
        (SELECT COUNT(*) FROM projects WHERE client_id = c.id AND status IN ('In Progress', 'Review', 'Planning')) as active_project_count
      FROM clients c
      ORDER BY c.created_at DESC
    `).all();
    res.json(clients);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to load clients' });
  }
});

apiRouter.post('/admin/clients', requireAdmin, (req: Request, res: Response) => {
  try {
    const { name, email, company, phone, notes } = req.body;
    if (!name || !email) {
      return res.status(400).json({ error: 'Client name and email are required.' });
    }

    const id = 'cli_' + crypto.randomUUID();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO clients (id, name, email, company, phone, notes, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, name.trim(), email.trim(), company || null, phone || null, notes || null, now, now);

    recordActivity(null, null, 'Agency Director', 'client_created', `Added new client record: ${name} (${company || 'Direct'})`);

    res.json({ success: true, id });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to create client' });
  }
});

apiRouter.get('/admin/clients/:id', requireAdmin, (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(id);
    if (!client) return res.status(404).json({ error: 'Client not found' });

    const projects = db.prepare(`
      SELECT p.*,
        (SELECT COUNT(*) FROM tasks WHERE project_id = p.id) as task_count,
        (SELECT COUNT(*) FROM tasks WHERE project_id = p.id AND status = 'Approved / Done') as completed_task_count
      FROM projects p
      WHERE p.client_id = ?
      ORDER BY p.created_at DESC
    `).all(id);

    res.json({ client, projects });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to load client details' });
  }
});

apiRouter.patch('/admin/clients/:id', requireAdmin, (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const fields = req.body;
    const now = new Date().toISOString();

    const allowed = ['name', 'email', 'company', 'phone', 'notes'];
    const updates: string[] = ['updated_at = ?'];
    const values: any[] = [now];

    for (const key of allowed) {
      if (fields[key] !== undefined) {
        updates.push(`${key} = ?`);
        values.push(fields[key]);
      }
    }

    values.push(id);
    db.prepare(`UPDATE clients SET ${updates.join(', ')} WHERE id = ?`).run(...values);

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update client' });
  }
});

apiRouter.delete('/admin/clients/:id', requireAdmin, (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM clients WHERE id = ?').run(id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete client' });
  }
});

// ==========================================
// 6. FREELANCERS / SPECIALISTS CRUD
// ==========================================

apiRouter.get('/admin/freelancers', requireAdmin, (_req: Request, res: Response) => {
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
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to load specialists' });
  }
});

apiRouter.post('/admin/freelancers', requireAdmin, (req: Request, res: Response) => {
  try {
    const {
      name, email, location_timezone, primary_skill, secondary_skills,
      portfolio_url, years_experience, weekly_availability, hourly_rate,
      bio, status, internal_notes, quality_rating
    } = req.body;

    if (!name || !email || !primary_skill) {
      return res.status(400).json({ error: 'Name, email, and primary skill are required.' });
    }

    const id = 'spc_' + crypto.randomUUID();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO freelancers (
        id, name, email, location_timezone, primary_skill, secondary_skills,
        portfolio_url, years_experience, weekly_availability, hourly_rate,
        bio, status, internal_notes, quality_rating, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, name.trim(), email.trim().toLowerCase(), location_timezone || null,
      primary_skill.trim(), secondary_skills || null, portfolio_url || '',
      years_experience || null, weekly_availability || null, hourly_rate || null,
      bio || null, status || 'Approved Network Member', internal_notes || null,
      quality_rating !== undefined ? quality_rating : 5, now, now
    );

    recordActivity(null, null, 'Agency Director', 'specialist_created', `Added specialist ${name} (${primary_skill})`);

    res.json({ success: true, id });
  } catch (err: any) {
    console.error('Failed to create specialist:', err);
    res.status(500).json({ error: 'Failed to create specialist' });
  }
});

apiRouter.get('/admin/freelancers/:id', requireAdmin, (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const specialist = db.prepare('SELECT * FROM freelancers WHERE id = ?').get(id);
    if (!specialist) return res.status(404).json({ error: 'Specialist not found' });

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
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to load specialist details' });
  }
});

apiRouter.patch('/admin/freelancers/:id', requireAdmin, (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const fields = req.body;
    const now = new Date().toISOString();

    const allowed = [
      'name', 'email', 'location_timezone', 'primary_skill', 'secondary_skills',
      'portfolio_url', 'years_experience', 'weekly_availability', 'hourly_rate',
      'bio', 'status', 'internal_notes', 'quality_rating'
    ];
    const updates: string[] = ['updated_at = ?'];
    const values: any[] = [now];

    for (const key of allowed) {
      if (fields[key] !== undefined) {
        updates.push(`${key} = ?`);
        values.push(fields[key]);
      }
    }

    values.push(id);
    db.prepare(`UPDATE freelancers SET ${updates.join(', ')} WHERE id = ?`).run(...values);

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update specialist' });
  }
});

apiRouter.delete('/admin/freelancers/:id', requireAdmin, (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM freelancers WHERE id = ?').run(id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete specialist' });
  }
});

// ==========================================
// 7. PROJECTS CRUD & SPECIALIST ASSIGNMENT
// ==========================================

apiRouter.get('/admin/projects', requireAdmin, (_req: Request, res: Response) => {
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
    `).all() as any[];

    // Attach specialists for each project
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
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to load projects' });
  }
});

apiRouter.post('/admin/projects', requireAdmin, (req: Request, res: Response) => {
  try {
    const {
      name, client_id, description, services, start_date, deadline,
      budget_value, status, internal_notes, client_notes, specialist_ids
    } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Project name is required.' });
    }

    const id = 'prj_' + crypto.randomUUID();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO projects (
        id, client_id, name, description, services, start_date, deadline,
        budget_value, status, internal_notes, client_notes, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, client_id || null, name.trim(), description || null, services || null,
      start_date || null, deadline || null, budget_value || null, status || 'Planning',
      internal_notes || null, client_notes || null, now, now
    );

    if (Array.isArray(specialist_ids)) {
      for (const spcId of specialist_ids) {
        db.prepare(`
          INSERT OR IGNORE INTO project_freelancers (project_id, freelancer_id, created_at)
          VALUES (?, ?, ?)
        `).run(id, spcId, now);
      }
    }

    recordActivity(id, null, 'Agency Director', 'project_created', `Created project "${name}"`);

    res.json({ success: true, id });
  } catch (err: any) {
    console.error('Failed to create project:', err);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

apiRouter.get('/admin/projects/:id', requireAdmin, (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const project = db.prepare(`
      SELECT p.*, c.name as client_name, c.company as client_company, c.email as client_email
      FROM projects p
      LEFT JOIN clients c ON p.client_id = c.id
      WHERE p.id = ?
    `).get(id);

    if (!project) return res.status(404).json({ error: 'Project not found' });

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
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to load project details' });
  }
});

apiRouter.patch('/admin/projects/:id', requireAdmin, (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const fields = req.body;
    const now = new Date().toISOString();

    const allowed = [
      'name', 'client_id', 'description', 'services', 'start_date', 'deadline',
      'budget_value', 'status', 'internal_notes', 'client_notes', 'files_json'
    ];
    const updates: string[] = ['updated_at = ?'];
    const values: any[] = [now];

    for (const key of allowed) {
      if (fields[key] !== undefined) {
        updates.push(`${key} = ?`);
        values.push(fields[key]);
      }
    }

    values.push(id);
    db.prepare(`UPDATE projects SET ${updates.join(', ')} WHERE id = ?`).run(...values);

    if (fields.status) {
      recordActivity(id, null, 'Agency Director', 'project_status_changed', `Updated project status to "${fields.status}"`);
    }

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update project' });
  }
});

apiRouter.delete('/admin/projects/:id', requireAdmin, (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM projects WHERE id = ?').run(id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

apiRouter.post('/admin/projects/:id/assign-freelancer', requireAdmin, (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { freelancer_id, role_in_project } = req.body;
    if (!freelancer_id) return res.status(400).json({ error: 'Freelancer ID required' });

    db.prepare(`
      INSERT INTO project_freelancers (project_id, freelancer_id, role_in_project, created_at)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(project_id, freelancer_id) DO UPDATE SET role_in_project = excluded.role_in_project
    `).run(id, freelancer_id, role_in_project || null, new Date().toISOString());

    const spc = db.prepare('SELECT name FROM freelancers WHERE id = ?').get(freelancer_id) as any;
    recordActivity(id, null, 'Agency Director', 'specialist_assigned', `Assigned specialist ${spc?.name || freelancer_id} to project`);

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to assign specialist' });
  }
});

apiRouter.delete('/admin/projects/:id/remove-freelancer', requireAdmin, (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { freelancer_id } = req.body;
    db.prepare('DELETE FROM project_freelancers WHERE project_id = ? AND freelancer_id = ?').run(id, freelancer_id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to remove specialist from project' });
  }
});

// ==========================================
// 8. TASKS & KANBAN MANAGEMENT
// ==========================================

apiRouter.get('/admin/tasks', requireAdmin, (req: Request, res: Response) => {
  try {
    const { projectId, freelancerId, status, priority } = req.query;
    const where: string[] = ['1=1'];
    const params: any[] = [];

    if (projectId) {
      where.push('t.project_id = ?');
      params.push(projectId);
    }
    if (freelancerId) {
      where.push('t.assigned_freelancer_id = ?');
      params.push(freelancerId);
    }
    if (status) {
      where.push('t.status = ?');
      params.push(status);
    }
    if (priority) {
      where.push('t.priority = ?');
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
      WHERE ${where.join(' AND ')}
      ORDER BY t.order_index ASC, t.deadline ASC
    `).all(...params);

    res.json(tasks);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to load tasks' });
  }
});

apiRouter.post('/admin/tasks', requireAdmin, (req: Request, res: Response) => {
  try {
    const rawProjectId = req.body.project_id || req.body.projectId;
    const rawFreelancerId = req.body.assigned_freelancer_id || req.body.assignedFreelancerId;
    const { title, description, status, priority, deadline, internal_notes } = req.body;

    if (!rawProjectId || !title) {
      return res.status(400).json({ error: 'Project and task title are required.' });
    }

    const id = 'tsk_' + crypto.randomUUID();
    const now = new Date().toISOString();

    const maxOrderRow = db.prepare('SELECT MAX(order_index) as max_idx FROM tasks WHERE project_id = ? AND status = ?').get(rawProjectId, status || 'Backlog') as any;
    const nextOrder = (maxOrderRow?.max_idx ?? -1) + 1;

    db.prepare(`
      INSERT INTO tasks (
        id, project_id, title, description, assigned_freelancer_id, status,
        priority, deadline, order_index, internal_notes, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, rawProjectId, title.trim(), description || null, rawFreelancerId || null,
      status || 'Backlog', priority || 'Medium', deadline || null, nextOrder,
      internal_notes || null, now, now
    );

    recordActivity(rawProjectId, id, 'Agency Director', 'task_created', `Created task "${title}"`);

    res.json({ success: true, id, taskId: id });
  } catch (err: any) {
    console.error('Failed to create task:', err);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

apiRouter.get('/admin/tasks/:id', requireAdmin, (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const task = db.prepare(`
      SELECT t.*, p.name as project_name, f.name as assigned_freelancer_name, f.email as assigned_freelancer_email
      FROM tasks t
      LEFT JOIN projects p ON t.project_id = p.id
      LEFT JOIN freelancers f ON t.assigned_freelancer_id = f.id
      WHERE t.id = ?
    `).get(id);

    if (!task) return res.status(404).json({ error: 'Task not found' });

    const checklists = db.prepare('SELECT * FROM task_checklists WHERE task_id = ? ORDER BY created_at ASC').all(id);
    const comments = db.prepare('SELECT * FROM task_comments WHERE task_id = ? ORDER BY created_at ASC').all(id);

    res.json({ task, checklists, comments });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to load task' });
  }
});

apiRouter.patch('/admin/tasks/:id', requireAdmin, (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const fields = req.body;
    const now = new Date().toISOString();

    const allowed = [
      'title', 'description', 'assigned_freelancer_id', 'status',
      'priority', 'deadline', 'order_index', 'revision_instructions', 'internal_notes', 'files_json'
    ];
    const updates: string[] = ['updated_at = ?'];
    const values: any[] = [now];

    for (const key of allowed) {
      if (fields[key] !== undefined) {
        updates.push(`${key} = ?`);
        values.push(fields[key]);
      }
    }

    values.push(id);
    db.prepare(`UPDATE tasks SET ${updates.join(', ')} WHERE id = ?`).run(...values);

    const updatedTask = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id) as any;

    if (fields.status) {
      const actorName = (req as any).user?.name || 'Workspace Lead';
      recordActivity(updatedTask.project_id, id, actorName, 'task_status_changed', `Moved task "${updatedTask.title}" to "${fields.status}"`);

      if (fields.status === 'Needs Review') {
        recordNotification('Task Awaiting Review', `Deliverable "${updatedTask.title}" submitted and awaiting agency review.`, 'task', id);
      }
    }

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update task' });
  }
});

apiRouter.post('/admin/tasks/:id/request-revision', requireAdmin, (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const revision_instructions = req.body.revision_instructions || req.body.revisionInstructions || req.body.instructions;
    const now = new Date().toISOString();

    db.prepare(`
      UPDATE tasks
      SET status = 'Revision Requested', revision_instructions = ?, updated_at = ?
      WHERE id = ?
    `).run(revision_instructions || 'Please review feedback notes and submit revision.', now, id);

    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id) as any;
    recordActivity(task?.project_id || null, id, 'Agency Director', 'revision_requested', `Requested revisions on task "${task?.title}"`);

    res.json({ success: true, task });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to request revision' });
  }
});

apiRouter.post('/admin/tasks/:id/revision', requireAdmin, (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const revision_instructions = req.body.revision_instructions || req.body.revisionInstructions || req.body.instructions;
    const now = new Date().toISOString();

    db.prepare(`
      UPDATE tasks
      SET status = 'Revision Requested', revision_instructions = ?, updated_at = ?
      WHERE id = ?
    `).run(revision_instructions || 'Please review feedback notes and submit revision.', now, id);

    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id) as any;
    recordActivity(task?.project_id || null, id, 'Agency Director', 'revision_requested', `Requested revisions on task "${task?.title}"`);

    res.json({ success: true, task });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to request revision' });
  }
});

apiRouter.post('/admin/tasks/:id/approve', requireAdmin, (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const now = new Date().toISOString();

    db.prepare(`
      UPDATE tasks
      SET status = 'Approved / Done', revision_instructions = NULL, updated_at = ?
      WHERE id = ?
    `).run(now, id);

    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id) as any;
    recordActivity(task?.project_id || null, id, 'Agency Director', 'task_approved', `Approved deliverable for "${task?.title}"`);

    res.json({ success: true, task });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to approve task' });
  }
});

apiRouter.delete('/admin/tasks/:id', requireAdmin, (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM tasks WHERE id = ?').run(id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

// Task Checklists
apiRouter.post('/admin/tasks/:id/checklists', requireAdmin, (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { title } = req.body;
    if (!title) return res.status(400).json({ error: 'Title required' });

    const chkId = 'chk_' + crypto.randomUUID();
    db.prepare(`
      INSERT INTO task_checklists (id, task_id, title, is_completed, created_at)
      VALUES (?, ?, ?, 0, ?)
    `).run(chkId, id, title.trim(), new Date().toISOString());

    res.json({ success: true, id: chkId });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to add checklist item' });
  }
});

apiRouter.patch('/admin/tasks/:id/checklists/:chkId', requireAdmin, (req: Request, res: Response) => {
  try {
    const { chkId } = req.params;
    const { is_completed, title } = req.body;

    const updates: string[] = [];
    const values: any[] = [];

    if (is_completed !== undefined) {
      updates.push('is_completed = ?');
      values.push(is_completed ? 1 : 0);
    }
    if (title !== undefined) {
      updates.push('title = ?');
      values.push(title);
    }

    values.push(chkId);
    db.prepare(`UPDATE task_checklists SET ${updates.join(', ')} WHERE id = ?`).run(...values);

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update checklist item' });
  }
});

apiRouter.delete('/admin/tasks/:id/checklists/:chkId', requireAdmin, (req: Request, res: Response) => {
  try {
    const { chkId } = req.params;
    db.prepare('DELETE FROM task_checklists WHERE id = ?').run(chkId);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete checklist item' });
  }
});

// Task Comments
apiRouter.post('/admin/tasks/:id/comments', requireAdmin, (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { content, is_internal } = req.body;
    if (!content) return res.status(400).json({ error: 'Comment content required' });

    const user = (req as any).user;
    const cId = 'cmt_' + crypto.randomUUID();

    db.prepare(`
      INSERT INTO task_comments (id, task_id, author_name, author_role, author_id, content, is_internal, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      cId,
      id,
      user?.name || 'Agency Director',
      'admin',
      user?.user_id || 'usr_admin',
      content.trim(),
      is_internal ? 1 : 0,
      new Date().toISOString()
    );

    res.json({ success: true, id: cId });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

// ==========================================
// 9. DEADLINES & CALENDAR
// ==========================================

apiRouter.get('/admin/deadlines', requireAdmin, (_req: Request, res: Response) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const rawProjects = db.prepare(`
      SELECT id, name as title, deadline, status, client_id
      FROM projects
      WHERE deadline IS NOT NULL AND deadline != ''
      ORDER BY deadline ASC
    `).all() as any[];

    const projects: any[] = rawProjects.map((p) => {
      const daysLeft = Math.ceil((new Date(p.deadline).getTime() - new Date(today).getTime()) / (1000 * 60 * 60 * 24));
      return {
        id: p.id,
        type: 'project',
        title: p.title,
        deadline: p.deadline,
        status: p.status,
        days_left: daysLeft,
        is_overdue: daysLeft < 0 && p.status !== 'Completed',
      };
    });

    const rawTasks = db.prepare(`
      SELECT t.id, t.title, t.deadline, t.status, t.priority, p.name as project_name, f.name as assigned_to
      FROM tasks t
      LEFT JOIN projects p ON t.project_id = p.id
      LEFT JOIN freelancers f ON t.assigned_freelancer_id = f.id
      WHERE t.deadline IS NOT NULL AND t.deadline != ''
      ORDER BY t.deadline ASC
    `).all() as any[];

    const tasks: any[] = rawTasks.map((t) => {
      const daysLeft = Math.ceil((new Date(t.deadline).getTime() - new Date(today).getTime()) / (1000 * 60 * 60 * 24));
      return {
        id: t.id,
        type: 'task',
        title: t.title,
        project_name: t.project_name,
        assigned_to: t.assigned_to,
        priority: t.priority,
        deadline: t.deadline,
        status: t.status,
        days_left: daysLeft,
        is_overdue: daysLeft < 0 && t.status !== 'Approved / Done',
      };
    });

    res.json({ today, projects, tasks });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to load deadlines' });
  }
});

// ==========================================
// 10. NOTIFICATIONS
// ==========================================

apiRouter.get('/admin/notifications', requireAdmin, (_req: Request, res: Response) => {
  try {
    const notifications = db.prepare('SELECT * FROM notifications ORDER BY created_at DESC LIMIT 50').all() as any[];
    const unreadCount = (db.prepare('SELECT COUNT(*) as count FROM notifications WHERE is_read = 0').get() as any).count;
    res.json({ notifications, unreadCount });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to load notifications' });
  }
});

apiRouter.patch('/admin/notifications/:id/read', requireAdmin, (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ?').run(id);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to mark notification read' });
  }
});

apiRouter.post('/admin/notifications/read-all', requireAdmin, (_req: Request, res: Response) => {
  try {
    db.prepare('UPDATE notifications SET is_read = 1').run();
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to mark all read' });
  }
});

// ==========================================
// 11. SETTINGS & EXPORT
// ==========================================

apiRouter.get('/admin/settings', requireAdmin, (_req: Request, res: Response) => {
  try {
    const rows = db.prepare('SELECT key, value FROM settings').all() as { key: string; value: string }[];
    const settings: Record<string, string> = {};
    for (const r of rows) {
      settings[r.key] = r.value;
    }

    const counts = {
      leads: (db.prepare('SELECT COUNT(*) as count FROM leads').get() as any).count,
      clients: (db.prepare('SELECT COUNT(*) as count FROM clients').get() as any).count,
      freelancers: (db.prepare('SELECT COUNT(*) as count FROM freelancers').get() as any).count,
      projects: (db.prepare('SELECT COUNT(*) as count FROM projects').get() as any).count,
      tasks: (db.prepare('SELECT COUNT(*) as count FROM tasks').get() as any).count,
    };

    res.json({ settings, counts });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to load settings' });
  }
});

apiRouter.patch('/admin/settings', requireOwner, (req: Request, res: Response) => {
  try {
    const { settings } = req.body;
    if (settings && typeof settings === 'object') {
      for (const [key, value] of Object.entries(settings)) {
        db.prepare(`
          INSERT INTO settings (key, value) VALUES (?, ?)
          ON CONFLICT(key) DO UPDATE SET value = excluded.value
        `).run(key, String(value));
      }
    }
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

// Data Export (CSV or JSON)
apiRouter.get('/admin/export/:type', requireAdmin, (req: Request, res: Response) => {
  try {
    const { type } = req.params;
    const format = req.query.format === 'json' ? 'json' : 'csv';

    let data: any[] = [];
    switch (type) {
      case 'leads':
        data = db.prepare('SELECT * FROM leads ORDER BY created_at DESC').all();
        break;
      case 'clients':
        data = db.prepare('SELECT * FROM clients ORDER BY created_at DESC').all();
        break;
      case 'freelancers':
        data = db.prepare('SELECT * FROM freelancers ORDER BY created_at DESC').all();
        break;
      case 'projects':
        data = db.prepare('SELECT * FROM projects ORDER BY created_at DESC').all();
        break;
      case 'tasks':
        data = db.prepare('SELECT * FROM tasks ORDER BY created_at DESC').all();
        break;
      default:
        return res.status(400).send('Invalid export type');
    }

    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="yaawp-${type}-${new Date().toISOString().split('T')[0]}.json"`);
      return res.send(JSON.stringify(data, null, 2));
    }

    // CSV format
    if (data.length === 0) {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="yaawp-${type}.csv"`);
      return res.send('no_data');
    }

    const headers = Object.keys(data[0]);
    const escapeCsv = (val: any) => {
      if (val === null || val === undefined) return '';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const csvLines = [
      headers.join(','),
      ...data.map((row) => headers.map((h) => escapeCsv(row[h])).join(',')),
    ];

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="yaawp-${type}-${new Date().toISOString().split('T')[0]}.csv"`);
    res.send(csvLines.join('\n'));
  } catch (err: any) {
    res.status(500).send('Export failed');
  }
});

// ==========================================
// 12. SYSTEM DIAGNOSTICS & MANAGEMENT
// ==========================================

apiRouter.get('/admin/system/email-status', requireAdmin, (_req: Request, res: Response) => {
  try {
    const status = getEmailConfigStatus();
    res.json(status);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to inspect email configuration' });
  }
});

apiRouter.post('/admin/system/test-email', requireOwner, async (req: Request, res: Response) => {
  try {
    const status = getEmailConfigStatus();
    if (!status.configured) {
      return res.status(400).json({
        success: false,
        error: `Email provider not configured. Missing: ${status.missingFields.join(', ')}`,
      });
    }

    const recipient = req.body?.recipient || status.recipientEmail;
    if (!recipient) {
      return res.status(400).json({ success: false, error: 'No recipient email specified.' });
    }

    const baseUrl = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
    const testResult = await sendClientInquiryEmail(
      {
        id: 'test_' + crypto.randomUUID().slice(0, 8),
        name: 'Test Client (YAAWP Diagnostics)',
        email: recipient,
        company: 'Diagnostic Test Studio',
        service: 'System Verification',
        budgetRange: '$10,000+',
        timeline: 'Immediate verification',
        projectDetails: 'This is a verified test email sent from the YAAWP Agency Workspace.',
        websiteOrSocial: baseUrl,
        createdAt: new Date().toISOString(),
      },
      baseUrl
    );

    if (testResult.success) {
      res.json({ success: true, message: `Test email sent successfully to ${recipient}`, messageId: testResult.messageId });
    } else {
      res.status(502).json({ success: false, error: testResult.error || 'Failed to dispatch test email.' });
    }
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Exception during email test' });
  }
});

apiRouter.post('/admin/system/purge-demo-data', requireOwner, (req: Request, res: Response) => {
  try {
    // Purge only seeded fictional records (prefixed with known demo IDs)
    const demoLeadIds = ['lead_elena', 'lead_marcus', 'lead_sophia', 'lead_henri', 'lead_clara_dupont'];
    const demoClientIds = ['cli_aura', 'cli_kanso', 'cli_monolith', 'cli_vanguard', 'cli_solas'];
    const demoFreelancerIds = ['spc_liam', 'spc_claire', 'spc_david', 'spc_maya', 'spc_james', 'spc_soren', 'spc_zoe'];
    const demoProjectIds = ['prj_aura', 'prj_kanso', 'prj_monolith', 'prj_vanguard', 'prj_solas'];

    db.exec('BEGIN TRANSACTION;');
    for (const id of demoLeadIds) db.prepare('DELETE FROM leads WHERE id = ?').run(id);
    for (const id of demoProjectIds) db.prepare('DELETE FROM projects WHERE id = ?').run(id);
    for (const id of demoFreelancerIds) db.prepare('DELETE FROM freelancers WHERE id = ?').run(id);
    for (const id of demoClientIds) db.prepare('DELETE FROM clients WHERE id = ?').run(id);
    db.exec('COMMIT;');

    const actor = (req as any).user?.name || 'Agency Owner';
    recordActivity(null, null, actor, 'demo_data_purged', 'Purged initial demo records for clean workspace.');
    res.json({ success: true, message: 'Fictional demo records successfully removed.' });
  } catch (err: any) {
    db.exec('ROLLBACK;');
    res.status(500).json({ error: 'Failed to purge demo data' });
  }
});

// ==========================================
// 13. TEAM ACCESS & ROLES (Owner Only)
// ==========================================

apiRouter.get('/admin/team', requireOwner, (_req: Request, res: Response) => {
  try {
    const members = db.prepare(`
      SELECT id, email, name, role, created_at
      FROM users
      ORDER BY created_at ASC
    `).all();
    res.json(members);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to load team members' });
  }
});

apiRouter.post('/admin/team', requireOwner, (req: Request, res: Response) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long.' });
    }

    const trimmedEmail = email.trim().toLowerCase();
    const existing = db.prepare('SELECT id FROM users WHERE LOWER(email) = ?').get(trimmedEmail);
    if (existing) {
      return res.status(400).json({ error: 'A team account with this email already exists.' });
    }

    const count = (db.prepare('SELECT COUNT(*) as count FROM users').get() as any).count;
    if (count >= 5) {
      return res.status(400).json({ error: 'Team limit reached (maximum 5 workspace members allowed).' });
    }

    const assignedRole = role === 'owner' ? 'owner' : 'pm';
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.scryptSync(password, salt, 64).toString('hex');
    const id = 'usr_' + crypto.randomUUID();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO users (id, email, password_hash, salt, name, role, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, trimmedEmail, hash, salt, name.trim(), assignedRole, now);

    const actor = (req as any).user?.name || 'Owner';
    recordActivity(null, null, actor, 'team_member_added', `Added ${assignedRole === 'owner' ? 'Owner' : 'Project Manager'} account: ${name} (${trimmedEmail})`);

    res.json({
      success: true,
      member: {
        id,
        email: trimmedEmail,
        name: name.trim(),
        role: assignedRole,
        created_at: now,
      },
    });
  } catch (err: any) {
    console.error('Failed to create team member:', err);
    res.status(500).json({ error: 'Failed to create team member' });
  }
});

apiRouter.patch('/admin/team/:id', requireOwner, (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, role, password } = req.body;
    const targetUser = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as any;
    if (!targetUser) {
      return res.status(404).json({ error: 'Team member not found' });
    }

    const currentUserId = (req as any).user.user_id;

    if (name) {
      db.prepare('UPDATE users SET name = ? WHERE id = ?').run(name.trim(), id);
    }
    if (role && (role === 'owner' || role === 'pm')) {
      if (id === currentUserId && role !== 'owner') {
        const ownerCount = (db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'owner'").get() as any).count;
        if (ownerCount <= 1) {
          return res.status(400).json({ error: 'Cannot remove owner role from the only workspace owner.' });
        }
      }
      db.prepare('UPDATE users SET role = ? WHERE id = ?').run(role, id);
    }
    if (password && password.length >= 8) {
      const salt = crypto.randomBytes(16).toString('hex');
      const hash = crypto.scryptSync(password, salt, 64).toString('hex');
      db.prepare('UPDATE users SET password_hash = ?, salt = ? WHERE id = ?').run(hash, salt, id);
      db.prepare('DELETE FROM sessions WHERE user_id = ?').run(id);
    }

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update team member' });
  }
});

apiRouter.delete('/admin/team/:id', requireOwner, (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const currentUserId = (req as any).user.user_id;
    if (id === currentUserId) {
      return res.status(400).json({ error: 'You cannot delete your own active owner account.' });
    }

    const targetUser = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as any;
    if (!targetUser) {
      return res.status(404).json({ error: 'Team member not found' });
    }

    db.prepare('DELETE FROM sessions WHERE user_id = ?').run(id);
    db.prepare('DELETE FROM users WHERE id = ?').run(id);

    const actor = (req as any).user?.name || 'Owner';
    recordActivity(null, null, actor, 'team_member_removed', `Removed team account: ${targetUser.name} (${targetUser.email})`);

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete team member' });
  }
});
