/**
 * Authentication Domain - Entities, Value Objects, Domain Events
 *
 * Laravel mapping: app/Modules/Authentication/Domain/*
 */

import { AggregateRoot, Entity, DomainError } from "@core/domain";
import type { Email, PhoneNumber } from "@core/domain";

// ── Value Objects ────────────────────────────────────────────────

export interface AuthSession {
  userId: string;
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
}

export interface AuthToken {
  value: string;
  type: "access" | "refresh";
  expiresAt: Date;
}

// ── Entities ─────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  email: string;
  emailVerified: boolean;
  phone?: string;
  phoneVerified: boolean;
  createdAt: Date;
  lastSignInAt?: Date;
}

export interface AuthCredential {
  userId: string;
  provider: "email" | "phone" | "google" | "github";
  providerUserId: string;
  createdAt: Date;
}

export interface UserSession {
  id: string;
  userId: string;
  userAgent?: string;
  ipAddress?: string;
  createdAt: string;
  expiresAt: string;
}

// ── Domain Events ────────────────────────────────────────────────

export interface UserSignedUpEvent {
  type: "UserSignedUp";
  userId: string;
  email: string;
  timestamp: Date;
}

export interface UserSignedInEvent {
  type: "UserSignedIn";
  userId: string;
  method: "email" | "phone" | "google" | "github";
  timestamp: Date;
}

export interface UserSignedOutEvent {
  type: "UserSignedOut";
  userId: string;
  timestamp: Date;
}

export interface PasswordResetRequestedEvent {
  type: "PasswordResetRequested";
  userId: string;
  email: string;
  token: string;
  timestamp: Date;
}

export interface PasswordResetCompletedEvent {
  type: "PasswordResetCompleted";
  userId: string;
  timestamp: Date;
}

export interface EmailVerifiedEvent {
  type: "EmailVerified";
  userId: string;
  email: string;
  timestamp: Date;
}

export interface PhoneVerifiedEvent {
  type: "PhoneVerified";
  userId: string;
  phone: string;
  timestamp: Date;
}

// ── Domain Service ───────────────────────────────────────────────

export interface AuthenticationService {
  signUp(input: {
    email: string;
    password: string;
    fullName?: string;
    phone?: string;
  }): Promise<{ userId: string; email: string }>;

  signIn(input: {
    email: string;
    password: string;
  }): Promise<{ userId: string; accessToken: string; refreshToken: string }>;

  signOut(userId: string): Promise<void>;

  resetPassword(email: string): Promise<{ token: string }>;

  confirmPasswordReset(token: string, newPassword: string): Promise<void>;

  verifyEmail(token: string): Promise<void>;

  verifyPhone(phone: string, code: string): Promise<void>;

  refreshSession(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }>;

  getSession(): Promise<{ userId: string; accessToken: string } | null>;

  getCurrentUser(): Promise<{ userId: string; email: string } | null>;
}

// ── Domain Errors ────────────────────────────────────────────────

export class InvalidCredentialsError extends DomainError {
  constructor() {
    super("Invalid email or password", "INVALID_CREDENTIALS");
    this.name = "InvalidCredentialsError";
  }
}

export class EmailAlreadyExistsError extends DomainError {
  constructor(email: string) {
    super(`Email ${email} already exists`, "EMAIL_ALREADY_EXISTS");
    this.name = "EmailAlreadyExistsError";
  }
}

export class InvalidTokenError extends DomainError {
  constructor() {
    super("Invalid or expired token", "INVALID_TOKEN");
    this.name = "InvalidTokenError";
  }
}

export class EmailNotVerifiedError extends DomainError {
  constructor() {
    super("Email not verified", "EMAIL_NOT_VERIFIED");
    this.name = "EmailNotVerifiedError";
  }
}

export class AccountLockedError extends DomainError {
  constructor(reason: string) {
    super(`Account locked: ${reason}`, "ACCOUNT_LOCKED");
    this.name = "AccountLockedError";
  }
}
