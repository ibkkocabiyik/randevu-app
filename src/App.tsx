import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useEffect } from 'react';
import { useTheme } from './store/theme';
import { useUserAuth } from './store/userAuth';
import BookingLayout from './components/BookingLayout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/admin/Login';
import StepService from './pages/booking/StepService';
import StepEmployee from './pages/booking/StepEmployee';
import StepDateTime from './pages/booking/StepDateTime';
import StepConfirm from './pages/booking/StepConfirm';
import Dashboard from './pages/admin/Dashboard';
import Appointments from './pages/admin/Appointments';
import Customers from './pages/admin/Customers';
import Staff from './pages/admin/Staff';
import Services from './pages/admin/Services';
import Reviews from './pages/admin/Reviews';
import AuthPage from './pages/user/AuthPage';
import MyAppointments from './pages/user/MyAppointments';
import Profile from './pages/user/Profile';

function ThemeInit() {
  const dark = useTheme(s => s.dark);
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
  }, [dark]);
  return null;
}

function UserProtectedRoute({ next }: { next?: string } = {}) {
  const currentUser = useUserAuth(s => s.currentUser);
  if (!currentUser) {
    const to = next ? `/login?next=${encodeURIComponent(next)}` : '/login';
    return <Navigate to={to} replace />;
  }
  return <Outlet />;
}

function UserPageLayout() {
  return (
    <BookingLayout>
      <Outlet />
    </BookingLayout>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeInit />
      <Routes>
        {/* Auth pages (no booking layout) */}
        <Route path="/login" element={<AuthPage mode="login" />} />
        <Route path="/register" element={<AuthPage mode="register" />} />

        {/* User protected pages */}
        <Route element={<UserProtectedRoute />}>
          <Route element={<UserPageLayout />}>
            <Route path="/my-appointments" element={<MyAppointments />} />
            <Route path="/profile" element={<Profile />} />
          </Route>
        </Route>

        {/* Customer booking flow — giriş zorunlu */}
        <Route element={<UserProtectedRoute next="/book" />}>
          <Route element={<UserPageLayout />}>
            <Route path="/book" element={<StepService />} />
            <Route path="/book/employee" element={<StepEmployee />} />
            <Route path="/book/datetime" element={<StepDateTime />} />
            <Route path="/book/confirm" element={<StepConfirm />} />
          </Route>
        </Route>

        {/* Root redirect */}
        <Route path="/" element={<Navigate to="/book" replace />} />

        {/* Admin */}
        <Route path="/admin/login" element={<Login />} />
        <Route path="/admin" element={<ProtectedRoute />}>
          <Route index element={<Dashboard />} />
          <Route path="appointments" element={<Appointments />} />
          <Route path="customers" element={<Customers />} />
          <Route path="staff" element={<Staff />} />
          <Route path="services" element={<Services />} />
          <Route path="reviews" element={<Reviews />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
