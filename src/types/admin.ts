export type LeadStatus = 'New' | 'Contacted' | 'In Discussion' | 'Converted' | 'Archived';

export interface Lead {
  id: string;
  name: string;
  email: string;
  company: string | null;
  service: string;
  budget_range: string | null;
  timeline: string | null;
  project_details: string | null;
  website_or_social: string | null;
  status: LeadStatus;
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  company: string | null;
  phone: string | null;
  notes: string | null;
  total_projects?: number;
  active_projects?: number;
  created_at: string;
  updated_at: string;
}

export type FreelancerStatus = 'New Application' | 'Approved Network Member' | 'On Hold' | 'Rejected' | 'Inactive';

export interface Freelancer {
  id: string;
  name: string;
  email: string;
  location_timezone: string | null;
  primary_skill: string;
  secondary_skills: string | null;
  portfolio_url: string;
  years_experience: string | null;
  weekly_availability: string | null;
  hourly_rate: string | null;
  bio: string | null;
  status: FreelancerStatus;
  internal_notes: string | null;
  quality_rating: number;
  assigned_projects_count?: number;
  assigned_tasks_count?: number;
  created_at: string;
  updated_at: string;
}

export type ProjectStatus = 'Planning' | 'In Progress' | 'Review' | 'Completed' | 'On Hold' | 'Cancelled';

export interface ProjectSpecialistLink {
  id: string;
  name: string;
  primary_skill: string;
  role_in_project?: string;
}

export interface Project {
  id: string;
  client_id: string | null;
  client_name?: string;
  client_company?: string;
  client_email?: string;
  client_phone?: string;
  name: string;
  description: string | null;
  services: string | null;
  start_date: string | null;
  deadline: string | null;
  budget_value: string | null;
  status: ProjectStatus;
  internal_notes: string | null;
  client_notes: string | null;
  total_tasks?: number;
  completed_tasks?: number;
  review_tasks?: number;
  specialists?: ProjectSpecialistLink[];
  created_at: string;
  updated_at: string;
}

export type TaskStatus = 
  | 'Backlog'
  | 'To Do'
  | 'In Progress'
  | 'Needs Review'
  | 'Revisions Requested'
  | 'Approved / Done';

export type TaskPriority = 'Low' | 'Medium' | 'High' | 'Urgent';

export interface TaskChecklist {
  id: string;
  task_id: string;
  title: string;
  is_completed: number;
  created_at: string;
}

export interface TaskComment {
  id: string;
  task_id: string;
  author_name: string;
  author_role: string;
  author_id: string;
  content: string;
  is_internal: number;
  created_at: string;
}

export interface TaskItem {
  id: string;
  project_id: string;
  project_name?: string;
  client_company?: string;
  title: string;
  description: string | null;
  assigned_freelancer_id: string | null;
  assigned_specialist_name?: string;
  assigned_specialist_skill?: string;
  status: TaskStatus;
  priority: TaskPriority;
  deadline: string | null;
  order_index: number;
  revision_instructions: string | null;
  internal_notes: string | null;
  checklist_total?: number;
  checklist_completed?: number;
  comment_count?: number;
  created_at: string;
  updated_at: string;
}

export interface ActivityEvent {
  id: string;
  project_id: string | null;
  task_id: string | null;
  actor_name: string;
  action_type: string;
  description: string;
  created_at: string;
}

export interface NotificationItem {
  id: string;
  recipient_role: string;
  title: string;
  message: string;
  link_type: string | null;
  link_id: string | null;
  is_read: number;
  created_at: string;
}

export interface DashboardMetrics {
  newLeads: number;
  activeProjects: number;
  tasksAwaitingReview: number;
  tasksOverdue: number;
  tasksInProgress: number;
  revisionsRequested: number;
  newSpecialistApplications: number;
}

export interface DeadlineItem {
  item_type: 'project' | 'task';
  id: string;
  title: string;
  deadline: string;
  status: string;
  priority?: string;
  project_name?: string;
  client_company?: string;
  specialist_name?: string;
  budget_value?: string;
  is_overdue: number;
}

export interface AgencyUser {
  id: string;
  email: string;
  name: string;
  role: string;
}
