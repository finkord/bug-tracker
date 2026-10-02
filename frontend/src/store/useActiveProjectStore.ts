import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface ActiveProjectSnippet {
  id: number;
  key: string;
  name: string;
}

interface ActiveProjectState {
  activeProjectId: number | null;
  activeProjectKey: string | null;
  activeProjectName: string | null;
  recentProjects: ActiveProjectSnippet[];
  setActiveProject: (project: ActiveProjectSnippet) => void;
  clearActiveProject: () => void;
}

export const useActiveProjectStore = create<ActiveProjectState>()(
  persist(
    (set) => ({
      activeProjectId: null,
      activeProjectKey: null,
      activeProjectName: null,
      recentProjects: [],

      setActiveProject: (project) =>
        set((state) => {
          const filtered = state.recentProjects.filter((p) => p.id !== project.id);
          return {
            activeProjectId: project.id,
            activeProjectKey: project.key,
            activeProjectName: project.name,
            recentProjects: [project, ...filtered].slice(0, 5),
          };
        }),

      clearActiveProject: () =>
        set({
          activeProjectId: null,
          activeProjectKey: null,
          activeProjectName: null,
        }),
    }),
    {
      name: 'bugtracker-active-project-storage',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
