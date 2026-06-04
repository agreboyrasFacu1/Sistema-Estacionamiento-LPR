import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { useParking } from '../contexts/ParkingContext';
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
import { VehicleCategory } from '../types';
import { translateCategory, validatePlate, getCategoryIcon } from '../data/mockData';

export const VehicleEntry: React.FC = () => {
  const {
    addVehicleEntry,
    checkDuplicatePlate,
    getSubscriberByPlate,
  } = useParking();

  const navigate = useNavigate();

  const [selectedCategory, setSelectedCategory] = useState<VehicleCategory>('car');
  const [manualPlate, setManualPlate] = useState('');
  const [isManualEntry, setIsManualEntry] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [entryResult, setEntryResult] = useState<any>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [plateError, setPlateError] = useState<string | null>(null);
  const [confirmedPlate, setConfirmedPlate] = useState('');

  const getActivePlate = () => {
    if (confirmedPlate) return confirmedPlate;
    if (isManualEntry) return manualPlate;
    return '';
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
      toast.success(`Patente ${plate} confirmada`);
    }
  };

  const handleOpenManual = () => {
    setIsManualEntry(true);
    setConfirmedPlate('');
    setPlateError(null);
    setManualPlate('');
  };

  const handleConfirmEntry = async () => {
    const plate = getActivePlate();
    if (!plate) return;

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

  const categories: { value: VehicleCategory; label: string; icon: string }[] = [
    { value: 'car', label: 'Automóvil', icon: '🚗' },
    { value: 'motorcycle', label: 'Motocicleta', icon: '🏍️' },
    { value: 'van', label: 'Camioneta/SUV', icon: '🚙' },
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

      {/* Page Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Ingreso de Vehículo</h1>
          <p className="text-gray-500">Registrar nuevo vehículo ingresando a la instalación</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleOpenManual}
            className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2.5 rounded-xl font-medium transition-colors"
          >
            <Edit3 className="w-4 h-4" />
            Manual
          </button>
          <button
            onClick={() => setShowCamera(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium transition-colors shadow-sm"
          >
            <Camera className="w-5 h-5" />
            Abrir Cámara
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Detection Panel */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-gray-900">Patente del Vehículo</h2>
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
                <button
                  onClick={() => setShowCamera(true)}
                  className="mt-3 w-full text-xs text-blue-600 hover:text-blue-700 text-center py-1"
                >
                  ↩ Cambiar patente
                </button>
              </div>
            )}

            {/* No plate selected */}
            {!isManualEntry && !confirmedPlate && (
              <div className="text-center py-8 mb-4">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Car className="w-10 h-10 text-gray-300" />
                </div>
                <p className="text-gray-400 mb-5">Sin patente ingresada</p>
                <div className="flex justify-center gap-3">
                  <button
                    onClick={() => setShowCamera(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white py-2.5 px-5 rounded-xl font-medium flex items-center gap-2 text-sm transition-colors"
                  >
                    <Camera className="w-4 h-4" />
                    Abrir Cámara
                  </button>
                  <button
                    onClick={handleOpenManual}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 px-5 rounded-xl font-medium flex items-center gap-2 text-sm transition-colors"
                  >
                    <Edit3 className="w-4 h-4" />
                    Ingresar Manual
                  </button>
                </div>
              </div>
            )}

            {/* Manual Entry */}
            {isManualEntry && (
              <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                    <Edit3 className="w-4 h-4 text-gray-500" />
                    Ingreso Manual
                  </label>
                  {confirmedPlate || (
                    <button
                      onClick={() => { setIsManualEntry(false); setManualPlate(''); setPlateError(null); }}
                      className="text-xs text-gray-400 hover:text-gray-600"
                    >
                      Cancelar
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  value={manualPlate}
                  onChange={(e) => handleManualPlateChange(e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-xl tracking-widest uppercase text-center transition-all ${
                    plateError ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-gray-50'
                  }`}
                  placeholder="ABC123 o AB123CD"
                  maxLength={7}
                  autoFocus
                />
                <p className="text-xs text-gray-400 text-center">
                  Formatos válidos: ABC123 · AB123CD
                </p>
              </div>
            )}

            {/* Plate Error */}
            {plateError && (
              <div className="mt-3 flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-800">{plateError}</p>
                  {plateError.includes('ya registrada') && (
                    <p className="text-xs text-red-600 mt-1">
                      El vehículo ya se encuentra dentro del estacionamiento.
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
                  ? subscriber.status === 'active' ? '✅ Abono mensual activo — Sin cargo' : '⚠️ Abono vencido'
                  : `🏷️ ${subscriber.discount}% de descuento`}
              </p>
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
              <div className="grid grid-cols-3 gap-2.5">
                {categories.map((category) => (
                  <button
                    key={category.value}
                    onClick={() => setSelectedCategory(category.value)}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      selectedCategory === category.value
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="text-2xl mb-1.5">{category.icon}</div>
                    <div className="text-xs font-medium text-gray-900">{category.label}</div>
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
                    <span className="text-sm font-medium text-gray-500">Use la cámara o ingrese la patente manualmente</span>
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
