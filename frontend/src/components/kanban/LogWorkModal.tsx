import React, { useState, useEffect } from 'react';
import { api, type IssueItem } from '../../api/client';
import { Clock, Calendar, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

interface LogWorkModalProps {
  isOpen: boolean;
  onClose: () => void;
  issueId?: number;
  issueKey?: string;
  issueTitle?: string;
  onWorkLogged: () => void;
}

export const LogWorkModal: React.FC<LogWorkModalProps> = ({
  isOpen,
  onClose,
  issueId: initialIssueId,
  issueKey: initialIssueKey,
  issueTitle: initialIssueTitle,
  onWorkLogged,
}) => {
  const [selectedIssueId, setSelectedIssueId] = useState<number | undefined>(initialIssueId);
  const [issuesList, setIssuesList] = useState<IssueItem[]>([]);

  // Hours and minutes input (supports decimals e.g. 0.5 or 1 and minutes)
  const [hours, setHours] = useState<number | string>(1);
  const [minutes, setMinutes] = useState<number | string>(0);
  const [dateLogged, setDateLogged] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load issues list if no issueId or to allow switching tickets
  useEffect(() => {
    if (isOpen) {
      setSelectedIssueId(initialIssueId);
      api.getIssues()
        .then((items) => {
          setIssuesList(items);
          if (!initialIssueId && items.length > 0) {
            setSelectedIssueId(items[0].id);
          }
        })
        .catch(() => {});
    }
  }, [isOpen, initialIssueId]);

  const numericHours = parseFloat(String(hours)) || 0;
  const numericMinutes = parseFloat(String(minutes)) || 0;
  const totalCalculatedHours = Number((numericHours + numericMinutes / 60).toFixed(2));

  // Quick preset chips handler
  const setQuickTime = (h: number, m: number) => {
    setHours(h);
    setMinutes(m);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedIssueId) {
      setError('Please select a valid ticket/issue to log work against');
      return;
    }

    if (totalCalculatedHours <= 0) {
      setError('Please specify a positive time spent (at least 5 minutes)');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await api.logWork(selectedIssueId, {
        timeSpentHours: totalCalculatedHours,
        dateLogged,
        description: description.trim() || undefined,
      });
      onWorkLogged();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to log work hours');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[var(--md-sys-color-on-surface)]">
              Log Work Effort
            </h3>
            <p className="text-xs text-[var(--md-sys-color-on-surface-variant)]">
              Record engineering time spent against project tickets
            </p>
          </div>
        </div>
      }
      size="md"
    >
      {error && (
        <div className="p-3 mb-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4 pt-1">
        {/* Ticket / Issue Selector */}
        <div>
          <label className="block text-[11px] font-semibold text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider mb-1">
            Associated Ticket *
          </label>
          {issuesList.length > 0 ? (
            <select
              value={selectedIssueId || ''}
              onChange={(e) => setSelectedIssueId(Number(e.target.value))}
              required
              className="w-full text-xs px-3 py-2 rounded-xl bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)] border border-[var(--md-sys-color-outline-variant)] focus:outline-hidden focus:ring-2 focus:ring-[var(--md-sys-color-primary)] font-medium cursor-pointer"
            >
              {issuesList.map((issue) => (
                <option key={issue.id} value={issue.id}>
                  {issue.key} — {issue.title} ({issue.status})
                </option>
              ))}
            </select>
          ) : (
            <div className="p-2.5 rounded-xl bg-[var(--md-sys-color-surface-container)] border border-[var(--md-sys-color-outline-variant)] text-xs text-[var(--md-sys-color-primary)] font-bold">
              {initialIssueKey || 'Issue'} — {initialIssueTitle || 'Selected ticket'}
            </div>
          )}
        </div>

        {/* Time Input: Hours and Minutes side by side */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-[11px] font-semibold text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider">
              Time Spent *
            </label>
            <span className="text-xs font-bold text-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-primary-container)] px-2 py-0.5 rounded-md">
              Total: {hours || 0}h {numericMinutes > 0 ? `${numericMinutes}m` : ''} ({totalCalculatedHours} hrs)
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="relative">
                <span className="absolute right-3 top-2 text-xs text-[var(--md-sys-color-on-surface-variant)] pointer-events-none font-semibold">
                  hours
                </span>
                <input
                  type="number"
                  min="0"
                  max="24"
                  step="any"
                  value={hours}
                  onChange={(e) => setHours(e.target.value)}
                  placeholder="0"
                  className="w-full text-xs pl-3 pr-14 py-2 rounded-xl bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)] border border-[var(--md-sys-color-outline-variant)] focus:outline-hidden focus:ring-2 focus:ring-[var(--md-sys-color-primary)] font-bold"
                />
              </div>
            </div>

            <div>
              <div className="relative">
                <span className="absolute right-3 top-2 text-xs text-[var(--md-sys-color-on-surface-variant)] pointer-events-none font-semibold">
                  minutes
                </span>
                <input
                  type="number"
                  min="0"
                  max="59"
                  step="1"
                  value={minutes}
                  onChange={(e) => setMinutes(e.target.value)}
                  placeholder="0"
                  className="w-full text-xs pl-3 pr-16 py-2 rounded-xl bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)] border border-[var(--md-sys-color-outline-variant)] focus:outline-hidden focus:ring-2 focus:ring-[var(--md-sys-color-primary)] font-bold"
                />
              </div>
            </div>
          </div>

          {/* Quick Presets Chips */}
          <div className="flex flex-wrap items-center gap-1.5 mt-2">
            <span className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] mr-1">Presets:</span>
            {[
              { label: '30m', h: 0, m: 30 },
              { label: '1h', h: 1, m: 0 },
              { label: '1h 30m', h: 1, m: 30 },
              { label: '2h', h: 2, m: 0 },
              { label: '4h', h: 4, m: 0 },
              { label: '8h', h: 8, m: 0 },
            ].map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => setQuickTime(preset.h, preset.m)}
                className="px-2 py-0.5 rounded-lg text-xs font-semibold bg-[var(--md-sys-color-surface-container)] hover:bg-[var(--md-sys-color-surface-container-high)] border border-[var(--md-sys-color-outline-variant)] text-[var(--md-sys-color-on-surface)] transition-colors cursor-pointer"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider mb-1">
            Date Performed *
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-[var(--md-sys-color-on-surface-variant)]" />
            <input
              type="date"
              value={dateLogged}
              onChange={(e) => setDateLogged(e.target.value)}
              required
              className="w-full text-xs pl-9 pr-3 py-2 rounded-xl bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)] border border-[var(--md-sys-color-outline-variant)] focus:outline-hidden focus:ring-2 focus:ring-[var(--md-sys-color-primary)] font-medium"
            />
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-[var(--md-sys-color-on-surface-variant)] uppercase tracking-wider mb-1">
            Work Description (Optional)
          </label>
          <div className="relative">
            <FileText className="absolute left-3 top-2.5 w-4 h-4 text-[var(--md-sys-color-on-surface-variant)]" />
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="What tasks or bug fixes did you accomplish?"
              className="w-full text-xs pl-9 pr-3 py-2 rounded-xl bg-[var(--md-sys-color-surface-container)] text-[var(--md-sys-color-on-surface)] border border-[var(--md-sys-color-outline-variant)] focus:outline-hidden focus:ring-2 focus:ring-[var(--md-sys-color-primary)] resize-none"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--md-sys-color-outline-variant)]">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="filled"
            size="sm"
            isLoading={loading}
            leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
          >
            Save Worklog
          </Button>
        </div>
      </form>
    </Modal>
  );
};
