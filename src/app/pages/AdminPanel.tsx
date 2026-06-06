import React, { useState } from 'react';
import { useParking } from '../contexts/ParkingContext';
import { translateCategory } from '../data/mockData';
import { PricingRule, VehicleCategory } from '../types';
import { formatLprAccuracy, getLprAccuracySummary } from '../domain/lpr';
import {
  calculateDefaultFractionPrice,
  normalizePricingRule,
} from '../domain/pricing';
import {
  DollarSign,
  FileText,
  BarChart3,
  Plus,
  Edit,
  Trash2,
  X,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Save,
  Info,
} from 'lucide-react';
import { formatCurrencyARS, formatCurrencyARSWithCents } from '../utils/currency';
import { resetDemoStorage } from '../services/storage';

type TabType = 'pricing' | 'logs' | 'reports';

const CATEGORIES: { value: VehicleCategory; label: string; icon: string }[] = [
  { value: 'auto', label: 'Auto', icon: '🚗' },
  { value: 'camioneta', label: 'Camioneta', icon: '🚙' },
  { value: 'moto', label: 'Moto', icon: '🏍️' },
];

const PRICING_DEFAULTS: Record<
  VehicleCategory,
  Pick<PricingRule, 'basePrice' | 'fractionPrice' | 'fraction' | 'baseMinutes'>
> = {
  auto: {
    basePrice: 5000,
    fractionPrice: 750,
    fraction: 10,
    baseMinutes: 60,
  },
  camioneta: {
    basePrice: 5000,
    fractionPrice: 750,
    fraction: 10,
    baseMinutes: 60,
  },
  moto: {
    basePrice: 3000,
    fractionPrice: 450,
    fraction: 10,
    baseMinutes: 60,
  },
};

const createEmptyRule = (category: VehicleCategory = 'auto'): Omit<PricingRule, 'id'> => ({
  category,
  name: '',
  ...PRICING_DEFAULTS[category],
});

