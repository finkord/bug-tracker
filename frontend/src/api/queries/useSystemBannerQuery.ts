import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api, type BroadcastConfig } from '../client.js';

export const systemBannerKeys = {
  banner: ['system', 'banner'] as const,
};

export function useSystemBannerQuery() {
  return useQuery({
    queryKey: systemBannerKeys.banner,
    queryFn: () => api.getBanner(),
    staleTime: 30000,
  });
}

export function useUpdateSystemBannerMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<BroadcastConfig>) => api.updateBanner(payload),
    onSuccess: (updated) => {
      queryClient.setQueryData(systemBannerKeys.banner, updated);
    },
  });
}
