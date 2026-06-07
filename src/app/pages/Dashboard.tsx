import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { useParking } from '../contexts/ParkingContext';
import { useAuth } from '../contexts/AuthContext';
import { CameraModal } from '../components/CameraModal';
import {
  Car,
  DollarSign,
  Clock,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ArrowRight,
  Camera,
  LogIn,
  LogOut,
  Search,
  Star,
} from 'lucide-react';
import { formatDuration, translateCategory, getCategoryIcon } from '../data/mockData';
import { sortVehiclesByLatestEntry } from '../domain/stays';
import { formatCurrencyARS } from '../utils/currency';
import { toast } from 'sonner';

export const Dashboard: React.FC = () => {
  const { vehicles, stats, currentDetection, logs, searchVehicle, clearDetection } = useParking();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showCamera, setShowCamera] = useState(false);

  const activeVehicles = sortVehiclesByLatestEntry(
    vehicles.filter((v) => !v.exitTime)
  );
  const recentLogs = logs.slice(0, 6);

  const handleCameraPlateDetected = (plate: string) => {
    const found = searchVehicle(plate);
    if (found) {
      toast.info(`Vehículo ${plate} encontrado — procesando salida`);
      navigate('/exit', { state: { detectedPlate: plate } });
    } else {
      toast.info(`Nueva patente ${plate} detectada — procesando ingreso`);
      navigate('/entry', { state: { detectedPlate: plate } });
    }
  };

  const getTimeOfDay = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Buenos días';
    if (h < 18) return 'Buenas tardes';
    return 'Buenas noches';
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Camera Modal */}
      <CameraModal
        isOpen={showCamera}
        onClose={() => setShowCamera(false)}
        onPlateDetected={handleCameraPlateDetected}
        title="Cámara Principal"
      />

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            {getTimeOfDay()}, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-gray-500">Panel de Control · Vista en tiempo real</p>
        </div>
        <button
          onClick={() => setShowCamera(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium transition-colors shadow-sm"
        >
          <Camera className="w-5 h-5" />
          Abrir Cámara
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Car className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-3xl font-bold text-blue-600">{stats.vehiclesInside}</span>
          </div>
          <p className="text-sm font-medium text-gray-700">Vehículos Adentro</p>
          <p className="text-xs text-gray-400 mt-0.5">Estacionados ahora</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-600" />
            </div>
            <span className="text-3xl font-bold text-green-600">{stats.todayEntries}</span>
          </div>
          <p className="text-sm font-medium text-gray-700">Entradas de Hoy</p>
          <p className="text-xs text-gray-400 mt-0.5">Total vehículos</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-emerald-600" />
            </div>
            <span className="text-3xl font-bold text-emerald-600">{formatCurrencyARS(stats.todayRevenue)}</span>
          </div>
          <p className="text-sm font-medium text-gray-700">Ingresos Hoy</p>
          <p className="text-xs text-gray-400 mt-0.5">Total recaudado</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-purple-600" />
            </div>
            <span className="text-3xl font-bold text-purple-600">{formatDuration(stats.averageDuration)}</span>
          </div>
          <p className="text-sm font-medium text-gray-700">Duración Prom.</p>
          <p className="text-xs text-gray-400 mt-0.5">Tiempo estadía</p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Detection + Quick Actions */}
        <div className="space-y-4">
          {/* Live Detection */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <h2 className="font-semibold text-gray-900 mb-4">Detección LPR en Vivo</h2>

            {currentDetection ? (
              <div className="space-y-4">
                <div
                  className={`p-5 rounded-xl border-2 ${
                    currentDetection.isValid
                      ? 'bg-green-50 border-green-300'
                      : 'bg-amber-50 border-amber-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-medium text-gray-500">PATENTE DETECTADA</span>
                    {currentDetection.isValid ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-amber-600" />
                    )}
                  </div>
                  <div className="text-3xl font-bold text-gray-900 tracking-widest font-mono text-center mb-3">
                    {currentDetection.plate}
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">Confianza</span>
                    <span className="font-semibold">{(currentDetection.confidence * 100).toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                    <div
                      className={`h-1.5 rounded-full ${currentDetection.isValid ? 'bg-green-600' : 'bg-amber-500'}`}
                      style={{ width: `${currentDetection.confidence * 100}%` }}
                    />
                  </div>
                </div>
                <button
                  onClick={() => navigate('/entry')}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
                >
                  Procesar Ingreso
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Camera className="w-7 h-7 text-gray-300" />
                </div>
                <p className="text-gray-400 text-sm mb-3">Sin detección activa</p>
                <div className="flex items-center justify-center gap-1.5">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-pulse" style={{ animationDelay: `${i * 0.2}s` }} />
                  ))}
                </div>
                <button
                  onClick={() => setShowCamera(true)}
                  className="mt-4 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg text-sm font-medium flex items-center gap-2 mx-auto transition-colors"
                >
                  <Camera className="w-4 h-4" />
                  Abrir Cámara
                </button>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <h2 className="font-semibold text-gray-900 mb-4">Acciones Rápidas</h2>
            <div className="space-y-2">
              <button
                onClick={() => {
                  clearDetection();
                  navigate('/entry');
                }}
                className="w-full flex items-center gap-3 bg-blue-50 hover:bg-blue-100 text-blue-700 py-3 px-4 rounded-xl font-medium transition-colors text-left"
              >
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <LogIn className="w-4 h-4 text-white" />
                </div>
                Nuevo Ingreso
              </button>
              <button
                onClick={() => {
                  clearDetection();
                  navigate('/exit');
                }}
                className="w-full flex items-center gap-3 bg-green-50 hover:bg-green-100 text-green-700 py-3 px-4 rounded-xl font-medium transition-colors text-left"
              >
                <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <LogOut className="w-4 h-4 text-white" />
                </div>
                Procesar Salida
              </button>
              <button
                onClick={() => navigate('/search')}
                className="w-full flex items-center gap-3 bg-gray-50 hover:bg-gray-100 text-gray-700 py-3 px-4 rounded-xl font-medium transition-colors text-left"
              >
                <div className="w-8 h-8 bg-gray-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Search className="w-4 h-4 text-white" />
                </div>
                Buscar Vehículo
              </button>
              <button
                onClick={() => setShowCamera(true)}
                className="w-full flex items-center gap-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 py-3 px-4 rounded-xl font-medium transition-colors text-left"
              >
                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Camera className="w-4 h-4 text-white" />
                </div>
                Abrir Cámara LPR
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Active vehicles + recent activity */}
        <div className="lg:col-span-2 space-y-4">
          {/* Active Vehicles */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">
                Vehículos Activos <span className="text-gray-400 font-normal">({activeVehicles.length})</span>
              </h2>
              <button
                onClick={() => navigate('/search')}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Ver Todos →
              </button>
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto">
              {activeVehicles.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <Car className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">Sin vehículos actualmente</p>
                </div>
              ) : (
                activeVehicles.map((vehicle) => {
                  const duration = Math.round((Date.now() - new Date(vehicle.entryTime).getTime()) / (1000 * 60));
                  return (
                    <div
                      key={vehicle.id}
                      className="flex items-center justify-between p-3.5 bg-gray-50 hover:bg-gray-100 rounded-xl cursor-pointer transition-colors group"
                      onClick={() => navigate('/exit')}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center text-sm">
                          {getCategoryIcon(vehicle.category)}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-gray-900 font-mono text-sm">{vehicle.licensePlate}</span>
                            {vehicle.isSubscriber && <Star className="w-3 h-3 text-amber-500 fill-amber-400" />}
                          </div>
                          <div className="text-xs text-gray-500">{translateCategory(vehicle.category)}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold text-gray-900">{formatDuration(duration)}</div>
                        <div className="text-xs text-gray-400">
                          {new Date(vehicle.entryTime).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <h2 className="font-semibold text-gray-900 mb-4">Actividad Reciente</h2>
            <div className="space-y-2">
              {recentLogs.map((log) => {
                const iconMap = {
                  entry: <CheckCircle className="w-4 h-4 text-blue-600" />,
                  exit: <CheckCircle className="w-4 h-4 text-green-600" />,
                  payment: <DollarSign className="w-4 h-4 text-emerald-600" />,
                  ticket: <DollarSign className="w-4 h-4 text-indigo-600" />,
                  error: <XCircle className="w-4 h-4 text-red-600" />,
                  manual: <AlertTriangle className="w-4 h-4 text-amber-600" />,
                  white_run: <AlertTriangle className="w-4 h-4 text-cyan-600" />,
                  system: <CheckCircle className="w-4 h-4 text-gray-500" />,
                };
                const bgMap = {
                  entry: 'bg-blue-50',
                  exit: 'bg-green-50',
                  payment: 'bg-emerald-50',
                  ticket: 'bg-indigo-50',
                  error: 'bg-red-50',
                  manual: 'bg-amber-50',
                  white_run: 'bg-cyan-50',
                  system: 'bg-gray-50',
                };

                return (
                  <div key={log.id} className={`flex items-start gap-3 p-3 ${bgMap[log.type]} rounded-lg`}>
                    <div className="flex-shrink-0 mt-0.5">{iconMap[log.type]}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900 leading-snug">{log.message}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {new Date(log.timestamp).toLocaleTimeString('es-CL')}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
