import { z } from 'zod';

export const SprintStatusEnum = z.enum(['ACTIVE', 'PLANNED', 'COMPLETED']);

export const SprintSchema = z.object({
  id: z.number(),
  projectId: z.number(),
  name: z.string().min(1, 'Sprint name is required'),
  goal: z.string().nullable(),
  startDate: z.string().nullable(),
  endDate: z.string().nullable(),
  status: SprintStatusEnum,
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Sprint = z.infer<typeof SprintSchema>;

export const CreateSprintSchema = z.object({
  name: z.string().min(1, 'Sprint name is required').max(100, 'Sprint name is too long'),
  goal: z.string().nullable().optional(),
  startDate: z.string().nullable().optional(),
  endDate: z.string().nullable().optional(),
  status: SprintStatusEnum.optional().default('PLANNED'),
});

export type CreateSprintInput = z.infer<typeof CreateSprintSchema>;

export const UpdateSprintSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  goal: z.string().nullable().optional(),
  startDate: z.string().nullable().optional(),
  endDate: z.string().nullable().optional(),
  status: SprintStatusEnum.optional(),
});

export type UpdateSprintInput = z.infer<typeof UpdateSprintSchema>;
