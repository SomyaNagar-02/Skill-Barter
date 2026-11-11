import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div className='rounded-3xl border border-[#dfe7e2] bg-[#f7f4ef] p-6 text-[#456d67]'>Loading workspace...</div>;
  }

  return isAuthenticated ? children : <Navigate to='/signin' replace />;
}

export default ProtectedRoute;
