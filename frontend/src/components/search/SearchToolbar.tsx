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
  Check,
  Pencil,
  RotateCcw,
} from 'lucide-react';

interface SearchToolbarProps {
  mode: SearchMode;
  onModeChange: (mode: SearchMode) => void;
  savedFilters: SavedFilterPreset[];
  activeFilterId?: string | null;
  isFilterDirty?: boolean;
  onSelectSavedFilter: (filter: SavedFilterPreset | { jql: string; id?: string }) => void;
  onSaveCurrentFilter: () => void;
  onUpdateActiveFilter?: () => void;
  onRevertActiveFilter?: () => void;
  onEditFilter?: (filter: SavedFilterPreset) => void;
  onClearActiveFilter?: () => void;
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
  activeFilterId,
  isFilterDirty = false,
  onSelectSavedFilter,
  onSaveCurrentFilter,
  onUpdateActiveFilter,
  onRevertActiveFilter,
  onEditFilter,
  onClearActiveFilter,
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
  const otherCustomFilters = savedFilters.filter((f) => !f.isFavorite);
  const activeSavedFilter = savedFilters.find((f) => String(f.id) === String(activeFilterId));

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 pb-2.5 border-b border-[var(--md-sys-color-outline-variant)]/20">
      {/* Left: Saved Views (All Issues, Favorites, More) */}
      <div className="flex flex-wrap items-center gap-1.5 flex-1 min-w-0">
        {/* Default 'All Tickets' Pill */}
        <button
          type="button"
          onClick={() => onClearActiveFilter?.()}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
            !activeFilterId
              ? 'bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] shadow-2xs'
              : 'bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)] hover:text-[var(--md-sys-color-on-surface)]'
          }`}
        >
          <span>All Issues</span>
        </button>

        {/* Starred / Custom Saved Filter Pills (Linear Style) */}
        {favoriteFilters.map((filter) => {
          const isActive = String(filter.id) === String(activeFilterId);
          const isDirty = isActive && isFilterDirty;

          return (
            <div
              key={filter.id}
              className={`inline-flex items-center rounded-full transition-all text-xs font-semibold shrink-0 ${
                isActive
                  ? 'bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] ring-1 ring-[var(--md-sys-color-primary)] shadow-2xs'
                  : 'bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)] hover:text-[var(--md-sys-color-on-surface)]'
              }`}
            >
              <button
                type="button"
                onClick={() => onSelectSavedFilter(filter)}
                className="inline-flex items-center gap-1.5 pl-3 pr-2 py-1.5 cursor-pointer whitespace-nowrap"
                title={filter.description || filter.jql}
              >
                <Star className="w-3 h-3 fill-[var(--md-sys-color-warning)] text-[var(--md-sys-color-warning)] shrink-0" />
                <span className="max-w-[140px] truncate">{filter.name}</span>
              </button>

              {/* Dirty state indicator inside pill */}
              {isDirty && (
                <span className="text-[10px] font-bold px-1.5 py-0.2 mr-1 rounded-full bg-[var(--md-sys-color-warning-container)] text-[var(--md-sys-color-on-warning-container)] uppercase tracking-wider">
                  Edited
                </span>
              )}

              {/* Edit details pencil icon trigger */}
              {onEditFilter && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditFilter(filter);
                  }}
                  className="p-1 mr-1 rounded-full hover:bg-[var(--md-sys-color-surface-container-highest)] text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-primary)] transition cursor-pointer"
                  title="Edit filter details"
                >
                  <Pencil className="w-3 h-3 shrink-0" />
                </button>
              )}
            </div>
          );
        })}

        {/* Active Custom Filter if not in favorites */}
        {activeSavedFilter && !activeSavedFilter.isFavorite && (
          <div
            className="inline-flex items-center rounded-full text-xs font-semibold shrink-0 bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] ring-1 ring-[var(--md-sys-color-primary)] shadow-2xs"
          >
            <button
              type="button"
              onClick={() => onSelectSavedFilter(activeSavedFilter)}
              className="inline-flex items-center gap-1.5 pl-3 pr-2 py-1.5 cursor-pointer whitespace-nowrap"
              title={activeSavedFilter.description || activeSavedFilter.jql}
            >
              <Bookmark className="w-3 h-3 text-[var(--md-sys-color-primary)] shrink-0" />
              <span className="max-w-[140px] truncate">{activeSavedFilter.name}</span>
            </button>

            {isFilterDirty && (
              <span className="text-[10px] font-bold px-1.5 py-0.2 mr-1 rounded-full bg-[var(--md-sys-color-warning-container)] text-[var(--md-sys-color-on-warning-container)] uppercase tracking-wider">
                Edited
              </span>
            )}
          </div>
        )}

        {/* Save Changes Button (when active filter criteria changed) */}
        {activeSavedFilter && isFilterDirty && (
          <div className="inline-flex items-center gap-1">
            <button
              type="button"
              onClick={onUpdateActiveFilter}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-[var(--md-sys-color-primary)] text-[var(--md-sys-color-on-primary)] text-xs font-bold hover:brightness-105 shadow-xs transition cursor-pointer whitespace-nowrap shrink-0"
              title="Overwrite current filter criteria with your active search"
            >
              <Check className="w-3.5 h-3.5 shrink-0" />
              <span>Save</span>
            </button>

            {onRevertActiveFilter && (
              <button
                type="button"
                onClick={onRevertActiveFilter}
                className="p-1.5 rounded-full text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container-high)] transition cursor-pointer"
                title="Revert to saved query"
              >
                <RotateCcw className="w-3.5 h-3.5 shrink-0" />
              </button>
            )}
          </div>
        )}

        {/* More Presets & Filters Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-[var(--md-sys-color-surface-container)] text-xs font-semibold text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-high)] hover:text-[var(--md-sys-color-on-surface)] transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <span>More</span>
              <span className="text-[10px] opacity-70">({otherCustomFilters.length + SYSTEM_FILTER_PRESETS.length})</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-64 max-h-[380px] overflow-y-auto">
            {otherCustomFilters.length > 0 && (
              <>
                <DropdownMenuLabel className="text-[10px] uppercase font-bold text-[var(--md-sys-color-on-surface-variant)] tracking-wider">
                  Other Saved Filters
                </DropdownMenuLabel>
                {otherCustomFilters.map((filter) => (
                  <DropdownMenuItem
                    key={filter.id}
                    onClick={() => onSelectSavedFilter(filter)}
                    className="gap-2 text-xs cursor-pointer"
                  >
                    <Bookmark className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)] shrink-0" />
                    <span className="truncate">{filter.name}</span>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
              </>
            )}

            <DropdownMenuLabel className="text-[10px] uppercase font-bold text-[var(--md-sys-color-on-surface-variant)] tracking-wider">
              System Views
            </DropdownMenuLabel>
            {SYSTEM_FILTER_PRESETS.map((preset) => (
              <DropdownMenuItem
                key={preset.id}
                onClick={() => onSelectSavedFilter({ jql: preset.jql, id: `system-${preset.id}` })}
                className="gap-2 text-xs cursor-pointer"
              >
                {getPresetIcon(preset.iconName)}
                <div className="flex flex-col min-w-0">
                  <span className="font-medium truncate">{preset.name}</span>
                  <span className="text-[10px] text-[var(--md-sys-color-on-surface-variant)]/70 truncate">
                    {preset.description}
                  </span>
                </div>
              </DropdownMenuItem>
            ))}

            <DropdownMenuSeparator />

            <DropdownMenuItem onClick={onSaveCurrentFilter} className="gap-2 text-xs cursor-pointer font-semibold text-[var(--md-sys-color-primary)]">
              <BookmarkPlus className="w-3.5 h-3.5" />
              <span>Save current search as view...</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onManageFilters} className="gap-2 text-xs cursor-pointer">
              <Settings className="w-3.5 h-3.5" />
              <span>Manage saved views...</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <button
          type="button"
          onClick={onSaveCurrentFilter}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-semibold text-[var(--md-sys-color-primary)] hover:bg-[var(--md-sys-color-primary-container)]/30 transition cursor-pointer whitespace-nowrap shrink-0"
          title="Save current criteria as a custom view"
        >
          <BookmarkPlus className="w-3.5 h-3.5" />
          <span>Save View</span>
        </button>
      </div>

      {/* Right: Mode Toggle (JQL), View Layout Switcher, Export, Refresh */}
      <div className="flex items-center gap-2 flex-wrap shrink-0">
        {/* Mode Switcher Pill Toggle */}
        <div className="inline-flex items-center p-0.5 rounded-full bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)]/40">
          <button
            type="button"
            onClick={() => onModeChange('basic')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              mode === 'basic'
                ? 'bg-[var(--md-sys-color-surface-container-lowest)] dark:bg-[var(--md-sys-color-surface-container-highest)] text-[var(--md-sys-color-primary)] shadow-xs'
                : 'text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5 shrink-0" />
            <span>Filters</span>
          </button>

          <button
            type="button"
            onClick={() => onModeChange('jql')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              mode === 'jql'
                ? 'bg-[var(--md-sys-color-surface-container-lowest)] dark:bg-[var(--md-sys-color-surface-container-highest)] text-[var(--md-sys-color-primary)] shadow-xs'
                : 'text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]'
            }`}
          >
            <Code2 className="w-3.5 h-3.5 shrink-0" />
            <span>JQL</span>
          </button>
        </div>

        {/* Layout Toggle (List vs Detail) */}
        <div className="inline-flex items-center p-0.5 rounded-full bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)]/40">
          <button
            type="button"
            onClick={() => onViewLayoutChange('list')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              viewLayout === 'list'
                ? 'bg-[var(--md-sys-color-surface-container-lowest)] dark:bg-[var(--md-sys-color-surface-container-highest)] text-[var(--md-sys-color-primary)] shadow-xs'
                : 'text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]'
            }`}
            title="Table List View"
          >
            <LayoutList className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">List</span>
          </button>

          <button
            type="button"
            onClick={() => onViewLayoutChange('detail')}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              viewLayout === 'detail'
                ? 'bg-[var(--md-sys-color-surface-container-lowest)] dark:bg-[var(--md-sys-color-surface-container-highest)] text-[var(--md-sys-color-primary)] shadow-xs'
                : 'text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)]'
            }`}
            title="Master-Detail Split View"
          >
            <Columns2 className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">Detail</span>
          </button>
        </div>

        {/* Export Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)]/40 text-xs font-semibold text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container-high)] transition-colors cursor-pointer whitespace-nowrap shrink-0"
            >
              <Download className="w-3.5 h-3.5 shrink-0" />
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
              className="p-1.5 rounded-full text-[var(--md-sys-color-on-surface-variant)] hover:text-[var(--md-sys-color-on-surface)] hover:bg-[var(--md-sys-color-surface-container-high)] transition-colors cursor-pointer disabled:opacity-50"
              aria-label="Refresh Search"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[var(--md-sys-color-primary)]' : ''}`} />
            </button>
          </Tooltip>
        )}
      </div>
    </div>
  );
};
