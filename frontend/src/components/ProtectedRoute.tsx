import { useAuth } from "@/context/AuthContext";
import { Navigate, Outlet } from "react-router-dom";

interface ProtectedRouteProps {
  type: 'student' | 'admin';
}
const ProtectedRoute = ({ type }: ProtectedRouteProps) => {
  const { user, authType, isLoading } = useAuth();

  if (isLoading) {
    return <div>Loading session...</div>;
  }

  if (!user || authType !== type) {
    const loginPath = type === 'student' ? '/student-login' : '/admin-login';
    return <Navigate to={loginPath} replace />;
  }
  return <Outlet />;
};

export default ProtectedRoute;