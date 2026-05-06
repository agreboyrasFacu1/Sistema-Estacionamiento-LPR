import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { useParking } from '../contexts/ParkingContext';
import { useAuth } from '../contexts/AuthContext';
import { CameraModal } from '../components/CameraModal';
import { TicketModal } from '../components/TicketModal';
import {
  CheckCircle,
  AlertTriangle,
  Loader2,
  RefreshCw,
  DollarSign,
  Clock,
  Calendar,
  Camera,
  Gift,
  Banknote,
  CreditCard,
  Search,
  Star,
  AlertCircle,
  XCircle,
} from 'lucide-react';
import { calculateParkingFee, formatDuration, translateCategory, getCategoryIcon } from '../data/mockData';
import { PaymentMethod, VehicleEntry } from '../types';

export const VehicleExit: React.FC = () => {
  const {
    vehicles,
    pricingRules,
    currentDetection,
    simulateDetection,
    processExit,
    searchVehicle,
    getSubscriberByPlate,
  } = useParking();
  const { isTrainingMode } = useAuth();
  const navigate = useNavigate();

  const [selectedVehicle, setSelectedVehicle] = useState<VehicleEntry | null>(null);
  const [manualPlate, setManualPlate] = useState('');
  const [isManualSearch, setIsManualSearch] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showTicket, setShowTicket] = useState(false);
  const [exitResult, setExitResult] = useState<VehicleEntry | null>(null);
  const [searchError, setSearchError] = useState('');
  const [showCamera, setShowCamera] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod | null>(null);
  const [showPaymentStep, setShowPaymentStep] = useState(false);

  useEffect(() => {
    simulateDetection();
  }, []);

  useEffect(() => {
    if (currentDetection && !isManualSearch) {
      const vehicle = searchVehicle(currentDetection.plate);
      if (vehicle) {
        setSelectedVehicle(vehicle);
        setSearchError('');
      } else {
        setSelectedVehicle(null);
        if (currentDetection.isValid) {
          setSearchError('Vehículo no encontrado en el estacionamiento');
        }
      }
    }
  }, [currentDetection]);

  const handleManualSearch = () => {
    setSearchError('');
    if (!manualPlate) return;
    const vehicle = searchVehicle(manualPlate);
    if (vehicle) {
      setSelectedVehicle(vehicle);
    } else {
      setSelectedVehicle(null);
      setSearchError('Vehículo no encontrado. Verifique el número de patente.');
    }
  };

  const handleCameraPlateDetected = (plate: string) => {
    const vehicle = searchVehicle(plate);
    if (vehicle) {
      setSelectedVehicle(vehicle);
      setSearchError('');
      toast.success(`Vehículo ${plate} encontrado`);
    } else {
      setSearchError(`Patente ${plate} no encontrada en el estacionamiento`);
      toast.error(`Patente ${plate} no encontrada`);
    }
  };

  const getCurrentDuration = () => {
    if (!selectedVehicle) return 0;
    return Math.round((Date.now() - new Date(selectedVehicle.entryTime).getTime()) / (1000 * 60));
  };

  const isFreeExit = () => getCurrentDuration() <= 5;

  const getSubscriber = () => {
    if (!selectedVehicle) return null;
    return getSubscriberByPlate(selectedVehicle.licensePlate);
  };

  const isActiveMonthlySubscriber = () => {
    const sub = getSubscriber();
    return sub && sub.status === 'active' && sub.type === 'monthly';
  };

  const getAmount = () => {
    if (!selectedVehicle) return 0;
    if (isFreeExit()) return 0;
    if (isActiveMonthlySubscriber()) return 0;
    const sub = getSubscriber();
    const base = calculateParkingFee(selectedVehicle.category, getCurrentDuration(), pricingRules);
    if (sub && sub.status === 'active' && sub.type === 'discounted' && sub.discount) {
      return base * (1 - sub.discount / 100);
    }
    return base;
  };

  const handleGoToPayment = () => {
    if (!selectedVehicle) return;
    if (isFreeExit() || isActiveMonthlySubscriber()) {
      // Process directly without payment selection
      handleProcessExit('cash');
    } else {
      setShowPaymentStep(true);
      setSelectedPayment(null);
    }
  };

  const handleProcessExit = async (method: PaymentMethod) => {
    if (!selectedVehicle) return;
    setIsProcessing(true);
    try {
      const result = await processExit(selectedVehicle.id, method);
      setExitResult(result);
      setShowTicket(true);
      setShowPaymentStep(false);
    } catch (error) {
      toast.error('Error al procesar la salida. Por favor intente nuevamente.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleNewTransaction = () => {
    setShowTicket(false);
    setExitResult(null);
    setSelectedVehicle(null);
    setManualPlate('');
    setSearchError('');
    setShowPaymentStep(false);
    setSelectedPayment(null);
    simulateDetection();
  };

  const duration = getCurrentDuration();
  const amount = getAmount();
  const sub = getSubscriber();
  const freeExit = isFreeExit();
  const monthlyFree = isActiveMonthlySubscriber();

  const activeVehicles = vehicles.filter((v) => !v.exitTime);

  return (
    <div className="max-w-5xl mx-auto">
      {/* Modals */}
      <CameraModal
        isOpen={showCamera}
        onClose={() => setShowCamera(false)}
        onPlateDetected={handleCameraPlateDetected}
        title="Cámara de Salida"
      />

      <TicketModal
        isOpen={showTicket}
        vehicle={exitResult}
        onClose={() => { setShowTicket(false); navigate('/dashboard'); }}
        onNewTransaction={handleNewTransaction}
      />

      {/* Page Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Salida de Vehículos</h1>
          <p className="text-gray-500">Procesar salida y cobrar pago</p>
        </div>
        <button
          onClick={() => setShowCamera(true)}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl font-medium transition-colors shadow-sm"
        >
          <Camera className="w-5 h-5" />
          Abrir Cámara
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Search Section */}
        <div className="lg:col-span-2 space-y-4">
          {/* Search card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">Buscar Vehículo</h2>
              <div className="flex gap-1">
                <button
                  onClick={() => setShowCamera(true)}
                  className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                  title="Usar cámara"
                >
                  <Camera className="w-5 h-5" />
                </button>
                <button
                  onClick={() => { simulateDetection(); setIsManualSearch(false); }}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Nueva detección"
                >
                  <RefreshCw className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Auto Detection */}
            {!isManualSearch && currentDetection && (
              <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="text-xs font-medium text-blue-700 mb-1">Placa Auto-Detectada</div>
                <div className="text-xl font-bold text-gray-900 font-mono">
                  {currentDetection.plate}
                </div>
                <div className="text-xs text-blue-600 mt-0.5">
                  {(currentDetection.confidence * 100).toFixed(0)}% confianza
                </div>
              </div>
            )}

            {/* Manual Search */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={isManualSearch}
                  onChange={(e) => setIsManualSearch(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <label className="text-sm font-medium text-gray-700">Búsqueda Manual</label>
              </div>

              {isManualSearch && (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={manualPlate}
                    onChange={(e) => setManualPlate(e.target.value.toUpperCase())}
                    onKeyPress={(e) => e.key === 'Enter' && handleManualSearch()}
                    className="flex-1 px-3 py-2.5 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono uppercase text-sm"
                    placeholder="ABC123"
                  />
                  <button
                    onClick={handleManualSearch}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg transition-colors"
                  >
                    <Search className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {searchError && (
              <div className="mt-3 flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{searchError}</p>
              </div>
            )}
          </div>

          {/* Active Vehicles list */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              En la Instalación ({activeVehicles.length})
            </h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {activeVehicles.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">Sin vehículos activos</p>
              ) : (
                activeVehicles.map((vehicle) => {
                  const dur = Math.round((Date.now() - new Date(vehicle.entryTime).getTime()) / (1000 * 60));
                  return (
                    <button
                      key={vehicle.id}
                      onClick={() => { setSelectedVehicle(vehicle); setSearchError(''); }}
                      className={`w-full text-left p-3 rounded-lg transition-all ${
                        selectedVehicle?.id === vehicle.id
                          ? 'bg-blue-50 border-2 border-blue-300'
                          : 'bg-gray-50 hover:bg-gray-100 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-semibold text-gray-900 text-sm">{vehicle.licensePlate}</span>
                            {vehicle.isSubscriber && <Star className="w-3 h-3 text-amber-500 fill-amber-400" />}
                          </div>
                          <div className="text-xs text-gray-500 mt-0.5">
                            {getCategoryIcon(vehicle.category)} {translateCategory(vehicle.category)}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs font-medium text-gray-700">{formatDuration(dur)}</div>
                          <div className="text-xs text-gray-400">{new Date(vehicle.entryTime).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}</div>
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {isTrainingMode && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <p className="text-sm text-amber-800">
                <span className="font-semibold">💡 Entrenamiento:</span> El sistema detecta la patente automáticamente. La búsqueda manual es solo para excepciones.
              </p>
            </div>
          )}
        </div>

        {/* Payment Section */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">

            {selectedVehicle ? (
              !showPaymentStep ? (
                /* Summary View */
                <div className="space-y-5">
                  <h2 className="font-semibold text-gray-900">Resumen de Salida</h2>

                  {/* Plate */}
                  <div className="bg-gray-900 text-white rounded-xl p-5">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-400">{getCategoryIcon(selectedVehicle.category)} {translateCategory(selectedVehicle.category)}</span>
                      {sub && <div className="flex items-center gap-1 text-amber-400"><Star className="w-3.5 h-3.5 fill-amber-400" /><span className="text-xs">Abonado</span></div>}
                    </div>
                    <div className="text-4xl font-bold font-mono tracking-widest">
                      {selectedVehicle.licensePlate}
                    </div>
                  </div>

                  {/* Subscriber info */}
                  {sub && (
                    <div className={`p-3 rounded-lg border ${sub.status === 'active' ? 'bg-amber-50 border-amber-200' : 'bg-gray-50 border-gray-200'}`}>
                      <div className="flex items-center gap-2">
                        <Star className={`w-4 h-4 ${sub.status === 'active' ? 'text-amber-500 fill-amber-400' : 'text-gray-400'}`} />
                        <span className="text-sm font-medium text-gray-800">{sub.name}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${sub.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {sub.status === 'active' ? 'Activo' : 'Inactivo'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1 ml-6">
                        {sub.type === 'monthly' ? 'Abono mensual' : `Descuento ${sub.discount}%`}
                        {sub.expiryDate && ` · Vence: ${new Date(sub.expiryDate).toLocaleDateString('es-CL')}`}
                      </p>
                    </div>
                  )}

                  {/* Time details */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-50 border border-gray-200 p-3 rounded-lg">
                      <div className="flex items-center gap-2 text-gray-500 mb-1">
                        <Calendar className="w-3.5 h-3.5" />
                        <span className="text-xs font-medium">Entrada</span>
                      </div>
                      <div className="text-sm font-semibold text-gray-900">
                        {new Date(selectedVehicle.entryTime).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div className="text-xs text-gray-400">
                        {new Date(selectedVehicle.entryTime).toLocaleDateString('es-CL')}
                      </div>
                    </div>
                    <div className="bg-gray-50 border border-gray-200 p-3 rounded-lg">
                      <div className="flex items-center gap-2 text-gray-500 mb-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span className="text-xs font-medium">Duración</span>
                      </div>
                      <div className="text-sm font-semibold text-gray-900">
                        {formatDuration(duration)}
                      </div>
                      <div className="text-xs text-gray-400">hasta ahora</div>
                    </div>
                  </div>

                  {/* Amount */}
                  {freeExit ? (
                    <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-5 text-center">
                      <Gift className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                      <div className="font-bold text-blue-800 text-lg mb-1">Salida Sin Cargo</div>
                      <p className="text-sm text-blue-600">
                        Estadía menor a 5 minutos — no se cobra
                      </p>
                    </div>
                  ) : monthlyFree ? (
                    <div className="bg-amber-50 border-2 border-amber-200 rounded-xl p-5 text-center">
                      <Star className="w-8 h-8 text-amber-500 fill-amber-400 mx-auto mb-2" />
                      <div className="font-bold text-amber-800 text-lg mb-1">Abonado Mensual</div>
                      <p className="text-sm text-amber-600">Sin cargo por abono vigente</p>
                    </div>
                  ) : (
                    <div className="bg-green-50 border-2 border-green-200 rounded-xl p-5">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-600">Monto Total</span>
                        <DollarSign className="w-5 h-5 text-green-600" />
                      </div>
                      <div className="text-5xl font-bold text-green-600">
                        ${amount.toFixed(2)}
                      </div>
                      {sub && sub.type === 'discounted' && sub.discount && (
                        <div className="text-xs text-green-700 mt-1">
                          Con {sub.discount}% de descuento aplicado
                        </div>
                      )}
                      <div className="text-sm text-gray-500 mt-1">
                        {formatDuration(duration)} de estacionamiento
                      </div>
                    </div>
                  )}

                  {duration > 1440 && (
                    <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                      <p className="text-sm text-amber-800">
                        <strong>Duración prolongada:</strong> más de 24 horas. Verifique antes de procesar.
                      </p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => navigate('/dashboard')}
                      className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3.5 px-4 rounded-xl font-medium transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleGoToPayment}
                      disabled={isProcessing}
                      className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white py-3.5 px-4 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors shadow-sm"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Procesando...
                        </>
                      ) : freeExit || monthlyFree ? (
                        <>
                          <CheckCircle className="w-5 h-5" />
                          Confirmar Salida
                        </>
                      ) : (
                        <>
                          <CreditCard className="w-5 h-5" />
                          Seleccionar Pago
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                /* Payment Method Step */
                <div className="space-y-5">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setShowPaymentStep(false)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500"
                    >
                      ←
                    </button>
                    <h2 className="font-semibold text-gray-900">Seleccionar Medio de Pago</h2>
                  </div>

                  {/* Amount reminder */}
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                    <div className="text-xs text-gray-500 mb-1">Total a cobrar</div>
                    <div className="text-3xl font-bold text-green-600">${amount.toFixed(2)}</div>
                    <div className="text-xs text-gray-400 mt-1">{selectedVehicle.licensePlate} · {formatDuration(duration)}</div>
                  </div>

                  {/* Payment options */}
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setSelectedPayment('cash')}
                      className={`p-5 rounded-xl border-2 transition-all text-center ${
                        selectedPayment === 'cash'
                          ? 'border-green-600 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Banknote className={`w-10 h-10 mx-auto mb-2 ${selectedPayment === 'cash' ? 'text-green-600' : 'text-gray-400'}`} />
                      <div className="font-semibold text-gray-900">Efectivo</div>
                      <div className="text-xs text-gray-500 mt-0.5">Pago en efectivo</div>
                    </button>
                    <button
                      onClick={() => setSelectedPayment('card')}
                      className={`p-5 rounded-xl border-2 transition-all text-center ${
                        selectedPayment === 'card'
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <CreditCard className={`w-10 h-10 mx-auto mb-2 ${selectedPayment === 'card' ? 'text-blue-600' : 'text-gray-400'}`} />
                      <div className="font-semibold text-gray-900">Tarjeta</div>
                      <div className="text-xs text-gray-500 mt-0.5">Débito / Crédito</div>
                    </button>
                  </div>

                  {selectedPayment && (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-gray-700">
                        Método seleccionado: <strong>{selectedPayment === 'cash' ? 'Efectivo' : 'Tarjeta'}</strong>
                      </span>
                    </div>
                  )}

                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => setShowPaymentStep(false)}
                      className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3.5 px-4 rounded-xl font-medium transition-colors"
                    >
                      Volver
                    </button>
                    <button
                      onClick={() => selectedPayment && handleProcessExit(selectedPayment)}
                      disabled={!selectedPayment || isProcessing}
                      className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-3.5 px-4 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors shadow-sm"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Procesando...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-5 h-5" />
                          Confirmar Pago
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )
            ) : (
              <div className="text-center py-16 text-gray-400">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <DollarSign className="w-10 h-10 text-gray-300" />
                </div>
                <p className="font-medium text-gray-500 mb-2">Sin vehículo seleccionado</p>
                <p className="text-sm">Use la cámara, la detección automática o la búsqueda manual para encontrar un vehículo</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
