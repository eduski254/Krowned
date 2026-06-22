import { z } from "zod";

export const signupSchema = z.object({
  full_name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100)
    .trim(),
  email: z.string().email("Please enter a valid email").trim().toLowerCase(),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72),
  account_type: z.enum(["client", "professional"]),
});

export const loginSchema = z.object({
  email: z.string().email("Please enter a valid email").trim().toLowerCase(),
  password: z.string().min(1, "Password is required"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email").trim().toLowerCase(),
});

export const resetPasswordSchema = z.object({
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(72),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
