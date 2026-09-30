import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  AdminUsersTab,
  AdminRbacTab,
  AdminSecurityLogsTab,
  AdminProjectsTab,
  AdminTeamsTab,
  AdminBroadcastBannerCard,
} from '../components/admin/index.js';
import {
  Tabs,
  TabsList,
  TabsTrigger,
  Button,
} from '../components/ui/index.js';
import {
  Users,
  ShieldCheck,
  FolderGit2,
  ShieldAlert,
  UsersRound,
  Megaphone,
} from 'lucide-react';

type AdminTab = 'users' | 'rbac' | 'teams' | 'security' | 'projects';

interface AdminDashboardPageProps {
  defaultTab?: AdminTab;
}

export const AdminDashboardPage: React.FC<AdminDashboardPageProps> = ({
  defaultTab = 'users',
}) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [showBroadcastControl, setShowBroadcastControl] = useState(false);
  const queryTab = searchParams.get('tab') as AdminTab | null;
  const activeTab: AdminTab =
    queryTab && ['users', 'rbac', 'teams', 'security', 'projects'].includes(queryTab)
      ? queryTab
      : defaultTab;

  const handleTabChange = (val: string) => {
    setSearchParams({ tab: val });
  };

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-6 space-y-6 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--md-sys-color-outline-variant)]/20 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-primary)] flex items-center justify-center shadow-xs">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-[var(--md-sys-color-on-surface)]">
                Administration & System Center
              </h1>
              <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-0.5">
                Global governance, dual-layer RBAC authority, user identity management, scrum teams, and security telemetry.
              </p>
            </div>
          </div>
        </div>

        <Button
          variant={showBroadcastControl ? 'filled' : 'outline'}
          size="sm"
          onClick={() => setShowBroadcastControl(!showBroadcastControl)}
          className="gap-2 text-xs shrink-0"
        >
          <Megaphone className="w-3.5 h-3.5" />
          <span>{showBroadcastControl ? 'Hide Broadcast Panel' : 'Broadcast Announcement'}</span>
        </Button>
      </div>

      {/* Broadcast Announcement Control Panel */}
      {showBroadcastControl && (
        <div className="animate-in fade-in duration-200">
          <AdminBroadcastBannerCard />
        </div>
      )}

      {/* Primary Navigation Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList
          variant="pills"
          className="bg-[var(--md-sys-color-surface-container-low)] p-1.5 rounded-2xl border border-[var(--md-sys-color-outline-variant)]/30 w-full sm:w-auto flex flex-wrap gap-1"
        >
          <TabsTrigger
            value="users"
            variant="pills"
            size="sm"
            className="text-xs font-bold gap-2 px-3.5 py-2 rounded-xl"
          >
            <Users className="w-3.5 h-3.5" />
            <span>Users & Identity</span>
          </TabsTrigger>
          <TabsTrigger
            value="rbac"
            variant="pills"
            size="sm"
            className="text-xs font-bold gap-2 px-3.5 py-2 rounded-xl"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Access Control & RBAC</span>
          </TabsTrigger>
          <TabsTrigger
            value="teams"
            variant="pills"
            size="sm"
            className="text-xs font-bold gap-2 px-3.5 py-2 rounded-xl"
          >
            <UsersRound className="w-3.5 h-3.5" />
            <span>Scrum Teams</span>
          </TabsTrigger>
          <TabsTrigger
            value="security"
            variant="pills"
            size="sm"
            className="text-xs font-bold gap-2 px-3.5 py-2 rounded-xl"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Security Audit Logs</span>
          </TabsTrigger>
          <TabsTrigger
            value="projects"
            variant="pills"
            size="sm"
            className="text-xs font-bold gap-2 px-3.5 py-2 rounded-xl"
          >
            <FolderGit2 className="w-3.5 h-3.5" />
            <span>Projects Governance</span>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Tab Contents */}
      <div className="pt-2 w-full">
        {activeTab === 'users' && <AdminUsersTab />}
        {activeTab === 'rbac' && <AdminRbacTab />}
        {activeTab === 'teams' && <AdminTeamsTab />}
        {activeTab === 'security' && <AdminSecurityLogsTab />}
        {activeTab === 'projects' && <AdminProjectsTab />}
      </div>
    </div>
  );
};

