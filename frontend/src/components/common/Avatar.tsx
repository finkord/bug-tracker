import React, { useState } from 'react';

export interface AvatarProps {
  name: string;
  avatarUrl?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  role?: string;
  showTooltip?: boolean;
}

const sizeClasses = {
  xs: 'w-5 h-5 text-[10px]',
  sm: 'w-7 h-7 text-xs',
  md: 'w-9 h-9 text-sm',
  lg: 'w-12 h-12 text-base font-semibold',
  xl: 'w-16 h-16 text-xl font-bold',
};

// Deterministic vibrant gradient palettes
const gradients = [
  'from-indigo-500 to-purple-600',
  'from-blue-500 to-cyan-500',
  'from-emerald-500 to-teal-600',
  'from-amber-500 to-orange-600',
  'from-rose-500 to-pink-600',
  'from-violet-600 to-fuchsia-600',
  'from-teal-500 to-emerald-600',
];

export const Avatar: React.FC<AvatarProps> = ({
  name,
  avatarUrl,
  size = 'md',
  className = '',
  role,
  showTooltip = true,
}) => {
  const [imageError, setImageError] = useState(false);

  // Derive initials (e.g. "John Doe" -> "JD", "Admin" -> "AD")
  const getInitials = (n: string) => {
    if (!n) return '?';
    const parts = n.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return n.slice(0, 2).toUpperCase();
  };

  // Derive deterministic color gradient based on string character codes
  const getGradient = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % gradients.length;
    return gradients[index];
  };

  const initials = getInitials(name);
  const gradient = getGradient(name || 'user');
  const sizeClass = sizeClasses[size];

  const tooltipText = role ? `${name} (${role})` : name;

  if (avatarUrl && !imageError) {
    return (
      <div
        className={`relative inline-flex items-center justify-center shrink-0 rounded-full overflow-hidden shadow-xs ring-1 ring-black/10 dark:ring-white/10 ${sizeClass} ${className}`}
        title={showTooltip ? tooltipText : undefined}
      >
        <img
          src={avatarUrl}
          alt={name}
          className="w-full h-full object-cover"
          onError={() => setImageError(true)}
          loading="lazy"
        />
      </div>
    );
  }

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 rounded-full bg-gradient-to-tr ${gradient} text-white font-medium shadow-xs select-none ${sizeClass} ${className}`}
      title={showTooltip ? tooltipText : undefined}
    >
      <span>{initials}</span>
    </div>
  );
};
