import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { useIssueModalUrl } from './useIssueModalUrl';

describe('useIssueModalUrl', () => {
  const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <MemoryRouter initialEntries={['/projects/BUGT/board']}>{children}</MemoryRouter>
  );

  it('starts closed when no ?issue query param is in URL', () => {
    const { result } = renderHook(() => useIssueModalUrl(), { wrapper });

    expect(result.current.isOpen).toBe(false);
    expect(result.current.activeIssueKey).toBeNull();
  });

  it('updates URL search params when openIssue is called', () => {
    const { result } = renderHook(
      () => ({
        modal: useIssueModalUrl(),
        location: useLocation(),
      }),
      { wrapper },
    );

    act(() => {
      result.current.modal.openIssue('BUGT-42');
    });

    expect(result.current.modal.isOpen).toBe(true);
    expect(result.current.modal.activeIssueKey).toBe('BUGT-42');
    expect(result.current.location.search).toContain('issue=BUGT-42');
  });

  it('clears query param when closeIssue is called', () => {
    const initialWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
      <MemoryRouter initialEntries={['/projects/BUGT/board?issue=BUGT-99']}>{children}</MemoryRouter>
    );

    const { result } = renderHook(
      () => ({
        modal: useIssueModalUrl(),
        location: useLocation(),
      }),
      { wrapper: initialWrapper },
    );

    expect(result.current.modal.isOpen).toBe(true);
    expect(result.current.modal.activeIssueKey).toBe('BUGT-99');

    act(() => {
      result.current.modal.closeIssue();
    });

    expect(result.current.modal.isOpen).toBe(false);
    expect(result.current.modal.activeIssueKey).toBeNull();
    expect(result.current.location.search).toBe('');
  });
});
