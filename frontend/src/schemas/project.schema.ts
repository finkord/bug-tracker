import { z } from 'zod';

export const LeadSchema = z.object({
  id: z.number(),
  fullName: z.string(),
  email: z.string().email(),
  avatarUrl: z.string().nullable().optional(),
});

export const ProjectSchema = z.object({
  id: z.number(),
  name: z.string().min(1, 'Project name is required'),
  key: z.string().min(2, 'Project key must be at least 2 characters').max(10, 'Project key must be at most 10 characters'),
  description: z.string().nullable(),
  leadId: z.number(),
  lead: LeadSchema.nullable(),
  totalIssues: z.number().default(0),
  openIssues: z.number().default(0),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Project = z.infer<typeof ProjectSchema>;

export const CreateProjectSchema = z.object({
  name: z.string().min(2, 'Project name must be at least 2 characters').max(100, 'Project name is too long'),
  key: z
    .string()
    .min(2, 'Project key must be at least 2 characters')
    .max(10, 'Project key must be at most 10 characters')
    .regex(/^[A-Z0-9]+$/, 'Project key must be uppercase alphanumeric characters'),
  description: z.string().max(500, 'Description is too long').optional(),
});

export type CreateProjectInput = z.infer<typeof CreateProjectSchema>;
