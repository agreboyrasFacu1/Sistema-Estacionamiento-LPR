import { createBrowserRouter } from 'react-router';
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

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
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
      <ProtectedRoute>
        <AdminPanel />
      </ProtectedRoute>
    ),
  },
  {
    path: '/admin/users',
    element: (
      <ProtectedRoute>
        <UserManagement />
      </ProtectedRoute>
    ),
  },
  {
    path: '*',
    element: <NotFound />,
  },
]);
