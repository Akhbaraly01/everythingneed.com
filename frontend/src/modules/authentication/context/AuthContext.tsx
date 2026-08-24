import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { auth, db } from "@core/api/laravelGateway";
import type { User } from "@core/api/types";
import { useToast } from "@/hooks/use-toast";

export type AppRole = "super_admin" | "administrator" | "vendor_admin" | "moderator" | "support_staff" | "content_manager" | "finance_admin" | "healthcare_admin" | "learning_admin" | "customer_service" | "category_admin" | "user";

interface Profile {
  id: string;
  email: string | null;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
}

interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: AppRole;
  profile: Profile | null;
}

interface AuthContextType {
  user: AuthUser | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (email: string, password: string, fullName?: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
  role: AppRole | null;
  hasRole: (requiredRole: AppRole) => boolean;
  hasAnyRole: (allowedRoles: AppRole[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function mapSessionUser(sessionUser: User | null | undefined): AuthUser | null {
  if (!sessionUser || typeof sessionUser !== "object" || !("id" in sessionUser)) return null;
  const meta = ((sessionUser as User).user_metadata ?? {}) as Record<string, unknown>;
  const raw = sessionUser as unknown as Record<string, unknown>;
  const fullName =
    (typeof meta.full_name === "string" && meta.full_name) ||
    (typeof raw.full_name === "string" && raw.full_name) ||
    (typeof raw.name === "string" && raw.name) ||
    (sessionUser as User).email ||
    "";
  const roleName =
    (typeof meta.role === "string" && meta.role) ||
    (typeof raw.role === "string" && raw.role) ||
    "user";
  return {
    id: (sessionUser as User).id,
    email: (sessionUser as User).email,
    name: fullName,
    role: roleName as AppRole,
    profile: null,
  };
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const applyUser = (sessionUser: User | null | undefined) => {
    const mapped = mapSessionUser(sessionUser);
    setUser(mapped);
    if (!mapped) setProfile(null);
  };

  const loadProfile = async (email: string) => {
    try {
      const rows = await db.from("profiles").select("*").eq("email", email).limit(1);
      const row = Array.isArray(rows) ? rows[0] : null;
      if (row && typeof row === "object") {
        const p = row as Record<string, unknown>;
        setProfile({
          id: String(p.id ?? ""),
          email: (p.email as string | null) ?? null,
          full_name: (p.full_name as string | null) ?? null,
          phone: (p.phone as string | null) ?? null,
          avatar_url: (p.avatar_url as string | null) ?? null,
        });
      }
    } catch {
      setProfile(null);
    }
  };

  useEffect(() => {
    const { data: { subscription } } = auth.onAuthStateChange(
      (event, newSession) => {
        if (event === "SIGNED_IN" && newSession?.user) {
          applyUser(newSession.user);
          void loadProfile(newSession.user.email);
        } else if (event === "SIGNED_OUT") {
          applyUser(null);
        }
        setLoading(false);
      }
    );

    auth.getSession().then(({ data: { session: existingSession }, error }) => {
      if (!error && existingSession?.user) {
        applyUser(existingSession.user);
        void loadProfile(existingSession.user.email);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, fullName?: string) => {
    const { data, error } = await auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName || "",
        },
      },
    });

    if (error) {
      toast({
        variant: "destructive",
        title: "Sign up failed",
        description: error.message,
      });
      return { error };
    }

    toast({
      title: "Account created!",
      description: "You can now sign in to your account.",
    });

    return { error: null };
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await auth.signIn({ email, password });

    if (error) {
      toast({
        variant: "destructive",
        title: "Sign in failed",
        description: error.message,
      });
      return { error };
    }

    toast({
      title: "Welcome back!",
      description: "You have successfully signed in.",
    });

    return { error: null };
  };

  const signOut = async () => {
    await auth.signOut();
    setUser(null);
    setProfile(null);
    toast({
      title: "Signed out",
      description: "You have been signed out successfully.",
    });
  };

  const role = user?.role ?? null;

  const hasRole = (requiredRole: AppRole): boolean => {
    if (!role) return false;

    const roleHierarchy: Record<string, number> = {
      super_admin: 12,
      administrator: 11,
      vendor_admin: 10,
      moderator: 9,
      support_staff: 8,
      content_manager: 7,
      finance_admin: 6,
      healthcare_admin: 5,
      learning_admin: 4,
      customer_service: 3,
      category_admin: 2,
      user: 1,
    };

    return (roleHierarchy[role] ?? 0) >= (roleHierarchy[requiredRole] ?? 0);
  };

  // Exact membership check for module-scoped areas. The super admin
  // bypasses everything; a finance admin never opens healthcare admin.
  const hasAnyRole = (allowedRoles: AppRole[]): boolean => {
    if (!role) return false;
    if (role === "super_admin") return true;
    return allowedRoles.includes(role);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        signUp,
        signIn,
        signOut,
        isAuthenticated: !!user,
        role,
        hasRole,
        hasAnyRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
