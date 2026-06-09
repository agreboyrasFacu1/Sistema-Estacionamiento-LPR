import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { LogIn, AlertCircle, Loader2 } from 'lucide-react';
import parkingGemLogo from '../assets/parkinggem.svg';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const success = await login(email, password);
      if (success) {
        navigate('/dashboard');
      } else {
        setError('Correo electrónico o contraseña incorrectos');
      }
    } catch (err) {
      setError('Ocurrió un error. Por favor intente nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-18 h-18 mb-4">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200 overflow-hidden">
              <img
                src={parkingGemLogo}
                alt="ParkingGem"
                className="w-12 h-12 object-contain"
              />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">
            Control de Acceso
          </h1>
          <p className="text-gray-500">Sistema LPR · Reconocimiento de Patentes</p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-1">
              Iniciar Sesión
            </h2>
            <p className="text-sm text-gray-500">
              Ingrese sus credenciales para acceder
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Correo Electrónico
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="tu.email@parking.com"
                required
                disabled={isLoading}
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700"
                >
                  Contraseña
                </label>
                <button
                  type="button"
                  onClick={() => navigate('/forgot-password')}
                  className="text-sm text-blue-600 hover:text-blue-700 hover:underline transition-colors"
                >
                  ¿Olvidé mi contraseña?
                </button>
              </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Ingrese su contraseña"
                required
                disabled={isLoading}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white py-3 px-4 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors shadow-lg hover:shadow-xl"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Iniciando sesión...
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  Iniciar Sesión
                </>
              )}
            </button>
          </form>

          {/* Demo Credentials */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-xs font-medium text-gray-500 mb-3 uppercase tracking-wide">
              Credenciales de Demostración
            </p>
            <div className="space-y-2 text-xs text-gray-600">
              <div
                className="flex justify-between items-center bg-blue-50 px-3 py-2.5 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors border border-blue-100"
                onClick={() => { setEmail('cajero@parking.com'); setPassword('demo'); }}
              >
                <span className="font-medium text-blue-700">Cajero</span>
                <span className="font-mono text-blue-600">cajero@parking.com</span>
              </div>
              <div
                className="flex justify-between items-center bg-purple-50 px-3 py-2.5 rounded-lg cursor-pointer hover:bg-purple-100 transition-colors border border-purple-100"
                onClick={() => { setEmail('admin@parking.com'); setPassword('demo'); }}
              >
                <span className="font-medium text-purple-700">Administrador</span>
                <span className="font-mono text-purple-600">admin@parking.com</span>
              </div>
              <p className="text-gray-400 italic text-center mt-2">
                Haga clic para autocompletar · Contraseña demo: demo
              </p>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          © 2026 Sistema de Control de Acceso LPR. Todos los derechos reservados.
        </p>
      </div>
    </div>
  );
};
