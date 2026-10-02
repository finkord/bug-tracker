import { describe, it, expect, beforeEach } from 'vitest';
import { useActiveProjectStore } from './useActiveProjectStore';

describe('useActiveProjectStore', () => {
  beforeEach(() => {
    useActiveProjectStore.setState({
      activeProjectId: null,
      activeProjectKey: null,
      activeProjectName: null,
      recentProjects: [],
    });
  });

  it('sets the active project and adds it to recent projects', () => {
    const project = { id: 1, key: 'PHX', name: 'Phoenix Engine' };
    useActiveProjectStore.getState().setActiveProject(project);

    const state = useActiveProjectStore.getState();
    expect(state.activeProjectId).toBe(1);
    expect(state.activeProjectKey).toBe('PHX');
    expect(state.activeProjectName).toBe('Phoenix Engine');
    expect(state.recentProjects).toHaveLength(1);
    expect(state.recentProjects[0]).toEqual(project);
  });

  it('deduplicates recent projects and moves most recent to front', () => {
    const p1 = { id: 1, key: 'PHX', name: 'Phoenix Engine' };
    const p2 = { id: 2, key: 'APL', name: 'Apollo Core' };

    useActiveProjectStore.getState().setActiveProject(p1);
    useActiveProjectStore.getState().setActiveProject(p2);
    useActiveProjectStore.getState().setActiveProject(p1);

    const state = useActiveProjectStore.getState();
    expect(state.activeProjectId).toBe(1);
    expect(state.recentProjects).toHaveLength(2);
    expect(state.recentProjects[0].key).toBe('PHX');
    expect(state.recentProjects[1].key).toBe('APL');
  });

  it('limits recent projects to 5 items', () => {
    for (let i = 1; i <= 7; i++) {
      useActiveProjectStore.getState().setActiveProject({
        id: i,
        key: `PRJ-${i}`,
        name: `Project ${i}`,
      });
    }

    const state = useActiveProjectStore.getState();
    expect(state.recentProjects).toHaveLength(5);
    expect(state.recentProjects[0].key).toBe('PRJ-7');
    expect(state.recentProjects[4].key).toBe('PRJ-3');
  });

  it('clears active project while preserving recent history', () => {
    const project = { id: 1, key: 'PHX', name: 'Phoenix Engine' };
    useActiveProjectStore.getState().setActiveProject(project);
    useActiveProjectStore.getState().clearActiveProject();

    const state = useActiveProjectStore.getState();
    expect(state.activeProjectId).toBeNull();
    expect(state.activeProjectKey).toBeNull();
    expect(state.recentProjects).toHaveLength(1);
  });
});
