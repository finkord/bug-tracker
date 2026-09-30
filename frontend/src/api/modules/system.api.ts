import { request } from '../http.js';

export type BroadcastSeverity = 'info' | 'warning' | 'critical' | 'success';

export interface BroadcastConfig {
  enabled: boolean;
  message: string;
  severity: BroadcastSeverity;
  updatedAt: string;
  author: string;
}

export const systemApi = {
  getBanner: () => {
    return request<BroadcastConfig>('/system/banner');
  },

  updateBanner: (payload: Partial<BroadcastConfig>) => {
    return request<BroadcastConfig>('/system/banner', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },
};
