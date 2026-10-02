import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { KeyboardShortcutsModal } from './KeyboardShortcutsModal';
import { useModalStore } from '../../store';

describe('KeyboardShortcutsModal', () => {
  beforeEach(() => {
    useModalStore.setState({ isShortcutsOpen: false });
  });

  it('does not render when closed', () => {
    render(<KeyboardShortcutsModal />);
    expect(screen.queryByText('Keyboard Shortcuts')).not.toBeInTheDocument();
  });

  it('renders all shortcut categories when open', () => {
    useModalStore.setState({ isShortcutsOpen: true });
    render(<KeyboardShortcutsModal />);

    expect(screen.getByText('Keyboard Shortcuts')).toBeInTheDocument();
    expect(screen.getByText('General & Navigation')).toBeInTheDocument();
    expect(screen.getByText('Issue Actions & Editing')).toBeInTheDocument();
    expect(screen.getByText('List & Board Navigation')).toBeInTheDocument();
    expect(screen.getByText('Create new issue dialog')).toBeInTheDocument();
  });
});
