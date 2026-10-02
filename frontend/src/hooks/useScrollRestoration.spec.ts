import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
  useScrollRestoration,
  clearScrollPositions,
  getScrollPosition,
  setScrollPosition,
} from './useScrollRestoration';

let mockLocation = { pathname: '/projects/MOBT/backlog', search: '' };
let mockNavigationType = 'PUSH';

vi.mock('react-router-dom', () => ({
  useLocation: () => mockLocation,
  useNavigationType: () => mockNavigationType,
}));

describe('useScrollRestoration', () => {
  let container: HTMLDivElement;

  beforeEach(() => {
    clearScrollPositions();
    mockLocation = { pathname: '/projects/MOBT/backlog', search: '' };
    mockNavigationType = 'PUSH';

    container = document.createElement('div');
    container.id = 'main-content';
    Object.defineProperty(container, 'scrollTop', {
      writable: true,
      value: 0,
    });
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
    vi.clearAllMocks();
  });

  it('records scroll position on container scroll event', () => {
    renderHook(() => useScrollRestoration('main-content'));

    container.scrollTop = 350;
    container.dispatchEvent(new Event('scroll'));

    expect(getScrollPosition('/projects/MOBT/backlog')).toBe(350);
  });

  it('restores saved scroll position when navigating back to a previous page', () => {
    setScrollPosition('/projects/MOBT/backlog', 420);

    renderHook(() => useScrollRestoration('main-content'));

    expect(container.scrollTop).toBe(420);
  });

  it('resets scroll position to 0 on fresh navigation without saved coordinates', () => {
    container.scrollTop = 200;
    mockLocation = { pathname: '/my-issues', search: '' };

    renderHook(() => useScrollRestoration('main-content'));

    expect(container.scrollTop).toBe(0);
  });
});
