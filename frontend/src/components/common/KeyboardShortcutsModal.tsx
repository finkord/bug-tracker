import React from 'react';
import { Modal } from '../ui/Modal';
import { useModalStore } from '../../store';
import { Keyboard, CornerDownLeft, Search, Plus, PanelLeft, ArrowDown, ArrowUp, X } from 'lucide-react';

interface ShortcutRow {
  keys: string[];
  description: string;
  icon?: React.ReactNode;
}

interface ShortcutCategory {
  title: string;
  items: ShortcutRow[];
}

const SHORTCUT_CATEGORIES: ShortcutCategory[] = [
  {
    title: 'General & Navigation',
    items: [
      { keys: ['?'], description: 'Open keyboard shortcuts cheat sheet' },
      { keys: ['Ctrl', 'K'], description: 'Open quick search palette', icon: <Search className="w-3.5 h-3.5" /> },
      { keys: ['/'], description: 'Quick search palette lookup', icon: <Search className="w-3.5 h-3.5" /> },
      { keys: ['['], description: 'Toggle navigation sidebar', icon: <PanelLeft className="w-3.5 h-3.5" /> },
      { keys: ['Ctrl', 'B'], description: 'Toggle navigation sidebar', icon: <PanelLeft className="w-3.5 h-3.5" /> },
      { keys: ['Esc'], description: 'Close modal / cancel inline edit', icon: <X className="w-3.5 h-3.5" /> },
    ],
  },
  {
    title: 'Issue Actions & Editing',
    items: [
      { keys: ['C'], description: 'Create new issue dialog', icon: <Plus className="w-3.5 h-3.5" /> },
      { keys: ['Ctrl', 'Enter'], description: 'Submit form / save inline edits', icon: <CornerDownLeft className="w-3.5 h-3.5" /> },
    ],
  },
  {
    title: 'List & Board Navigation',
    items: [
      { keys: ['J'], description: 'Navigate to next issue', icon: <ArrowDown className="w-3.5 h-3.5" /> },
      { keys: ['K'], description: 'Navigate to previous issue', icon: <ArrowUp className="w-3.5 h-3.5" /> },
      { keys: ['↵', 'O'], description: 'Open selected issue details' },
    ],
  },
];

export const KeyboardShortcutsModal: React.FC = () => {
  const { isShortcutsOpen, closeShortcuts } = useModalStore();

  if (!isShortcutsOpen) return null;

  return (
    <Modal
      isOpen={isShortcutsOpen}
      onClose={closeShortcuts}
      title={
        <div className="flex items-center gap-2">
          <Keyboard className="w-5 h-5 text-[var(--md-sys-color-primary)]" />
          <span>Keyboard Shortcuts</span>
        </div>
      }
      size="md"
    >
      <div className="space-y-6 select-none">
        {SHORTCUT_CATEGORIES.map((category) => (
          <div key={category.title} className="space-y-2.5">
            <h4 className="text-xs font-bold text-[var(--md-sys-color-primary)] uppercase tracking-wider">
              {category.title}
            </h4>
            <div className="divide-y divide-[var(--md-sys-color-outline-variant)]/20 rounded-xl bg-[var(--md-sys-color-surface-container-low)] border border-[var(--md-sys-color-outline-variant)]/40 overflow-hidden">
              {category.items.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between px-3.5 py-2 text-xs text-[var(--md-sys-color-on-surface)]"
                >
                  <div className="flex items-center gap-2">
                    {item.icon && (
                      <span className="text-[var(--md-sys-color-on-surface-variant)]">
                        {item.icon}
                      </span>
                    )}
                    <span>{item.description}</span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {item.keys.map((key, kIdx) => (
                      <kbd
                        key={kIdx}
                        className="min-w-6 px-1.5 py-0.5 text-center font-mono text-[11px] font-bold rounded-md bg-[var(--md-sys-color-surface-container-high)] text-[var(--md-sys-color-on-surface)] border border-[var(--md-sys-color-outline-variant)]/60 shadow-2xs"
                      >
                        {key}
                      </kbd>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Modal>
  );
};