const parseMoneyInput = (value: string): number => {
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const AdminPanel: React.FC = () => {
  const {
    logs,
    stats,
    vehicles,
    pricingRules,
    subscriberPricingRules,
    lprCorrections,
    addPricingRule,
    updatePricingRule,
    deletePricingRule,
    updateSubscriberPricingRule,
  } = useParking();
  const [activeTab, setActiveTab] = useState<TabType>('pricing');
  const [showModal, setShowModal] = useState(false);
  const [editingRule, setEditingRule] = useState<PricingRule | null>(null);
  const [formData, setFormData] = useState<Omit<PricingRule, 'id'>>(createEmptyRule());
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [logFilter, setLogFilter] = useState<string>('all');

  const tabs = [
    { id: 'pricing', label: 'Precios', icon: DollarSign },
    { id: 'logs', label: 'Registros', icon: FileText },
    { id: 'reports', label: 'Reportes', icon: BarChart3 },
  ];

  const openAddModal = () => {
    setEditingRule(null);
    setFormData(createEmptyRule());
    setShowModal(true);
  };

  const openEditModal = (rule: PricingRule) => {
    const normalizedRule = normalizePricingRule(rule);
    setEditingRule(rule);
    setFormData({
      category: normalizedRule.category,
      name: normalizedRule.name,
      basePrice: normalizedRule.basePrice,
      fractionPrice: normalizedRule.fractionPrice,
      fraction: normalizedRule.fraction,
      baseMinutes: normalizedRule.baseMinutes,
    });
    setShowModal(true);
  };

  const handleSave = () => {
    if (!formData.name) return;
    if (editingRule) {
      updatePricingRule({ ...formData, id: editingRule.id });
    } else {
      addPricingRule(formData);
    }
    setShowModal(false);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleDelete = (id: string) => {
    deletePricingRule(id);
    setDeleteConfirm(null);
  };

  const handleCategoryChange = (category: VehicleCategory) => {
    setFormData({
      ...formData,
      category,
      ...(!editingRule ? PRICING_DEFAULTS[category] : {}),
    });
  };

  const handleSubscriberPriceChange = (ruleId: string, monthlyPrice: number) => {
    const rule = subscriberPricingRules.find((item) => item.id === ruleId);
    if (!rule) return;
    updateSubscriberPricingRule({
      ...rule,
      monthlyPrice: Number.isFinite(monthlyPrice) && monthlyPrice >= 0 ? monthlyPrice : 0,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleResetDemoData = () => {
    const confirmed = window.confirm(
      'Esto reinicia usuarios demo, vehiculos, tickets, logs, tarifas, abonados e incidencias locales. No borra datos fuera de parking-lpr. Continuar?'
    );
    if (!confirmed) return;
    resetDemoStorage();
    window.location.reload();
  };

  const filteredLogs = logFilter === 'all' ? logs : logs.filter((l) => l.type === logFilter);

  // Report data
  const completedToday = vehicles.filter((v) => {
    if (!v.exitTime) return false;
    const today = new Date();
    return new Date(v.exitTime).toDateString() === today.toDateString();
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
  const lprSummary = getLprAccuracySummary(lprCorrections);
  const lprStatusLabel = {
    no_sample: 'Sin muestra suficiente',
    below_target: 'Por debajo del objetivo',
    target_met: 'Objetivo alcanzado en muestra registrada',
  }[lprSummary.status];
  const lprStatusClass = {
    no_sample: 'bg-gray-100 text-gray-700 border-gray-200',
    below_target: 'bg-amber-100 text-amber-800 border-amber-200',
    target_met: 'bg-green-100 text-green-800 border-green-200',
  }[lprSummary.status];

  return (
    <div className="max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Panel de Administración</h1>
          <p className="text-gray-500">Gestión de configuración, precios y análisis del sistema</p>
        </div>
        <button
          onClick={handleResetDemoData}
          className="bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 py-2 px-4 rounded-xl font-medium transition-colors text-sm"
        >
          Reset demo
        </button>
      </div>

      {/* Success toast */}
      {savedSuccess && (
        <div className="fixed top-20 right-6 z-50 bg-green-600 text-white px-5 py-3 rounded-xl shadow-lg flex items-center gap-2 animate-in slide-in-from-right">
          <CheckCircle className="w-5 h-5" />
          <span className="font-medium">Cambios guardados exitosamente</span>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="text-center font-bold text-gray-900 mb-2">¿Eliminar Tarifa?</h3>
            <p className="text-center text-sm text-gray-500 mb-5">Esta acción no se puede deshacer.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 rounded-xl font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-xl font-medium transition-colors"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Pricing Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="font-bold text-gray-900">
                {editingRule ? 'Editar Tarifa' : 'Nueva Tarifa'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Categoría de Vehículo
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => handleCategoryChange(cat.value)}
                      className={`p-3 rounded-xl border-2 text-center transition-all ${
                        formData.category === cat.value
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-xl mb-1">{cat.icon}</div>
                      <div className="text-xs font-medium text-gray-700">{cat.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Nombre de la Tarifa
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ej: Automóvil Estándar"
                />
              </div>

              {/* Prices */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Hora inicial (ARS)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={formData.basePrice}
                    onChange={(e) => {
                      const basePrice = parseMoneyInput(e.target.value);
                      setFormData({
                        ...formData,
                        basePrice,
                        fractionPrice: calculateDefaultFractionPrice(basePrice),
                      });
                    }}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Fracción posterior (ARS)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={formData.fractionPrice}
                    onChange={(e) => setFormData({ ...formData, fractionPrice: parseMoneyInput(e.target.value) })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Default sugerido: 15% de la hora inicial. Se puede modificar.
                  </p>
                </div>
              </div>

              <div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Fracción (minutos)
                  </label>
                  <select
                    value={formData.fraction}
                    onChange={(e) => setFormData({ ...formData, fraction: parseInt(e.target.value) })}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value={10}>Cada 10 min</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Tolerancia post-pago fija (minutos)
                </label>
                <input
                  type="number"
                  min="0"
                  max="60"
                  value={3}
                  readOnly
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ej: 10"
                />
                <p className="text-xs text-gray-400 mt-1">
                  La tolerancia oficial es de 3 minutos posteriores al pago. No aplica como tiempo sin cargo desde el ingreso.
                </p>
              </div>

              {/* Preview */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-center gap-2 text-blue-700 mb-2">
                  <Info className="w-4 h-4" />
                  <span className="text-sm font-medium">Vista Previa</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-blue-800">
                  <div>
                    <div className="font-semibold">{formatCurrencyARSWithCents(formData.basePrice)}</div>
                    <div className="text-blue-600">Hora inicial</div>
                  </div>
                  <div>
                    <div className="font-semibold">{formatCurrencyARSWithCents(formData.fractionPrice)}</div>
                    <div className="text-blue-600">c/10 min posteriores</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 rounded-xl font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={!formData.name}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white py-2.5 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors"
              >
                <Save className="w-4 h-4" />
                {editingRule ? 'Guardar Cambios' : 'Agregar Tarifa'}
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
          {/* ==================== PRICING TAB ==================== */}
          {activeTab === 'pricing' && (
            <div>
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="font-semibold text-gray-900 mb-0.5">Configuración de Tarifas</h2>
                  <p className="text-sm text-gray-500">CRUD completo de precios por categoría de vehículo</p>
                </div>
                <button
                  onClick={openAddModal}
                  className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-xl font-medium flex items-center gap-2 transition-colors shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                  Nueva Tarifa
                </button>
              </div>

              {pricingRules.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <DollarSign className="w-12 h-12 mx-auto mb-3 text-gray-200" />
                  <p>No hay tarifas configuradas</p>
                  <button onClick={openAddModal} className="mt-3 text-blue-600 hover:text-blue-700 font-medium text-sm">
                    + Agregar primera tarifa
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {pricingRules.map((rule) => {
                    const catInfo = CATEGORIES.find((c) => c.value === rule.category);
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
                              <span className="text-xs text-gray-500 capitalize">{translateCategory(rule.category)}</span>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <button
                              onClick={() => openEditModal(rule)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Editar"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(rule.id)}
                              className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              title="Eliminar"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-500">Hora inicial:</span>
                            <span className="font-semibold text-gray-900">{formatCurrencyARSWithCents(rule.basePrice)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Valor fracción:</span>
                            <span className="font-semibold text-gray-900">{formatCurrencyARSWithCents(rule.fractionPrice)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Fracción:</span>
                            <span className="font-semibold text-gray-900">c/{rule.fraction} min</span>
                          </div>
                        </div>

                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>Tolerancia post-pago: 3 min</span>
                            <span className="text-blue-600 font-medium">
                              Ej. 3h: 1h inicial + 12 fracciones = {formatCurrencyARSWithCents(rule.basePrice + 12 * rule.fractionPrice)}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="mt-6">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <h2 className="font-semibold text-gray-900 mb-0.5">Valores de Abonos Mensuales</h2>
                    <p className="text-sm text-gray-500">
                      El alta y la renovación cobran estos importes y fijan vigencia por un mes calendario.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {subscriberPricingRules.map((rule) => {
                    const catInfo = CATEGORIES.find((c) => c.value === rule.category);
                    return (
                      <div key={rule.id} className="bg-gray-50 border border-gray-200 rounded-xl p-5">
                        <div className="flex items-center gap-2.5 mb-4">
                          <div className="text-2xl">{catInfo?.icon}</div>
                          <div>
                            <h3 className="font-semibold text-gray-900">{rule.name}</h3>
                            <span className="text-xs text-gray-500 capitalize">
                              {translateCategory(rule.category)}
                            </span>
                          </div>
                        </div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                          Abono mensual (ARS)
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={rule.monthlyPrice}
                          onChange={(event) =>
                            handleSubscriberPriceChange(rule.id, parseMoneyInput(event.target.value))
                          }
                          className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <p className="text-xs text-gray-500 mt-2">
                          Actual: {formatCurrencyARSWithCents(rule.monthlyPrice)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Billing rule notice */}
              <div className="mt-5 flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-800">Regla de negocio especial</p>
                  <p className="text-xs text-blue-600 mt-0.5">
                    La tarifa cubre la primera hora completa y luego fracciona automáticamente cada 10 minutos. La tolerancia de egreso ocurre solo durante los 3 minutos posteriores al pago.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ==================== LOGS TAB ==================== */}
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
                  <option value="exit">Salidas</option>
                  <option value="payment">Pagos</option>
                  <option value="ticket">Tickets</option>
                  <option value="error">Errores</option>
                  <option value="manual">Manual</option>
                  <option value="white_run">Marcha blanca</option>
                  <option value="system">Sistema</option>
                </select>
              </div>

              {/* Error summary */}
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
                  const typeLabels: Record<string, string> = {
                    entry: 'Ingreso',
                    exit: 'Salida',
                    payment: 'Pago',
                    ticket: 'Ticket',
                    error: 'Error',
                    manual: 'Manual',
                    white_run: 'Marcha blanca',
                    system: 'Sistema',
                  };
                  const typeColors: Record<string, string> = {
                    entry: 'bg-blue-100 text-blue-700',
                    exit: 'bg-purple-100 text-purple-700',
                    payment: 'bg-green-100 text-green-700',
                    ticket: 'bg-indigo-100 text-indigo-700',
                    error: 'bg-red-100 text-red-700',
                    manual: 'bg-amber-100 text-amber-700',
                    white_run: 'bg-cyan-100 text-cyan-700',
                    system: 'bg-gray-100 text-gray-700',
                  };
                  const typeIcons: Record<string, React.ReactNode> = {
                    entry: <CheckCircle className="w-4 h-4 text-blue-600" />,
                    exit: <CheckCircle className="w-4 h-4 text-purple-600" />,
                    payment: <DollarSign className="w-4 h-4 text-green-600" />,
                    ticket: <FileText className="w-4 h-4 text-indigo-600" />,
                    error: <XCircle className="w-4 h-4 text-red-600" />,
                    manual: <AlertTriangle className="w-4 h-4 text-amber-600" />,
                    white_run: <AlertTriangle className="w-4 h-4 text-cyan-600" />,
                    system: <CheckCircle className="w-4 h-4 text-gray-500" />,
                  };

                  return (
                    <div
                      key={log.id}
                      className="flex items-start gap-4 p-3.5 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex-shrink-0 mt-0.5">{typeIcons[log.type]}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900">{log.message}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {new Date(log.timestamp).toLocaleString('es-CL')}
                        </p>
                      </div>
                      <span className={`flex-shrink-0 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${typeColors[log.type]}`}>
                        {typeLabels[log.type]}
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

          {/* ==================== REPORTS TAB ==================== */}
          {activeTab === 'reports' && (
            <div className="space-y-6">
              <div>
                <h2 className="font-semibold text-gray-900 mb-0.5">Análisis y Reportes</h2>
                <p className="text-sm text-gray-500">Resumen del rendimiento del estacionamiento</p>
              </div>

              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-4">
                  <div className="text-sm text-blue-700 mb-1 font-medium">Entradas Hoy</div>
                  <div className="text-3xl font-bold text-blue-900">{stats.todayEntries}</div>
                  <div className="text-xs text-blue-600 mt-0.5">vehículos</div>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-4">
                  <div className="text-sm text-green-700 mb-1 font-medium">Ingresos Hoy</div>
                  <div className="text-3xl font-bold text-green-900">{formatCurrencyARS(stats.todayRevenue)}</div>
                  <div className="text-xs text-green-600 mt-0.5">recaudados</div>
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

              {/* Category Breakdown */}
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
                          <span className="font-semibold text-gray-900">{formatCurrencyARSWithCents(cat.revenue)}</span>
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all"
                          style={{ width: `${(cat.count / maxCount) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-5">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div>
                    <h3 className="font-semibold text-gray-900">Calidad LPR demo</h3>
                    <p className="text-sm text-gray-500">
                      Basado en lecturas aceptadas y correcciones manuales registradas. No valida OCR productivo real.
                    </p>
                  </div>
                  <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${lprStatusClass}`}>
                    {lprStatusLabel}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  <div className="bg-white border border-gray-200 rounded-xl p-4">
                    <div className="text-xs text-gray-500 mb-1">Muestra</div>
                    <div className="text-2xl font-bold text-gray-900">{lprSummary.totalReadings}</div>
                    <div className="text-xs text-gray-400">lecturas</div>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-xl p-4">
                    <div className="text-xs text-gray-500 mb-1">Correctas</div>
                    <div className="text-2xl font-bold text-green-700">{lprSummary.correctReadings}</div>
                    <div className="text-xs text-gray-400">sin correccion</div>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-xl p-4">
                    <div className="text-xs text-gray-500 mb-1">Correcciones</div>
                    <div className="text-2xl font-bold text-amber-700">{lprSummary.manualCorrections}</div>
                    <div className="text-xs text-gray-400">manuales</div>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-xl p-4">
                    <div className="text-xs text-gray-500 mb-1">Accuracy</div>
                    <div className="text-2xl font-bold text-blue-700">{formatLprAccuracy(lprSummary.accuracy)}</div>
                    <div className="text-xs text-gray-400">registrada</div>
                  </div>
                  <div className="bg-white border border-gray-200 rounded-xl p-4">
                    <div className="text-xs text-gray-500 mb-1">Objetivo</div>
                    <div className="text-2xl font-bold text-gray-900">{formatLprAccuracy(lprSummary.targetAccuracy)}</div>
                    <div className="text-xs text-gray-400">academico</div>
                  </div>
                </div>

                <div className="mt-4 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-amber-800">
                    La fuente actual es webcam/mock de entrenamiento. La integracion con camara IP real queda preparada como contrato y pendiente de backend/hardware.
                  </p>
                </div>
              </div>

              {/* Recent Completed Exits */}
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
                          <span className={`font-semibold ${(v.amount || 0) === 0 ? 'text-blue-600' : 'text-green-600'}`}>
                            {(v.amount || 0) === 0 ? 'Sin cargo' : formatCurrencyARSWithCents(v.amount || 0)}
                          </span>
                          <span className="text-xs text-gray-400 capitalize">
                            {v.paymentMethod === 'cash' ? 'Efectivo' : v.paymentMethod === 'card' ? 'Tarjeta' : '-'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Error incidents */}
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
