import React from 'react';
import type { SearchMode, ViewLayout, SavedFilterPreset } from '../../types/search';
import { SYSTEM_FILTER_PRESETS } from '../../types/search';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  Tooltip,
} from '../ui';
import {
  SlidersHorizontal,
  Code2,
  Bookmark,
  BookmarkPlus,
  LayoutList,
  Columns2,
  Download,
  UserCheck,
  FileCheck2,
  Sparkles,
  Clock,
  CheckCircle2,
  Star,
  Settings,
  RefreshCw,
} from 'lucide-react';

interface SearchToolbarProps {
  mode: SearchMode;
  onModeChange: (mode: SearchMode) => void;
  savedFilters: SavedFilterPreset[];
  onSelectSavedFilter: (jql: string) => void;
  onSaveCurrentFilter: () => void;
  onManageFilters: () => void;
  viewLayout: ViewLayout;
  onViewLayoutChange: (layout: ViewLayout) => void;
  onExportCsv: () => void;
  onExportJson: () => void;
  onRefresh?: () => void;
  loading?: boolean;
  totalResults: number;
}

export const SearchToolbar: React.FC<SearchToolbarProps> = ({
  mode,
  onModeChange,
  savedFilters,
  onSelectSavedFilter,
  onSaveCurrentFilter,
  onManageFilters,
  viewLayout,
  onViewLayoutChange,
  onExportCsv,
  onExportJson,
  onRefresh,
  loading = false,
  totalResults,
}) => {
  const getPresetIcon = (iconName: string) => {
    switch (iconName) {
      case 'UserCheck':
        return <UserCheck className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)] shrink-0" />;
      case 'FileCheck2':
        return <FileCheck2 className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)] shrink-0" />;
      case 'Sparkles':
        return <Sparkles className="w-3.5 h-3.5 text-[var(--md-sys-color-warning)] shrink-0" />;
      case 'Clock':
        return <Clock className="w-3.5 h-3.5 text-[var(--md-sys-color-tertiary)] shrink-0" />;
      case 'CheckCircle2':
        return <CheckCircle2 className="w-3.5 h-3.5 text-[var(--md-sys-color-success)] shrink-0" />;
      default:
        return <Bookmark className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)] shrink-0" />;
    }
  };

  const favoriteFilters = savedFilters.filter((f) => f.isFavorite);

  return (
    <div className="flex flex-col gap-3 pb-3 border-b border-[var(--md-sys-color-outline-variant)]">
      {/* Upper Row: Title, Mode Pill Toggle, and Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Left: Title, Total Badge, and Mode Pill Toggle */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-[var(--md-sys-color-on-surface)] leading-tight">
              Search & Filters
            </h1>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface-variant)]">
              {totalResults} {totalResults === 1 ? 'ticket' : 'tickets'}
            </span>
          </div>

          {/* Mode Switcher Pill Toggle */}
          <div className="inline-flex items-center p-1 rounded-full bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)]/40">
            <button
              type="button"
              onClick={() => onModeChange('basic')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                mode === 'basic'
                  ? 'bg-[var(--md-sys-color-surface-container-lowest)] dark:bg-[var(--md-sys-color-surface-container-highest)] text-[var(--md-sys-color-primary)] shadow-xs'
                  : 'text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Basic Filters</span>
            </button>

            <button
              type="button"
              onClick={() => onModeChange('jql')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                mode === 'jql'
                  ? 'bg-[var(--md-sys-color-surface-container-lowest)] dark:bg-[var(--md-sys-color-surface-container-highest)] text-[var(--md-sys-color-primary)] shadow-xs'
                  : 'text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>JQL Editor</span>
            </button>
          </div>
        </div>

        {/* Right: Presets, Save, View Layout Switcher, Export, Refresh */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Presets & Saved Filters Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)]/40 text-xs font-semibold text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container-high)] transition-colors cursor-pointer"
              >
                <Bookmark className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />
                <span>Filters & Presets</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel className="text-[10px] uppercase font-bold text-[var(--md-sys-color-on-surface-variant)] tracking-wider">
                System Presets
              </DropdownMenuLabel>
              {SYSTEM_FILTER_PRESETS.map((preset) => (
                <DropdownMenuItem
                  key={preset.id}
                  onClick={() => onSelectSavedFilter(preset.jql)}
                  className="gap-2 text-xs cursor-pointer"
                >
                  {getPresetIcon(preset.iconName)}
                  <span className="truncate">{preset.name}</span>
                </DropdownMenuItem>
              ))}

              {favoriteFilters.length > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel className="text-[10px] uppercase font-bold text-[var(--md-sys-color-on-surface-variant)] tracking-wider flex items-center gap-1">
                    <Star className="w-3 h-3 fill-[var(--md-sys-color-warning)] text-[var(--md-sys-color-warning)]" />
                    <span>Starred Filters</span>
                  </DropdownMenuLabel>
                  {favoriteFilters.map((filter) => (
                    <DropdownMenuItem
                      key={filter.id}
                      onClick={() => onSelectSavedFilter(filter.jql)}
                      className="gap-2 text-xs cursor-pointer"
                    >
                      <Star className="w-3.5 h-3.5 fill-[var(--md-sys-color-warning)] text-[var(--md-sys-color-warning)] shrink-0" />
                      <span className="truncate">{filter.name}</span>
                    </DropdownMenuItem>
                  ))}
                </>
              )}

              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={onManageFilters}
                className="gap-2 text-xs text-[var(--md-sys-color-primary)] font-medium cursor-pointer"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Manage all filters...</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Save Current Filter Pill */}
          <button
            type="button"
            onClick={onSaveCurrentFilter}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--md-sys-color-primary-container)]/40 text-xs font-semibold text-[var(--md-sys-color-primary)] hover:bg-[var(--md-sys-color-primary-container)]/80 transition-colors cursor-pointer"
            title="Save current search criteria as reusable filter"
          >
            <BookmarkPlus className="w-3.5 h-3.5" />
            <span>Save Filter</span>
          </button>

          {/* Layout Toggle (List vs Detail) */}
          <div className="inline-flex items-center p-1 rounded-full bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)]/40">
            <button
              type="button"
              onClick={() => onViewLayoutChange('list')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                viewLayout === 'list'
                  ? 'bg-[var(--md-sys-color-surface-container-lowest)] dark:bg-[var(--md-sys-color-surface-container-highest)] text-[var(--md-sys-color-primary)] shadow-xs'
                  : 'text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]'
              }`}
              title="Table List View"
            >
              <LayoutList className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">List</span>
            </button>

            <button
              type="button"
              onClick={() => onViewLayoutChange('detail')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                viewLayout === 'detail'
                  ? 'bg-[var(--md-sys-color-surface-container-lowest)] dark:bg-[var(--md-sys-color-surface-container-highest)] text-[var(--md-sys-color-primary)] shadow-xs'
                  : 'text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]'
              }`}
              title="Master-Detail Split View"
            >
              <Columns2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Detail</span>
            </button>
          </div>

          {/* Export Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)]/40 text-xs font-semibold text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container-high)] transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Export</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-36">
              <DropdownMenuItem onClick={onExportCsv} className="text-xs cursor-pointer">
                Export to CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onExportJson} className="text-xs cursor-pointer">
                Export to JSON
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Refresh Button */}
          {onRefresh && (
            <Tooltip content="Refresh search results">
              <button
                type="button"
                onClick={onRefresh}
                disabled={loading}
                className="p-2 rounded-full text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container-high)] transition-colors cursor-pointer disabled:opacity-50"
                aria-label="Refresh Search"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[var(--md-sys-color-primary)]' : ''}`} />
              </button>
            </Tooltip>
          )}
        </div>
      </div>
    </div>
  );
};
