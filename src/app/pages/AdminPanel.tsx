import React, { useState } from 'react';
import { useParking } from '../contexts/ParkingContext';
import { translateCategory, formatCurrency } from '../data/mockData';
import { PricingRule, VehicleCategory } from '../types';
import {
  DollarSign,
  FileText,
  BarChart3,
  Edit,
  X,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Save,
  Info,
} from 'lucide-react';

type TabType = 'pricing' | 'logs' | 'reports';

const CATEGORIES: { value: VehicleCategory; label: string; icon: string }[] = [
  { value: 'car', label: 'Automóvil', icon: '🚗' },
  { value: 'motorcycle', label: 'Motocicleta', icon: '🏍️' },
  { value: 'van', label: 'Camioneta/SUV', icon: '🚙' },
];

export const AdminPanel: React.FC = () => {
  const { logs, stats, vehicles, pricingRules, updatePricingRule } = useParking();
  const [activeTab, setActiveTab] = useState<TabType>('pricing');
  const [showModal, setShowModal] = useState(false);
  const [editingRule, setEditingRule] = useState<PricingRule | null>(null);
  const [formData, setFormData] = useState<Partial<PricingRule>>({});
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [logFilter, setLogFilter] = useState<string>('all');

  const tabs = [
    { id: 'pricing', label: 'Precios', icon: DollarSign },
    { id: 'logs', label: 'Registros', icon: FileText },
    { id: 'reports', label: 'Reportes', icon: BarChart3 },
  ];

  const openEditModal = (rule: PricingRule) => {
    setEditingRule(rule);
    setFormData({ ...rule });
    setShowModal(true);
  };

  const handleSave = () => {
    if (!editingRule || !formData.basePrice || !formData.fractionRate) return;
    updatePricingRule({ ...editingRule, ...formData } as PricingRule);
    setShowModal(false);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const filteredLogs = logFilter === 'all' ? logs : logs.filter((l) => l.type === logFilter);

  const completedToday = vehicles.filter((v) => {
    if (!v.exitTime) return false;
    return new Date(v.exitTime).toDateString() === new Date().toDateString();
  });
  const errorLogs = logs.filter((l) => l.type === 'error');
  const categoryStats = CATEGORIES.map((cat) => {
    const count = vehicles.filter((v) => v.category === cat.value).length;
    const revenue = vehicles
      .filter((v) => v.category === cat.value && v.isPaid)
      .reduce((sum, v) => sum + (v.amount || 0), 0);
    return { ...cat, count, revenue };
  });
  const maxCount = Math.max(...categoryStats.map((c) => c.count), 1);

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Panel de Administración</h1>
        <p className="text-gray-500">Gestión de configuración, precios y análisis del sistema</p>
      </div>

      {savedSuccess && (
        <div className="fixed top-20 right-6 z-50 bg-green-600 text-white px-5 py-3 rounded-xl shadow-lg flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />
          <span className="font-medium">Cambios guardados exitosamente</span>
        </div>
      )}

      {/* Edit Pricing Modal */}
      {showModal && editingRule && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="font-bold text-gray-900">Editar Tarifa — {editingRule.name}</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Category badge (read-only) */}
              <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3 border border-gray-200">
                <span className="text-2xl">{CATEGORIES.find((c) => c.value === editingRule.category)?.icon}</span>
                <div>
                  <div className="text-sm font-medium text-gray-900">{editingRule.name}</div>
                  <div className="text-xs text-gray-500">Categoría: {translateCategory(editingRule.category)}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Precio primera hora (ARS $)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={formData.basePrice ?? ''}
                    onChange={(e) => setFormData({ ...formData, basePrice: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Por fracción de 10 min (ARS $)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={formData.fractionRate ?? ''}
                    onChange={(e) => setFormData({ ...formData, fractionRate: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Preview */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-center gap-2 text-blue-700 mb-3">
                  <Info className="w-4 h-4" />
                  <span className="text-sm font-medium">Vista previa de cobro</span>
                </div>
                <div className="space-y-1.5 text-xs text-blue-800">
                  <div className="flex justify-between">
                    <span>1ª hora (0–60 min)</span>
                    <span className="font-semibold">{formatCurrency(formData.basePrice ?? 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Fracción de 10 min (máx. 5)</span>
                    <span className="font-semibold">{formatCurrency(formData.fractionRate ?? 0)} c/u</span>
                  </div>
                  <div className="flex justify-between border-t border-blue-200 pt-1.5 mt-1.5">
                    <span>Máx. 1ª hora + 5 fracciones (110 min)</span>
                    <span className="font-semibold">
                      {formatCurrency((formData.basePrice ?? 0) + 5 * (formData.fractionRate ?? 0))}
                    </span>
                  </div>
                  <div className="flex justify-between text-blue-600">
                    <span>Al exceder 5 fracciones → nueva hora base</span>
                    <span className="font-semibold">{formatCurrency(2 * (formData.basePrice ?? 0))}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex gap-3">
              <button onClick={() => setShowModal(false)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 rounded-xl font-medium">
                Cancelar
              </button>
              <button
                onClick={handleSave}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl font-medium flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <div className="flex px-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`flex items-center gap-2 px-6 py-4 font-medium transition-colors relative ${
                    activeTab === tab.id ? 'text-blue-600' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Icon className="w-4 h-4" />
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
          {/* PRICING TAB */}
          {activeTab === 'pricing' && (
            <div>
              <div className="mb-5">
                <h2 className="font-semibold text-gray-900 mb-0.5">Configuración de Tarifas</h2>
                <p className="text-sm text-gray-500">
                  Modifique los valores de cada categoría. No se pueden agregar ni eliminar tarifas.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pricingRules.map((rule) => {
                  const catInfo = CATEGORIES.find((c) => c.value === rule.category);
                  const maxCharge = rule.basePrice + rule.maxFractions * rule.fractionRate;
                  return (
                    <div
                      key={rule.id}
                      className="bg-gray-50 border border-gray-200 rounded-xl p-5 hover:border-blue-200 hover:shadow-sm transition-all"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-2.5">
                          <div className="text-2xl">{catInfo?.icon}</div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{rule.name}</h3>
                            <span className="text-xs text-gray-500">{translateCategory(rule.category)}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => openEditModal(rule)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Editar tarifa"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Primera hora:</span>
                          <span className="font-semibold text-gray-900">{formatCurrency(rule.basePrice)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">c/10 min:</span>
                          <span className="font-semibold text-gray-900">{formatCurrency(rule.fractionRate)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Máx. fracciones:</span>
                          <span className="font-semibold text-gray-900">{rule.maxFractions} × {rule.fraction} min</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Tope 1ª hora:</span>
                          <span className="font-semibold text-blue-700">{formatCurrency(maxCharge)}</span>
                        </div>
                      </div>

                      <div className="mt-3 pt-3 border-t border-gray-200 text-xs text-gray-500">
                        A los {60 + rule.maxFractions * rule.fraction} min → nueva hora base ({formatCurrency(rule.basePrice)})
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-5 flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="space-y-1 text-xs text-blue-700">
                  <p><span className="font-semibold">Regla de 5 minutos:</span> Los vehículos que salgan dentro de los primeros 5 min no son cobrados.</p>
                  <p><span className="font-semibold">Regla de fracciones:</span> Máximo {pricingRules[0]?.maxFractions ?? 5} fracciones de {pricingRules[0]?.fraction ?? 10} min por hora. Al exceder, se cobra una nueva hora completa.</p>
                </div>
              </div>
            </div>
          )}

          {/* LOGS TAB */}
          {activeTab === 'logs' && (
            <div>
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="font-semibold text-gray-900 mb-0.5">Registros del Sistema</h2>
                  <p className="text-sm text-gray-500">Historial completo de eventos y transacciones</p>
                </div>
                <select
                  value={logFilter}
                  onChange={(e) => setLogFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                >
                  <option value="all">Todos los tipos</option>
                  <option value="entry">Ingresos</option>
                  <option value="payment">Pagos</option>
                  <option value="error">Errores</option>
                  <option value="manual">Manual</option>
                  <option value="system">Sistema</option>
                </select>
              </div>

              {errorLogs.length > 0 && (
                <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl mb-4">
                  <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-red-800">
                      {errorLogs.length} error{errorLogs.length > 1 ? 'es' : ''} en el sistema
                    </p>
                    <p className="text-xs text-red-600">Revise los logs de tipo "error" para más detalles</p>
                  </div>
                </div>
              )}

              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {filteredLogs.map((log) => {
                  const typeColors: Record<string, string> = {
                    entry: 'bg-blue-100 text-blue-700',
                    payment: 'bg-green-100 text-green-700',
                    error: 'bg-red-100 text-red-700',
                    manual: 'bg-amber-100 text-amber-700',
                    system: 'bg-gray-100 text-gray-700',
                  };
                  const typeLabels: Record<string, string> = {
                    entry: 'Ingreso', payment: 'Pago', error: 'Error', manual: 'Manual', system: 'Sistema',
                  };
                  return (
                    <div key={log.id} className="flex items-start gap-4 p-3.5 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                      <div className="flex-shrink-0 mt-0.5">
                        {log.type === 'error' ? (
                          <XCircle className="w-4 h-4 text-red-600" />
                        ) : (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900">{log.message}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{new Date(log.timestamp).toLocaleString('es-CL')}</p>
                      </div>
                      <span className={`flex-shrink-0 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${typeColors[log.type] || 'bg-gray-100 text-gray-700'}`}>
                        {typeLabels[log.type] || log.type}
                      </span>
                    </div>
                  );
                })}
                {filteredLogs.length === 0 && (
                  <p className="text-center text-gray-400 py-8">No hay registros para este filtro</p>
                )}
              </div>
            </div>
          )}

          {/* REPORTS TAB */}
          {activeTab === 'reports' && (
            <div className="space-y-6">
              <div>
                <h2 className="font-semibold text-gray-900 mb-0.5">Análisis y Reportes</h2>
                <p className="text-sm text-gray-500">Resumen del rendimiento del estacionamiento</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-4">
                  <div className="text-sm text-blue-700 mb-1 font-medium">Entradas Hoy</div>
                  <div className="text-3xl font-bold text-blue-900">{stats.todayEntries}</div>
                  <div className="text-xs text-blue-600 mt-0.5">vehículos</div>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-4">
                  <div className="text-sm text-green-700 mb-1 font-medium">Ingresos Hoy</div>
                  <div className="text-2xl font-bold text-green-900">{formatCurrency(stats.todayRevenue)}</div>
                  <div className="text-xs text-green-600 mt-0.5">recaudado</div>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-4">
                  <div className="text-sm text-purple-700 mb-1 font-medium">Actualmente</div>
                  <div className="text-3xl font-bold text-purple-900">{stats.vehiclesInside}</div>
                  <div className="text-xs text-purple-600 mt-0.5">adentro</div>
                </div>
                <div className="bg-gradient-to-br from-red-50 to-red-100 border border-red-200 rounded-xl p-4">
                  <div className="text-sm text-red-700 mb-1 font-medium">Errores</div>
                  <div className="text-3xl font-bold text-red-900">{errorLogs.length}</div>
                  <div className="text-xs text-red-600 mt-0.5">incidentes</div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-5">
                <h3 className="font-semibold text-gray-900 mb-4">Desglose por Categoría</h3>
                <div className="space-y-3">
                  {categoryStats.map((cat) => (
                    <div key={cat.value}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span>{cat.icon}</span>
                          <span className="text-sm font-medium text-gray-700">{cat.label}</span>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-gray-500">{cat.count} vehículos</span>
                          <span className="font-semibold text-gray-900">{formatCurrency(cat.revenue)}</span>
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${(cat.count / maxCount) * 100}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Últimas Salidas del Día</h3>
                {completedToday.length === 0 ? (
                  <p className="text-sm text-gray-400">No hay salidas registradas hoy</p>
                ) : (
                  <div className="space-y-2">
                    {completedToday.slice(0, 8).map((v) => (
                      <div key={v.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                        <div className="flex items-center gap-3">
                          <span className="font-mono font-semibold text-gray-900 text-sm">{v.licensePlate}</span>
                          <span className="text-xs text-gray-500">{translateCategory(v.category)}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                          <span className="text-gray-500">{v.duration ? `${v.duration}min` : '-'}</span>
                          <span className={`font-semibold ${v.isFreeExit ? 'text-blue-600' : 'text-green-600'}`}>
                            {v.isFreeExit ? 'Sin cargo' : formatCurrency(v.amount ?? 0)}
                          </span>
                          <span className="text-xs text-gray-400">
                            {v.paymentMethod === 'cash' ? 'Efectivo' : v.paymentMethod === 'card' ? 'Tarjeta' : '-'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {errorLogs.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-3">Incidentes y Errores</h3>
                  <div className="space-y-2">
                    {errorLogs.map((log) => (
                      <div key={log.id} className="flex items-start gap-3 p-3 bg-red-50 border border-red-100 rounded-xl">
                        <XCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm text-red-800">{log.message}</p>
                          <p className="text-xs text-red-400 mt-0.5">{new Date(log.timestamp).toLocaleString('es-CL')}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
