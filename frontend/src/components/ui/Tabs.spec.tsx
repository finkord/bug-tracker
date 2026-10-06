import { describe, it, expect, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import React from 'react';
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  ScrollableTabsContainer,
} from './Tabs';

describe('Unified Tabs and ScrollableTabsContainer', () => {
  it('renders TabsList and triggers with M3 variants', () => {
    render(
      <Tabs defaultValue="tab1">
        <TabsList variant="pills">
          <TabsTrigger value="tab1">Tab 1</TabsTrigger>
          <TabsTrigger value="tab2">Tab 2</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Content 1</TabsContent>
        <TabsContent value="tab2">Content 2</TabsContent>
      </Tabs>,
    );

    expect(screen.getByRole('tablist')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Tab 1' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Tab 2' })).toBeInTheDocument();
    expect(screen.getByText('Content 1')).toBeInTheDocument();
  });

  it('ScrollableTabsContainer attaches wheel handler that cancels vertical page scroll when scrollable', () => {
    render(
      <ScrollableTabsContainer as="nav" aria-label="Test Nav">
        <div style={{ width: '200px' }}>Tab 1</div>
        <div style={{ width: '200px' }}>Tab 2</div>
        <div style={{ width: '200px' }}>Tab 3</div>
      </ScrollableTabsContainer>,
    );

    const nav = screen.getByRole('navigation', { name: 'Test Nav' });

    // Mock overflow
    Object.defineProperty(nav, 'scrollWidth', { configurable: true, value: 1000 });
    Object.defineProperty(nav, 'clientWidth', { configurable: true, value: 400 });
    Object.defineProperty(nav, 'scrollLeft', { configurable: true, writable: true, value: 0 });

    const wheelEvent = new WheelEvent('wheel', {
      deltaY: 50,
      deltaX: 0,
      cancelable: true,
    });
    const preventDefaultSpy = vi.spyOn(wheelEvent, 'preventDefault');

    act(() => {
      nav.dispatchEvent(wheelEvent);
    });

    expect(preventDefaultSpy).toHaveBeenCalled();
    expect(nav.scrollLeft).toBeCloseTo(110);
  });

  it('ScrollableTabsContainer does not preventDefault if tabs are not overflowing', () => {
    render(
      <ScrollableTabsContainer as="nav" aria-label="Not Overflowing Nav">
        <div>Tab A</div>
      </ScrollableTabsContainer>,
    );

    const nav = screen.getByRole('navigation', { name: 'Not Overflowing Nav' });

    // No overflow
    Object.defineProperty(nav, 'scrollWidth', { configurable: true, value: 300 });
    Object.defineProperty(nav, 'clientWidth', { configurable: true, value: 500 });
    Object.defineProperty(nav, 'scrollLeft', { configurable: true, writable: true, value: 0 });

    const wheelEvent = new WheelEvent('wheel', {
      deltaY: 50,
      cancelable: true,
    });
    const preventDefaultSpy = vi.spyOn(wheelEvent, 'preventDefault');

    act(() => {
      nav.dispatchEvent(wheelEvent);
    });

    expect(preventDefaultSpy).not.toHaveBeenCalled();
  });
});
