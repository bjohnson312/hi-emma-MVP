import { z } from 'zod';

export const createMemberSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  relationship: z.string().min(1, 'Relationship is required'),
  email: z.string().email('Invalid email').optional(),
  phone: z.string().optional(),
  role: z.string().min(1, 'Role is required'),
  notes: z.string().max(500).optional(),
});

export const updateMemberSchema = z.object({
  name: z.string().min(1).optional(),
  relationship: z.string().min(1).optional(),
  email: z.string().email('Invalid email').optional(),
  phone: z.string().optional(),
  role: z.string().min(1).optional(),
  notes: z.string().max(500).optional(),
});
