import React, { useState } from 'react';
import { useParking } from '../contexts/ParkingContext';
import { Subscriber, SubscriberType, SubscriberStatus } from '../types';
import { findActiveSubscriberPlateConflict } from '../domain/subscribers';
import {
  Star,
  Plus,
  Edit,
  Trash2,
  Search,
  X,
  CheckCircle,
  XCircle,
  Save,
  Users,
  Calendar,
  Phone,
  Mail,
  Car,
  AlertCircle,
} from 'lucide-react';

const emptyForm: Omit<Subscriber, 'id' | 'createdAt'> = {
  name: '',
  email: '',
  phone: '',
  licensePlate: '',
  additionalPlates: [],
  type: 'monthly',
  status: 'active',
  expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  discount: 0,
  notes: '',
};

export const Subscribers: React.FC = () => {
  const { subscribers, addSubscriber, updateSubscriber, deleteSubscriber } = useParking();
  const [showModal, setShowModal] = useState(false);
  const [editingSub, setEditingSub] = useState<Subscriber | null>(null);
  const [formData, setFormData] = useState<typeof emptyForm>(emptyForm);
  const [additionalPlateInput, setAdditionalPlateInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | SubscriberType>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | SubscriberStatus>('all');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});

  const buildSubscriberCandidate = (): Subscriber => ({
    ...formData,
    id: editingSub?.id || '__new__',
    createdAt: editingSub?.createdAt || new Date().toISOString(),
    licensePlate: formData.licensePlate.toUpperCase(),
    additionalPlates: (formData.additionalPlates || []).map((p) => p.toUpperCase()),
    expiryDate: formData.type === 'monthly' && formData.expiryDate
      ? new Date(formData.expiryDate).toISOString()
      : undefined,
  });

  const validate = (): boolean => {
    const e: Record<string, string | undefined> = {};
    if (!formData.name.trim()) e.name = 'El nombre es requerido';
    if (!formData.email.trim()) e.email = 'El correo es requerido';
    if (!formData.licensePlate.trim()) e.licensePlate = 'La patente es requerida';
    else if (!/^([A-Z]{3}\d{3}|[A-Z]{2}\d{3}[A-Z]{2})$/.test(formData.licensePlate.toUpperCase())) {
      e.licensePlate = 'Formato inválido (ABC123 o AB123CD)';
    }
    if (formData.type === 'monthly' && !formData.expiryDate) e.expiryDate = 'La fecha de vencimiento es requerida';
    if (formData.type === 'discounted' && (!formData.discount || formData.discount <= 0)) {
      e.discount = 'El descuento debe ser mayor a 0';
    }
    if (!e.licensePlate && !e.expiryDate) {
      const conflict = findActiveSubscriberPlateConflict(
        subscribers,
        buildSubscriberCandidate()
      );
      if (conflict) {
        e.licensePlate = `Ya existe un abono activo/vigente para la patente ${conflict.plate} (${conflict.subscriber.name})`;
      }
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const openAddModal = () => {
    setEditingSub(null);
    setFormData({ ...emptyForm, expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] });
    setAdditionalPlateInput('');
    setErrors({});
    setShowModal(true);
  };

  const openEditModal = (sub: Subscriber) => {
    setEditingSub(sub);
    setFormData({
      name: sub.name,
      email: sub.email,
      phone: sub.phone,
      licensePlate: sub.licensePlate,
      additionalPlates: sub.additionalPlates || [],
      type: sub.type,
      status: sub.status,
      expiryDate: sub.expiryDate ? sub.expiryDate.split('T')[0] : '',
      discount: sub.discount || 0,
      notes: sub.notes || '',
    });
    setAdditionalPlateInput('');
    setErrors({});
    setShowModal(true);
  };

  const handleSave = () => {
    if (!validate()) return;
    const payload = {
      ...formData,
      licensePlate: formData.licensePlate.toUpperCase(),
      additionalPlates: (formData.additionalPlates || []).map((p) => p.toUpperCase()),
      expiryDate: formData.type === 'monthly' && formData.expiryDate
        ? new Date(formData.expiryDate).toISOString()
        : undefined,
    };
    if (editingSub) {
      updateSubscriber({ ...payload, id: editingSub.id, createdAt: editingSub.createdAt });
    } else {
      addSubscriber(payload);
    }
    setShowModal(false);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleDelete = (id: string) => {
    deleteSubscriber(id);
    setDeleteConfirm(null);
  };

  const handleAddPlate = () => {
    const plate = additionalPlateInput.toUpperCase().trim();
    if (!plate) return;
    if (!/^([A-Z]{3}\d{3}|[A-Z]{2}\d{3}[A-Z]{2})$/.test(plate)) {
      setErrors({ ...errors, additionalPlate: 'Formato inválido' });
      return;
    }
    setFormData({ ...formData, additionalPlates: [...(formData.additionalPlates || []), plate] });
    setAdditionalPlateInput('');
    setErrors({ ...errors, additionalPlate: undefined });
  };

  const handleRemovePlate = (plate: string) => {
    setFormData({
      ...formData,
      additionalPlates: (formData.additionalPlates || []).filter((p) => p !== plate),
    });
  };

  const isExpired = (sub: Subscriber) => {
    if (sub.type !== 'monthly' || !sub.expiryDate) return false;
    return new Date(sub.expiryDate) < new Date();
  };

  const daysUntilExpiry = (sub: Subscriber) => {
    if (!sub.expiryDate) return null;
    const diff = new Date(sub.expiryDate).getTime() - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const filteredSubs = subscribers.filter((s) => {
    const matchSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.licensePlate.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchType = filterType === 'all' || s.type === filterType;
    const matchStatus = filterStatus === 'all' || s.status === filterStatus;
    return matchSearch && matchType && matchStatus;
  });

  const activeCount = subscribers.filter((s) => s.status === 'active').length;
  const monthlyCount = subscribers.filter((s) => s.type === 'monthly').length;
  const expiringCount = subscribers.filter((s) => {
    const days = daysUntilExpiry(s);
    return days !== null && days <= 7 && days > 0 && s.status === 'active';
  }).length;

  return (
    <div className="max-w-7xl mx-auto">
      {/* Success Toast */}
      {savedSuccess && (
        <div className="fixed top-20 right-6 z-50 bg-green-600 text-white px-5 py-3 rounded-xl shadow-lg flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />
          <span className="font-medium">Abonado guardado exitosamente</span>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4 text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="font-bold text-gray-900 mb-2">¿Eliminar Abonado?</h3>
            <p className="text-sm text-gray-500 mb-5">Esta acción no se puede deshacer.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 rounded-xl font-medium transition-colors">Cancelar</button>
              <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-xl font-medium transition-colors">Eliminar</button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="font-bold text-gray-900">{editingSub ? 'Editar Abonado' : 'Nuevo Abonado'}</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Type selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Abono</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, type: 'monthly' })}
                    className={`p-3 rounded-xl border-2 text-center transition-all ${formData.type === 'monthly' ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}
                  >
                    <Calendar className={`w-6 h-6 mx-auto mb-1 ${formData.type === 'monthly' ? 'text-blue-600' : 'text-gray-400'}`} />
                    <div className="text-sm font-medium text-gray-900">Mensual</div>
                    <div className="text-xs text-gray-500">Sin cargo mensual</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, type: 'discounted' })}
                    className={`p-3 rounded-xl border-2 text-center transition-all ${formData.type === 'discounted' ? 'border-amber-500 bg-amber-50' : 'border-gray-200 hover:border-gray-300'}`}
                  >
                    <Star className={`w-6 h-6 mx-auto mb-1 ${formData.type === 'discounted' ? 'text-amber-500 fill-amber-400' : 'text-gray-400'}`} />
                    <div className="text-sm font-medium text-gray-900">Bonificado</div>
                    <div className="text-xs text-gray-500">Descuento especial</div>
                  </button>
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nombre / Empresa</label>
                <input type="text" value={formData.name} onChange={(e) => { setFormData({ ...formData, name: e.target.value }); setErrors({ ...errors, name: '' }); }}
                  className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 ${errors.name ? 'border-red-400' : 'border-gray-300'}`}
                  placeholder="Juan Pérez / Empresa ABC S.A." />
                {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name}</p>}
              </div>

              {/* Contact */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                  <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 ${errors.email ? 'border-red-400' : 'border-gray-300'}`}
                    placeholder="email@ejemplo.com" />
                  {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Teléfono</label>
                  <input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                    placeholder="+56 9 1234 5678" />
                </div>
              </div>

              {/* Primary plate */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Patente Principal</label>
                <input type="text" value={formData.licensePlate} onChange={(e) => { setFormData({ ...formData, licensePlate: e.target.value.toUpperCase() }); setErrors({ ...errors, licensePlate: '' }); }}
                  className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 font-mono uppercase text-center tracking-widest ${errors.licensePlate ? 'border-red-400' : 'border-gray-300'}`}
                  placeholder="ABC123" maxLength={7} />
                {errors.licensePlate && <p className="text-xs text-red-600 mt-1">{errors.licensePlate}</p>}
              </div>

              {/* Additional plates */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Patentes Adicionales (opcional)</label>
                <div className="flex gap-2 mb-2">
                  <input type="text" value={additionalPlateInput} onChange={(e) => setAdditionalPlateInput(e.target.value.toUpperCase())}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddPlate()}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 font-mono uppercase text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="AB123CD" maxLength={7} />
                  <button type="button" onClick={handleAddPlate} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg transition-colors text-sm">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                {errors.additionalPlate && <p className="text-xs text-red-600 mb-1">{errors.additionalPlate}</p>}
                {(formData.additionalPlates || []).length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {(formData.additionalPlates || []).map((plate) => (
                      <div key={plate} className="flex items-center gap-1.5 bg-gray-100 rounded-lg px-2.5 py-1">
                        <span className="font-mono text-sm text-gray-800">{plate}</span>
                        <button onClick={() => handleRemovePlate(plate)} className="text-gray-400 hover:text-red-500 transition-colors">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Type-specific fields */}
              {formData.type === 'monthly' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Fecha de Vencimiento</label>
                  <input type="date" value={formData.expiryDate || ''} onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                    className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 ${errors.expiryDate ? 'border-red-400' : 'border-gray-300'}`} />
                  {errors.expiryDate && <p className="text-xs text-red-600 mt-1">{errors.expiryDate}</p>}
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Porcentaje de Descuento (%)</label>
                  <input type="number" min="1" max="100" value={formData.discount || ''} onChange={(e) => setFormData({ ...formData, discount: parseInt(e.target.value) || 0 })}
                    className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 ${errors.discount ? 'border-red-400' : 'border-gray-300'}`}
                    placeholder="50" />
                  {errors.discount && <p className="text-xs text-red-600 mt-1">{errors.discount}</p>}
                </div>
              )}

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Estado</label>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setFormData({ ...formData, status: 'active' })}
                    className={`flex-1 py-2 rounded-xl border-2 text-sm font-medium transition-all ${formData.status === 'active' ? 'border-green-600 bg-green-50 text-green-700' : 'border-gray-200 text-gray-600'}`}>
                    ✅ Activo
                  </button>
                  <button type="button" onClick={() => setFormData({ ...formData, status: 'inactive' })}
                    className={`flex-1 py-2 rounded-xl border-2 text-sm font-medium transition-all ${formData.status === 'inactive' ? 'border-red-500 bg-red-50 text-red-700' : 'border-gray-200 text-gray-600'}`}>
                    ❌ Inactivo
                  </button>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Notas (opcional)</label>
                <textarea value={formData.notes || ''} onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 resize-none"
                  rows={2} placeholder="Observaciones adicionales..." />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex gap-3">
              <button onClick={() => setShowModal(false)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 rounded-xl font-medium transition-colors">Cancelar</button>
              <button onClick={handleSave} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors">
                <Save className="w-4 h-4" />
                {editingSub ? 'Guardar' : 'Crear Abonado'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Clientes y Abonados</h1>
        <p className="text-gray-500">Gestión de suscriptores mensuales y clientes bonificados</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{subscribers.length}</div>
              <div className="text-xs text-gray-500">Total</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{activeCount}</div>
              <div className="text-xs text-gray-500">Activos</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{monthlyCount}</div>
              <div className="text-xs text-gray-500">Mensuales</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{expiringCount}</div>
              <div className="text-xs text-gray-500">Por vencer</div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters + Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="flex items-center gap-4 p-5 border-b border-gray-200 flex-wrap">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nombre, patente o email..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <select value={filterType} onChange={(e) => setFilterType(e.target.value as 'all' | SubscriberType)}
            className="px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="all">Todos los tipos</option>
            <option value="monthly">Mensual</option>
            <option value="discounted">Bonificado</option>
          </select>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as 'all' | SubscriberStatus)}
            className="px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="all">Todos los estados</option>
            <option value="active">Activos</option>
            <option value="inactive">Inactivos</option>
          </select>
          <button onClick={openAddModal}
            className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-xl font-medium flex items-center gap-2 transition-colors shadow-sm ml-auto">
            <Plus className="w-4 h-4" />
            Nuevo Abonado
          </button>
        </div>

        <div className="divide-y divide-gray-50">
          {filteredSubs.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Star className="w-10 h-10 mx-auto mb-3 text-gray-200" />
              <p className="text-sm">No se encontraron abonados</p>
            </div>
          ) : (
            filteredSubs.map((sub) => {
              const days = daysUntilExpiry(sub);
              const expired = isExpired(sub);
              const expiringSoon = days !== null && days <= 7 && days > 0;

              return (
                <div key={sub.id} className="p-5 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className={`w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-lg ${
                        sub.type === 'monthly' ? 'bg-blue-600' : 'bg-amber-500'
                      }`}>
                        {sub.name.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-gray-900">{sub.name}</span>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                            sub.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {sub.status === 'active' ? '● Activo' : '● Inactivo'}
                          </span>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                            sub.type === 'monthly' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
                          }`}>
                            {sub.type === 'monthly' ? '📅 Mensual' : `⭐ ${sub.discount}% desc.`}
                          </span>
                          {expired && (
                            <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-xs font-medium">⚠️ Vencido</span>
                          )}
                          {expiringSoon && !expired && (
                            <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full text-xs font-medium">⏰ Vence en {days}d</span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {sub.email}
                          </div>
                          {sub.phone && (
                            <div className="flex items-center gap-1">
                              <Phone className="w-3 h-3" />
                              {sub.phone}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2 mt-2">
                          <Car className="w-3.5 h-3.5 text-gray-400" />
                          <div className="flex gap-1.5 flex-wrap">
                            <span className="bg-gray-900 text-white text-xs font-mono px-2 py-0.5 rounded">
                              {sub.licensePlate}
                            </span>
                            {(sub.additionalPlates || []).map((p) => (
                              <span key={p} className="bg-gray-200 text-gray-700 text-xs font-mono px-2 py-0.5 rounded">
                                {p}
                              </span>
                            ))}
                          </div>
                        </div>

                        {sub.type === 'monthly' && sub.expiryDate && (
                          <p className="text-xs text-gray-400 mt-1.5">
                            Vencimiento: {new Date(sub.expiryDate).toLocaleDateString('es-CL')}
                          </p>
                        )}
                        {sub.notes && (
                          <p className="text-xs text-gray-400 mt-1 italic">"{sub.notes}"</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 ml-4">
                      <button onClick={() => openEditModal(sub)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Editar">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => setDeleteConfirm(sub.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Eliminar">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
