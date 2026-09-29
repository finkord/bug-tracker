import React, { useState, useEffect } from 'react';
import type { SprintDefinition } from '../../types/agile';
import { Modal, Button, Input, Tabs, TabsList, TabsTrigger } from '../ui';
import { Calendar, Sparkles, Play } from 'lucide-react';

interface SprintFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (sprintData: SprintDefinition) => void;
  editingSprint?: SprintDefinition | null;
  mode?: 'create' | 'edit' | 'start';
  defaultSprintNumber?: number;
}

export const SprintFormModal: React.FC<SprintFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingSprint,
  mode = 'create',
  defaultSprintNumber = 1,
}) => {
  const [name, setName] = useState('');
  const [goal, setGoal] = useState('');
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [durationWeeks, setDurationWeeks] = useState<number | 'custom'>(2);
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().split('T')[0];
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (editingSprint) {
        setName(editingSprint.name);
        setGoal(editingSprint.goal || '');
        setStartDate(editingSprint.startDate || new Date().toISOString().split('T')[0]);
        setEndDate(
          editingSprint.endDate ||
            new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
        );
      } else {
        setName(`Sprint ${defaultSprintNumber}`);
        setGoal('');
        const today = new Date().toISOString().split('T')[0];
        setStartDate(today);
        const end = new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0];
        setEndDate(end);
        setDurationWeeks(2);
      }
      setError(null);
    }
  }, [isOpen, editingSprint, defaultSprintNumber]);

  const handleDurationChange = (weeks: number | 'custom') => {
    setDurationWeeks(weeks);
    if (weeks !== 'custom') {
      const start = new Date(startDate || Date.now());
      start.setDate(start.getDate() + weeks * 7);
      setEndDate(start.toISOString().split('T')[0]);
    }
  };

  const handleStartDateChange = (newStart: string) => {
    setStartDate(newStart);
    if (durationWeeks !== 'custom') {
      const start = new Date(newStart || Date.now());
      start.setDate(start.getDate() + durationWeeks * 7);
      setEndDate(start.toISOString().split('T')[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Sprint name is required.');
      return;
    }

    const sprintStatus =
      mode === 'start'
        ? 'ACTIVE'
        : editingSprint?.status || 'PLANNED';

    onSave({
      id: editingSprint?.id,
      projectId: editingSprint?.projectId,
      name: name.trim(),
      goal: goal.trim(),
      startDate,
      endDate,
      status: sprintStatus,
    });
    onClose();
  };

  const modalTitle =
    mode === 'start'
      ? `Start ${editingSprint?.name || 'Sprint'}`
      : mode === 'edit'
      ? `Edit ${editingSprint?.name || 'Sprint'}`
      : 'Create New Sprint';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={modalTitle} size="md">
      <form onSubmit={handleSubmit} className="space-y-4 text-[var(--md-sys-color-on-surface)]">
        {error && (
          <div className="p-3 rounded-xl bg-[var(--md-sys-color-error-container)] text-[var(--md-sys-color-on-error-container)] text-xs font-semibold">
            {error}
          </div>
        )}

        {/* Sprint Name Input */}
        <Input
          label="Sprint Name *"
          placeholder="e.g. Sprint 2 - Core Engine"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        {/* Duration Presets */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)] mb-1.5">
            Duration
          </label>
          <Tabs
            value={String(durationWeeks)}
            onValueChange={(val) =>
              handleDurationChange(val === 'custom' ? 'custom' : Number(val))
            }
          >
            <TabsList variant="pills" className="w-full grid grid-cols-5 p-1 rounded-xl">
              <TabsTrigger value="1" variant="pills" size="sm" className="text-center font-semibold">
                1 wk
              </TabsTrigger>
              <TabsTrigger value="2" variant="pills" size="sm" className="text-center font-semibold">
                2 wks
              </TabsTrigger>
              <TabsTrigger value="3" variant="pills" size="sm" className="text-center font-semibold">
                3 wks
              </TabsTrigger>
              <TabsTrigger value="4" variant="pills" size="sm" className="text-center font-semibold">
                4 wks
              </TabsTrigger>
              <TabsTrigger value="custom" variant="pills" size="sm" className="text-center font-semibold">
                Custom
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Start Date and End Date Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Start Date"
            type="date"
            value={startDate}
            onChange={(e) => handleStartDateChange(e.target.value)}
            leftIcon={<Calendar className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />}
          />

          <Input
            label="End Date"
            type="date"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              setDurationWeeks('custom');
            }}
            leftIcon={<Calendar className="w-3.5 h-3.5 text-[var(--md-sys-color-primary)]" />}
          />
        </div>

        {/* Sprint Goal */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-[var(--md-sys-color-on-surface-variant)] mb-1.5">
            Sprint Goal
          </label>
          <div className="relative">
            <textarea
              rows={3}
              placeholder="What are the key deliverables, milestones, or objectives for this sprint?"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-2xl bg-[var(--md-sys-color-surface-container-lowest)] dark:bg-[var(--md-sys-color-surface-container-high)] border border-[var(--md-sys-color-outline-variant)] text-xs text-[var(--md-sys-color-on-surface)] focus:outline-none focus:ring-2 focus:ring-[var(--md-sys-color-primary)] resize-none"
            />
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[var(--md-sys-color-outline-variant)]">
          <Button variant="ghost" size="sm" type="button" onClick={onClose}>
            Cancel
          </Button>

          <Button
            variant="filled"
            size="sm"
            type="submit"
            leftIcon={
              mode === 'start' ? (
                <Play className="w-3.5 h-3.5 fill-current" />
              ) : (
                <Sparkles className="w-3.5 h-3.5" />
              )
            }
          >
            {mode === 'start' ? 'Start Sprint' : mode === 'edit' ? 'Save Changes' : 'Create Sprint'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
