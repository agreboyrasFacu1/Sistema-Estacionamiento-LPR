import React, { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useParking } from '../contexts/ParkingContext';
import { useAuth } from '../contexts/AuthContext';
import { LPRSimulator } from '../components/LPRSimulator';
import {
  Car,
  DollarSign,
  Clock,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ArrowRight,
} from 'lucide-react';
import { formatDuration, translateCategory } from '../data/mockData';

export const Dashboard: React.FC = () => {
  const { vehicles, stats, currentDetection, logs } = useParking();
  const { isTrainingMode } = useAuth();
  const navigate = useNavigate();

  const activeVehicles = vehicles.filter((v) => !v.exitTime);
  const recentLogs = logs.slice(0, 5);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Panel de Control - Vista de Cabina
        </h1>
        <p className="text-gray-600">
          Vista en tiempo real de las operaciones del estacionamiento
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Car className="w-6 h-6 text-blue-600" />
            </div>
            <span className="text-2xl font-bold text-blue-600">
              {stats.vehiclesInside}
            </span>
          </div>
          <h3 className="text-sm font-medium text-gray-600 mb-1">
            Vehículos Adentro
          </h3>
          <p className="text-xs text-gray-500">Estacionados actualmente</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <span className="text-2xl font-bold text-green-600">
              {stats.todayEntries}
            </span>
          </div>
          <h3 className="text-sm font-medium text-gray-600 mb-1">
            Ingresos de Hoy
          </h3>
          <p className="text-xs text-gray-500">Total de vehículos</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-emerald-600" />
            </div>
            <span className="text-2xl font-bold text-emerald-600">
              ${stats.todayRevenue.toFixed(2)}
            </span>
          </div>
          <h3 className="text-sm font-medium text-gray-600 mb-1">
            Ingresos de Hoy
          </h3>
          <p className="text-xs text-gray-500">Total recaudado</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-purple-600" />
            </div>
            <span className="text-2xl font-bold text-purple-600">
              {formatDuration(stats.averageDuration)}
            </span>
          </div>
          <h3 className="text-sm font-medium text-gray-600 mb-1">
            Duración Prom.
          </h3>
          <p className="text-xs text-gray-500">Tiempo de estacionamiento</p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Live Plate Detection */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Detección de Patentes en Vivo
            </h2>

            {currentDetection ? (
              <div className="space-y-4">
                <div
                  className={`p-6 rounded-lg border-2 ${
                    currentDetection.isValid
                      ? 'bg-green-50 border-green-300'
                      : 'bg-amber-50 border-amber-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-600">
                      Patente Detectada
                    </span>
                    {currentDetection.isValid ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-amber-600" />
                    )}
                  </div>
                  <div className="text-3xl font-bold text-gray-900 tracking-wide font-mono text-center mb-3">
                    {currentDetection.plate}
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Confianza:</span>
                    <span className="font-semibold">
                      {(currentDetection.confidence * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="mt-2">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          currentDetection.isValid
                            ? 'bg-green-600'
                            : 'bg-amber-600'
                        }`}
                        style={{
                          width: `${currentDetection.confidence * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => navigate('/entry')}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
                  >
                    Procesar Ingreso
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Car className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-500 mb-4">No se detectó patente</p>
                <div className="flex items-center justify-center gap-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" />
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"
                    style={{ animationDelay: '0.2s' }}
                  />
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"
                    style={{ animationDelay: '0.4s' }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mt-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Acciones Rápidas
            </h2>
            <div className="space-y-3">
              <button
                onClick={() => navigate('/entry')}
                className="w-full bg-blue-50 hover:bg-blue-100 text-blue-700 py-3 px-4 rounded-lg font-medium transition-colors text-left"
              >
                + Nuevo Ingreso de Vehículo
              </button>
              <button
                onClick={() => navigate('/exit')}
                className="w-full bg-green-50 hover:bg-green-100 text-green-700 py-3 px-4 rounded-lg font-medium transition-colors text-left"
              >
                → Procesar Salida de Vehículo
              </button>
              <button
                onClick={() => navigate('/search')}
                className="w-full bg-gray-50 hover:bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium transition-colors text-left"
              >
                🔍 Buscar Vehículo
              </button>
            </div>
          </div>
        </div>

        {/* Active Vehicles & Recent Activity */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Vehicles */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Vehículos Activos ({activeVehicles.length})
              </h2>
              <button
                onClick={() => navigate('/search')}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Ver Todos
              </button>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {activeVehicles.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No hay vehículos estacionados actualmente
                </div>
              ) : (
                activeVehicles.map((vehicle) => {
                  const entryTime = new Date(vehicle.entryTime);
                  const duration = Math.round(
                    (Date.now() - entryTime.getTime()) / (1000 * 60)
                  );

                  return (
                    <div
                      key={vehicle.id}
                      className="flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                      onClick={() => navigate('/exit')}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Car className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900 font-mono">
                            {vehicle.licensePlate}
                          </div>
                          <div className="text-sm text-gray-600">
                            {translateCategory(vehicle.category)}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900">
                          {formatDuration(duration)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {entryTime.toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Actividad Reciente
            </h2>

            <div className="space-y-3">
              {recentLogs.map((log) => {
                const logTime = new Date(log.timestamp);
                const iconMap = {
                  entry: <CheckCircle className="w-4 h-4 text-green-600" />,
                  exit: <CheckCircle className="w-4 h-4 text-blue-600" />,
                  payment: <DollarSign className="w-4 h-4 text-emerald-600" />,
                  error: <XCircle className="w-4 h-4 text-red-600" />,
                  manual: <AlertTriangle className="w-4 h-4 text-amber-600" />,
                  system: <CheckCircle className="w-4 h-4 text-gray-600" />,
                };

                return (
                  <div
                    key={log.id}
                    className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      {iconMap[log.type]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900">{log.message}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {logTime.toLocaleTimeString()}
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