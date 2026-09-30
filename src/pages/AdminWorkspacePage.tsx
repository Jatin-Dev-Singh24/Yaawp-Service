import React, { useState, useEffect } from 'react';
import { AdminLogin } from '../components/admin/AdminLogin';
import { AdminHeader, AdminTab } from '../components/admin/AdminHeader';
import { AdminDashboard } from '../components/admin/AdminDashboard';
import { AdminLeads } from '../components/admin/AdminLeads';
import { AdminClients } from '../components/admin/AdminClients';
import { AdminFreelancers } from '../components/admin/AdminFreelancers';
import { AdminProjects } from '../components/admin/AdminProjects';
import { AdminKanban } from '../components/admin/AdminKanban';
import { AdminDeadlines } from '../components/admin/AdminDeadlines';
import { AdminNotifications } from '../components/admin/AdminNotifications';
import { AdminSettings } from '../components/admin/AdminSettings';
import { agencyApi } from '../services/agencyApi';
import {
  AgencyUser,
  Client,
  DashboardMetrics,
  DeadlineItem,
  Freelancer,
  Lead,
  LeadStatus,
  NotificationItem,
  Project,
  TaskItem,
} from '../types/admin';

interface AdminWorkspacePageProps {
  onReturnToPublic: () => void;
}

