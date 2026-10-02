import {
  AgencyUser,
  Client,
  DashboardMetrics,
  DeadlineItem,
  Freelancer,
  Lead,
  NotificationItem,
  Project,
  TaskChecklist,
  TaskComment,
  TaskItem,
  TeamMember,
} from '../types/admin';

class AgencyApiService {
  private token: string | null = null;

  constructor() {
    this.token = typeof window !== 'undefined' ? localStorage.getItem('yaawp_admin_token') : null;
  }

  setToken(token: string | null) {
    this.token = token;
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('yaawp_admin_token', token);
      } else {
        localStorage.removeItem('yaawp_admin_token');
      }
    }
  }

  getToken() {
    if (this.token) return this.token;
    if (typeof window !== 'undefined') {
      return localStorage.getItem('yaawp_admin_token');
    }
    return null;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers = new Headers(options.headers || {});
    if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json');
    }

    const currentToken = this.getToken();
    if (currentToken && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${currentToken}`);
    }

    const response = await fetch(endpoint, {
      ...options,
      headers,
      credentials: 'include',
    });

    if (response.status === 401) {
      this.setToken(null);
      let errorMsg = 'Invalid email or password.';
      try {
        const errJson = await response.json();
        if (errJson?.error) errorMsg = errJson.error;
      } catch {
        // use fallback
      }
      throw new Error(errorMsg);
    }

    if (!response.ok) {
      let errMsg = response.statusText ? `Request failed: ${response.statusText}` : `Request failed (HTTP ${response.status})`;
      if (response.status === 404) {
        errMsg = 'API route not found (404). The server may still be deploying or starting up.';
      } else if (response.status === 502 || response.status === 503) {
        errMsg = 'Backend service is restarting or unavailable. Please wait a moment and try again.';
      }

      try {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errJson = await response.json();
          if (errJson?.error) errMsg = errJson.error;
        }
      } catch {
        // ignore
      }
      throw new Error(errMsg);
    }

    return response.json();
  }

  // --- Public Intake ---
  async submitInquiry(data: {
    name: string;
    email: string;
    company?: string;
    service: string;
    budgetRange?: string;
    timeline?: string;
    projectDetails?: string;
    websiteOrSocial?: string;
  }) {
    return this.request<{ success: boolean; leadId: string }>('/api/public/inquiry', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async submitSpecialistApplication(data: {
    fullName: string;
    email: string;
    discipline: string;
    portfolioUrl: string;
    yearsOfExperience?: string;
    weeklyAvailability?: string;
    primarySkills?: string;
    briefBio?: string;
  }) {
    return this.request<{ success: boolean; freelancerId: string }>('/api/public/specialist-apply', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // --- Auth ---
  async login(email: string, password: string) {
    const res = await this.request<{ success: boolean; token: string; user: AgencyUser }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (res.token) {
      this.setToken(res.token);
    }
    return res;
  }

  async logout() {
    try {
      await this.request('/api/auth/logout', { method: 'POST' });
    } finally {
      this.setToken(null);
    }
  }

  async checkAuth() {
    return this.request<{ authenticated: boolean; user: AgencyUser; token?: string }>('/api/auth/me');
  }

  // --- Dashboard ---
  async getDashboard() {
    return this.request<{
      metrics: DashboardMetrics;
      upcomingTasks: any[];
      upcomingProjects: any[];
      recentActivity: any[];
      recentlyCompletedTasks: any[];
    }>('/api/admin/dashboard');
  }

  // --- Leads ---
  async getLeads(): Promise<Lead[]> {
    return this.request<Lead[]>('/api/admin/leads');
  }

  async updateLead(id: string, data: Partial<Lead>) {
    return this.request<{ success: boolean }>(`/api/admin/leads/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async convertLead(
    id: string,
    options: {
      createProject?: boolean;
      projectName?: string;
      budget?: string;
      deadline?: string;
      specialistIds?: string[];
      initialTasks?: string[];
      status?: string;
    }
  ) {
    return this.request<{ success: boolean; clientId: string; projectId?: string }>(`/api/admin/leads/${id}/convert`, {
      method: 'POST',
      body: JSON.stringify(options),
    });
  }

  async deleteLead(id: string) {
    return this.request<{ success: boolean }>(`/api/admin/leads/${id}`, {
      method: 'DELETE',
    });
  }

  // --- Clients ---
  async getClients(): Promise<Client[]> {
    return this.request<Client[]>('/api/admin/clients');
  }

  async createClient(data: Partial<Client>) {
    return this.request<{ success: boolean; id: string }>('/api/admin/clients', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getClient(id: string): Promise<{ client: Client; projects: Project[] }> {
    return this.request<{ client: Client; projects: Project[] }>(`/api/admin/clients/${id}`);
  }

  async updateClient(id: string, data: Partial<Client>) {
    return this.request<{ success: boolean }>(`/api/admin/clients/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteClient(id: string) {
    return this.request<{ success: boolean }>(`/api/admin/clients/${id}`, {
      method: 'DELETE',
    });
  }

  // --- Freelancers ---
  async getFreelancers(): Promise<Freelancer[]> {
    return this.request<Freelancer[]>('/api/admin/freelancers');
  }

  async createFreelancer(data: Partial<Freelancer>) {
    return this.request<{ success: boolean; id: string }>('/api/admin/freelancers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getFreelancer(id: string): Promise<{ specialist: Freelancer; projects: Project[]; tasks: TaskItem[] }> {
    return this.request<{ specialist: Freelancer; projects: Project[]; tasks: TaskItem[] }>(`/api/admin/freelancers/${id}`);
  }

  async updateFreelancer(id: string, data: Partial<Freelancer>) {
    return this.request<{ success: boolean }>(`/api/admin/freelancers/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteFreelancer(id: string) {
    return this.request<{ success: boolean }>(`/api/admin/freelancers/${id}`, {
      method: 'DELETE',
    });
  }

  // --- Projects ---
  async getProjects(): Promise<Project[]> {
    return this.request<Project[]>('/api/admin/projects');
  }

  async createProject(data: any) {
    return this.request<{ success: boolean; id: string }>('/api/admin/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getProject(id: string): Promise<{ project: Project; specialists: Freelancer[]; tasks: TaskItem[] }> {
    return this.request<{ project: Project; specialists: Freelancer[]; tasks: TaskItem[] }>(`/api/admin/projects/${id}`);
  }

  async updateProject(id: string, data: Partial<Project>) {
    return this.request<{ success: boolean }>(`/api/admin/projects/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteProject(id: string) {
    return this.request<{ success: boolean }>(`/api/admin/projects/${id}`, {
      method: 'DELETE',
    });
  }

  async assignFreelancer(projectId: string, freelancerId: string, role?: string) {
    return this.request<{ success: boolean }>(`/api/admin/projects/${projectId}/assign-freelancer`, {
      method: 'POST',
      body: JSON.stringify({ freelancer_id: freelancerId, role_in_project: role }),
    });
  }

  async removeFreelancer(projectId: string, freelancerId: string) {
    return this.request<{ success: boolean }>(`/api/admin/projects/${projectId}/remove-freelancer`, {
      method: 'DELETE',
      body: JSON.stringify({ freelancer_id: freelancerId }),
    });
  }

  // --- Tasks & Kanban ---
  async getTasks(params?: { projectId?: string; freelancerId?: string; status?: string; priority?: string }): Promise<TaskItem[]> {
    const qs = new URLSearchParams();
    if (params?.projectId) qs.set('projectId', params.projectId);
    if (params?.freelancerId) qs.set('freelancerId', params.freelancerId);
    if (params?.status) qs.set('status', params.status);
    if (params?.priority) qs.set('priority', params.priority);
    return this.request<TaskItem[]>(`/api/admin/tasks?${qs.toString()}`);
  }

  async createTask(data: any) {
    return this.request<{ success: boolean; id: string }>('/api/admin/tasks', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getTask(id: string): Promise<{ task: TaskItem; checklists: TaskChecklist[]; comments: TaskComment[] }> {
    return this.request<{ task: TaskItem; checklists: TaskChecklist[]; comments: TaskComment[] }>(`/api/admin/tasks/${id}`);
  }

  async updateTask(id: string, data: Partial<TaskItem>) {
    return this.request<{ success: boolean }>(`/api/admin/tasks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async requestRevision(id: string, revisionInstructions: string) {
    return this.request<{ success: boolean }>(`/api/admin/tasks/${id}/request-revision`, {
      method: 'POST',
      body: JSON.stringify({ revision_instructions: revisionInstructions }),
    });
  }

  async approveTask(id: string) {
    return this.request<{ success: boolean }>(`/api/admin/tasks/${id}/approve`, {
      method: 'POST',
    });
  }

  async deleteTask(id: string) {
    return this.request<{ success: boolean }>(`/api/admin/tasks/${id}`, {
      method: 'DELETE',
    });
  }

  async addChecklist(taskId: string, title: string) {
    return this.request<{ success: boolean; id: string }>(`/api/admin/tasks/${taskId}/checklists`, {
      method: 'POST',
      body: JSON.stringify({ title }),
    });
  }

  async toggleChecklist(taskId: string, checklistId: string, isCompleted: boolean) {
    return this.request<{ success: boolean }>(`/api/admin/tasks/${taskId}/checklists/${checklistId}`, {
      method: 'PATCH',
      body: JSON.stringify({ is_completed: isCompleted }),
    });
  }

  async deleteChecklist(taskId: string, checklistId: string) {
    return this.request<{ success: boolean }>(`/api/admin/tasks/${taskId}/checklists/${checklistId}`, {
      method: 'DELETE',
    });
  }

  async addComment(taskId: string, content: string, isInternal: boolean = false) {
    return this.request<{ success: boolean; id: string }>(`/api/admin/tasks/${taskId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content, is_internal: isInternal }),
    });
  }

  // --- Deadlines & Calendar ---
  async getDeadlines(): Promise<{ today: string; projects: DeadlineItem[]; tasks: DeadlineItem[] }> {
    return this.request<{ today: string; projects: DeadlineItem[]; tasks: DeadlineItem[] }>('/api/admin/deadlines');
  }

  // --- Notifications ---
  async getNotifications(): Promise<{ notifications: NotificationItem[]; unreadCount: number }> {
    return this.request<{ notifications: NotificationItem[]; unreadCount: number }>('/api/admin/notifications');
  }

  async markNotificationRead(id: string) {
    return this.request<{ success: boolean }>(`/api/admin/notifications/${id}/read`, {
      method: 'PATCH',
    });
  }

  async markAllNotificationsRead() {
    return this.request<{ success: boolean }>('/api/admin/notifications/read-all', {
      method: 'POST',
    });
  }

  // --- Settings & Export ---
  async getSettings() {
    return this.request<{ settings: Record<string, string>; counts: Record<string, number> }>('/api/admin/settings');
  }

  async updateSettings(settings: Record<string, string>) {
    return this.request<{ success: boolean }>('/api/admin/settings', {
      method: 'PATCH',
      body: JSON.stringify({ settings }),
    });
  }

  getExportUrl(type: string, format: 'json' | 'csv' = 'csv') {
    return `/api/admin/export/${type}?format=${format}`;
  }

  // --- Auth & Diagnostics ---
  async getAuthConfig() {
    return this.request<{
      allowDemoCredentials: boolean;
      hasConfiguredAdmin: boolean;
      configuredEmail?: string | null;
      isProduction: boolean;
    }>('/api/auth/config');
  }

  async getEmailStatus() {
    return this.request<{
      configured: boolean;
      recipientConfigured: boolean;
      recipientEmail: string | null;
      provider: string;
      fromEmail: string;
      missingFields: string[];
    }>('/api/admin/system/email-status');
  }

  async testEmail(recipient?: string) {
    return this.request<{ success: boolean; message?: string; messageId?: string }>('/api/admin/system/test-email', {
      method: 'POST',
      body: JSON.stringify({ recipient }),
    });
  }

  async purgeDemoData() {
    return this.request<{ success: boolean; message: string }>('/api/admin/system/purge-demo-data', {
      method: 'POST',
    });
  }

  // --- Team Access & Roles (Owner Only) ---
  async getTeamMembers(): Promise<TeamMember[]> {
    return this.request<TeamMember[]>('/api/admin/team');
  }

  async createTeamMember(data: { name: string; email: string; password: string; role?: 'owner' | 'pm' }) {
    return this.request<{ success: boolean; member: TeamMember }>('/api/admin/team', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateTeamMember(id: string, data: { name?: string; role?: 'owner' | 'pm'; password?: string }) {
    return this.request<{ success: boolean }>(`/api/admin/team/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteTeamMember(id: string) {
    return this.request<{ success: boolean }>(`/api/admin/team/${id}`, {
      method: 'DELETE',
    });
  }
}

export const agencyApi = new AgencyApiService();
