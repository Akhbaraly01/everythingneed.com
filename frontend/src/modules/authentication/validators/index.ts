import { z } from "zod";

export const SignUpSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(8).regex(/[A-Z]/, "Must contain uppercase").regex(/[a-z]/, "Must contain lowercase").regex(/[0-9]/, "Must contain digit"),
  fullName: z.string().min(2).max(100).optional(),
  phone: z.string().regex(/^\+[1-9]\d{1,14}$/, "Invalid phone number").optional(),
});

export const SignInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const ResetPasswordSchema = z.object({
  email: z.string().email(),
});

export const ConfirmResetPasswordSchema = z.object({
  token: z.string().min(1),
  newPassword: z.string().min(8),
});

export const VerifyEmailSchema = z.object({
  token: z.string().min(1),
});

export const VerifyPhoneSchema = z.object({
  phone: z.string().regex(/^\+[1-9]\d{1,14}$/),
  code: z.string().length(6),
});

export type SignUpInput = z.infer<typeof SignUpSchema>;
export type SignInInput = z.infer<typeof SignInSchema>;
