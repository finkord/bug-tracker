import React, { useState } from 'react';
import { TEAM_PRESET_ICONS, TEAM_PRESET_COLORS } from './team-presets.js';

export interface TeamAvatarProps {
  name: string;
  avatarUrl?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showTooltip?: boolean;
}

const sizeClasses = {
  xs: 'w-6 h-6 text-[10px] rounded-lg',
  sm: 'w-8 h-8 text-xs rounded-xl',
  md: 'w-10 h-10 text-sm rounded-xl',
  lg: 'w-14 h-14 text-lg font-bold rounded-2xl',
  xl: 'w-20 h-20 text-2xl font-black rounded-3xl',
};

const iconSizes = {
  xs: 'w-3.5 h-3.5',
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-7 h-7',
  xl: 'w-10 h-10',
};

export const TeamAvatar: React.FC<TeamAvatarProps> = ({
  name,
  avatarUrl,
  size = 'md',
  className = '',
  showTooltip = false,
}) => {
  const [imageError, setImageError] = useState(false);

  // Check if avatarUrl is a preset: preset:iconId:colorId
  const isPreset = avatarUrl?.startsWith('preset:');
  let presetIcon = 'rocket';
  let presetColor = 'indigo';

  if (isPreset && avatarUrl) {
    const parts = avatarUrl.split(':');
    if (parts[1]) presetIcon = parts[1];
    if (parts[2]) presetColor = parts[2];
  }

  const selectedColor = TEAM_PRESET_COLORS.find((c) => c.id === presetColor) || TEAM_PRESET_COLORS[0];
  const selectedIconObj = TEAM_PRESET_ICONS.find((i) => i.id === presetIcon) || TEAM_PRESET_ICONS[0];
  const IconComponent = selectedIconObj.Icon;

  // Derives initials for standard fallback
  const getInitials = (n: string) => {
    if (!n) return 'TM';
    const parts = n.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return n.slice(0, 2).toUpperCase();
  };

  return (
    <div
      title={showTooltip ? name : undefined}
      className={`inline-flex items-center justify-center shrink-0 font-bold overflow-hidden shadow-2xs select-none transition-transform ${sizeClasses[size]} ${className}`}
    >
      {isPreset ? (
        <div className={`w-full h-full flex items-center justify-center ${selectedColor.bg} ${selectedColor.text}`}>
          <IconComponent className={iconSizes[size]} />
        </div>
      ) : avatarUrl && !imageError ? (
        <img
          src={avatarUrl}
          alt={name}
          onError={() => setImageError(true)}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] font-black tracking-wider">
          {getInitials(name)}
        </div>
      )}
    </div>
  );
};
