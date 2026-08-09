import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LoadingState } from './common/States';

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return <LoadingState label="Checking session..." />;
  if (!user) return <Navigate to="/login" replace />;

  return children;
}