export const AdminWorkspacePage: React.FC<AdminWorkspacePageProps> = ({ onReturnToPublic }) => {
  const [user, setUser] = useState<AgencyUser | null>(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [currentTab, setCurrentTab] = useState<AdminTab>('dashboard');

  // Agency Data State
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [upcomingTasks, setUpcomingTasks] = useState<any[]>([]);
  const [upcomingProjects, setUpcomingProjects] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [recentlyCompletedTasks, setRecentlyCompletedTasks] = useState<any[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [freelancers, setFreelancers] = useState<Freelancer[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [deadlines, setDeadlines] = useState<{
    today: string;
    projects: DeadlineItem[];
    tasks: DeadlineItem[];
  } | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [systemCounts, setSystemCounts] = useState<Record<string, number>>({});

  // Deep link or inspecting item
  const [inspectingTaskIdForKanban, setInspectingTaskIdForKanban] = useState<string | null>(null);

  // Check auth session on mount
  useEffect(() => {
    agencyApi
      .checkAuth()
      .then((res) => {
        if (res.authenticated && res.user) {
          setUser(res.user);
        }
      })
      .catch(() => {
        // Not logged in
      })
      .finally(() => {
        setAuthChecking(false);
      });
  }, []);

  // When logged in, load all agency state
  const loadAllData = async () => {
    try {
      const [
        dashData,
        leadsData,
        clientsData,
        freelancersData,
        projectsData,
        tasksData,
        deadlinesData,
        notifData,
        settingsData,
      ] = await Promise.all([
        agencyApi.getDashboard(),
        agencyApi.getLeads(),
        agencyApi.getClients(),
        agencyApi.getFreelancers(),
        agencyApi.getProjects(),
        agencyApi.getTasks(),
        agencyApi.getDeadlines(),
        agencyApi.getNotifications(),
        agencyApi.getSettings(),
      ]);

      setMetrics(dashData.metrics);
      setUpcomingTasks(dashData.upcomingTasks || []);
      setUpcomingProjects(dashData.upcomingProjects || []);
      setRecentActivity(dashData.recentActivity || []);
      setRecentlyCompletedTasks(dashData.recentlyCompletedTasks || []);

      setLeads(leadsData);
      setClients(clientsData);
      setFreelancers(freelancersData);
      setProjects(projectsData);
      setTasks(tasksData);
      setDeadlines(deadlinesData);
      setNotifications(notifData.notifications || []);
      setUnreadNotifications(notifData.unreadCount || 0);
      setSettings(settingsData.settings || {});
      setSystemCounts(settingsData.counts || {});
    } catch (err) {
      console.error('Failed to load agency data:', err);
    }
  };

  useEffect(() => {
    if (user) {
      loadAllData();
    }
  }, [user]);

  // Auth Handlers
  const handleLoginSuccess = (loggedInUser: AgencyUser) => {
    setUser(loggedInUser);
  };

  const handleLogout = async () => {
    await agencyApi.logout();
    setUser(null);
  };

  // Lead Handlers
  const handleUpdateLeadStatus = async (leadId: string, status: LeadStatus) => {
    await agencyApi.updateLead(leadId, { status });
    await loadAllData();
  };

  const handleConvertLead = async (
    leadId: string,
    options: { createProject: boolean; projectName?: string; budget?: string; deadline?: string }
  ) => {
    await agencyApi.convertLead(leadId, options);
    await loadAllData();
  };

  const handleArchiveLead = async (leadId: string) => {
    await agencyApi.updateLead(leadId, { status: 'Archived' });
    await loadAllData();
  };

  const handleDeleteLead = async (leadId: string) => {
    await agencyApi.deleteLead(leadId);
    await loadAllData();
  };

  // Client Handlers
  const handleCreateClient = async (data: Partial<Client>) => {
    await agencyApi.createClient(data);
    await loadAllData();
  };

  const handleUpdateClient = async (id: string, data: Partial<Client>) => {
    await agencyApi.updateClient(id, data);
    await loadAllData();
  };

  const handleDeleteClient = async (id: string) => {
    await agencyApi.deleteClient(id);
    await loadAllData();
  };

  // Freelancer Handlers
  const handleCreateFreelancer = async (data: Partial<Freelancer>) => {
    await agencyApi.createFreelancer(data);
    await loadAllData();
  };

  const handleUpdateFreelancer = async (id: string, data: Partial<Freelancer>) => {
    await agencyApi.updateFreelancer(id, data);
    await loadAllData();
  };

  const handleDeleteFreelancer = async (id: string) => {
    await agencyApi.deleteFreelancer(id);
    await loadAllData();
  };

  // Project Handlers
  const handleCreateProject = async (data: any) => {
    await agencyApi.createProject(data);
    await loadAllData();
  };

  const handleUpdateProject = async (id: string, data: Partial<Project>) => {
    await agencyApi.updateProject(id, data);
    await loadAllData();
  };

  const handleDeleteProject = async (id: string) => {
    await agencyApi.deleteProject(id);
    await loadAllData();
  };

  const handleAssignSpecialistToProject = async (
    projectId: string,
    specialistId: string,
    role?: string
  ) => {
    await agencyApi.assignFreelancer(projectId, specialistId, role);
    await loadAllData();
  };

  const handleRemoveSpecialistFromProject = async (projectId: string, specialistId: string) => {
    await agencyApi.removeFreelancer(projectId, specialistId);
    await loadAllData();
  };

  // Task Handlers
  const handleCreateTask = async (data: any) => {
    await agencyApi.createTask(data);
    await loadAllData();
  };

  const handleUpdateTask = async (id: string, data: Partial<TaskItem>) => {
    await agencyApi.updateTask(id, data);
    await loadAllData();
  };

  const handleApproveTask = async (id: string) => {
    await agencyApi.approveTask(id);
    await loadAllData();
  };

  const handleRequestRevision = async (id: string, instructions: string) => {
    await agencyApi.requestRevision(id, instructions);
    await loadAllData();
  };

  const handleDeleteTask = async (id: string) => {
    await agencyApi.deleteTask(id);
    await loadAllData();
  };

  const handleAddChecklist = async (taskId: string, title: string) => {
    await agencyApi.addChecklist(taskId, title);
    await loadAllData();
  };

  const handleToggleChecklist = async (taskId: string, checklistId: string, isCompleted: boolean) => {
    await agencyApi.toggleChecklist(taskId, checklistId, isCompleted);
    await loadAllData();
  };

  const handleDeleteChecklist = async (taskId: string, checklistId: string) => {
    await agencyApi.deleteChecklist(taskId, checklistId);
    await loadAllData();
  };

  const handleAddComment = async (taskId: string, content: string, isInternal: boolean) => {
    await agencyApi.addComment(taskId, content, isInternal);
    await loadAllData();
  };

  // Notifications Handlers
  const handleMarkNotificationRead = async (id: string) => {
    await agencyApi.markNotificationRead(id);
    setNotifications(
      notifications.map((n) => (n.id === id ? { ...n, is_read: 1 } : n))
    );
    setUnreadNotifications((prev) => Math.max(0, prev - 1));
  };

  const handleMarkAllNotificationsRead = async () => {
    await agencyApi.markAllNotificationsRead();
    setNotifications(notifications.map((n) => ({ ...n, is_read: 1 })));
    setUnreadNotifications(0);
  };

  const handleNavigateToNotificationTarget = (linkType: string | null, linkId: string | null) => {
    if (linkType === 'lead') {
      setCurrentTab('leads');
    } else if (linkType === 'freelancer') {
      setCurrentTab('freelancers');
    } else if (linkType === 'task') {
      setInspectingTaskIdForKanban(linkId);
      setCurrentTab('tasks');
    }
  };

  // Settings Handlers
  const handleUpdateSettings = async (newSettings: Record<string, string>) => {
    await agencyApi.updateSettings(newSettings);
    await loadAllData();
  };

  if (authChecking) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-6 h-6 border-2 border-[#581825] border-t-transparent rounded-full animate-spin mx-auto" />
          <span className="text-xs uppercase tracking-widest text-[#5C5853] block">
            Verifying Director Access...
          </span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <AdminLogin onSuccess={handleLoginSuccess} onBackToSite={onReturnToPublic} />
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#191816] flex flex-col">
      {/* Top Admin Header */}
      <AdminHeader
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        metrics={metrics}
        unreadNotifications={unreadNotifications}
        user={user}
        onLogout={handleLogout}
        onReturnToPublic={onReturnToPublic}
      />

      {/* Main Workspace Canvas */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {currentTab === 'dashboard' && (
          <AdminDashboard
            metrics={metrics}
            upcomingTasks={upcomingTasks}
            upcomingProjects={upcomingProjects}
            recentActivity={recentActivity}
            recentlyCompletedTasks={recentlyCompletedTasks}
            onSelectTab={setCurrentTab}
            onOpenNewProject={() => setCurrentTab('projects')}
            onOpenNewTask={() => setCurrentTab('tasks')}
            onApproveTask={handleApproveTask}
            onInspectTask={(taskId) => {
              setInspectingTaskIdForKanban(taskId);
              setCurrentTab('tasks');
            }}
          />
        )}

        {currentTab === 'leads' && (
          <AdminLeads
            leads={leads}
            onUpdateLeadStatus={handleUpdateLeadStatus}
            onUpdateLeadNotes={async () => {}}
            onConvertLead={handleConvertLead}
            onArchiveLead={handleArchiveLead}
            onDeleteLead={handleDeleteLead}
          />
        )}

        {currentTab === 'clients' && (
          <AdminClients
            clients={clients}
            projects={projects}
            onCreateClient={handleCreateClient}
            onUpdateClient={handleUpdateClient}
            onDeleteClient={handleDeleteClient}
            onSelectProject={() => setCurrentTab('projects')}
            onOpenNewProjectForClient={() => setCurrentTab('projects')}
          />
        )}

        {currentTab === 'freelancers' && (
          <AdminFreelancers
            freelancers={freelancers}
            projects={projects}
            onCreateFreelancer={handleCreateFreelancer}
            onUpdateFreelancer={handleUpdateFreelancer}
            onDeleteFreelancer={handleDeleteFreelancer}
            onSelectProject={() => setCurrentTab('projects')}
          />
        )}

        {currentTab === 'projects' && (
          <AdminProjects
            projects={projects}
            clients={clients}
            freelancers={freelancers}
            tasks={tasks}
            onCreateProject={handleCreateProject}
            onUpdateProject={handleUpdateProject}
            onDeleteProject={handleDeleteProject}
            onAssignSpecialistToProject={handleAssignSpecialistToProject}
            onRemoveSpecialistFromProject={handleRemoveSpecialistFromProject}
            onSelectTask={(taskId) => {
              setInspectingTaskIdForKanban(taskId);
              setCurrentTab('tasks');
            }}
            onOpenNewTaskForProject={() => setCurrentTab('tasks')}
          />
        )}

        {currentTab === 'tasks' && (
          <AdminKanban
            tasks={tasks}
            projects={projects}
            freelancers={freelancers}
            onCreateTask={handleCreateTask}
            onUpdateTask={handleUpdateTask}
            onApproveTask={handleApproveTask}
            onRequestRevision={handleRequestRevision}
            onDeleteTask={handleDeleteTask}
            onAddChecklist={handleAddChecklist}
            onToggleChecklist={handleToggleChecklist}
            onDeleteChecklist={handleDeleteChecklist}
            onAddComment={handleAddComment}
            initialInspectingTaskId={inspectingTaskIdForKanban}
            onClearInitialTask={() => setInspectingTaskIdForKanban(null)}
          />
        )}

        {currentTab === 'deadlines' && (
          <AdminDeadlines
            deadlines={deadlines}
            onSelectProject={() => setCurrentTab('projects')}
            onSelectTask={(taskId) => {
              setInspectingTaskIdForKanban(taskId);
              setCurrentTab('tasks');
            }}
          />
        )}

        {currentTab === 'notifications' && (
          <AdminNotifications
            notifications={notifications}
            unreadCount={unreadNotifications}
            onMarkRead={handleMarkNotificationRead}
            onMarkAllRead={handleMarkAllNotificationsRead}
            onNavigateToItem={handleNavigateToNotificationTarget}
          />
        )}

        {currentTab === 'settings' && (
          <AdminSettings
            settings={settings}
            counts={systemCounts}
            onUpdateSettings={handleUpdateSettings}
          />
        )}
      </main>
    </div>
  );
};
