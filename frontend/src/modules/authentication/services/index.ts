import { apiAuthClient } from "@core/services/apiClient";
import type { AuthenticationService } from "../domain";
import type { SignUpDTO, SignInDTO } from "../application";

export const authService: AuthenticationService = {
  async signUp(input) {
    const result = await apiAuthClient.signUp({
      email: input.email,
      password: input.password ?? "",
      options: { data: { full_name: input.fullName ?? "" } },
    });
    if (result.error) throw result.error;
    return { userId: result.data.user?.id ?? "", email: input.email };
  },

  async signIn(input) {
    const result = await apiAuthClient.signIn({ email: input.email, password: input.password });
    if (result.error) throw result.error;
    const user = result.data.user;
    return { userId: user?.id ?? "", accessToken: "", refreshToken: "" };
  },

  async signOut(userId) {
    await apiAuthClient.signOut();
  },

  async resetPassword(email) {
    return { token: "" };
  },

  async confirmPasswordReset(token, newPassword) {
    // Handled by backend
  },

  async verifyEmail(token) {
    // Handled by backend
  },

  async verifyPhone(phone, code) {
    // Handled by backend
  },

  async refreshSession(refreshToken) {
    return { accessToken: "", refreshToken: "" };
  },

  async getSession() {
    const result = await apiAuthClient.getSession();
    return result.data.session;
  },

  async getCurrentUser() {
    const result = await apiAuthClient.getUser();
    return result.data.user;
  },
};
