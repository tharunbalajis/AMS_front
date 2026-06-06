import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

export const settingsSchema = z.object({
  organizationName: z.string().min(2),
  timezone: z.string().min(2),
  dateFormat: z.string().min(4),
  sessionTimeout: z.coerce.number().min(5).max(1440),
  backupEnabled: z.boolean(),
  emailFrom: z.string().email(),
  storageProvider: z.string().min(2)
});

export type LoginForm = z.infer<typeof loginSchema>;
export type SettingsForm = z.infer<typeof settingsSchema>;
