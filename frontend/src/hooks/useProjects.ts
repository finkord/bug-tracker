import {
  useProjectsQuery,
  useCreateProjectMutation,
  useUpdateProjectMutation,
  useDeleteProjectMutation,
} from '../api/queries/useProjectsQuery';
import type { ProjectItem, CreateProjectPayload } from '../api/client';

export function useProjects() {
  const { data: projects = [], isLoading: loading, error, refetch } = useProjectsQuery();
  const createMutation = useCreateProjectMutation();
  const updateMutation = useUpdateProjectMutation();
  const deleteMutation = useDeleteProjectMutation();

  const createProject = async (payload: CreateProjectPayload): Promise<ProjectItem> => {
    return createMutation.mutateAsync(payload);
  };

  const updateProject = async (
    id: number,
    payload: Partial<CreateProjectPayload>,
  ): Promise<ProjectItem> => {
    return updateMutation.mutateAsync({ id, data: payload });
  };

  const deleteProject = async (id: number): Promise<void> => {
    await deleteMutation.mutateAsync(id);
  };

  return {
    projects,
    loading,
    error: error instanceof Error ? error.message : error ? String(error) : null,
    reload: refetch,
    createProject,
    updateProject,
    deleteProject,
  };
}
