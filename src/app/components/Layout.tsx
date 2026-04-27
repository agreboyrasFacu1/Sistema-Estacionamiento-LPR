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
      label: 'Entrada de Vehículos',
      icon: LogIn,
      roles: ['cashier', 'admin'],
    },
    {
      path: '/exit',
      label: 'Salida de Vehículos',
      icon: ExitIcon,
      roles: ['cashier', 'admin'],
    },
    {
      path: '/search',
      label: 'Buscar Vehículo',
      icon: Search,
      roles: ['cashier', 'admin'],
    },
    {
      path: '/admin',
      label: 'Panel de Administración',
      icon: Settings,
      roles: ['admin'],
    },
    {
      path: '/admin/users',
      label: 'Gestión de Usuarios',
      icon: Users,
      roles: ['admin'],
    },
  ];

  const visibleNavItems = navItems.filter((item) =>
    item.roles.includes(user?.role || 'cashier')
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">P</span>
            </div>
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                Control de Acceso de Estacionamiento
              </h1>
              <p className="text-sm text-gray-500">Sistema de Reconocimiento de Placas</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {isTrainingMode && (
              <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-800 px-4 py-2 rounded-lg">
                <GraduationCap className="w-4 h-4" />
                <span className="text-sm font-medium">Modo Entrenamiento Activo</span>
              </div>
            )}

            <button
              onClick={toggleTrainingMode}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {isTrainingMode ? 'Salir del Entrenamiento' : 'Modo Entrenamiento'}
            </button>

            <div className="flex items-center gap-3 pl-4 border-l border-gray-200">
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900">
                  {user?.name}
                </div>
                <div className="text-xs text-gray-500 capitalize">
                  {user?.role}
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                title="Cerrar Sesión"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="px-6 border-t border-gray-200">
          <div className="flex gap-1">
            {visibleNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors relative ${
                    isActive
                      ? 'text-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
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

      {/* Training Mode Overlay Hint */}
      {isTrainingMode && location.pathname !== '/dashboard' && (
        <div className="fixed bottom-6 right-6 bg-amber-500 text-white px-4 py-3 rounded-lg shadow-lg max-w-sm">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <div className="font-semibold mb-1">Consejo de Modo Entrenamiento</div>
              <div className="text-amber-50">
                Este es un entorno simulado. Todas las acciones son solo para
                propósitos de entrenamiento.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
