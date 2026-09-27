import React, { useState } from 'react';
import {
  AdminUsersTab,
  AdminRolesTab,
  AdminSystemTab,
  AdminProjectsTab,
  AdminAnalyticsTab,
} from '../components/admin/index.js';
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from '../components/ui/index.js';
import {
  Users,
  ShieldCheck,
  FolderGit2,
  TrendingUp,
  Activity,
  ShieldAlert,
} from 'lucide-react';

interface AdminDashboardPageProps {
  defaultTab?: 'users' | 'roles' | 'system' | 'projects' | 'analytics';
}

export const AdminDashboardPage: React.FC<AdminDashboardPageProps> = ({
  defaultTab = 'users',
}) => {
  const [activeTab, setActiveTab] = useState<'users' | 'roles' | 'system' | 'projects' | 'analytics'>(defaultTab);

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded bg-primary/10 text-primary">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Administration & System Center
            </h1>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Global governance, RBAC authority, user identity management, and system operations.
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as any)}>
        <TabsList className="bg-muted/50 p-1 rounded-lg border border-border/60 w-full sm:w-auto flex flex-wrap">
          <TabsTrigger value="users" className="text-xs font-semibold gap-1.5 px-3 py-1.5">
            <Users className="w-3.5 h-3.5" />
            Users & Identity
          </TabsTrigger>
          <TabsTrigger value="roles" className="text-xs font-semibold gap-1.5 px-3 py-1.5">
            <ShieldCheck className="w-3.5 h-3.5" />
            Roles & RBAC
          </TabsTrigger>
          <TabsTrigger value="projects" className="text-xs font-semibold gap-1.5 px-3 py-1.5">
            <FolderGit2 className="w-3.5 h-3.5" />
            Projects
          </TabsTrigger>
          <TabsTrigger value="system" className="text-xs font-semibold gap-1.5 px-3 py-1.5">
            <Activity className="w-3.5 h-3.5" />
            System & Broadcast
          </TabsTrigger>
          <TabsTrigger value="analytics" className="text-xs font-semibold gap-1.5 px-3 py-1.5">
            <TrendingUp className="w-3.5 h-3.5" />
            Worklog Analytics
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Tab Contents */}
      {activeTab === 'users' && <AdminUsersTab />}
      {activeTab === 'roles' && <AdminRolesTab />}
      {activeTab === 'projects' && <AdminProjectsTab />}
      {activeTab === 'system' && <AdminSystemTab />}
      {activeTab === 'analytics' && <AdminAnalyticsTab />}
    </div>
  );
};
