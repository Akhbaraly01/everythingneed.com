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

export const NameValidation = z.string().trim().min(2, "Name must be at least 2 characters").max(100);

export const DescriptionValidation = z
  .string()
  .trim()
  .min(20, "Please provide more details (at least 20 characters)")
  .max(1000);

export const UrgencyEnum = z.enum(["low", "medium", "high", "urgent"]);

export const PrescriptionFileValidation = z
  .instanceof(File)
  .refine((f) => f.size <= 5 * 1024 * 1024, "File must be ≤ 5MB")
  .refine(
    (f) => ["image/png", "image/jpeg", "image/webp", "application/pdf"].includes(f.type),
    "Only PNG, JPG, WEBP or PDF allowed",
  );

/** Canonical booking request schema; reuse across booking/needs/healthcare. */
export const BookingRequestSchema = z.object({
  name: NameValidation,
  email: EmailValidation,
  phone: PhoneValidation,
  serviceType: z.string().min(1, "Please select a service type"),
  description: DescriptionValidation,
  budget: z.string().optional(),
  preferredDate: z.string().optional(),
  preferredTime: z.string().optional(),
  location: z.string().optional(),
  urgency: UrgencyEnum.optional(),
});
export type BookingRequest = z.infer<typeof BookingRequestSchema>;

/** Canonical checkout schema. */
export const CheckoutSchema = z.object({
  address: SafeTextValidation,
  notes: z.string().trim().max(500).optional(),
});
export type Checkout = z.infer<typeof CheckoutSchema>;
