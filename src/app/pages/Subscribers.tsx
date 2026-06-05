import React, { useState } from 'react';
import { useParking } from '../contexts/ParkingContext';
import { Subscriber, SubscriberType } from '../types';
import { getEffectiveSubscriberStatus, formatCurrency } from '../data/mockData';
import {
  Star,
  Plus,
  Edit,
  Trash2,
  Search,
  X,
  CheckCircle,
  Save,
  Users,
  Calendar,
  Phone,
  Mail,
  Car,
  AlertCircle,
  AlertTriangle,
  Banknote,
  CreditCard,
  Receipt,
} from 'lucide-react';
import { toast } from 'sonner';

const SUBSCRIPTION_PRICE = 150000;

const emptyForm: Omit<Subscriber, 'id' | 'createdAt'> = {
  name: '',
  email: '',
  phone: '',
  licensePlate: '',
  additionalPlates: [],
  type: 'monthly',
  status: 'active',
  discount: 0,
  notes: '',
};

interface PaymentModalProps {
  subscriber: Subscriber;
  onClose: () => void;
  onPaid: (method: 'cash' | 'card' | 'mixed', split?: { cash: number; card: number }) => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ subscriber, onClose, onPaid }) => {
  const [method, setMethod] = useState<'cash' | 'card' | 'mixed' | null>(null);
  const [cashAmount, setCashAmount] = useState('');
  const [cardAmount, setCardAmount] = useState('');

  const getMixedError = (): string | null => {
    if (method !== 'mixed') return null;
    const cash = parseFloat(cashAmount) || 0;
    const card = parseFloat(cardAmount) || 0;
    if (Math.round(cash + card) !== SUBSCRIPTION_PRICE) {
      const diff = SUBSCRIPTION_PRICE - cash - card;
      return `Faltan ${formatCurrency(diff)} para completar el total`;
    }
    return null;
  };

  const canConfirm = (): boolean => {
    if (!method) return false;
    if (method === 'mixed') return getMixedError() === null && (parseFloat(cashAmount) || 0) >= 0 && (parseFloat(cardAmount) || 0) >= 0;
    return true;
  };

  const handleConfirm = () => {
    if (!method || !canConfirm()) return;
    if (method === 'mixed') {
      onPaid(method, { cash: parseFloat(cashAmount) || 0, card: parseFloat(cardAmount) || 0 });
    } else {
      onPaid(method);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center">
              <Receipt className="w-5 h-5 text-blue-600" />
            </div>
            <h2 className="font-bold text-gray-900">Cobro de Abono Mensual</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Summary */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold">
                {subscriber.name.charAt(0)}
              </div>
              <div>
                <p className="font-semibold text-gray-900">{subscriber.name}</p>
                <p className="text-xs text-gray-500 font-mono">{subscriber.licensePlate}</p>
              </div>
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-blue-200">
              <span className="text-sm text-gray-600">Abono mensual (30 días)</span>
              <span className="text-xl font-bold text-blue-700">{formatCurrency(SUBSCRIPTION_PRICE)}</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Vencimiento: {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('es-CL')}
            </p>
          </div>

          {/* Payment method */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Medio de Pago</label>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => { setMethod('cash'); setCashAmount(''); setCardAmount(''); }}
                className={`p-3 rounded-xl border-2 transition-all text-center ${method === 'cash' ? 'border-green-600 bg-green-50' : 'border-gray-200 hover:border-gray-300'}`}
              >
                <Banknote className={`w-7 h-7 mx-auto mb-1 ${method === 'cash' ? 'text-green-600' : 'text-gray-400'}`} />
                <div className="text-xs font-semibold text-gray-900">Efectivo</div>
              </button>
              <button
                onClick={() => { setMethod('card'); setCashAmount(''); setCardAmount(''); }}
                className={`p-3 rounded-xl border-2 transition-all text-center ${method === 'card' ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}
              >
                <CreditCard className={`w-7 h-7 mx-auto mb-1 ${method === 'card' ? 'text-blue-600' : 'text-gray-400'}`} />
                <div className="text-xs font-semibold text-gray-900">Tarjeta</div>
              </button>
              <button
                onClick={() => { setMethod('mixed'); setCashAmount(''); setCardAmount(''); }}
                className={`p-3 rounded-xl border-2 transition-all text-center ${method === 'mixed' ? 'border-purple-600 bg-purple-50' : 'border-gray-200 hover:border-gray-300'}`}
              >
                <div className="flex justify-center gap-0.5 mb-1">
                  <Banknote className={`w-4 h-4 ${method === 'mixed' ? 'text-purple-600' : 'text-gray-400'}`} />
                  <CreditCard className={`w-4 h-4 ${method === 'mixed' ? 'text-purple-600' : 'text-gray-400'}`} />
                </div>
                <div className="text-xs font-semibold text-gray-900">Combinado</div>
              </button>
            </div>
          </div>

          {/* Mixed inputs */}
          {method === 'mixed' && (
            <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="flex items-center gap-1 text-xs font-medium text-gray-700 mb-1.5">
                    <Banknote className="w-3.5 h-3.5 text-green-600" />Efectivo (ARS)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={cashAmount}
                    onChange={(e) => setCashAmount(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white text-sm"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="flex items-center gap-1 text-xs font-medium text-gray-700 mb-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-blue-600" />Tarjeta (ARS)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={cardAmount}
                    onChange={(e) => setCardAmount(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white text-sm"
                    placeholder="0"
                  />
                </div>
              </div>
              {(parseFloat(cashAmount) || 0) + (parseFloat(cardAmount) || 0) > 0 && (
                <div className={`flex items-center gap-2 text-xs p-2 rounded-lg ${getMixedError() ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                  {getMixedError() ? (
                    <><AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />{getMixedError()}</>
                  ) : (
                    <><CheckCircle className="w-3.5 h-3.5 flex-shrink-0" />Suma correcta</>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl font-medium">Cancelar</button>
            <button
              onClick={handleConfirm}
              disabled={!canConfirm()}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2"
            >
              <Receipt className="w-4 h-4" />
              Confirmar Pago
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Subscription receipt after payment
interface SubscriptionReceiptProps {
  subscriber: Subscriber;
  method: 'cash' | 'card' | 'mixed';
  split?: { cash: number; card: number };
  expiryDate: string;
  onClose: () => void;
}

const SubscriptionReceipt: React.FC<SubscriptionReceiptProps> = ({ subscriber, method, split, expiryDate, onClose }) => {
  const ticketNumber = `ABN-${Date.now().toString().slice(-8)}`;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
        <div className="bg-blue-600 px-6 py-5 text-white text-center">
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2">
            <CheckCircle className="w-7 h-7" />
          </div>
          <h2 className="font-bold text-lg">Abono Registrado</h2>
          <p className="text-blue-100 text-sm">Pago recibido — {ticketNumber}</p>
        </div>

        <div className="p-6 space-y-4">
          <div className="text-center bg-gray-50 rounded-xl p-4 border border-gray-200">
            <div className="text-2xl font-bold font-mono text-gray-900">{subscriber.licensePlate}</div>
            <p className="text-sm text-gray-600 mt-1">{subscriber.name}</p>
          </div>

          <div className="space-y-2.5 text-sm">
            <div className="flex justify-between py-1.5 border-b border-gray-100">
              <span className="text-gray-500">Monto pagado</span>
              <span className="font-bold text-blue-600">{formatCurrency(SUBSCRIPTION_PRICE)}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-gray-100">
              <span className="text-gray-500">Medio de pago</span>
              <span className="font-medium text-gray-900">
                {method === 'cash' ? 'Efectivo' : method === 'card' ? 'Tarjeta' : 'Combinado'}
              </span>
            </div>
            {method === 'mixed' && split && (
              <>
                <div className="flex justify-between text-xs text-gray-400 py-1">
                  <span>· Efectivo</span><span>{formatCurrency(split.cash)}</span>
                </div>
                <div className="flex justify-between text-xs text-gray-400 py-1 border-b border-gray-100">
                  <span>· Tarjeta</span><span>{formatCurrency(split.card)}</span>
                </div>
              </>
            )}
            <div className="flex justify-between py-1.5 border-b border-gray-100">
              <span className="text-gray-500">Vigencia hasta</span>
              <span className="font-medium text-green-700">{new Date(expiryDate).toLocaleDateString('es-CL')}</span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-medium transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export const Subscribers: React.FC = () => {
  const { subscribers, addSubscriber, updateSubscriber, deleteSubscriber, hasActiveSubscription } = useParking();
  const [showModal, setShowModal] = useState(false);
  const [editingSub, setEditingSub] = useState<Subscriber | null>(null);
  const [formData, setFormData] = useState<typeof emptyForm>(emptyForm);
  const [additionalPlateInput, setAdditionalPlateInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | SubscriberType>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'expired' | 'inactive'>('all');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [payingSubscriber, setPayingSubscriber] = useState<Subscriber | null>(null);
  const [receiptData, setReceiptData] = useState<{
    subscriber: Subscriber;
    method: 'cash' | 'card' | 'mixed';
    split?: { cash: number; card: number };
    expiryDate: string;
  } | null>(null);

  const PLATE_RE = /^([A-Z]{3}\d{3}|[A-Z]{2}\d{3}[A-Z]{2})$/;

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!formData.name.trim()) e.name = 'El nombre es requerido';
    if (!formData.email.trim()) e.email = 'El correo es requerido';

    const plate = formData.licensePlate.toUpperCase();
    if (!plate) {
      e.licensePlate = 'La patente es requerida';
    } else if (!PLATE_RE.test(plate)) {
      e.licensePlate = 'Formato inválido (ABC123 o AB123CD)';
    } else if (formData.type === 'monthly') {
      const alreadyActive = hasActiveSubscription(plate, editingSub?.id);
      if (alreadyActive) {
        e.licensePlate = 'Esta patente ya tiene un abono mensual ACTIVO. Solo se puede crear uno nuevo cuando el anterior esté vencido.';
      }
    }

    if (formData.type === 'discounted' && (!formData.discount || formData.discount <= 0)) {
      e.discount = 'El descuento debe ser mayor a 0';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const openAddModal = () => {
    setEditingSub(null);
    setFormData({ ...emptyForm });
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
      // For monthly, auto-calculate 30 days from now; for edit, keep existing expiry or extend
      expiryDate: formData.type === 'monthly'
        ? (editingSub?.expiryDate && new Date(editingSub.expiryDate) > new Date()
          ? editingSub.expiryDate  // keep existing if not expired
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString())
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
    if (!PLATE_RE.test(plate)) {
      setErrors({ ...errors, additionalPlate: 'Formato inválido' });
      return;
    }
    setFormData({ ...formData, additionalPlates: [...(formData.additionalPlates || []), plate] });
    setAdditionalPlateInput('');
    const { additionalPlate: _, ...rest } = errors;
    setErrors(rest);
  };

  const handleRemovePlate = (plate: string) => {
    setFormData({
      ...formData,
      additionalPlates: (formData.additionalPlates || []).filter((p) => p !== plate),
    });
  };

  const handlePaySubscription = (
    subscriber: Subscriber,
    method: 'cash' | 'card' | 'mixed',
    split?: { cash: number; card: number }
  ) => {
    const newExpiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    updateSubscriber({
      ...subscriber,
      status: 'active',
      expiryDate: newExpiry,
    });
    setReceiptData({ subscriber, method, split, expiryDate: newExpiry });
    setPayingSubscriber(null);
    toast.success(`Abono de ${subscriber.name} renovado por 30 días`);
  };

  const daysUntilExpiry = (sub: Subscriber) => {
    if (!sub.expiryDate) return null;
    return Math.ceil((new Date(sub.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  };

  const filteredSubs = subscribers.filter((s) => {
    const matchSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.licensePlate.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchType = filterType === 'all' || s.type === filterType;
    const effStatus = getEffectiveSubscriberStatus(s);
    const matchStatus =
      filterStatus === 'all' ||
      (filterStatus === 'active' && effStatus === 'active') ||
      (filterStatus === 'expired' && effStatus === 'expired') ||
      (filterStatus === 'inactive' && effStatus === 'inactive');
    return matchSearch && matchType && matchStatus;
  });

  const activeCount = subscribers.filter((s) => getEffectiveSubscriberStatus(s) === 'active').length;
  const expiredCount = subscribers.filter((s) => getEffectiveSubscriberStatus(s) === 'expired').length;
  const expiringSoon = subscribers.filter((s) => {
    const days = daysUntilExpiry(s);
    return days !== null && days <= 7 && days > 0 && getEffectiveSubscriberStatus(s) === 'active';
  }).length;

  return (
    <div className="max-w-7xl mx-auto">
      {savedSuccess && (
        <div className="fixed top-20 right-6 z-50 bg-green-600 text-white px-5 py-3 rounded-xl shadow-lg flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />
          <span className="font-medium">Abonado guardado exitosamente</span>
        </div>
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4 text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="font-bold text-gray-900 mb-2">¿Eliminar Abonado?</h3>
            <p className="text-sm text-gray-500 mb-5">Esta acción no se puede deshacer.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 rounded-xl font-medium">Cancelar</button>
              <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-xl font-medium">Eliminar</button>
            </div>
          </div>
        </div>
      )}

      {/* Subscription Payment Modal */}
      {payingSubscriber && (
        <PaymentModal
          subscriber={payingSubscriber}
          onClose={() => setPayingSubscriber(null)}
          onPaid={(method, split) => handlePaySubscription(payingSubscriber, method, split)}
        />
      )}

      {/* Subscription Receipt */}
      {receiptData && (
        <SubscriptionReceipt
          subscriber={receiptData.subscriber}
          method={receiptData.method}
          split={receiptData.split}
          expiryDate={receiptData.expiryDate}
          onClose={() => setReceiptData(null)}
        />
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="font-bold text-gray-900">{editingSub ? 'Editar Abonado' : 'Nuevo Abonado'}</h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Abono</label>
                <div className="grid grid-cols-2 gap-3">
                  <button type="button" onClick={() => setFormData({ ...formData, type: 'monthly' })}
                    className={`p-3 rounded-xl border-2 text-center transition-all ${formData.type === 'monthly' ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}>
                    <Calendar className={`w-6 h-6 mx-auto mb-1 ${formData.type === 'monthly' ? 'text-blue-600' : 'text-gray-400'}`} />
                    <div className="text-sm font-medium text-gray-900">Mensual</div>
                    <div className="text-xs text-gray-500">{formatCurrency(SUBSCRIPTION_PRICE)}/mes</div>
                  </button>
                  <button type="button" onClick={() => setFormData({ ...formData, type: 'discounted' })}
                    className={`p-3 rounded-xl border-2 text-center transition-all ${formData.type === 'discounted' ? 'border-amber-500 bg-amber-50' : 'border-gray-200 hover:border-gray-300'}`}>
                    <Star className={`w-6 h-6 mx-auto mb-1 ${formData.type === 'discounted' ? 'text-amber-500 fill-amber-400' : 'text-gray-400'}`} />
                    <div className="text-sm font-medium text-gray-900">Bonificado</div>
                    <div className="text-xs text-gray-500">Descuento especial</div>
                  </button>
                </div>
              </div>

              {/* Monthly info banner */}
              {formData.type === 'monthly' && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2">
                  <Calendar className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-medium text-blue-800">Duración automática: 30 días</p>
                    <p className="text-xs text-blue-600 mt-0.5">
                      El abono vence el {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('es-CL')}
                      {' '}· Precio: {formatCurrency(SUBSCRIPTION_PRICE)}
                    </p>
                  </div>
                </div>
              )}

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nombre / Empresa</label>
                <input type="text" value={formData.name}
                  onChange={(e) => { setFormData({ ...formData, name: e.target.value }); const { name: _, ...r } = errors; setErrors(r); }}
                  className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 ${errors.name ? 'border-red-400' : 'border-gray-300'}`}
                  placeholder="Juan Pérez / Empresa ABC S.A." />
                {errors.name && <p className="text-xs text-red-600 mt-1">{errors.name}</p>}
              </div>

              {/* Contact */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                  <input type="email" value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 ${errors.email ? 'border-red-400' : 'border-gray-300'}`}
                    placeholder="email@ejemplo.com" />
                  {errors.email && <p className="text-xs text-red-600 mt-1">{errors.email}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Teléfono</label>
                  <input type="tel" value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                    placeholder="+54 9 11 1234 5678" />
                </div>
              </div>

              {/* Primary plate */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Patente Principal</label>
                <input type="text" value={formData.licensePlate}
                  onChange={(e) => { setFormData({ ...formData, licensePlate: e.target.value.toUpperCase() }); const { licensePlate: _, ...r } = errors; setErrors(r); }}
                  className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 font-mono uppercase text-center tracking-widest ${errors.licensePlate ? 'border-red-400' : 'border-gray-300'}`}
                  placeholder="ABC123" maxLength={7} />
                {errors.licensePlate && (
                  <div className="flex items-start gap-1.5 mt-1">
                    <AlertCircle className="w-3.5 h-3.5 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-red-600">{errors.licensePlate}</p>
                  </div>
                )}
              </div>

              {/* Additional plates */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Patentes Adicionales (opcional)</label>
                <div className="flex gap-2 mb-2">
                  <input type="text" value={additionalPlateInput}
                    onChange={(e) => setAdditionalPlateInput(e.target.value.toUpperCase())}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddPlate()}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 font-mono uppercase text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="AB123CD" maxLength={7} />
                  <button type="button" onClick={handleAddPlate} className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg">
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                {errors.additionalPlate && <p className="text-xs text-red-600 mb-1">{errors.additionalPlate}</p>}
                {(formData.additionalPlates || []).length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {(formData.additionalPlates || []).map((plate) => (
                      <div key={plate} className="flex items-center gap-1.5 bg-gray-100 rounded-lg px-2.5 py-1">
                        <span className="font-mono text-sm text-gray-800">{plate}</span>
                        <button onClick={() => handleRemovePlate(plate)} className="text-gray-400 hover:text-red-500">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Discount (only for discounted type) */}
              {formData.type === 'discounted' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Porcentaje de Descuento (%)</label>
                  <input type="number" min="1" max="100" value={formData.discount || ''}
                    onChange={(e) => setFormData({ ...formData, discount: parseInt(e.target.value) || 0 })}
                    className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 ${errors.discount ? 'border-red-400' : 'border-gray-300'}`}
                    placeholder="50" />
                  {errors.discount && <p className="text-xs text-red-600 mt-1">{errors.discount}</p>}
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Notas (opcional)</label>
                <textarea value={formData.notes || ''} onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 resize-none"
                  rows={2} placeholder="Observaciones adicionales..." />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex gap-3">
              <button onClick={() => setShowModal(false)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 rounded-xl font-medium">Cancelar</button>
              <button onClick={handleSave} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl font-medium flex items-center justify-center gap-2">
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
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{expiredCount}</div>
              <div className="text-xs text-gray-500">Vencidos</div>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900">{expiringSoon}</div>
              <div className="text-xs text-gray-500">Por vencer (7d)</div>
            </div>
          </div>
        </div>
      </div>

      {/* Expired warning */}
      {expiredCount > 0 && (
        <div className="mb-5 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-800">
              {expiredCount} abono{expiredCount > 1 ? 's' : ''} vencido{expiredCount > 1 ? 's' : ''}
            </p>
            <p className="text-xs text-red-700 mt-0.5">
              Los vehículos con abono VENCIDO serán cobrados a tarifa normal. Use "Pagar Abono" para renovar.
            </p>
          </div>
        </div>
      )}

         {/* Filters + Table */}
       <div className="bg-white rounded-xl shadow-sm border border-gray-200">
         <div className="flex items-center gap-4 p-5 border-b border-gray-200 flex-wrap">
           <div className="relative flex-1 min-w-48">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
             <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
               placeholder="Buscar por nombre, patente o email..."
               className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
           </div>
           <select value={filterType} onChange={(e) => setFilterType(e.target.value as any)}
             className="px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
             <option value="all">Todos los tipos</option>
             <option value="monthly">Mensual</option>
             <option value="discounted">Bonificado</option>
           </select>
           <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as any)}
             className="px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
             <option value="all">Todos los estados</option>
             <option value="active">Activos</option>
             <option value="expired">Vencidos</option>
             <option value="inactive">Inactivos</option>
           </select>
           <button onClick={openAddModal}
             className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-xl font-medium flex items-center gap-2 transition-colors shadow-sm ml-auto">
             <Plus className="w-4 h-4" />
             Nuevo Abonado
           </button>
         </div>

         {filteredSubs.length === 0 ? (
           <div className="text-center py-12 text-gray-400">
             <Star className="w-10 h-10 mx-auto mb-3 text-gray-200" />
             <p className="text-sm">No se encontraron abonados</p>
           </div>
         ) : (
           <div className="space-y-6 p-5">
             {/* Active Subscribers Section */}
             {(() => {
               const activeSubs = filteredSubs.filter((s) => getEffectiveSubscriberStatus(s) === 'active');
               return activeSubs.length > 0 ? (
                 <div>
                   <div className="flex items-center gap-2 mb-4">
                     <CheckCircle className="w-5 h-5 text-green-600" />
                     <h3 className="font-semibold text-gray-900">Abonados Activos ({activeSubs.length})</h3>
                   </div>
                   <div className="space-y-3 border-l-4 border-green-200 pl-5">
                     {activeSubs.map((sub) => {
                       const days = daysUntilExpiry(sub);
                       const isExpiringSoon = days !== null && days <= 7 && days > 0;

                       return (
                         <div key={sub.id} className="p-4 bg-green-50 border border-green-100 rounded-lg hover:bg-green-100 transition-colors">
                           <div className="flex items-start justify-between">
                             <div className="flex items-start gap-4 flex-1 min-w-0">
                               <div className={`w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0 ${
                                 sub.type === 'monthly' ? 'bg-blue-600' : 'bg-amber-500'
                               }`}>
                                 {sub.name.charAt(0)}
                               </div>
                               <div className="min-w-0">
                                 <div className="flex items-center gap-2 flex-wrap">
                                   <span className="font-semibold text-gray-900">{sub.name}</span>
                                   <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">✓ ACTIVO</span>

                                   <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                                     sub.type === 'monthly' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
                                   }`}>
                                     {sub.type === 'monthly' ? '📅 Mensual' : `⭐ ${sub.discount}% desc.`}
                                   </span>

                                   {isExpiringSoon && (
                                     <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full text-xs font-medium">
                                       ⏰ Vence en {days}d
                                     </span>
                                   )}
                                 </div>

                                 <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-gray-500">
                                   <div className="flex items-center gap-1"><Mail className="w-3 h-3" />{sub.email}</div>
                                   {sub.phone && <div className="flex items-center gap-1"><Phone className="w-3 h-3" />{sub.phone}</div>}
                                 </div>

                                 <div className="flex items-center gap-2 mt-2">
                                   <Car className="w-3.5 h-3.5 text-gray-400" />
                                   <div className="flex gap-1.5 flex-wrap">
                                     <span className="bg-gray-900 text-white text-xs font-mono px-2 py-0.5 rounded">{sub.licensePlate}</span>
                                     {(sub.additionalPlates || []).map((p) => (
                                       <span key={p} className="bg-gray-200 text-gray-700 text-xs font-mono px-2 py-0.5 rounded">{p}</span>
                                     ))}
                                   </div>
                                 </div>

                                 {sub.type === 'monthly' && sub.expiryDate && (
                                   <p className="text-xs mt-1.5 text-gray-400">
                                     Vencimiento: {new Date(sub.expiryDate).toLocaleDateString('es-CL')}
                                   </p>
                                 )}
                                 {sub.notes && <p className="text-xs text-gray-400 mt-1 italic">"{sub.notes}"</p>}
                               </div>
                             </div>

                             <div className="flex items-center gap-1 ml-4 flex-shrink-0">
                               {sub.type === 'monthly' && (
                                 <button
                                   onClick={() => setPayingSubscriber(sub)}
                                   className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium transition-colors bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200"
                                   title="Cobrar abono"
                                 >
                                   <Receipt className="w-3.5 h-3.5" />
                                   Pagar Abono
                                 </button>
                               )}
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
                     })}
                   </div>
                 </div>
               ) : null;
             })()}

             {/* Expired Subscribers Section */}
             {(() => {
               const expiredSubs = filteredSubs.filter((s) => getEffectiveSubscriberStatus(s) === 'expired');
               return expiredSubs.length > 0 ? (
                 <div>
                   <div className="flex items-center gap-2 mb-4">
                     <AlertTriangle className="w-5 h-5 text-red-600" />
                     <h3 className="font-semibold text-gray-900">Abonados Vencidos ({expiredSubs.length})</h3>
                   </div>
                   <div className="space-y-3 border-l-4 border-red-200 pl-5">
                     {expiredSubs.map((sub) => {
                       return (
                         <div key={sub.id} className="p-4 bg-red-50 border border-red-100 rounded-lg hover:bg-red-100 transition-colors">
                           <div className="flex items-start justify-between">
                             <div className="flex items-start gap-4 flex-1 min-w-0">
                               <div className={`w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0 ${
                                 sub.type === 'monthly' ? 'bg-red-600' : 'bg-orange-500'
                               }`}>
                                 {sub.name.charAt(0)}
                               </div>
                               <div className="min-w-0">
                                 <div className="flex items-center gap-2 flex-wrap">
                                   <span className="font-semibold text-gray-900">{sub.name}</span>
                                   <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">⚠ VENCIDO</span>

                                   <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                                     sub.type === 'monthly' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                                   }`}>
                                     {sub.type === 'monthly' ? '📅 Mensual' : `⭐ ${sub.discount}% desc.`}
                                   </span>
                                 </div>

                                 <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-gray-500">
                                   <div className="flex items-center gap-1"><Mail className="w-3 h-3" />{sub.email}</div>
                                   {sub.phone && <div className="flex items-center gap-1"><Phone className="w-3 h-3" />{sub.phone}</div>}
                                 </div>

                                 <div className="flex items-center gap-2 mt-2">
                                   <Car className="w-3.5 h-3.5 text-gray-400" />
                                   <div className="flex gap-1.5 flex-wrap">
                                     <span className="bg-gray-900 text-white text-xs font-mono px-2 py-0.5 rounded">{sub.licensePlate}</span>
                                     {(sub.additionalPlates || []).map((p) => (
                                       <span key={p} className="bg-gray-200 text-gray-700 text-xs font-mono px-2 py-0.5 rounded">{p}</span>
                                     ))}
                                   </div>
                                 </div>

                                 {sub.type === 'monthly' && sub.expiryDate && (
                                   <p className="text-xs mt-1.5 text-red-600 font-medium">
                                     ⚠ Venció el {new Date(sub.expiryDate).toLocaleDateString('es-CL')} — Se aplica tarifa normal
                                   </p>
                                 )}
                                 {sub.notes && <p className="text-xs text-gray-400 mt-1 italic">"{sub.notes}"</p>}
                               </div>
                             </div>

                             <div className="flex items-center gap-1 ml-4 flex-shrink-0">
                               {sub.type === 'monthly' && (
                                 <button
                                   onClick={() => setPayingSubscriber(sub)}
                                   className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium transition-colors bg-green-50 text-green-700 hover:bg-green-100 border border-green-200"
                                   title="Cobrar abono para renovar"
                                 >
                                   <Receipt className="w-3.5 h-3.5" />
                                   Renovar
                                 </button>
                               )}
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
                     })}
                   </div>
                 </div>
               ) : null;
             })()}

             {/* Inactive Subscribers Section */}
             {(() => {
               const inactiveSubs = filteredSubs.filter((s) => getEffectiveSubscriberStatus(s) === 'inactive');
               return inactiveSubs.length > 0 ? (
                 <div>
                   <div className="flex items-center gap-2 mb-4">
                     <AlertCircle className="w-5 h-5 text-gray-400" />
                     <h3 className="font-semibold text-gray-900">Abonados Inactivos ({inactiveSubs.length})</h3>
                   </div>
                   <div className="space-y-3 border-l-4 border-gray-200 pl-5">
                     {inactiveSubs.map((sub) => {
                       return (
                         <div key={sub.id} className="p-4 bg-gray-50 border border-gray-100 rounded-lg hover:bg-gray-100 transition-colors">
                           <div className="flex items-start justify-between">
                             <div className="flex items-start gap-4 flex-1 min-w-0">
                               <div className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0 bg-gray-400">
                                 {sub.name.charAt(0)}
                               </div>
                               <div className="min-w-0">
                                 <div className="flex items-center gap-2 flex-wrap">
                                   <span className="font-semibold text-gray-900">{sub.name}</span>
                                   <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">● INACTIVO</span>

                                   <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                                     sub.type === 'monthly' ? 'bg-gray-100 text-gray-700' : 'bg-gray-100 text-gray-700'
                                   }`}>
                                     {sub.type === 'monthly' ? '📅 Mensual' : `⭐ ${sub.discount}% desc.`}
                                   </span>
                                 </div>

                                 <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-gray-500">
                                   <div className="flex items-center gap-1"><Mail className="w-3 h-3" />{sub.email}</div>
                                   {sub.phone && <div className="flex items-center gap-1"><Phone className="w-3 h-3" />{sub.phone}</div>}
                                 </div>

                                 <div className="flex items-center gap-2 mt-2">
                                   <Car className="w-3.5 h-3.5 text-gray-400" />
                                   <div className="flex gap-1.5 flex-wrap">
                                     <span className="bg-gray-900 text-white text-xs font-mono px-2 py-0.5 rounded">{sub.licensePlate}</span>
                                     {(sub.additionalPlates || []).map((p) => (
                                       <span key={p} className="bg-gray-200 text-gray-700 text-xs font-mono px-2 py-0.5 rounded">{p}</span>
                                     ))}
                                   </div>
                                 </div>

                                 {sub.notes && <p className="text-xs text-gray-400 mt-1 italic">"{sub.notes}"</p>}
                               </div>
                             </div>

                             <div className="flex items-center gap-1 ml-4 flex-shrink-0">
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
                     })}
                   </div>
                 </div>
               ) : null;
             })()}
           </div>
         )}
       </div>
    </div>
  );
};
