import React, { useState } from 'react';
import { TEAM_PRESET_ICONS, TEAM_PRESET_COLORS } from '../teams/team-presets.js';
import { cn } from '../../utils/cn';

export interface EntityAvatarProps {
  name: string;
  entityKey?: string;
  projectKey?: string;
  avatarUrl?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showTooltip?: boolean;
}

const sizeClasses = {
  xs: 'w-6 h-6 text-[10px] rounded-lg font-bold',
  sm: 'w-8 h-8 text-xs rounded-xl font-bold',
  md: 'w-10 h-10 text-sm rounded-xl font-black',
  lg: 'w-14 h-14 text-lg rounded-2xl font-black',
  xl: 'w-20 h-20 text-2xl rounded-3xl font-black',
};

const iconSizes = {
  xs: 'w-3.5 h-3.5',
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-7 h-7',
  xl: 'w-10 h-10',
};

export const EntityAvatar: React.FC<EntityAvatarProps> = ({
  name,
  entityKey,
  projectKey,
  avatarUrl,
  size = 'md',
  className = '',
  showTooltip = false,
}) => {
  const [imageError, setImageError] = useState(false);

  const effectiveKey = entityKey || projectKey;
  const isPreset = avatarUrl?.startsWith('preset:');
  let presetIcon = 'layers';
  let presetColor = 'indigo';

  if (isPreset && avatarUrl) {
    const parts = avatarUrl.split(':');
    if (parts[1]) presetIcon = parts[1];
    if (parts[2]) presetColor = parts[2];
  }

  const selectedColor =
    TEAM_PRESET_COLORS.find((c) => c.id === presetColor) || TEAM_PRESET_COLORS[0];
  const selectedIconObj =
    TEAM_PRESET_ICONS.find((i) => i.id === presetIcon) || TEAM_PRESET_ICONS[0];
  const IconComponent = selectedIconObj.Icon;

  // Custom uploaded image or external URL
  if (avatarUrl && !isPreset && !imageError) {
    return (
      <div
        title={showTooltip ? name : undefined}
        className={cn(
          'relative shrink-0 overflow-hidden flex items-center justify-center bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)]/40',
          sizeClasses[size],
          className,
        )}
      >
        <img
          src={avatarUrl}
          alt={name}
          className="w-full h-full object-cover"
          onError={() => setImageError(true)}
        />
      </div>
    );
  }

  // Geometric Preset
  if (isPreset) {
    return (
      <div
        title={showTooltip ? name : undefined}
        className={cn(
          'shrink-0 flex items-center justify-center shadow-xs select-none',
          selectedColor.bg,
          selectedColor.text,
          sizeClasses[size],
          className,
        )}
      >
        <IconComponent className={iconSizes[size]} />
      </div>
    );
  }

  // Fallback: Key initials (up to 3 chars) or Name initials
  const displayLetters = effectiveKey
    ? effectiveKey.slice(0, 3).toUpperCase()
    : name
        .trim()
        .split(/\s+/)
        .map((w) => w[0])
        .slice(0, 2)
        .join('')
        .toUpperCase() || 'EN';

  return (
    <div
      title={showTooltip ? name : undefined}
      className={cn(
        'shrink-0 flex items-center justify-center bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] border border-[var(--md-sys-color-outline-variant)]/30 select-none shadow-2xs font-bold',
        sizeClasses[size],
        className,
      )}
    >
      <span>{displayLetters}</span>
    </div>
  );
};
