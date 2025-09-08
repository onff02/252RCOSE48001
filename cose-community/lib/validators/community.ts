import { z } from "zod";

export const createCommunitySchema = z.object({
  name: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[a-zA-Z0-9_\-]+$/, "Only letters, numbers, dashes and underscores allowed"),
  title: z.string().min(3).max(60),
  description: z.string().max(500).optional().or(z.literal("")),
});

export type CreateCommunityInput = z.infer<typeof createCommunitySchema>;


