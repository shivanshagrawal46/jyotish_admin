import { Navigate, useLocation } from 'react-router-dom';
import { TOKEN_KEY } from '../api/client';

export default function RequireAuth({ children }) {
  const location = useLocation();
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
}
