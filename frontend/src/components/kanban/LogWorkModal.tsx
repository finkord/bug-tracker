import React, { useState, useEffect } from 'react';
import { api, type IssueItem } from '../../api/client';
import { Clock, X, Calendar, FileText, CheckCircle2, AlertCircle } from 'lucide-react';

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

  if (!isOpen) return null;

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-[28px] bg-[var(--md-sys-color-surface-container-high)] border border-[var(--md-sys-color-outline-variant)] shadow-2xl p-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[var(--md-sys-color-outline-variant)]">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[var(--md-sys-color-primary-container)] text-[var(--md-sys-color-on-primary-container)] flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[var(--md-sys-color-on-surface)]">
                Log Work Effort
              </h2>
              <p className="text-xs text-[var(--md-sys-color-on-surface-variant)]">
                Record engineering time spent against project tickets
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-[var(--md-sys-color-on-surface-variant)] hover:bg-[var(--md-sys-color-surface-container-highest)]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Ticket / Issue Selector */}
          <div>
            <label className="block text-xs font-semibold text-[var(--md-sys-color-on-surface)] mb-1.5">
              Associated Ticket *
            </label>
            {issuesList.length > 0 ? (
              <select
                value={selectedIssueId || ''}
                onChange={(e) => setSelectedIssueId(Number(e.target.value))}
                required
                className="w-full text-xs px-3 py-2.5 rounded-xl bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)] border border-[var(--md-sys-color-outline-variant)] focus:outline-hidden focus:ring-2 focus:ring-[var(--md-sys-color-primary)] font-medium cursor-pointer"
              >
                {issuesList.map((issue) => (
                  <option key={issue.id} value={issue.id}>
                    {issue.key} — {issue.title} ({issue.status})
                  </option>
                ))}
              </select>
            ) : (
              <div className="p-2.5 rounded-xl bg-[var(--md-sys-color-surface)] border border-[var(--md-sys-color-outline-variant)] text-xs text-[var(--md-sys-color-primary)] font-bold">
                {initialIssueKey || 'Issue'} — {initialIssueTitle || 'Selected ticket'}
              </div>
            )}
          </div>

          {/* Time Input: Hours and Minutes side by side */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-[var(--md-sys-color-on-surface)]">
                Time Spent (Hours & Minutes) *
              </label>
              <span className="text-xs font-bold text-[var(--md-sys-color-primary)] bg-[var(--md-sys-color-primary-container)] px-2 py-0.5 rounded-md">
                Total: {hours || 0}h {numericMinutes > 0 ? `${numericMinutes}m` : ''} ({totalCalculatedHours} hrs)
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="relative">
                  <span className="absolute right-3 top-2.5 text-xs text-[var(--md-sys-color-on-surface-variant)] pointer-events-none font-semibold">
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
                    className="w-full text-sm pl-3 pr-14 py-2 rounded-xl bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)] border border-[var(--md-sys-color-outline-variant)] focus:outline-hidden focus:ring-2 focus:ring-[var(--md-sys-color-primary)] font-bold"
                  />
                </div>
              </div>

              <div>
                <div className="relative">
                  <span className="absolute right-3 top-2.5 text-xs text-[var(--md-sys-color-on-surface-variant)] pointer-events-none font-semibold">
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
                    className="w-full text-sm pl-3 pr-16 py-2 rounded-xl bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)] border border-[var(--md-sys-color-outline-variant)] focus:outline-hidden focus:ring-2 focus:ring-[var(--md-sys-color-primary)] font-bold"
                  />
                </div>
              </div>
            </div>

            {/* Quick Presets Chips */}
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              <span className="text-[11px] text-[var(--md-sys-color-on-surface-variant)] mr-1">Presets:</span>
              <button
                type="button"
                onClick={() => setQuickTime(0, 30)}
                className="px-2 py-0.5 rounded-lg text-xs font-semibold bg-[var(--md-sys-color-surface-container-low)] hover:bg-[var(--md-sys-color-surface-container-highest)] border border-[var(--md-sys-color-outline-variant)] transition-colors"
              >
                30m
              </button>
              <button
                type="button"
                onClick={() => setQuickTime(1, 0)}
                className="px-2 py-0.5 rounded-lg text-xs font-semibold bg-[var(--md-sys-color-surface-container-low)] hover:bg-[var(--md-sys-color-surface-container-highest)] border border-[var(--md-sys-color-outline-variant)] transition-colors"
              >
                1h
              </button>
              <button
                type="button"
                onClick={() => setQuickTime(1, 30)}
                className="px-2 py-0.5 rounded-lg text-xs font-semibold bg-[var(--md-sys-color-surface-container-low)] hover:bg-[var(--md-sys-color-surface-container-highest)] border border-[var(--md-sys-color-outline-variant)] transition-colors"
              >
                1h 30m
              </button>
              <button
                type="button"
                onClick={() => setQuickTime(2, 0)}
                className="px-2 py-0.5 rounded-lg text-xs font-semibold bg-[var(--md-sys-color-surface-container-low)] hover:bg-[var(--md-sys-color-surface-container-highest)] border border-[var(--md-sys-color-outline-variant)] transition-colors"
              >
                2h
              </button>
              <button
                type="button"
                onClick={() => setQuickTime(4, 0)}
                className="px-2 py-0.5 rounded-lg text-xs font-semibold bg-[var(--md-sys-color-surface-container-low)] hover:bg-[var(--md-sys-color-surface-container-highest)] border border-[var(--md-sys-color-outline-variant)] transition-colors"
              >
                4h
              </button>
              <button
                type="button"
                onClick={() => setQuickTime(8, 0)}
                className="px-2 py-0.5 rounded-lg text-xs font-semibold bg-[var(--md-sys-color-surface-container-low)] hover:bg-[var(--md-sys-color-surface-container-highest)] border border-[var(--md-sys-color-outline-variant)] transition-colors"
              >
                8h
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--md-sys-color-on-surface)] mb-1.5">
              Date Performed *
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-[var(--md-sys-color-on-surface-variant)]" />
              <input
                type="date"
                value={dateLogged}
                onChange={(e) => setDateLogged(e.target.value)}
                required
                className="w-full text-sm pl-9 pr-3 py-2 rounded-xl bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)] border border-[var(--md-sys-color-outline-variant)] focus:outline-hidden focus:ring-2 focus:ring-[var(--md-sys-color-primary)] font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--md-sys-color-on-surface)] mb-1.5">
              Work Description (Optional)
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-2.5 w-4 h-4 text-[var(--md-sys-color-on-surface-variant)]" />
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="What tasks or bug fixes did you accomplish?"
                className="w-full text-xs pl-9 pr-3 py-2 rounded-xl bg-[var(--md-sys-color-surface)] text-[var(--md-sys-color-on-surface)] border border-[var(--md-sys-color-outline-variant)] focus:outline-hidden focus:ring-2 focus:ring-[var(--md-sys-color-primary)] resize-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[var(--md-sys-color-outline-variant)]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-full m3-btn-outline text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 rounded-full m3-btn-filled text-xs flex items-center gap-1.5 font-semibold shadow-xs"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{loading ? 'Logging...' : 'Save Worklog'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
