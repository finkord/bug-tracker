import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../store';
import { Tabs, TabsList, TabsTrigger } from '../components/ui';
import { KeyRound, Sparkles } from 'lucide-react';
import {
  ProfileOverviewHeader,
  ProfileSecurityCard,
  ProfileTwoFactorCard,
  ProfileSessionsCard,
  ProfileAdminBanner,
  ProfileTimeTab,
} from '../components/profile';

/**
 * ProfilePage orchestrates user identity, security credentials (Argon2id, 2FA, Zero-Trust sessions),
 * and personal worklog time tracking using Material 3 design tokens.
 */
export const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const activeTab = searchParams.get('tab') === 'time' ? 'time' : 'account';
  const setActiveTab = (tab: 'account' | 'time') => setSearchParams({ tab });

  if (!user) return null;

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-5 flex-1 flex flex-col min-w-0 space-y-6 animate-in fade-in duration-200">
      {/* 1. Profile Overview Header Card with Inline Profile Editing */}
      <ProfileOverviewHeader />

      {/* 2. Tab Navigation Strip */}
      <Tabs
        value={activeTab}
        onValueChange={(val) => setActiveTab(val as 'account' | 'time')}
        className="w-full"
      >
        <TabsList
          variant="underline"
          className="w-full grid grid-cols-2 gap-0 p-0 overflow-visible border-b border-[var(--md-sys-color-outline-variant)]/30"
        >
          <TabsTrigger
            value="account"
            variant="underline"
            className="w-full flex items-center justify-center gap-1.5 sm:gap-2 pb-3 text-xs sm:text-sm font-bold tracking-tight cursor-pointer"
          >
            <KeyRound className="w-4 h-4 text-[var(--md-sys-color-primary)] shrink-0" />
            <span className="truncate">Security & Account</span>
          </TabsTrigger>
          <TabsTrigger
            value="time"
            variant="underline"
            className="w-full flex items-center justify-center gap-1.5 sm:gap-2 pb-3 text-xs sm:text-sm font-bold tracking-tight cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-[var(--md-sys-color-warning)] shrink-0" />
            <span className="truncate">
              <span className="hidden sm:inline">Personal </span>Time & Effort
            </span>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* 3. Tab Content */}
      {activeTab === 'time' ? (
        <ProfileTimeTab />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start animate-in fade-in duration-200">
          <ProfileSecurityCard />
          <ProfileTwoFactorCard />
          <ProfileSessionsCard />
          <ProfileAdminBanner />
        </div>
      )}
    </div>
  );
};
