import { useAuth } from "../../hooks/useAuth";
import { Navigate, useLocation } from "react-router-dom";
import LoadingState from "../LoadingState";

const AuthGuard = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  const location = useLocation();

  if (loading) {
    return <LoadingState />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

const LogoutButton = () => {
  const { logout } = useAuth();

  return (
    <button
      onClick={logout}
      className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded transition-colors"
    >
      Sign Out
    </button>
  );
};

export default AuthGuard;
