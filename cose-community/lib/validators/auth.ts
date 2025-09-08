import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email(),
  username: z
    .string()
    .min(3)
    .max(20)
    .regex(/^[a-zA-Z0-9_]+$/, "Only letters, numbers and underscores allowed"),
  password: z.string().min(6).max(100),
});

export const loginSchema = z.object({
  identifier: z.string().min(3).max(100), // email or username
  password: z.string().min(6).max(100),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;


