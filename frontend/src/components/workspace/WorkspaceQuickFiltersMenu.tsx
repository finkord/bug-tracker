import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  SlidersHorizontal,
  ChevronDown,
  Search,
  UserCheck,
  FileCheck2,
  Sparkles,
  Clock,
  CheckCircle2,
  Star,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '../ui/Dropdown';
import { api, type SavedFilterItem } from '../../api/client';

/**
 * Quick JQL filters & saved filters dropdown menu.
 */
export const WorkspaceQuickFiltersMenu: React.FC = () => {
  const navigate = useNavigate();
  const [savedFilters, setSavedFilters] = useState<SavedFilterItem[]>([]);

  useEffect(() => {
    api.getSavedFilters()
      .then((data) => setSavedFilters(data))
      .catch(() => {});
  }, []);

  const handleNavigateJql = (jql: string) => {
    navigate(`/search?jql=${encodeURIComponent(jql)}`);
  };

  const handleNavigateCriteria = (criteriaStr: string) => {
    try {
      const parsed = JSON.parse(criteriaStr);
      if (parsed.jql) {
        navigate(`/search?jql=${encodeURIComponent(parsed.jql)}`);
        return;
      }
      if (parsed.q || parsed.query) {
        navigate(`/search?q=${encodeURIComponent(parsed.q || parsed.query)}`);
        return;
      }
    } catch {
      // Fallback if plain query
      navigate(`/search?q=${encodeURIComponent(criteriaStr)}`);
      return;
    }
    navigate('/search');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="w-9 sm:w-auto h-9 px-0 sm:px-3 rounded-xl bg-[var(--md-sys-color-surface-container)] hover:bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-[var(--md-sys-color-outline-variant)]/30 shadow-2xs shrink-0 select-none"
          title="Quick filters"
          aria-label="Quick filters"
        >
          <SlidersHorizontal className="w-4 h-4 text-[var(--md-sys-color-primary)]" />
          <span className="hidden sm:inline">Filters</span>
          <ChevronDown className="w-3 h-3 opacity-60 hidden sm:inline" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        side="bottom"
        className="w-64 p-2 rounded-2xl bg-[var(--md-sys-color-surface-container-lowest)] shadow-xl z-50 border border-[var(--md-sys-color-outline-variant)]/20 text-xs animate-in fade-in zoom-in-95 duration-150"
      >
        <DropdownMenuItem
          onClick={() => navigate('/search')}
          className="flex items-center gap-2 font-bold text-[var(--md-sys-color-primary)] cursor-pointer"
        >
          <Search className="w-4 h-4 text-[var(--md-sys-color-primary)]" />
          <span>View all filters & search</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <div className="px-2 py-1 text-[10px] font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider">
          Quick Filters
        </div>

        <DropdownMenuItem
          onClick={() =>
            handleNavigateJql(
              'assignee = currentUser() AND status NOT IN ("RESOLVED", "CLOSED") ORDER BY priority DESC',
            )
          }
          className="flex items-center gap-2 cursor-pointer"
        >
          <UserCheck className="w-3.5 h-3.5 text-blue-400" />
          <span>My open issues</span>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() =>
            handleNavigateJql('reporter = currentUser() ORDER BY createdAt DESC')
          }
          className="flex items-center gap-2 cursor-pointer"
        >
          <FileCheck2 className="w-3.5 h-3.5 text-indigo-400" />
          <span>Reported by me</span>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() =>
            handleNavigateJql(
              'priority IN ("CRITICAL", "HIGH") AND status NOT IN ("CLOSED") ORDER BY priority DESC',
            )
          }
          className="flex items-center gap-2 cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Critical & High Priority</span>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => handleNavigateJql('ORDER BY updatedAt DESC')}
          className="flex items-center gap-2 cursor-pointer"
        >
          <Clock className="w-3.5 h-3.5 text-teal-400" />
          <span>Recently updated</span>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() =>
            handleNavigateJql('status IN ("RESOLVED", "CLOSED") ORDER BY updatedAt DESC')
          }
          className="flex items-center gap-2 cursor-pointer"
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>Done issues</span>
        </DropdownMenuItem>

        {savedFilters.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <div className="px-2 py-1 text-[10px] font-bold text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider">
              Saved Starred Filters
            </div>
            {savedFilters.slice(0, 5).map((f) => (
              <DropdownMenuItem
                key={f.id}
                onClick={() => handleNavigateCriteria(f.criteria)}
                className="flex items-center gap-2 cursor-pointer truncate"
              >
                <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400 shrink-0" />
                <span className="truncate">{f.name}</span>
              </DropdownMenuItem>
            ))}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
