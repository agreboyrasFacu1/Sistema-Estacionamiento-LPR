import React, { useState } from 'react';
import { useParking } from '../contexts/ParkingContext';
import { useAuth } from '../contexts/AuthContext';
import { PaymentBreakdownItem, PaymentMethod, Subscriber, SubscriberType, SubscriberValidity, VehicleCategory } from '../types';
import {
  canRenewMonthlySubscriber,
  findActiveSubscriberPlateConflict,
  getEffectiveSubscriberStatus,
  getDaysUntilMonthlyExpiry,
  MONTHLY_SUBSCRIPTION_AMOUNT_ARS,
  MONTHLY_RENEWAL_WINDOW_DAYS,
} from '../domain/subscribers';
import { formatCurrencyARSWithCents } from '../utils/currency';
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
  AlertTriangle,
  Banknote,
  CreditCard,
  Receipt,
  TrendingUp,
} from 'lucide-react';

const emptyForm: Omit<Subscriber, 'id' | 'createdAt'> = {
  name: '',
  email: '',
  phone: '',
  licensePlate: '',
  additionalPlates: [],
  category: 'auto',
  type: 'monthly',
  status: 'active',
  discount: 0,
  notes: '',
};

const CATEGORIES: { value: VehicleCategory; label: string }[] = [
  { value: 'auto', label: 'Auto' },
  { value: 'camioneta', label: 'Camioneta' },
  { value: 'moto', label: 'Moto' },
];

