import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import type { AppRole } from "@modules/authentication/context/AuthContext";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  /** Any-of membership check; super_admin always passes. */
  requiredRoles?: AppRole[];
  /** Legacy single-role hierarchical check. */
  requiredRole?: AppRole;
}

const ProtectedRoute = ({ children, requiredRole, requiredRoles }: ProtectedRouteProps) => {
  const { isAuthenticated, loading, hasRole, hasAnyRole } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  if (requiredRole && !hasRole(requiredRole)) {
    return <Navigate to="/" replace />;
  }

  if (requiredRoles && requiredRoles.length > 0 && !hasAnyRole(requiredRoles)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
