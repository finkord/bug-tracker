import React, { useState, useRef, useEffect } from 'react';
import { Upload, X, Sparkles, Image as ImageIcon } from 'lucide-react';
import { Button } from './Button';
import { EntityAvatar } from './EntityAvatar';
import { TEAM_PRESET_ICONS, TEAM_PRESET_COLORS } from '../teams/team-presets';
import { isValidFileSize, isAllowedImage } from '../../utils/files';
import { cn } from '../../utils/cn';

export interface AvatarPickerValue {
  mode: 'preset' | 'upload' | 'default';
  presetUrl?: string;
  file?: File | null;
  previewUrl?: string | null;
}

export interface AvatarPickerProps {
  name: string;
  entityKey?: string;
  initialAvatarUrl?: string | null;
  allowPresets?: boolean;
  onChange: (value: AvatarPickerValue) => void;
  onError?: (error: string | null) => void;
  className?: string;
}

export const AvatarPicker: React.FC<AvatarPickerProps> = ({
  name,
  entityKey,
  initialAvatarUrl,
  allowPresets = true,
  onChange,
  onError,
  className,
}) => {
  const isInitialPreset = Boolean(initialAvatarUrl?.startsWith('preset:'));
  const [mode, setMode] = useState<'preset' | 'upload'>(
    allowPresets && (isInitialPreset || !initialAvatarUrl) ? 'preset' : 'upload',
  );

  let initialIcon = 'rocket';
  let initialColor = 'indigo';
  if (isInitialPreset && initialAvatarUrl) {
    const parts = initialAvatarUrl.split(':');
    if (parts[1]) initialIcon = parts[1];
    if (parts[2]) initialColor = parts[2];
  }

  const [selectedIcon, setSelectedIcon] = useState(initialIcon);
  const [selectedColor, setSelectedColor] = useState(initialColor);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    !isInitialPreset ? initialAvatarUrl || null : null,
  );

  const fileInputRef = useRef<HTMLInputElement>(null);
  const objectUrlRef = useRef<string | null>(null);

  useEffect(() => {
    const isPreset = Boolean(initialAvatarUrl?.startsWith('preset:'));
    let icon = 'rocket';
    let color = 'indigo';
    if (isPreset && initialAvatarUrl) {
      const parts = initialAvatarUrl.split(':');
      if (parts[1]) icon = parts[1];
      if (parts[2]) color = parts[2];
    }
    const newMode = allowPresets && (isPreset || !initialAvatarUrl) ? 'preset' : 'upload';
    setMode(newMode);
    setSelectedIcon(icon);
    setSelectedColor(color);
    setSelectedFile(null);
    setPreviewUrl(!isPreset ? initialAvatarUrl || null : null);
    if (objectUrlRef.current) {
      try {
        URL.revokeObjectURL(objectUrlRef.current);
      } catch {
        // Ignored
      }
      objectUrlRef.current = null;
    }

    if (newMode === 'preset') {
      onChange({
        mode: 'preset',
        presetUrl: `preset:${icon}:${color}`,
        file: null,
        previewUrl: `preset:${icon}:${color}`,
      });
    } else {
      onChange({
        mode: initialAvatarUrl ? 'upload' : 'default',
        file: null,
        previewUrl: initialAvatarUrl || null,
      });
    }
  }, [initialAvatarUrl, allowPresets]);

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        try {
          URL.revokeObjectURL(objectUrlRef.current);
        } catch {
          // Ignored
        }
      }
    };
  }, []);

  const handleModeChange = (newMode: 'preset' | 'upload') => {
    setMode(newMode);
    if (newMode === 'preset') {
      const presetUrl = `preset:${selectedIcon}:${selectedColor}`;
      onChange({
        mode: 'preset',
        presetUrl,
        file: null,
        previewUrl: presetUrl,
      });
    } else {
      onChange({
        mode: selectedFile ? 'upload' : previewUrl ? 'upload' : 'default',
        file: selectedFile,
        previewUrl,
      });
    }
  };

  const handleSelectIcon = (iconId: string) => {
    setSelectedIcon(iconId);
    const presetUrl = `preset:${iconId}:${selectedColor}`;
    onChange({
      mode: 'preset',
      presetUrl,
      file: null,
      previewUrl: presetUrl,
    });
  };

  const handleSelectColor = (colorId: string) => {
    setSelectedColor(colorId);
    const presetUrl = `preset:${selectedIcon}:${colorId}`;
    onChange({
      mode: 'preset',
      presetUrl,
      file: null,
      previewUrl: presetUrl,
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!isAllowedImage(file)) {
      onError?.('Please select an image file (PNG, JPEG, WebP, SVG, GIF)');
      return;
    }

    if (!isValidFileSize(file, 5)) {
      onError?.('Image file must not exceed 5MB');
      return;
    }

    onError?.(null);

    if (objectUrlRef.current) {
      try {
        URL.revokeObjectURL(objectUrlRef.current);
      } catch {
        // Ignored in test environments
      }
    }

    let newUrl = '';
    try {
      newUrl = URL.createObjectURL(file);
    } catch {
      newUrl = '';
    }

    objectUrlRef.current = newUrl || null;
    setSelectedFile(file);
    setPreviewUrl(newUrl || null);

    onChange({
      mode: 'upload',
      file,
      previewUrl: newUrl || null,
    });
  };

  const handleClearUpload = () => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';

    onChange({
      mode: 'default',
      file: null,
      previewUrl: null,
    });
  };

  const effectiveAvatarUrl =
    mode === 'preset'
      ? `preset:${selectedIcon}:${selectedColor}`
      : previewUrl;

  return (
    <div className={cn('p-4 rounded-2xl bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]/40 space-y-4', className)}>
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-[var(--md-sys-color-on-surface)]">
          Avatar & Identity
        </label>
        {allowPresets && (
          <div className="inline-flex rounded-xl p-0.5 bg-[var(--md-sys-color-surface-container-high)] border border-[var(--md-sys-color-outline-variant)]/30 text-xs">
            <button
              type="button"
              onClick={() => handleModeChange('preset')}
              className={cn(
                'px-2.5 py-1 rounded-lg font-medium transition cursor-pointer flex items-center gap-1.5',
                mode === 'preset'
                  ? 'bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-primary)] font-bold shadow-2xs'
                  : 'text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]',
              )}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Preset</span>
            </button>
            <button
              type="button"
              onClick={() => handleModeChange('upload')}
              className={cn(
                'px-2.5 py-1 rounded-lg font-medium transition cursor-pointer flex items-center gap-1.5',
                mode === 'upload'
                  ? 'bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-primary)] font-bold shadow-2xs'
                  : 'text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]',
              )}
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Upload</span>
            </button>
          </div>
        )}
      </div>

      <div className="flex items-center gap-4">
        {/* Live Preview */}
        <div className="shrink-0 flex flex-col items-center gap-1">
          <EntityAvatar
            name={name || 'Entity'}
            entityKey={entityKey}
            avatarUrl={effectiveAvatarUrl}
            size="lg"
          />
          <span className="text-[10px] text-[var(--md-sys-color-on-surface-variant)] font-medium">
            Preview
          </span>
        </div>

        {/* Mode-specific customization */}
        {mode === 'preset' && allowPresets ? (
          <div className="flex-1 space-y-2.5">
            {/* Icon Grid */}
            <div className="flex flex-wrap items-center gap-1.5">
              {TEAM_PRESET_ICONS.map(({ id, Icon, label }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => handleSelectIcon(id)}
                  title={label}
                  className={cn(
                    'p-1.5 rounded-lg border transition cursor-pointer',
                    selectedIcon === id
                      ? 'border-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-primary)]'
                      : 'border-transparent hover:bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface-variant)]',
                  )}
                >
                  <Icon className="w-4 h-4" />
                </button>
              ))}
            </div>

            {/* Color Palette */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-[var(--md-sys-color-outline-variant)]/30">
              {TEAM_PRESET_COLORS.map(({ id, label, bg }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => handleSelectColor(id)}
                  title={label}
                  className={cn(
                    'w-5 h-5 rounded-full transition cursor-pointer',
                    bg,
                    selectedColor === id
                      ? 'ring-2 ring-offset-2 ring-[var(--md-sys-color-primary)] scale-110'
                      : 'opacity-80 hover:opacity-100',
                  )}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="flex-1 space-y-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif"
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              leftIcon={<Upload className="w-3.5 h-3.5" />}
              className="w-full text-xs"
            >
              {selectedFile ? selectedFile.name : 'Select Image File'}
            </Button>
            {previewUrl && (
              <button
                type="button"
                onClick={handleClearUpload}
                className="text-[11px] text-[var(--md-sys-color-error)] hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                <X className="w-3 h-3" />
                <span>Clear custom avatar</span>
              </button>
            )}
            <p className="text-[10px] text-[var(--md-sys-color-on-surface-variant)]">
              PNG, JPEG, WebP, SVG up to 5MB. Stored in SeaweedFS.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