export const Subscribers: React.FC = () => {
  const {
    subscribers,
    addSubscriber,
    updateSubscriber,
    deleteSubscriber,
    renewSubscriberSubscription,
    subscriberPricingRules,
  } = useParking();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [showModal, setShowModal] = useState(false);
  const [editingSub, setEditingSub] = useState<Subscriber | null>(null);
  const [formData, setFormData] = useState<typeof emptyForm>(emptyForm);
  const [additionalPlateInput, setAdditionalPlateInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | SubscriberType>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | SubscriberValidity>('all');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [payingSubscriber, setPayingSubscriber] = useState<Subscriber | null>(null);
  const [renewalMethod, setRenewalMethod] = useState<PaymentMethod | null>(null);
  const [renewalCashAmount, setRenewalCashAmount] = useState('');
  const [renewalCardAmount, setRenewalCardAmount] = useState('');
  const [registrationMethod, setRegistrationMethod] = useState<PaymentMethod | null>(null);
  const [registrationCashAmount, setRegistrationCashAmount] = useState('');
  const [registrationCardAmount, setRegistrationCardAmount] = useState('');
  const [renewalReceipt, setRenewalReceipt] = useState<{
    subscriber: Subscriber;
    ticketNumber: string;
    validUntil: string;
    amount: number;
    paymentMethod: PaymentMethod;
    paymentBreakdown?: PaymentBreakdownItem[];
  } | null>(null);
  const canEditAdminFields = isAdmin || !editingSub;

  const buildSubscriberCandidate = (): Subscriber => ({
    ...formData,
    id: editingSub?.id || '__new__',
    createdAt: editingSub?.createdAt || new Date().toISOString(),
    licensePlate: formData.licensePlate.toUpperCase(),
    additionalPlates: (formData.additionalPlates || []).map((p) => p.toUpperCase()),
    expiryDate: formData.type === 'monthly'
      ? new Date().toISOString()
      : undefined,
  });

  const getMonthlyPrice = (category: VehicleCategory = formData.category || 'auto'): number =>
    subscriberPricingRules.find((rule) => rule.category === category)?.monthlyPrice ||
    subscriberPricingRules[0]?.monthlyPrice ||
    MONTHLY_SUBSCRIPTION_AMOUNT_ARS;

  const getRegistrationBreakdown = (): PaymentBreakdownItem[] => [
    { method: 'cash', amount: Number(registrationCashAmount) || 0 },
    { method: 'card', amount: Number(registrationCardAmount) || 0 },
  ];

  const getRegistrationMixedError = (): string | null => {
    if (registrationMethod !== 'mixed' || formData.type !== 'monthly') return null;
    const breakdown = getRegistrationBreakdown();
    if (breakdown.some((item) => item.amount < 0)) {
      return 'Los montos no pueden ser negativos';
    }
    const total = breakdown.reduce((sum, item) => sum + item.amount, 0);
    const expectedAmount = getMonthlyPrice();
    if (total !== expectedAmount) {
      return `La suma debe coincidir con ${formatCurrencyARSWithCents(expectedAmount)}`;
    }
    return null;
  };

  const canChargeRegistration = (): boolean => {
    if (editingSub || formData.type !== 'monthly') return true;
    if (!registrationMethod) return false;
    if (registrationMethod !== 'mixed') return true;
    return getRegistrationMixedError() === null;
  };

  const validate = (): boolean => {
    const e: Record<string, string | undefined> = {};
    if (!formData.name.trim()) e.name = 'El nombre es requerido';
    if (!formData.email.trim()) e.email = 'El correo es requerido';
    if (!formData.licensePlate.trim()) e.licensePlate = 'La patente es requerida';
    else if (!/^([A-Z]{3}\d{3}|[A-Z]{2}\d{3}[A-Z]{2})$/.test(formData.licensePlate.toUpperCase())) {
      e.licensePlate = 'Formato inválido (ABC123 o AB123CD)';
    }
    if (formData.type === 'discounted' && (!formData.discount || formData.discount <= 0)) {
      e.discount = 'El descuento debe ser mayor a 0';
    }
    if (!canChargeRegistration()) {
      e.payment = registrationMethod === 'mixed'
        ? getRegistrationMixedError() || 'Revise el pago mixto'
        : 'El alta mensual requiere cobrar un medio de pago';
    }
    if (!e.licensePlate) {
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
    setFormData({ ...emptyForm });
    setAdditionalPlateInput('');
    setRegistrationMethod(null);
    setRegistrationCashAmount('');
    setRegistrationCardAmount('');
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
      category: sub.category || 'auto',
      type: sub.type,
      status: sub.status,
      expiryDate: sub.expiryDate ? sub.expiryDate.split('T')[0] : '',
      discount: sub.discount || 0,
      notes: sub.notes || '',
    });
    setAdditionalPlateInput('');
    setRegistrationMethod(null);
    setRegistrationCashAmount('');
    setRegistrationCardAmount('');
    setErrors({});
    setShowModal(true);
  };

  const handleSave = () => {
    if (!validate()) return;
    const basePayload = {
      ...formData,
      licensePlate: formData.licensePlate.toUpperCase(),
      additionalPlates: (formData.additionalPlates || []).map((p) => p.toUpperCase()),
      category: formData.type === 'monthly' ? formData.category || 'auto' : formData.category,
      expiryDate: formData.type === 'monthly' && editingSub?.expiryDate
        ? editingSub.expiryDate
        : undefined,
    };
    const payload =
      editingSub && !isAdmin
        ? {
            ...basePayload,
            type: editingSub.type,
            status: editingSub.status,
            category: editingSub.category,
            discount: editingSub.discount,
            amount: editingSub.amount,
            expiryDate: editingSub.expiryDate,
          }
        : basePayload;
    if (editingSub) {
      updateSubscriber({ ...payload, id: editingSub.id, createdAt: editingSub.createdAt });
    } else {
      const result = addSubscriber(
        payload,
        payload.type === 'monthly' && registrationMethod
          ? {
              paymentMethod: registrationMethod,
              paymentBreakdown:
                registrationMethod === 'mixed' ? getRegistrationBreakdown() : undefined,
            }
          : undefined
      );
      if (result.ticket) {
        setRenewalReceipt({
          subscriber: result.subscriber,
          ticketNumber: result.ticket.ticketNumber,
          validUntil: result.subscriber.expiryDate || result.ticket.validUntil || '',
          amount: result.ticket.amount,
          paymentMethod: result.ticket.paymentMethod,
          paymentBreakdown: result.ticket.paymentBreakdown,
        });
      }
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
    return getEffectiveSubscriberStatus(sub) === 'expired';
  };

  const getRenewalBreakdown = (): PaymentBreakdownItem[] => [
    { method: 'cash', amount: Number(renewalCashAmount) || 0 },
    { method: 'card', amount: Number(renewalCardAmount) || 0 },
  ];

  const getRenewalMixedError = (): string | null => {
    if (renewalMethod !== 'mixed' || !payingSubscriber) return null;
    const breakdown = getRenewalBreakdown();
    if (breakdown.some((item) => item.amount < 0)) {
      return 'Los montos no pueden ser negativos';
    }
    const total = breakdown.reduce((sum, item) => sum + item.amount, 0);
    const expectedAmount = getMonthlyPrice(payingSubscriber.category || 'auto');
    if (total !== expectedAmount) {
      return `La suma debe coincidir con ${formatCurrencyARSWithCents(expectedAmount)}`;
    }
    return null;
  };

  const canConfirmRenewal = (): boolean => {
    if (!renewalMethod) return false;
    if (renewalMethod !== 'mixed') return true;
    return getRenewalMixedError() === null;
  };

  const openRenewalModal = (subscriber: Subscriber) => {
    if (!canRenewMonthlySubscriber(subscriber)) return;
    setPayingSubscriber(subscriber);
    setRenewalMethod(null);
    setRenewalCashAmount('');
    setRenewalCardAmount('');
  };

  const handleConfirmRenewal = async () => {
    if (!payingSubscriber || !renewalMethod) return;
    const paymentBreakdown =
      renewalMethod === 'mixed' ? getRenewalBreakdown() : undefined;
    try {
      const result = await renewSubscriberSubscription(
        payingSubscriber.id,
        renewalMethod,
        paymentBreakdown
      );
      setRenewalReceipt({
        subscriber: result.subscriber,
        ticketNumber: result.ticket.ticketNumber,
        validUntil: result.subscriber.expiryDate || result.ticket.validUntil || '',
        amount: result.ticket.amount,
        paymentMethod: result.ticket.paymentMethod,
        paymentBreakdown: result.ticket.paymentBreakdown,
      });
      setPayingSubscriber(null);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch (error) {
      setErrors({
        ...errors,
        renewal: error instanceof Error ? error.message : 'No se pudo renovar el abono',
      });
    }
  };

  const daysUntilExpiry = (sub: Subscriber) => {
    return getDaysUntilMonthlyExpiry(sub);
  };

  const filteredSubs = subscribers.filter((s) => {
    const matchSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.licensePlate.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchType = filterType === 'all' || s.type === filterType;
    const matchStatus =
      filterStatus === 'all' || getEffectiveSubscriberStatus(s) === filterStatus;
    return matchSearch && matchType && matchStatus;
  });

  const activeCount = subscribers.filter((s) => getEffectiveSubscriberStatus(s) === 'active').length;
  const monthlyCount = subscribers.filter((s) => s.type === 'monthly').length;
  const expiringCount = subscribers.filter((s) => {
    const days = daysUntilExpiry(s);
    return days !== null && days <= 7 && days > 0 && getEffectiveSubscriberStatus(s) === 'active';
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

      {payingSubscriber && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Receipt className="w-5 h-5 text-blue-600" />
                </div>
                <h2 className="font-bold text-gray-900">Renovar Abono Mensual</h2>
              </div>
              <button onClick={() => setPayingSubscriber(null)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
               <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                 <p className="font-semibold text-gray-900">{payingSubscriber.name}</p>
                 <p className="text-xs text-gray-500 font-mono">{payingSubscriber.licensePlate}</p>
                 <div className="flex items-center justify-between pt-3 mt-3 border-t border-blue-200">
                   <span className="text-sm text-gray-600">Abono mensual</span>
                   <span className="text-xl font-bold text-blue-700">
                     {formatCurrencyARSWithCents(getMonthlyPrice(payingSubscriber.category || 'auto'))}
                   </span>
                 </div>
                 <p className="text-xs text-gray-500 mt-1">
                  Ticket interno no fiscal. La vigencia se extiende un mes calendario.
                 </p>
               </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Medio de pago</label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => {
                      setRenewalMethod('cash');
                      setRenewalCashAmount('');
                      setRenewalCardAmount('');
                    }}
                    className={`p-3 rounded-xl border-2 transition-all text-center ${renewalMethod === 'cash' ? 'border-green-600 bg-green-50' : 'border-gray-200 hover:border-gray-300'}`}
                  >
                    <Banknote className={`w-7 h-7 mx-auto mb-1 ${renewalMethod === 'cash' ? 'text-green-600' : 'text-gray-400'}`} />
                    <div className="text-xs font-semibold text-gray-900">Efectivo</div>
                  </button>
                  <button
                    onClick={() => {
                      setRenewalMethod('card');
                      setRenewalCashAmount('');
                      setRenewalCardAmount('');
                    }}
                    className={`p-3 rounded-xl border-2 transition-all text-center ${renewalMethod === 'card' ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}
                  >
                    <CreditCard className={`w-7 h-7 mx-auto mb-1 ${renewalMethod === 'card' ? 'text-blue-600' : 'text-gray-400'}`} />
                    <div className="text-xs font-semibold text-gray-900">Tarjeta</div>
                  </button>
                  <button
                    onClick={() => setRenewalMethod('mixed')}
                    className={`p-3 rounded-xl border-2 transition-all text-center ${renewalMethod === 'mixed' ? 'border-purple-600 bg-purple-50' : 'border-gray-200 hover:border-gray-300'}`}
                  >
                    <div className="flex justify-center gap-0.5 mb-1">
                      <Banknote className={`w-4 h-4 ${renewalMethod === 'mixed' ? 'text-purple-600' : 'text-gray-400'}`} />
                      <CreditCard className={`w-4 h-4 ${renewalMethod === 'mixed' ? 'text-purple-600' : 'text-gray-400'}`} />
                    </div>
                    <div className="text-xs font-semibold text-gray-900">Mixto</div>
                  </button>
                </div>
              </div>

              {renewalMethod === 'mixed' && (
                <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Efectivo (ARS)</label>
                      <input
                        type="number"
                        min="0"
                        value={renewalCashAmount}
                        onChange={(event) => setRenewalCashAmount(event.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Tarjeta (ARS)</label>
                      <input
                        type="number"
                        min="0"
                        value={renewalCardAmount}
                        onChange={(event) => setRenewalCardAmount(event.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                        placeholder="0"
                      />
                    </div>
                  </div>
                  {getRenewalMixedError() ? (
                    <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg p-2">
                      {getRenewalMixedError()}
                    </p>
                  ) : (
                    <p className="text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg p-2">
                      Desglose correcto.
                    </p>
                  )}
                </div>
              )}

              <div className="flex gap-3">
                <button onClick={() => setPayingSubscriber(null)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl font-medium">Cancelar</button>
                <button
                  onClick={handleConfirmRenewal}
                  disabled={!canConfirmRenewal()}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2"
                >
                  <Receipt className="w-4 h-4" />
                  Confirmar
                </button>
              </div>
              {errors.renewal && (
                <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg p-2">
                  {errors.renewal}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {renewalReceipt && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
            <div className="bg-blue-600 px-6 py-5 text-white text-center">
              <CheckCircle className="w-8 h-8 mx-auto mb-2" />
              <h2 className="font-bold text-lg">Abono Renovado</h2>
              <p className="text-blue-100 text-sm">Ticket interno {renewalReceipt.ticketNumber}</p>
            </div>
            <div className="p-6 space-y-3 text-sm">
              <div className="text-center bg-gray-50 rounded-xl p-4 border border-gray-200">
                <div className="text-2xl font-bold font-mono text-gray-900">{renewalReceipt.subscriber.licensePlate}</div>
                <p className="text-gray-600 mt-1">{renewalReceipt.subscriber.name}</p>
              </div>
              <div className="flex justify-between border-b border-gray-100 py-2">
                <span className="text-gray-500">Monto</span>
                <span className="font-bold text-blue-700">{formatCurrencyARSWithCents(renewalReceipt.amount)}</span>
              </div>
              <div className="flex justify-between border-b border-gray-100 py-2">
                <span className="text-gray-500">Medio</span>
                <span className="font-medium">
                  {renewalReceipt.paymentMethod === 'cash'
                    ? 'Efectivo'
                    : renewalReceipt.paymentMethod === 'mixed'
                    ? 'Mixto'
                    : 'Tarjeta'}
                </span>
              </div>
              {renewalReceipt.paymentBreakdown?.map((item) => (
                <div key={item.method} className="flex justify-between text-xs text-gray-500">
                  <span>{item.method === 'cash' ? 'Efectivo' : 'Tarjeta'}</span>
                  <span>{formatCurrencyARSWithCents(item.amount)}</span>
                </div>
              ))}
              <div className="flex justify-between border-b border-gray-100 py-2">
                <span className="text-gray-500">Vigente hasta</span>
                <span className="font-medium text-green-700">{new Date(renewalReceipt.validUntil).toLocaleDateString('es-CL')}</span>
              </div>
              <p className="text-xs text-gray-400 text-center">Comprobante interno no fiscal</p>
              <button
                onClick={() => setRenewalReceipt(null)}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-medium"
              >
                Cerrar
              </button>
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
              {canEditAdminFields ? (
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
                      <div className="text-xs text-gray-500">Cobro mensual fijo</div>
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
              ) : (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
                  <div className="text-xs text-gray-500 mb-1">Tipo de abono</div>
                  <div className="text-sm font-semibold text-gray-900">
                    {editingSub?.type === 'monthly' ? 'Mensual' : 'Bonificado'}
                  </div>
                </div>
              )}

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
                <div className="space-y-4">
                  {canEditAdminFields && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Categoría del Abono</label>
                    <div className="grid grid-cols-3 gap-2">
                      {CATEGORIES.map((category) => (
                        <button
                          key={category.value}
                          type="button"
                          onClick={() => setFormData({ ...formData, category: category.value })}
                          className={`py-2 rounded-xl border-2 text-sm font-medium transition-all ${
                            formData.category === category.value
                              ? 'border-blue-600 bg-blue-50 text-blue-700'
                              : 'border-gray-200 text-gray-600 hover:border-gray-300'
                          }`}
                        >
                          {category.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  )}

                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Valor mensual</span>
                      <span className="text-lg font-bold text-blue-700">
                        {formatCurrencyARSWithCents(getMonthlyPrice())}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-2 mt-2 border-t border-blue-200">
                      <span className="text-xs text-gray-500">Vencimiento</span>
                      <span className="text-xs font-medium text-gray-700">
                        {editingSub?.expiryDate
                          ? new Date(editingSub.expiryDate).toLocaleDateString('es-CL')
                          : new Date(new Date().setMonth(new Date().getMonth() + 1)).toLocaleDateString('es-CL')}
                      </span>
                    </div>
                    <p className="text-xs text-blue-700 mt-2">
                      La fecha la fija el sistema por un mes calendario y no se puede editar.
                    </p>
                  </div>

                  {!editingSub && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">Cobro del alta</label>
                      <div className="grid grid-cols-3 gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            setRegistrationMethod('cash');
                            setRegistrationCashAmount('');
                            setRegistrationCardAmount('');
                          }}
                          className={`p-3 rounded-xl border-2 transition-all text-center ${registrationMethod === 'cash' ? 'border-green-600 bg-green-50' : 'border-gray-200 hover:border-gray-300'}`}
                        >
                          <Banknote className={`w-6 h-6 mx-auto mb-1 ${registrationMethod === 'cash' ? 'text-green-600' : 'text-gray-400'}`} />
                          <div className="text-xs font-semibold text-gray-900">Efectivo</div>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setRegistrationMethod('card');
                            setRegistrationCashAmount('');
                            setRegistrationCardAmount('');
                          }}
                          className={`p-3 rounded-xl border-2 transition-all text-center ${registrationMethod === 'card' ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}`}
                        >
                          <CreditCard className={`w-6 h-6 mx-auto mb-1 ${registrationMethod === 'card' ? 'text-blue-600' : 'text-gray-400'}`} />
                          <div className="text-xs font-semibold text-gray-900">Tarjeta</div>
                        </button>
                        <button
                          type="button"
                          onClick={() => setRegistrationMethod('mixed')}
                          className={`p-3 rounded-xl border-2 transition-all text-center ${registrationMethod === 'mixed' ? 'border-purple-600 bg-purple-50' : 'border-gray-200 hover:border-gray-300'}`}
                        >
                          <div className="flex justify-center gap-0.5 mb-1">
                            <Banknote className={`w-4 h-4 ${registrationMethod === 'mixed' ? 'text-purple-600' : 'text-gray-400'}`} />
                            <CreditCard className={`w-4 h-4 ${registrationMethod === 'mixed' ? 'text-purple-600' : 'text-gray-400'}`} />
                          </div>
                          <div className="text-xs font-semibold text-gray-900">Mixto</div>
                        </button>
                      </div>

                      {registrationMethod === 'mixed' && (
                        <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 space-y-3 mt-3">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Efectivo (ARS)</label>
                              <input
                                type="number"
                                min="0"
                                value={registrationCashAmount}
                                onChange={(event) => setRegistrationCashAmount(event.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                                placeholder="0"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">Tarjeta (ARS)</label>
                              <input
                                type="number"
                                min="0"
                                value={registrationCardAmount}
                                onChange={(event) => setRegistrationCardAmount(event.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                                placeholder="0"
                              />
                            </div>
                          </div>
                          {getRegistrationMixedError() ? (
                            <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg p-2">
                              {getRegistrationMixedError()}
                            </p>
                          ) : (
                            <p className="text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg p-2">
                              Desglose correcto.
                            </p>
                          )}
                        </div>
                      )}
                      {errors.payment && <p className="text-xs text-red-600 mt-2">{errors.payment}</p>}
                    </div>
                  )}
                </div>
              ) : (
                canEditAdminFields ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Porcentaje de Descuento (%)</label>
                  <input type="number" min="1" max="100" value={formData.discount || ''} onChange={(e) => setFormData({ ...formData, discount: parseInt(e.target.value) || 0 })}
                    className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 ${errors.discount ? 'border-red-400' : 'border-gray-300'}`}
                    placeholder="50" />
                  {errors.discount && <p className="text-xs text-red-600 mt-1">{errors.discount}</p>}
                </div>
                ) : (
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
                    <div className="text-xs text-gray-500 mb-1">Descuento</div>
                    <div className="text-sm font-semibold text-gray-900">{editingSub?.discount || 0}%</div>
                  </div>
                )
              )}

              {/* Status */}
              {isAdmin && (
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
              <button onClick={() => setShowModal(false)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 rounded-xl font-medium transition-colors">Cancelar</button>
              <button
                onClick={handleSave}
                disabled={!canChargeRegistration()}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-2.5 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors"
              >
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
      <div className="space-y-6">
        {/* Search Bar */}
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
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as 'all' | SubscriberValidity)}
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
        </div>

        {/* Active Subscribers */}
        {filteredSubs.filter(s => getEffectiveSubscriberStatus(s) === 'active').length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-green-200 overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-green-100 bg-green-50">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <h2 className="font-semibold text-gray-900">
                  Abonados Activos{' '}
                  <span className="text-gray-400 font-normal">({filteredSubs.filter(s => getEffectiveSubscriberStatus(s) === 'active').length})</span>
                </h2>
              </div>
              <span className="text-xs bg-green-100 text-green-700 px-2.5 py-1 rounded-full font-medium">Vigentes</span>
            </div>
            <div className="divide-y divide-green-50">
              {filteredSubs.filter(s => getEffectiveSubscriberStatus(s) === 'active').map((sub) => {
                const days = daysUntilExpiry(sub);
                const expiringSoon = days !== null && days <= 7 && days > 0;

                return (
                  <div key={sub.id} className="p-5 hover:bg-green-50/50 transition-colors border-l-4 border-green-500">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <div className={`w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-lg ${
                          sub.type === 'monthly' ? 'bg-blue-600' : 'bg-amber-500'
                        }`}>
                          {sub.name.charAt(0)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-gray-900">{sub.name}</span>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                              ✓ Activo
                            </span>
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                              sub.type === 'monthly' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
                            }`}>
                              {sub.type === 'monthly' ? '📅 Mensual' : `⭐ ${sub.discount}% desc.`}
                            </span>
                            {expiringSoon && (
                              <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full text-xs font-medium">⏰ Vence en {days}d</span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-500">
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

                          <div className="flex items-center gap-2 mt-2.5">
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

                          <div className="flex items-center gap-6 mt-3">
                            {sub.type === 'monthly' && sub.expiryDate && (
                              <p className="text-xs text-gray-600">
                                <span className="text-gray-400">Vencimiento:</span> {new Date(sub.expiryDate).toLocaleDateString('es-CL')}
                              </p>
                            )}
                            {sub.amount && (
                              <div className="flex items-center gap-1">
                                <TrendingUp className="w-3.5 h-3.5 text-green-600" />
                                <span className="text-xs font-semibold text-green-700">{formatCurrencyARSWithCents(sub.amount)}</span>
                              </div>
                            )}
                          </div>
                          {sub.notes && (
                            <p className="text-xs text-gray-400 mt-1.5 italic">"{sub.notes}"</p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 ml-4">
                        {sub.type === 'monthly' && (
                          <button
                            onClick={() => openRenewalModal(sub)}
                            disabled={!canRenewMonthlySubscriber(sub)}
                            className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg font-medium transition-colors bg-blue-50 text-blue-700 hover:bg-blue-100 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                            title={
                              canRenewMonthlySubscriber(sub)
                                ? 'Renovar abono mensual'
                                : `Disponible cuando falten ${MONTHLY_RENEWAL_WINDOW_DAYS} dias o menos`
                            }
                          >
                            <Receipt className="w-3.5 h-3.5" />
                            Renovar
                          </button>
                        )}
                        <button onClick={() => openEditModal(sub)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Editar">
                          <Edit className="w-4 h-4" />
                        </button>
                        {isAdmin && (
                          <button onClick={() => setDeleteConfirm(sub.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Eliminar">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Expired Subscribers */}
        {filteredSubs.filter(s => getEffectiveSubscriberStatus(s) === 'expired').length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-red-200 overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-red-100 bg-red-50">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <h2 className="font-semibold text-gray-900">
                  Abonados Vencidos{' '}
                  <span className="text-gray-400 font-normal">({filteredSubs.filter(s => getEffectiveSubscriberStatus(s) === 'expired').length})</span>
                </h2>
              </div>
              <span className="text-xs bg-red-100 text-red-700 px-2.5 py-1 rounded-full font-medium">Renovación requerida</span>
            </div>
            <div className="divide-y divide-red-50">
              {filteredSubs.filter(s => getEffectiveSubscriberStatus(s) === 'expired').map((sub) => {
                return (
                  <div key={sub.id} className="p-5 hover:bg-red-50/50 transition-colors border-l-4 border-red-500">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <div className={`w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-lg ${
                          sub.type === 'monthly' ? 'bg-blue-600' : 'bg-amber-500'
                        }`}>
                          {sub.name.charAt(0)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-gray-900">{sub.name}</span>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                              ⚠ Vencido
                            </span>
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                              sub.type === 'monthly' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
                            }`}>
                              {sub.type === 'monthly' ? '📅 Mensual' : `⭐ ${sub.discount}% desc.`}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-500">
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

                          <div className="flex items-center gap-2 mt-2.5">
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

                          <div className="flex items-center gap-6 mt-3">
                            {sub.type === 'monthly' && sub.expiryDate && (
                              <p className="text-xs text-red-700 font-medium">
                                Vencido desde: {new Date(sub.expiryDate).toLocaleDateString('es-CL')}
                              </p>
                            )}
                            {sub.amount && (
                              <div className="flex items-center gap-1">
                                <TrendingUp className="w-3.5 h-3.5 text-red-600" />
                                <span className="text-xs font-semibold text-red-700">{formatCurrencyARSWithCents(sub.amount)}</span>
                              </div>
                            )}
                          </div>
                          {sub.notes && (
                            <p className="text-xs text-gray-400 mt-1.5 italic">"{sub.notes}"</p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 ml-4">
                        {sub.type === 'monthly' && (
                          <button
                            onClick={() => openRenewalModal(sub)}
                            className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg font-medium transition-colors bg-green-50 text-green-700 hover:bg-green-100"
                            title="Cobrar renovación"
                          >
                            <Receipt className="w-3.5 h-3.5" />
                            Cobrar
                          </button>
                        )}
                        <button onClick={() => openEditModal(sub)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Editar">
                          <Edit className="w-4 h-4" />
                        </button>
                        {isAdmin && (
                          <button onClick={() => setDeleteConfirm(sub.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Eliminar">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Inactive Subscribers */}
        {filteredSubs.filter(s => getEffectiveSubscriberStatus(s) === 'inactive').length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gray-50">
              <div className="flex items-center gap-3">
                <XCircle className="w-5 h-5 text-gray-600" />
                <h2 className="font-semibold text-gray-900">
                  Abonados Inactivos{' '}
                  <span className="text-gray-400 font-normal">({filteredSubs.filter(s => getEffectiveSubscriberStatus(s) === 'inactive').length})</span>
                </h2>
              </div>
            </div>
            <div className="divide-y divide-gray-50">
              {filteredSubs.filter(s => getEffectiveSubscriberStatus(s) === 'inactive').map((sub) => {
                return (
                  <div key={sub.id} className="p-5 hover:bg-gray-50/50 transition-colors border-l-4 border-gray-300">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <div className={`w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-lg ${
                          sub.type === 'monthly' ? 'bg-blue-600' : 'bg-amber-500'
                        }`}>
                          {sub.name.charAt(0)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-gray-900">{sub.name}</span>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                              ● Inactivo
                            </span>
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                              sub.type === 'monthly' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'
                            }`}>
                              {sub.type === 'monthly' ? '📅 Mensual' : `⭐ ${sub.discount}% desc.`}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-500">
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

                          <div className="flex items-center gap-2 mt-2.5">
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

                          {sub.amount && (
                            <div className="flex items-center gap-1 mt-3">
                              <TrendingUp className="w-3.5 h-3.5 text-gray-400" />
                              <span className="text-xs font-semibold text-gray-600">{formatCurrencyARSWithCents(sub.amount)}</span>
                            </div>
                          )}
                          {sub.notes && (
                            <p className="text-xs text-gray-400 mt-1.5 italic">"{sub.notes}"</p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 ml-4">
                        <button onClick={() => openEditModal(sub)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Editar">
                          <Edit className="w-4 h-4" />
                        </button>
                        {isAdmin && (
                          <button onClick={() => setDeleteConfirm(sub.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Eliminar">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {filteredSubs.length === 0 && (
          <div className="text-center py-12 text-gray-400 bg-white rounded-xl shadow-sm border border-gray-200">
            <Star className="w-10 h-10 mx-auto mb-3 text-gray-200" />
            <p className="text-sm">No se encontraron abonados</p>
          </div>
        )}
      </div>
    </div>
  );
};
