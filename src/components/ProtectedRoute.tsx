import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../store/auth';
import AdminLayout from './AdminLayout';

export default function ProtectedRoute() {
  const isAuthenticated = useAuth((s) => s.isAuthenticated);
  if (!isAuthenticated) return <Navigate to="/admin/login" replace />;
  return (
    <AdminLayout>
      <Outlet />
    </AdminLayout>
  );
}
