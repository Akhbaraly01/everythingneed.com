/**
 * Authentication Application Layer - Services, DTOs, Commands, Queries
 *
 * Laravel mapping: app/Modules/Authentication/Application/*
 */

import type { QueryParams, PaginatedResult } from "@core/domain";


// ── DTOs ─────────────────────────────────────────────────────────

export interface SignUpDTO {
  email: string;
  password: string;
  fullName?: string;
  phone?: string;
}

export interface SignInDTO {
  email: string;
  password: string;
}

export interface ResetPasswordDTO {
  email: string;
}

export interface ConfirmResetPasswordDTO {
  token: string;
  newPassword: string;
}

export interface VerifyEmailDTO {
  token: string;
}

export interface VerifyPhoneDTO {
  phone: string;
  code: string;
}

// ── Commands ─────────────────────────────────────────────────────

export interface SignUpCommand {
  type: "SignUp";
  payload: SignUpDTO;
}

export interface SignInCommand {
  type: "SignIn";
  payload: SignInDTO;
}

export interface SignOutCommand {
  type: "SignOut";
  payload: { userId: string };
}

export interface ResetPasswordCommand {
  type: "ResetPassword";
  payload: ResetPasswordDTO;
}

export interface ConfirmResetPasswordCommand {
  type: "ConfirmResetPassword";
  payload: ConfirmResetPasswordDTO;
}

export interface VerifyEmailCommand {
  type: "VerifyEmail";
  payload: VerifyEmailDTO;
}

export interface VerifyPhoneCommand {
  type: "VerifyPhone";
  payload: VerifyPhoneDTO;
}

// ── Queries ──────────────────────────────────────────────────────

export interface GetSessionQuery {
  type: "GetSession";
  payload: {};
}

export interface GetCurrentUserQuery {
  type: "GetCurrentUser";
  payload: {};
}

// ── Application Services ─────────────────────────────────────────

export interface AuthenticationApplicationService {
  signUp(command: SignUpCommand): Promise<{ userId: string; email: string }>;
  signIn(command: SignInCommand): Promise<{ userId: string; accessToken: string; refreshToken: string }>;
  signOut(command: SignOutCommand): Promise<void>;
  resetPassword(command: ResetPasswordCommand): Promise<{ token: string }>;
  confirmPasswordReset(command: ConfirmResetPasswordCommand): Promise<void>;
  verifyEmail(command: VerifyEmailCommand): Promise<void>;
  verifyPhone(command: VerifyPhoneCommand): Promise<void>;

  getSession(query: GetSessionQuery): Promise<{ userId: string; accessToken: string } | null>;
  getCurrentUser(query: GetCurrentUserQuery): Promise<{ userId: string; email: string } | null>;
}
