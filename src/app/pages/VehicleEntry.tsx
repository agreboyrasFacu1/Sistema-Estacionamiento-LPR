import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { toast } from 'sonner';
import { useParking } from '../contexts/ParkingContext';
import { useAuth } from '../contexts/AuthContext';
import { CameraModal } from '../components/CameraModal';
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  Car,
  Camera,
  Edit3,
  Star,
  AlertCircle,
} from 'lucide-react';
import { VehicleCategory, VehicleEntry as VehicleEntryRecord } from '../types';
import { translateCategory, validatePlate, getCategoryIcon } from '../data/mockData';
import { getEffectiveSubscriberStatus } from '../domain/subscribers';

export const VehicleEntry: React.FC = () => {
  const {
    currentDetection,
    addVehicleEntry,
    checkDuplicatePlate,
    getSubscriberByPlate,
  } = useParking();
  const { isTrainingMode } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const routeDetectedPlate =
    typeof (location.state as { detectedPlate?: unknown } | null)?.detectedPlate === 'string'
      ? (location.state as { detectedPlate: string }).detectedPlate
      : '';

  const [selectedCategory, setSelectedCategory] = useState<VehicleCategory>('auto');
  const [manualPlate, setManualPlate] = useState('');
  const [isManualEntry, setIsManualEntry] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [entryResult, setEntryResult] = useState<VehicleEntryRecord | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [detectionError, setDetectionError] = useState<string | null>(null);
  const [plateError, setPlateError] = useState<string | null>(null);
  const [confirmedPlate, setConfirmedPlate] = useState(routeDetectedPlate);

  const getActivePlate = () => {
    if (confirmedPlate) return confirmedPlate;
    if (isManualEntry) return manualPlate;
    return currentDetection?.plate || '';
  };

  const validateCurrentPlate = (plate: string): string | null => {
    if (!plate) return null;
    if (!validatePlate(plate)) {
      return 'Formato de patente inválido. Use ABC123 o AB123CD';
    }
    if (checkDuplicatePlate(plate)) {
      return 'Patente ya registrada dentro del estacionamiento';
    }
    return null;
  };

  const isPlateReady = () => {
    const plate = getActivePlate();
    if (!plate) return false;
    return validatePlate(plate) && !checkDuplicatePlate(plate);
  };

  const handleManualPlateChange = (value: string) => {
    const upper = value.toUpperCase();
    setManualPlate(upper);
    setPlateError(null);
    if (upper.length >= 6) {
      const err = validateCurrentPlate(upper);
      setPlateError(err);
    }
  };

  const handleCameraPlateDetected = (plate: string) => {
    setConfirmedPlate(plate);
    setIsManualEntry(false);
    setManualPlate('');
    const err = validateCurrentPlate(plate);
    if (err) {
      setPlateError(err);
    } else {
      setPlateError(null);
      toast.success(`Patente ${plate} detectada por cámara`);
    }
  };

  const handleConfirmEntry = async () => {
    const plate = getActivePlate();
    if (!plate) return;

    // Final validation
    const err = validateCurrentPlate(plate);
    if (err) {
      setPlateError(err);
      return;
    }

    setIsProcessing(true);
    try {
      const result = await addVehicleEntry(plate, selectedCategory);
      setEntryResult(result);
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        navigate('/dashboard');
      }, 3000);
    } catch (error) {
      toast.error('Error al confirmar el ingreso. Por favor intente nuevamente.');
    } finally {
      setIsProcessing(false);
    }
  };

  const activePlate = getActivePlate();
  const subscriber = activePlate ? getSubscriberByPlate(activePlate) : null;
  const subscriberStatus = subscriber ? getEffectiveSubscriberStatus(subscriber) : undefined;
  const scopedCategories: { value: VehicleCategory; label: string; icon: string }[] = [
    { value: 'auto', label: 'Auto', icon: '🚗' },
    { value: 'camioneta', label: 'Camioneta', icon: '🚙' },
    { value: 'moto', label: 'Moto', icon: '🏍️' },
  ];


  return (
    <div className="max-w-4xl mx-auto">
      {/* Camera Modal */}
      <CameraModal
        isOpen={showCamera}
        onClose={() => setShowCamera(false)}
        onPlateDetected={handleCameraPlateDetected}
        title="Cámara de Entrada"
      />

      {/* Page Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            Ingreso de Vehículo
          </h1>
          <p className="text-gray-500">Registrar nuevo vehículo ingresando a la instalación</p>
        </div>
        <button
          onClick={() => setShowCamera(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium transition-colors shadow-sm"
        >
          <Camera className="w-5 h-5" />
          Abrir Cámara
        </button>
      </div>

      {/* Success Modal */}
      {showSuccess && entryResult && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">¡Ingreso Confirmado!</h2>
            <p className="text-gray-500 mb-6">Vehículo registrado exitosamente</p>

            <div className="bg-gray-50 rounded-xl p-5 mb-6 border border-gray-200">
              <div className="text-3xl font-bold text-gray-900 font-mono mb-2">
                {entryResult.licensePlate}
              </div>
              <div className="flex items-center justify-center gap-2 text-gray-600">
                <span>{getCategoryIcon(entryResult.category)}</span>
                <span>{translateCategory(entryResult.category)}</span>
              </div>
              <div className="text-sm text-gray-400 mt-2">
                {new Date(entryResult.entryTime).toLocaleString('es-CL')}
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 text-gray-400 text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
              Redirigiendo al panel...
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Detection Panel */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-gray-900">Detección de Patente</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowCamera(true)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Abrir cámara"
                >
                  <Camera className="w-5 h-5" />
                </button>
                <button
                  onClick={() => { setIsManualEntry(true); setConfirmedPlate(''); }}
                  className="p-2 text-gray-500 hover:bg-gray-50 rounded-lg transition-colors"
                  title="Ingreso manual"
                >
                  <Edit3 className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Confirmed plate from camera */}
            {confirmedPlate && !isManualEntry && (
              <div className="bg-blue-50 border-2 border-blue-300 rounded-xl p-5 mb-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Camera className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-700">Detectada por Cámara</span>
                  </div>
                  <CheckCircle className="w-5 h-5 text-blue-600" />
                </div>
                <div className="text-4xl font-bold text-gray-900 tracking-wider font-mono text-center">
                  {confirmedPlate}
                </div>
              </div>
            )}

            {/* Auto detection */}
            {!isManualEntry && !confirmedPlate && currentDetection && (
              <div
                className={`p-5 rounded-xl border-2 mb-4 ${
                  currentDetection.isValid
                    ? 'bg-green-50 border-green-300'
                    : 'bg-amber-50 border-amber-300'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-600">LPR Auto-Detectada</span>
                  {currentDetection.isValid ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-amber-600" />
                  )}
                </div>
                <div className="text-4xl font-bold text-gray-900 tracking-wider font-mono text-center mb-3">
                  {currentDetection.plate}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Confianza:</span>
                    <span className="font-semibold">{(currentDetection.confidence * 100).toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full ${currentDetection.isValid ? 'bg-green-600' : 'bg-amber-500'}`}
                      style={{ width: `${currentDetection.confidence * 100}%` }}
                    />
                  </div>
                </div>
                {!currentDetection.isValid && (
                  <div className="mt-3 p-2.5 bg-amber-100 rounded-lg">
                    <p className="text-xs text-amber-800">Confianza baja — use cámara o ingreso manual</p>
                  </div>
                )}
              </div>
            )}

            {/* No detection state */}
            {!isManualEntry && !confirmedPlate && !currentDetection && (
              <div className="text-center py-10 mb-4">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Car className="w-10 h-10 text-gray-300" />
                </div>
                <p className="text-gray-400 mb-4">Sin detección activa</p>
                <div className="flex justify-center gap-3">
                  <button
                    onClick={() => setShowCamera(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium flex items-center gap-2 text-sm transition-colors"
                  >
                    <Camera className="w-4 h-4" />
                    Abrir Cámara
                  </button>
                </div>
              </div>
            )}

            {/* Manual Entry */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isManualEntry}
                    onChange={(e) => {
                      setIsManualEntry(e.target.checked);
                      if (e.target.checked) setConfirmedPlate('');
                    }}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Ingreso Manual</span>
                </label>
              </div>

              {isManualEntry && (
                <div>
                  <input
                    type="text"
                    value={manualPlate}
                    onChange={(e) => handleManualPlateChange(e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-xl tracking-widest uppercase text-center transition-all ${
                      plateError ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-gray-50'
                    }`}
                    placeholder="ABC123 o AB123CD"
                    maxLength={7}
                  />
                  <p className="text-xs text-gray-400 mt-1.5 text-center">
                    Formatos válidos: ABC123 · AB123CD
                  </p>
                </div>
              )}
            </div>

            {/* Plate Error */}
            {plateError && (
              <div className="mt-3 flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-800">{plateError}</p>
                  {plateError.includes('ya registrada') && (
                    <p className="text-xs text-red-600 mt-1">
                      El vehículo ya se encuentra dentro del estacionamiento. Verifique en Búsqueda o Salidas.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Subscriber Badge */}
          {subscriber && !plateError && activePlate && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <div className="flex items-center gap-2 text-amber-800">
                <Star className="w-5 h-5 text-amber-600 fill-amber-400" />
                <span className="font-semibold">Abonado Registrado</span>
              </div>
              <p className="text-sm text-amber-700 mt-1">
                <strong>{subscriber.name}</strong> ·{' '}
                {subscriber.type === 'monthly'
                  ? subscriberStatus === 'active'
                    ? 'Abono mensual activo — Sin cargo'
                    : 'Abono vencido/inactivo — corresponde cobro normal'
                  : `${subscriber.discount}% de descuento`}
              </p>
            </div>
          )}

          {isTrainingMode && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <div className="text-sm text-amber-800">
                <div className="font-semibold mb-1">Consejo de Entrenamiento</div>
                <p>En producción, el sistema detecta patentes automáticamente. Use la cámara o ingreso manual cuando la detección falle.</p>
              </div>
            </div>
          )}
        </div>

        {/* Entry Form */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-6">Detalles de Ingreso</h2>

          <div className="space-y-6">
            {/* License Plate Display */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Número de Patente
              </label>
              <div className={`rounded-xl p-5 text-center transition-all ${
                activePlate && !plateError ? 'bg-gray-900' : 'bg-gray-100 border-2 border-dashed border-gray-300'
              }`}>
                <div className={`text-3xl font-bold font-mono tracking-widest ${
                  activePlate && !plateError ? 'text-white' : 'text-gray-400'
                }`}>
                  {activePlate || '---'}
                </div>
              </div>
            </div>

            {/* Vehicle Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Categoría del Vehículo
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                {scopedCategories.map((category) => (
                  <button
                    key={category.value}
                    onClick={() => setSelectedCategory(category.value as VehicleCategory)}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      selectedCategory === category.value
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="text-2xl mb-1.5">{category.icon}</div>
                    <div className="text-sm font-medium text-gray-900">{category.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Entry Time */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hora de Ingreso
              </label>
              <div className="bg-gray-50 border border-gray-200 p-3 rounded-lg text-gray-900 font-medium text-sm">
                {new Date().toLocaleString('es-CL')}
              </div>
            </div>

            {/* Validation Status */}
            <div className={`p-4 rounded-xl border ${
              isPlateReady()
                ? 'bg-green-50 border-green-200'
                : plateError
                ? 'bg-red-50 border-red-200'
                : 'bg-gray-50 border-gray-200'
            }`}>
              <div className="flex items-center gap-2">
                {isPlateReady() ? (
                  <>
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <span className="text-sm font-medium text-green-800">Listo para confirmar ingreso</span>
                  </>
                ) : plateError ? (
                  <>
                    <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                    <span className="text-sm font-medium text-red-800">Corrija la patente antes de continuar</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    <span className="text-sm font-medium text-gray-500">Detecte o ingrese una patente válida</span>
                  </>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => navigate('/dashboard')}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-4 rounded-xl font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmEntry}
                disabled={!isPlateReady() || isProcessing}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-3 px-4 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors shadow-sm"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Procesando...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Confirmar Ingreso
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
