import { z } from "zod";

export const weeklySlotSchema = z.object({
  day_of_week: z.coerce.number().int().min(0).max(6),
  start_time: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "Use HH:MM format"),
  end_time: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "Use HH:MM format"),
}).refine(
  (d) => d.start_time < d.end_time,
  { message: "End time must be after start time", path: ["end_time"] },
);

export const scheduleExceptionSchema = z.object({
  starts_at: z.string().min(1, "Start date/time required"),
  ends_at: z.string().min(1, "End date/time required"),
  reason: z.string().max(200).trim().optional().default(""),
  is_available: z
    .string()
    .optional()
    .transform((v) => v === "on" || v === "true"),
}).refine(
  (d) => new Date(d.starts_at) < new Date(d.ends_at),
  { message: "End must be after start", path: ["ends_at"] },
);
