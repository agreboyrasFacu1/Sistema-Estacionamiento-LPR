import React, { ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import {
  LogOut,
  LayoutDashboard,
  LogIn,
  LogOut as ExitIcon,
  Search,
  Settings,
  Users,
  GraduationCap,
  AlertCircle,
  Star,
  Car,
} from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout, isTrainingMode, toggleTrainingMode } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navItems = [
    {
      path: '/dashboard',
      label: 'Panel de Control',
      icon: LayoutDashboard,
      roles: ['cashier', 'admin'],
    },
    {
      path: '/entry',
      label: 'Entrada',
      icon: LogIn,
      roles: ['cashier', 'admin'],
    },
    {
      path: '/exit',
      label: 'Salida',
      icon: ExitIcon,
      roles: ['cashier', 'admin'],
    },
    {
      path: '/search',
      label: 'Búsqueda',
      icon: Search,
      roles: ['cashier', 'admin'],
    },
    {
      path: '/subscribers',
      label: 'Abonados',
      icon: Star,
      roles: ['cashier', 'admin'],
    },
    {
      path: '/admin',
      label: 'Administración',
      icon: Settings,
      roles: ['admin'],
    },
    {
      path: '/admin/users',
      label: 'Usuarios',
      icon: Users,
      roles: ['admin'],
    },
  ];

  const visibleNavItems = navItems.filter((item) =>
    item.roles.includes(user?.role || 'cashier')
  );

  const getRoleLabel = (role: string) => {
    return role === 'admin' ? 'Administrador' : 'Cajero';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40">
        <div className="flex items-center justify-between px-6 py-3">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center shadow-sm">
              <Car className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-gray-900 leading-tight">Control de Acceso LPR</h1>
              <p className="text-xs text-gray-400">Sistema de Reconocimiento de Patentes</p>
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {isTrainingMode && (
              <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-800 px-3 py-1.5 rounded-lg">
                <GraduationCap className="w-4 h-4" />
                <span className="text-xs font-medium">Modo Entrenamiento</span>
              </div>
            )}

            <button
              onClick={toggleTrainingMode}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                isTrainingMode
                  ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {isTrainingMode ? 'Salir del Entrenamiento' : 'Modo Entrenamiento'}
            </button>

            <div className="flex items-center gap-3 pl-3 border-l border-gray-200">
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold ${
                  user?.role === 'admin' ? 'bg-purple-600' : 'bg-blue-600'
                }`}>
                  {user?.name?.charAt(0) || 'U'}
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900 leading-tight">{user?.name}</div>
                  <div className="text-xs text-gray-400">{getRoleLabel(user?.role || 'cashier')}</div>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="Cerrar Sesión"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="px-4 border-t border-gray-100">
          <div className="flex gap-0.5">
            {visibleNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path ||
                (item.path !== '/dashboard' && location.pathname.startsWith(item.path));

              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium transition-colors relative whitespace-nowrap ${
                    isActive
                      ? 'text-blue-600'
                      : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                  {isActive && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
                  )}
                </button>
              );
            })}
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="p-6">{children}</main>

      {/* Training Mode Hint */}
      {isTrainingMode && (
        <div className="fixed bottom-6 right-6 bg-amber-500 text-white px-4 py-3 rounded-xl shadow-lg max-w-xs z-30">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <div className="font-semibold mb-0.5">Modo Entrenamiento Activo</div>
              <div className="text-amber-50 text-xs">
                Todas las acciones son simuladas para propósitos de capacitación.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
