import { z } from "zod";

export const createCommentSchema = z.object({
  postId: z.string().min(1),
  content: z.string().min(1).max(5000),
  parentId: z.string().optional(),
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>;


