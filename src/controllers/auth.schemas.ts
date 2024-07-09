import { z } from "zod";

export const emailSchema = z.string().email().min(1).max(255);
export const passwordSchema = z.string().min(1).max(255);

export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  userAgent: z.string().optional(),
});

export const registerSchema = loginSchema
  .extend({
    confirmPassword: z.string().min(1).max(255),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const verificationCodeSchema = z.number().min(1).max(255);

export const resetPasswordSchema = z.object({
  password: passwordSchema,
  verificationCode: z.number().min(1).max(255),
});