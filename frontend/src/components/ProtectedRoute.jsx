import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div className='rounded-3xl border border-white/10 bg-slate-950/80 p-6 text-slate-300'>Loading workspace...</div>;
  }

  return isAuthenticated ? children : <Navigate to='/signin' replace />;
}

export default ProtectedRoute;
