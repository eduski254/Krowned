import { z } from "zod";

export const serviceSchema = z.object({
  name: z.string().min(1, "Name is required").max(200).trim(),
  description: z.string().max(2000).trim().optional().default(""),
  price_amount: z.coerce
    .number()
    .int("Price must be a whole number (in minor units/cents)")
    .min(0, "Price cannot be negative"),
  currency: z.string().min(3).max(3).trim().toUpperCase().default("USD"),
  duration_minutes: z.coerce.number().int().min(5, "Minimum 5 minutes").max(480),
  category_id: z.string().uuid("Select a category"),
  payment_option: z.enum(["prepay", "pay_at_store", "both"]),
  is_active: z
    .string()
    .optional()
    .transform((v) => v === "on" || v === "true"),
});

export const staffInviteSchema = z.object({
  email: z.string().email("Valid email required").trim().toLowerCase(),
  display_name: z.string().min(1, "Name is required").max(100).trim(),
  title: z.string().max(100).trim().optional().default(""),
});
