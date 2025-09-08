import { z } from "zod";

export const createPostSchema = z.object({
  communitySlug: z.string().min(1),
  title: z.string().min(3).max(300),
  content: z.string().min(1).max(10000),
});

export type CreatePostInput = z.infer<typeof createPostSchema>;


