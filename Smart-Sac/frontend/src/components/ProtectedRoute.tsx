import { useAuth } from "@/context/AuthContext";
import { Navigate, Outlet } from "react-router-dom";

// This interface defines the props that ProtectedRoute accepts
interface ProtectedRouteProps {
  type: 'student' | 'admin';
}

// We accept the 'type' prop here
const ProtectedRoute = ({ type }: ProtectedRouteProps) => {
  const { user, authType, isLoading } = useAuth();

  if (isLoading) {
    // You can show a full-page spinner here
    return <div>Loading session...</div>;
  }

  // 1. Check if a user is logged in
  // 2. Check if the logged-in user's type (authType)
  //    matches the route's required type (type)
  if (!user || authType !== type) {
    // If not, redirect to the correct login page
    const loginPath = type === 'student' ? '/student-login' : '/admin-login';
    return <Navigate to={loginPath} replace />;
  }

  // If all checks pass, render the child component (e.g., the dashboard)
  return <Outlet />;
};

export default ProtectedRoute;