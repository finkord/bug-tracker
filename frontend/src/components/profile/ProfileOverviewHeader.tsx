import React, { useState } from 'react';
import { useAuth } from '../../store';
import { Avatar } from '../common/Avatar';
import { Badge, Button } from '../ui';
import { Edit3 } from 'lucide-react';
import { EditProfileModal } from './EditProfileModal';

/**
 * Material 3 Profile Overview Header card displaying identity, badges, and quick edit action.
 */
export const ProfileOverviewHeader: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  if (!user) return null;

  return (
    <>
      <div className="bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]/20 rounded-3xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          {/* Identity & Avatar */}
          <div className="flex items-center gap-4">
            <div className="relative group">
              <Avatar
                name={user.fullName}
                avatarUrl={user.avatarUrl}
                role={user.systemRole}
                size="lg"
              />
              <button
                type="button"
                onClick={() => setIsEditModalOpen(true)}
                className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] flex items-center justify-center shadow-md opacity-90 group-hover:opacity-100 hover:scale-110 transition-transform"
                title="Edit avatar and profile"
              >
                <Edit3 className="w-3 h-3" />
              </button>
            </div>

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

          {/* Quick Badges / Status Chips & Edit Profile Button */}
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

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsEditModalOpen(true)}
              leftIcon={<Edit3 className="w-3.5 h-3.5" />}
            >
              Edit Profile
            </Button>
          </div>
        </div>
      </div>

      <EditProfileModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={() => refreshUser()}
      />
    </>
  );
};
