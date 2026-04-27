import React, { useState } from 'react';
import { useParking } from '../contexts/ParkingContext';
import { PRICING_RULES, translateCategory } from '../data/mockData';
import {
  Settings,
  DollarSign,
  FileText,
  BarChart3,
  Plus,
  Edit,
  Trash2,
} from 'lucide-react';

type TabType = 'categories' | 'pricing' | 'logs' | 'reports';

export const AdminPanel: React.FC = () => {
  const { logs, stats, vehicles } = useParking();
  const [activeTab, setActiveTab] = useState<TabType>('pricing');
  const [pricingRules] = useState(PRICING_RULES);

  const tabs = [
    { id: 'pricing', label: 'Reglas de Precio', icon: DollarSign },
    { id: 'logs', label: 'Registros del Sistema', icon: FileText },
    { id: 'reports', label: 'Reportes', icon: BarChart3 },
  ];

  return (
    <div className="max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Panel de Administración
        </h1>
        <p className="text-gray-600">
          Gestionar configuración del sistema y ver análisis
        </p>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
        <div className="border-b border-gray-200">
          <div className="flex">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors relative ${
                    activeTab === tab.id
                      ? 'text-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {tab.label}
                  {activeTab === tab.id && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-6">
          {/* Pricing Rules Tab */}
          {activeTab === 'pricing' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 mb-1">
                    Configuración de Precios
                  </h2>
                  <p className="text-sm text-gray-600">
                    Gestionar tarifas de estacionamiento para diferentes categorías de vehículos
                  </p>
                </div>
                <button className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium flex items-center gap-2 transition-colors">
                  <Plus className="w-4 h-4" />
                  Agregar Regla
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pricingRules.map((rule) => (
                  <div
                    key={rule.id}
                    className="bg-gray-50 border border-gray-200 rounded-lg p-5 hover:border-blue-300 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-gray-900 capitalize mb-1">
                          {rule.name}
                        </h3>
                        <span className="text-xs text-gray-500 uppercase">
                          {rule.category}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <button className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-white rounded transition-colors">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-white rounded transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Precio Base (1era hora):</span>
                        <span className="font-semibold text-gray-900">
                          ${rule.basePrice.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Tarifa por Hora:</span>
                        <span className="font-semibold text-gray-900">
                          ${rule.hourlyRate.toFixed(2)}/hr
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Máximo Diario:</span>
                        <span className="font-semibold text-gray-900">
                          ${rule.dailyMax.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Example Calculation */}
                    <div className="mt-4 pt-4 border-t border-gray-300">
                      <div className="text-xs text-gray-600 mb-2">
                        Ejemplo: 3 horas
                      </div>
                      <div className="text-sm font-semibold text-blue-600">
                        ${(rule.basePrice + 2 * rule.hourlyRate).toFixed(2)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* System Logs Tab */}
          {activeTab === 'logs' && (
            <div>
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-1">
                  Registros de Actividad del Sistema
                </h2>
                <p className="text-sm text-gray-600">
                  Ver todos los eventos y transacciones del sistema
                </p>
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {logs.map((log) => {
                  const logTime = new Date(log.timestamp);
                  const typeColors = {
                    entry: 'bg-blue-100 text-blue-800',
                    exit: 'bg-purple-100 text-purple-800',
                    payment: 'bg-green-100 text-green-800',
                    error: 'bg-red-100 text-red-800',
                    manual: 'bg-amber-100 text-amber-800',
                    system: 'bg-gray-100 text-gray-800',
                  };

                  return (
                    <div
                      key={log.id}
                      className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex-shrink-0 w-20 text-xs text-gray-600">
                        {logTime.toLocaleTimeString()}
                      </div>
                      <div className="flex-shrink-0">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            typeColors[log.type]
                          }`}
                        >
                          {log.type}
                        </span>
                      </div>
                      <div className="flex-1 text-sm text-gray-900">
                        {log.message}
                      </div>
                      <div className="flex-shrink-0 text-xs text-gray-500">
                        ID: {log.userId}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Reports Tab */}
          {activeTab === 'reports' && (
            <div>
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-1">
                  Análisis y Reportes
                </h2>
                <p className="text-sm text-gray-600">
                  Resumen del rendimiento de la instalación de estacionamiento
                </p>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-6">
                  <div className="text-sm text-blue-700 mb-2 font-medium">
                    Total de Entradas Hoy
                  </div>
                  <div className="text-4xl font-bold text-blue-900 mb-1">
                    {stats.todayEntries}
                  </div>
                  <div className="text-xs text-blue-600">vehículos</div>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-6">
                  <div className="text-sm text-green-700 mb-2 font-medium">
                    Ingresos Hoy
                  </div>
                  <div className="text-4xl font-bold text-green-900 mb-1">
                    ${stats.todayRevenue.toFixed(2)}
                  </div>
                  <div className="text-xs text-green-600">recaudados</div>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-6">
                  <div className="text-sm text-purple-700 mb-2 font-medium">
                    Actualmente Estacionados
                  </div>
                  <div className="text-4xl font-bold text-purple-900 mb-1">
                    {stats.vehiclesInside}
                  </div>
                  <div className="text-xs text-purple-600">vehículos</div>
                </div>
              </div>

              {/* Category Breakdown */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h3 className="font-semibold text-gray-900 mb-4">
                  Desglose por Categoría de Vehículo
                </h3>
                <div className="space-y-3">
                  {['car', 'motorcycle', 'van', 'truck'].map((category) => {
                    const count = vehicles.filter(
                      (v) => v.category === category
                    ).length;
                    const percentage = vehicles.length
                      ? (count / vehicles.length) * 100
                      : 0;

                    return (
                      <div key={category}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-700">
                            {translateCategory(category)}
                          </span>
                          <span className="text-sm text-gray-600">
                            {count} ({percentage.toFixed(1)}%)
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
