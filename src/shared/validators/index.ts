/**
 * Shared validation primitives. Every module MUST consume these instead
 * of redefining zod schemas for common fields. Mirrors Laravel
 * `app/Rules/*` + spatie/laravel-data validation attributes.
 */
import { z } from "zod";

export const EmailValidation = z
  .string()
  .trim()
  .email({ message: "Invalid email address" })
  .max(255);

export const PasswordValidation = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128)
  .regex(/[A-Z]/, "Must contain an uppercase letter")
  .regex(/[a-z]/, "Must contain a lowercase letter")
  .regex(/[0-9]/, "Must contain a number");

export const PhoneValidation = z
  .string()
  .trim()
  .regex(/^\+?[1-9]\d{6,14}$/, "Invalid phone number (E.164)");

export const AddressValidation = z.object({
  line1: z.string().trim().min(1).max(200),
  line2: z.string().trim().max(200).optional(),
  city: z.string().trim().min(1).max(100),
  region: z.string().trim().max(100).optional(),
  postalCode: z.string().trim().max(20).optional(),
  country: z.string().trim().length(2, "ISO-3166-1 alpha-2"),
});

export const CurrencyValidation = z
  .string()
  .trim()
  .length(3, "ISO-4217 currency code")
  .regex(/^[A-Z]{3}$/);

export const PriceValidation = z
  .number()
  .finite()
  .nonnegative("Price must be >= 0");

export const DateValidation = z.coerce.date();

export const UuidValidation = z.string().uuid();

export const SafeTextValidation = z
  .string()
  .trim()
  .min(1)
  .max(5000)
  .refine((v) => !/<script/i.test(v), "Disallowed content");

export type Address = z.infer<typeof AddressValidation>;
