import React from 'react';
import { createBrowserRouter, Navigate, useLocation } from 'react-router';
import { Login } from './pages/Login';
import { ForgotPassword } from './pages/ForgotPassword';
import { Dashboard } from './pages/Dashboard';
import { VehicleEntry } from './pages/VehicleEntry';
import { VehicleExit } from './pages/VehicleExit';
import { Search } from './pages/Search';
import { AdminPanel } from './pages/AdminPanel';
import { UserManagement } from './pages/UserManagement';
import { Subscribers } from './pages/Subscribers';
import { NotFound } from './pages/NotFound';
import { Layout } from './components/Layout';
import { useAuth } from './contexts/AuthContext';
import { UserRole } from './types';
import { canAccessRole } from './domain/permissions';

const ProtectedRoute = ({
  children,
  roles = ['cashier', 'admin'],
}: {
  children: React.ReactNode;
  roles?: UserRole[];
}) => {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/" replace state={{ from: location.pathname }} />;
  }

  if (!canAccessRole(user, roles)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Layout>{children}</Layout>;
};

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Login />,
  },
  {
    path: '/forgot-password',
    element: <ForgotPassword />,
  },
  {
    path: '/dashboard',
    element: (
      <ProtectedRoute>
        <Dashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: '/entry',
    element: (
      <ProtectedRoute>
        <VehicleEntry />
      </ProtectedRoute>
    ),
  },
  {
    path: '/exit',
    element: (
      <ProtectedRoute>
        <VehicleExit />
      </ProtectedRoute>
    ),
  },
  {
    path: '/search',
    element: (
      <ProtectedRoute>
        <Search />
      </ProtectedRoute>
    ),
  },
  {
    path: '/subscribers',
    element: (
      <ProtectedRoute>
        <Subscribers />
      </ProtectedRoute>
    ),
  },
  {
    path: '/admin',
    element: (
      <ProtectedRoute roles={['admin']}>
        <AdminPanel />
      </ProtectedRoute>
    ),
  },
  {
    path: '/admin/users',
    element: (
      <ProtectedRoute roles={['admin']}>
        <UserManagement />
      </ProtectedRoute>
    ),
  },
  {
    path: '*',
    element: <NotFound />,
  },
]);
