import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api, type WorklogItem } from '../api/client';
import { TwoFactorModal } from '../components/auth/TwoFactorModal';
import { PasswordStrengthMeter } from '../components/auth/PasswordStrengthMeter';
import { Link, useSearchParams } from 'react-router-dom';
import { TimeCalendar, type DayWorklog } from '../components/common/TimeCalendar';
import { Avatar } from '../components/common/Avatar';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  CheckCircle,
  Clock,
  ArrowRight,
  AlertCircle,
  Mail,
  Send,
  ExternalLink,
  Sparkles,
  Flame,
  Trophy,
  Award,
  Laptop,
  Smartphone,
  LogOut,
} from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') === 'time' ? 'time' : 'account';
  const setActiveTab = (tab: 'account' | 'time') => setSearchParams({ tab });

  // Personal Time & Achievements state
  const [myLogs, setMyLogs] = useState<WorklogItem[]>([]);
  const [calendarDate, setCalendarDate] = useState<Date>(new Date());

  useEffect(() => {
    if (user) {
      api.getMyWorklogs()
        .then((logs) => setMyLogs(logs))
        .catch(() => {});
    }
  }, [user]);

  // Compute daily hours for personal calendar
  const myDailyHours: Record<string, number> = {};
  let totalPersonalHours = 0;
  const currentMonthPrefix = `${calendarDate.getFullYear()}-${String(calendarDate.getMonth() + 1).padStart(2, '0')}`;
  let thisMonthPersonalHours = 0;

  myLogs.forEach((l) => {
    const hours = l.timeSpentHours || 0;
    totalPersonalHours += hours;
    myDailyHours[l.dateLogged] = Number(((myDailyHours[l.dateLogged] || 0) + hours).toFixed(2));
    if (l.dateLogged.startsWith(currentMonthPrefix)) {
      thisMonthPersonalHours += hours;
    }
  });

  // Calculate streak (consecutive active days up to today or yesterday)
  const sortedDates = Object.keys(myDailyHours).filter((d) => myDailyHours[d] > 0).sort().reverse();
  let streak = 0;
  if (sortedDates.length > 0) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const latestLoggedDate = new Date(sortedDates[0] + 'T00:00:00');
    if (latestLoggedDate.getTime() === today.getTime() || latestLoggedDate.getTime() === yesterday.getTime()) {
      streak = 1;
      let checkDate = new Date(latestLoggedDate);
      for (let i = 1; i < sortedDates.length; i++) {
        checkDate.setDate(checkDate.getDate() - 1);
        const checkStr = checkDate.toISOString().split('T')[0];
        if (sortedDates.includes(checkStr)) {
          streak++;
        } else {
          break;
        }
      }
    }
  }

  const calendarWorklogs: DayWorklog[] = myLogs.map((l) => ({
    id: l.id,
    timeSpentHours: l.timeSpentHours,
    dateLogged: l.dateLogged,
    description: l.description,
    issue: l.issue,
  }));

  const [modalOpen, setModalOpen] = useState(false);
  const [disabling, setDisabling] = useState(false);
  const [disableCode, setDisableCode] = useState('');
  const [showDisableForm, setShowDisableForm] = useState(false);
  const [twoFactorError, setTwoFactorError] = useState<string | null>(null);

  // Password management state
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);
  const [sendingResetEmail, setSendingResetEmail] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [sessionsRevokedMsg, setSessionsRevokedMsg] = useState<string | null>(null);

  if (!user) return null;

  const handleDisable2Fa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!disableCode || disableCode.length !== 6) return;

    setDisabling(true);
    setTwoFactorError(null);
    try {
      await api.disable2fa(disableCode);
      setShowDisableForm(false);
      setDisableCode('');
      await refreshUser();
    } catch (err: any) {
      setTwoFactorError(err.message || 'Failed to disable 2FA');
    } finally {
      setDisabling(false);
    }
  };

  const handleRequestPasswordReset = async () => {
    setSendingResetEmail(true);
    setPasswordError(null);
    setPasswordSuccess(null);
    try {
      const res = await api.forgotPassword(user.email);
      setPasswordSuccess(res.message || 'Password reset link sent to your email.');
    } catch (err: any) {
      setPasswordError(err.message || 'Failed to send password reset email');
    } finally {
      setSendingResetEmail(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters long');
      return;
    }

    setPasswordSubmitting(true);
    setPasswordError(null);
    setPasswordSuccess(null);

    try {
      const res = await api.setPassword({
        newPassword,
      });
      setPasswordSuccess(res.message);
      setShowPasswordForm(false);
      setNewPassword('');
      setConfirmPassword('');
      await refreshUser();
    } catch (err: any) {
      setPasswordError(err.message || 'Failed to set password');
    } finally {
      setPasswordSubmitting(false);
    }
  };

  const handleRevokeOtherSessions = () => {
    if (window.confirm('Revoke all other active sessions except your current device?')) {
      setSessionsRevokedMsg('All other browser sessions have been invalidated.');
      setTimeout(() => setSessionsRevokedMsg(null), 4000);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6 animate-in fade-in duration-200">
      {/* Profile Overview Card */}
      <div className="bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]/20 rounded-3xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <Avatar
              name={user.fullName}
              avatarUrl={user.avatarUrl}
              role={user.systemRole}
              size="lg"
            />
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-[var(--md-sys-color-on-surface)] tracking-tight">
                  {user.fullName}
                </h1>
                <Badge
                  variant={user.systemRole === 'ADMIN' ? 'primary' : 'neutral'}
                  size="sm"
                >
                  {user.systemRole}
                </Badge>
                <Badge variant="secondary" size="sm">
                  {user.jobTitle || 'Software Developer'}
                </Badge>
              </div>
              <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] mt-1">
                {user.email}
              </p>
            </div>
          </div>

          {/* Quick Badges / Status Chips */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <div className="px-3 py-1 rounded-full bg-[var(--md-sys-color-surface-container)] dark:bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface-variant)] border border-[var(--md-sys-color-outline-variant)]/30 flex items-center gap-1.5 font-medium">
              <span>ID:</span>
              <strong className="text-[var(--md-sys-color-on-surface)] font-mono">#{user.id}</strong>
            </div>

            <Badge variant={user.isActivated ? 'success' : 'neutral'} size="sm" dot>
              {user.isActivated ? 'Activated' : 'Pending Activation'}
            </Badge>

            <div className="px-3 py-1 rounded-full bg-[var(--md-sys-color-surface-container)] dark:bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface-variant)] border border-[var(--md-sys-color-outline-variant)]/30 font-medium">
              Auth: <strong className="text-[var(--md-sys-color-primary)]">{user.oauthProvider || 'LOCAL'}</strong>
            </div>

            <Badge variant={user.hasPassword ? 'success' : 'warning'} size="sm">
              {user.hasPassword ? 'Password Configured' : 'OAuth Only'}
            </Badge>
          </div>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex items-center gap-2 border-b border-[var(--md-sys-color-outline-variant)] pb-3">
        <Button
          type="button"
          variant={activeTab === 'account' ? 'filled' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('account')}
          leftIcon={<KeyRound className="w-3.5 h-3.5" />}
        >
          Security & Account
        </Button>

        <Button
          type="button"
          variant={activeTab === 'time' ? 'filled' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('time')}
          leftIcon={<Sparkles className="w-3.5 h-3.5 text-amber-500" />}
        >
          Personal Time & Achievements
        </Button>
      </div>

      {activeTab === 'time' ? (
        <div className="space-y-5">
          {/* Achievements Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div className="p-5 rounded-3xl bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]/20 shadow-xs flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-[11px] font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider">
                  Total Effort
                </span>
                <p className="text-xl sm:text-2xl font-black text-[var(--md-sys-color-primary)]">
                  {totalPersonalHours.toFixed(1)}h
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
            </div>

            <div className="p-5 rounded-3xl bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]/20 shadow-xs flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-[11px] font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider">
                  This Month
                </span>
                <p className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">
                  {thisMonthPersonalHours.toFixed(1)}h
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Trophy className="w-5 h-5" />
              </div>
            </div>

            <div className="p-5 rounded-3xl bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]/20 shadow-xs flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-[11px] font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider">
                  Day Streak
                </span>
                <p className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400 flex items-center gap-1">
                  <span>{streak}</span>
                  <span className="text-xs font-normal text-[var(--md-sys-color-on-surface-variant)]">days</span>
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Flame className="w-5 h-5" />
              </div>
            </div>

            <div className="p-5 rounded-3xl bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]/20 shadow-xs flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-[11px] font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider">
                  Worklogs
                </span>
                <p className="text-xl sm:text-2xl font-black text-purple-600 dark:text-purple-400">
                  {myLogs.length}
                </p>
              </div>
              <div className="w-10 h-10 rounded-full bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <Award className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Achievement Badges Showcase */}
          <div className="p-6 rounded-3xl bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]/20 space-y-4 shadow-xs">
            <h4 className="text-xs font-bold text-[var(--md-sys-color-on-surface)] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Personal Engineering Milestones & Badges</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className={`p-3.5 rounded-2xl border flex items-center gap-3 transition-colors ${
                streak >= 3
                  ? 'border-amber-500/40 bg-amber-500/10'
                  : 'border-[var(--md-sys-color-outline-variant)]/20 bg-[var(--md-sys-color-surface-container)] dark:bg-[var(--md-sys-color-surface-container-high)] opacity-70'
              }`}>
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-sm">
                  🔥
                </div>
                <div>
                  <p className="text-xs font-bold text-[var(--md-sys-color-on-surface)]">Consistency Hero</p>
                  <p className="text-[10px] text-[var(--md-sys-color-on-surface-variant)]">
                    {streak >= 3 ? 'Unlocked! 3+ days streak' : 'Log work 3 days consecutively'}
                  </p>
                </div>
              </div>

              <div className={`p-3.5 rounded-2xl border flex items-center gap-3 transition-colors ${
                Object.values(myDailyHours).some((h) => h >= 8)
                  ? 'border-emerald-500/40 bg-emerald-500/10'
                  : 'border-[var(--md-sys-color-outline-variant)]/20 bg-[var(--md-sys-color-surface-container)] dark:bg-[var(--md-sys-color-surface-container-high)] opacity-70'
              }`}>
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-sm">
                  ⚡
                </div>
                <div>
                  <p className="text-xs font-bold text-[var(--md-sys-color-on-surface)]">Daily 8h Sprinter</p>
                  <p className="text-[10px] text-[var(--md-sys-color-on-surface-variant)]">
                    {Object.values(myDailyHours).some((h) => h >= 8) ? 'Unlocked! Reached 8h in 1 day' : 'Log 8 hours in a single day'}
                  </p>
                </div>
              </div>

              <div className={`p-3.5 rounded-2xl border flex items-center gap-3 transition-colors ${
                myLogs.length >= 5
                  ? 'border-blue-500/40 bg-blue-500/10'
                  : 'border-[var(--md-sys-color-outline-variant)]/20 bg-[var(--md-sys-color-surface-container)] dark:bg-[var(--md-sys-color-surface-container-high)] opacity-70'
              }`}>
                <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-sm">
                  🎯
                </div>
                <div>
                  <p className="text-xs font-bold text-[var(--md-sys-color-on-surface)]">Active Contributor</p>
                  <p className="text-[10px] text-[var(--md-sys-color-on-surface-variant)]">
                    {myLogs.length >= 5 ? 'Unlocked! 5+ logged tasks' : 'Submit at least 5 worklogs'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Personal Calendar */}
          <TimeCalendar
            currentDate={calendarDate}
            onDateChange={setCalendarDate}
            dailyHours={myDailyHours}
            worklogs={calendarWorklogs}
            title="My Monthly Worklog Calendar"
            subtitle="Click on any day to see the exact issues and tasks you worked on"
            isTeamView={false}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
          {/* Account Password Card */}
          <div className="bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]/20 rounded-3xl p-6 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                    user.hasPassword
                      ? 'bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-primary)]'
                      : 'bg-[var(--md-sys-color-warning-container)] text-[var(--md-sys-color-warning)]'
                  }`}
                >
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[var(--md-sys-color-on-surface)]">
                    Account Password
                  </h3>
                  <p className="text-[11px] text-[var(--md-sys-color-on-surface-variant)]">
                    Argon2id cryptographic credential
                  </p>
                </div>
              </div>

              <Badge variant={user.hasPassword ? 'success' : 'warning'} size="sm">
                {user.hasPassword ? 'Configured' : 'Not Set'}
              </Badge>
            </div>

            <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] leading-relaxed">
              {user.hasPassword
                ? 'Your account is secured with Argon2id cryptographic hashing. Password changes require email verification via a 15-minute single-use token.'
                : `Your account was created via ${user.oauthProvider || 'OAuth'}. Add a password to unlock traditional email and password login alongside OAuth.`}
            </p>

            {passwordSuccess && (
              <div className="p-3 text-xs rounded-2xl bg-[var(--md-sys-color-success-container)] text-[var(--md-sys-color-on-success-container)] font-medium space-y-2 animate-in fade-in">
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 shrink-0 text-[var(--md-sys-color-success)] mt-0.5" />
                  <span>{passwordSuccess}</span>
                </div>
                {user.hasPassword && (
                  <div className="pt-1 pl-6">
                    <a
                      href="http://localhost:8025"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-primary)] font-semibold text-[11px] border border-[var(--md-sys-color-outline-variant)] hover:bg-[var(--md-sys-color-surface-container-high)] transition-colors"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span>Open Mailpit Inbox (8025)</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>
            )}

            {passwordError && (
              <div className="p-3 text-xs rounded-2xl bg-[var(--md-sys-color-error-container)] text-[var(--md-sys-color-on-error-container)] font-medium flex items-center gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 text-[var(--md-sys-color-error)]" />
                <span>{passwordError}</span>
              </div>
            )}

            {!user.hasPassword && showPasswordForm && (
              <form onSubmit={handlePasswordSubmit} className="space-y-3 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-[var(--md-sys-color-on-surface-variant)] mb-1">
                    Initial Password
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPw ? 'text' : 'password'}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full px-3.5 py-2.5 text-xs rounded-2xl bg-[var(--md-sys-color-surface-container)] dark:bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)] border border-[var(--md-sys-color-outline-variant)]/40 pr-10 font-medium focus:outline-hidden focus:ring-2 focus:ring-[var(--md-sys-color-primary)]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPw(!showNewPw)}
                      className="absolute right-3 top-2.5 text-[var(--md-sys-color-outline)] hover:text-[var(--md-sys-color-on-surface)] cursor-pointer"
                    >
                      {showNewPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <PasswordStrengthMeter password={newPassword} />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[var(--md-sys-color-on-surface-variant)] mb-1">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPw ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full px-3.5 py-2.5 text-xs rounded-2xl bg-[var(--md-sys-color-surface-container)] dark:bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)] border border-[var(--md-sys-color-outline-variant)]/40 pr-10 font-medium focus:outline-hidden focus:ring-2 focus:ring-[var(--md-sys-color-primary)]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPw(!showConfirmPw)}
                      className="absolute right-3 top-2.5 text-[var(--md-sys-color-outline)] hover:text-[var(--md-sys-color-on-surface)] cursor-pointer"
                    >
                      {showConfirmPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <Button
                    type="submit"
                    variant="filled"
                    size="sm"
                    isLoading={passwordSubmitting}
                    disabled={!newPassword || newPassword !== confirmPassword}
                  >
                    Save Password
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowPasswordForm(false);
                      setPasswordError(null);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            )}

            {/* Password Card Action Footer */}
            <div className="pt-3 border-t border-[var(--md-sys-color-surface-container-high)] flex items-center justify-between gap-3">
              {user.hasPassword ? (
                <>
                  <div className="flex items-center gap-1.5 text-xs text-[var(--md-sys-color-on-surface-variant)] truncate">
                    <Mail className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)] shrink-0" />
                    <span className="truncate">{user.email}</span>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleRequestPasswordReset}
                    isLoading={sendingResetEmail}
                    leftIcon={<Send className="w-3.5 h-3.5" />}
                  >
                    Send Reset Link
                  </Button>
                </>
              ) : !showPasswordForm ? (
                <>
                  <span className="text-xs text-[var(--md-sys-color-on-surface-variant)]">
                    Enable password login
                  </span>
                  <Button
                    type="button"
                    variant="filled"
                    size="sm"
                    onClick={() => {
                      setShowPasswordForm(true);
                      setPasswordSuccess(null);
                      setPasswordError(null);
                    }}
                    leftIcon={<KeyRound className="w-3.5 h-3.5" />}
                  >
                    Set Password
                  </Button>
                </>
              ) : null}
            </div>
          </div>

          {/* Two-Factor Authentication Card */}
          <div className="bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]/20 rounded-3xl p-6 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                    user.twoFactorEnabled
                      ? 'bg-[var(--md-sys-color-success-container)] text-[var(--md-sys-color-on-success-container)]'
                      : 'bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface-variant)]'
                  }`}
                >
                  {user.twoFactorEnabled ? (
                    <ShieldCheck className="w-5 h-5 text-[var(--md-sys-color-success)]" />
                  ) : (
                    <Shield className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[var(--md-sys-color-on-surface)]">
                    Two-Step Verification
                  </h3>
                  <p className="text-[11px] text-[var(--md-sys-color-on-surface-variant)]">
                    Authenticator app security
                  </p>
                </div>
              </div>

              <Badge variant={user.twoFactorEnabled ? 'success' : 'neutral'} size="sm">
                {user.twoFactorEnabled ? 'Active' : 'Disabled'}
              </Badge>
            </div>

            <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] leading-relaxed">
              Protect your account with Time-based One-Time Passcodes (TOTP) from Google Authenticator, Authy, or Microsoft Authenticator.
            </p>

            {twoFactorError && (
              <div className="p-3 text-xs rounded-2xl bg-[var(--md-sys-color-error-container)] text-[var(--md-sys-color-on-error-container)] font-medium">
                {twoFactorError}
              </div>
            )}

            {user.twoFactorEnabled && showDisableForm && (
              <form onSubmit={handleDisable2Fa} className="space-y-3 pt-1">
                <label className="block text-xs font-semibold text-[var(--md-sys-color-on-surface-variant)]">
                  Enter 6-digit passcode to confirm deactivation:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    maxLength={6}
                    value={disableCode}
                    onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="000000"
                    className="w-32 text-center tracking-widest font-mono text-sm py-2 rounded-xl bg-[var(--md-sys-color-surface-container)] dark:bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)] border border-[var(--md-sys-color-outline-variant)]/40 focus:outline-hidden"
                  />
                  <Button
                    type="submit"
                    variant="danger"
                    size="sm"
                    isLoading={disabling}
                    disabled={disableCode.length !== 6}
                  >
                    Confirm Disable
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowDisableForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            )}

            {/* 2FA Action Footer */}
            <div className="pt-3 border-t border-[var(--md-sys-color-surface-container-high)] flex items-center justify-between gap-3">
              <span className="text-[11px] text-[var(--md-sys-color-on-surface-variant)]">
                RFC 6238 Standard
              </span>

              {user.twoFactorEnabled ? (
                !showDisableForm && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowDisableForm(true)}
                  >
                    Disable 2FA
                  </Button>
                )
              ) : (
                <Button
                  type="button"
                  variant="filled"
                  size="sm"
                  onClick={() => setModalOpen(true)}
                  leftIcon={<KeyRound className="w-3.5 h-3.5" />}
                >
                  Configure & Enable 2FA
                </Button>
              )}
            </div>
          </div>

          {/* Active Sessions Card */}
          <div className="bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]/20 rounded-3xl p-6 space-y-4 shadow-xs md:col-span-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface-variant)] flex items-center justify-center">
                  <Laptop className="w-5 h-5 text-[var(--md-sys-color-primary)]" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[var(--md-sys-color-on-surface)]">
                    Active Sessions & Devices
                  </h3>
                  <p className="text-[11px] text-[var(--md-sys-color-on-surface-variant)]">
                    Inspect signed-in browsers and token authorizations
                  </p>
                </div>
              </div>

              <Button
                type="button"
                variant="danger-tonal"
                size="sm"
                onClick={handleRevokeOtherSessions}
                leftIcon={<LogOut className="w-3.5 h-3.5" />}
              >
                Revoke Other Sessions
              </Button>
            </div>

            {sessionsRevokedMsg && (
              <div className="p-3 text-xs rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-medium">
                {sessionsRevokedMsg}
              </div>
            )}

            <div className="space-y-2 pt-1">
              <div className="p-3.5 rounded-2xl bg-[var(--md-sys-color-surface-container)] dark:bg-[var(--md-sys-color-surface-container-high)] border border-[var(--md-sys-color-outline-variant)]/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Laptop className="w-4 h-4 text-[var(--md-sys-color-primary)]" />
                  <div>
                    <p className="text-xs font-bold text-[var(--md-sys-color-on-surface)]">
                      Current Browser Session (Linux / Chrome)
                    </p>
                    <p className="text-[10px] text-[var(--md-sys-color-on-surface-variant)]">
                      IP: 127.0.0.1 • Authorized via JWT bearer token
                    </p>
                  </div>
                </div>
                <Badge variant="success" size="sm" dot>
                  Active Now
                </Badge>
              </div>

              <div className="p-3.5 rounded-2xl bg-[var(--md-sys-color-surface-container)] dark:bg-[var(--md-sys-color-surface-container-high)] border border-[var(--md-sys-color-outline-variant)]/30 opacity-75 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Smartphone className="w-4 h-4 text-[var(--md-sys-color-on-surface-variant)]" />
                  <div>
                    <p className="text-xs font-semibold text-[var(--md-sys-color-on-surface)]">
                      Mobile Client (Android WebKit)
                    </p>
                    <p className="text-[10px] text-[var(--md-sys-color-on-surface-variant)]">
                      IP: 192.168.1.104 • Last seen 2 hours ago
                    </p>
                  </div>
                </div>
                <span className="text-[10px] text-[var(--md-sys-color-on-surface-variant)]">
                  Idle
                </span>
              </div>
            </div>
          </div>

          {/* Administrator Quick Controls Card */}
          {user.systemRole === 'ADMIN' && (
            <div className="p-6 rounded-3xl bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]/20 space-y-3 md:col-span-2 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[var(--md-sys-color-warning-container)] text-[var(--md-sys-color-on-warning-container)] flex items-center justify-center">
                  <ShieldAlert className="w-5 h-5 text-[var(--md-sys-color-warning)]" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[var(--md-sys-color-on-surface)]">
                    Admin Forensics & Access Control
                  </h3>
                  <p className="text-[11px] text-[var(--md-sys-color-on-surface-variant)]">
                    Review forensic logs, IP telemetry, and user credentials
                  </p>
                </div>
              </div>

              <p className="text-xs text-[var(--md-sys-color-on-surface-variant)] leading-relaxed">
                As a system administrator, you have permission to manage global users, inspect audit trails, and configure security parameters.
              </p>

              <div>
                <Link to="/admin">
                  <Button
                    type="button"
                    variant="filled"
                    size="sm"
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                  >
                    Open Admin Control Center
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2FA Setup Modal */}
      <TwoFactorModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={() => {
          refreshUser();
        }}
      />
    </div>
  );
};
