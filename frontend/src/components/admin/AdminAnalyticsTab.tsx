import React, { useState, useEffect } from 'react';
import { api, type WorklogStats } from '../../api/client.js';
import { Avatar } from '../common/Avatar.js';
import { Card, Badge } from '../ui/index.js';
import {
  TrendingUp,
  Clock,
  Calendar,
  FolderGit2,
  Users,
  Loader2,
} from 'lucide-react';

export const AdminAnalyticsTab: React.FC = () => {
  const [stats, setStats] = useState<WorklogStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      setLoading(true);
      try {
        const data = await api.getWorklogStats();
        setStats(data);
      } catch {
        // Fallback
      } finally {
        setLoading(false);
      }
    };
    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="py-16 text-center text-muted-foreground">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
        <p className="text-xs mt-2">Computing team timesheet metrics...</p>
      </div>
    );
  }

  const total = stats?.totalHoursLogged || 0;
  const today = stats?.hoursLoggedToday || 0;
  const week = stats?.hoursLoggedThisWeek || 0;
  const byProject = stats?.byProject || [];
  const byUser = stats?.byUser || [];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4 bg-card/80 border-border/80 space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase">Total Hours Logged</span>
            <Clock className="w-4 h-4 text-primary" />
          </div>
          <p className="text-2xl font-bold font-mono text-primary">{total}h</p>
          <span className="text-[11px] text-muted-foreground">Cumulative logged effort</span>
        </Card>

        <Card className="p-4 bg-card/80 border-border/80 space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase">Logged Today</span>
            <Calendar className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold font-mono text-emerald-500">{today}h</p>
          <span className="text-[11px] text-muted-foreground">Daily progress</span>
        </Card>

        <Card className="p-4 bg-card/80 border-border/80 space-y-1">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase">This Week</span>
            <TrendingUp className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold font-mono text-foreground">{week}h</p>
          <span className="text-[11px] text-muted-foreground">Last 7 days velocity</span>
        </Card>
      </div>

      {/* Two Column Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Project Effort Breakdown */}
        <Card className="p-5 bg-card/80 border-border/80 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <FolderGit2 className="w-3.5 h-3.5" />
              Hours by Project
            </h3>
            <Badge variant="neutral" className="text-xs">{byProject.length} Projects</Badge>
          </div>

          {byProject.length === 0 ? (
            <p className="text-xs text-muted-foreground italic text-center py-6">
              No worklogs recorded on any project yet.
            </p>
          ) : (
            <div className="space-y-3">
              {byProject.map((p) => {
                const percent = total > 0 ? Math.round((p.totalHours / total) * 100) : 0;
                return (
                  <div key={p.projectId} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-foreground">{p.projectName} ({p.projectKey})</span>
                      <span className="font-mono text-primary font-bold">{p.totalHours}h ({percent}%)</span>
                    </div>
                    <div className="h-2 w-full bg-muted/50 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* User Effort Ranking */}
        <Card className="p-5 bg-card/80 border-border/80 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" />
              Team Contribution Ranking
            </h3>
            <Badge variant="neutral" className="text-xs">{byUser.length} Contributors</Badge>
          </div>

          {byUser.length === 0 ? (
            <p className="text-xs text-muted-foreground italic text-center py-6">
              No logged time from team members yet.
            </p>
          ) : (
            <div className="divide-y divide-border/60">
              {byUser.map((u, idx) => (
                <div key={u.userId} className="py-2.5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs font-mono font-bold text-muted-foreground w-4">
                      #{idx + 1}
                    </span>
                    <Avatar
                      name={u.fullName}
                      avatarUrl={u.avatarUrl || undefined}
                      size="sm"
                    />
                    <div>
                      <p className="text-xs font-semibold text-foreground">{u.fullName}</p>
                      <p className="text-[11px] text-muted-foreground font-mono">{u.email}</p>
                    </div>
                  </div>

                  <span className="font-mono text-xs font-bold text-primary bg-primary/10 px-2.5 py-1 rounded">
                    {u.totalHours}h
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
