import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { useParking } from '../contexts/ParkingContext';
import { useAuth } from '../contexts/AuthContext';
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2,
  RefreshCw,
  Car,
} from 'lucide-react';
import { VehicleCategory } from '../types';
import { translateCategory } from '../data/mockData';

export const VehicleEntry: React.FC = () => {
  const { currentDetection, simulateDetection, addVehicleEntry } =
    useParking();
  const { isTrainingMode } = useAuth();
  const navigate = useNavigate();

  const [selectedCategory, setSelectedCategory] =
    useState<VehicleCategory>('car');
  const [manualPlate, setManualPlate] = useState('');
  const [isManualEntry, setIsManualEntry] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [entryResult, setEntryResult] = useState<any>(null);

  useEffect(() => {
    // Auto-detect on mount
    simulateDetection();
  }, []);

  const handleConfirmEntry = async () => {
    setIsProcessing(true);

    try {
      const plate = isManualEntry
        ? manualPlate
        : currentDetection?.plate || '';

      if (!plate) {
        return;
      }

      const result = await addVehicleEntry(plate, selectedCategory);
      setEntryResult(result);
      setShowSuccess(true);

      // Reset after 3 seconds
      setTimeout(() => {
        setShowSuccess(false);
        navigate('/dashboard');
      }, 3000);
    } catch (error) {
      console.error('Entry error:', error);
      toast.error('Error al confirmar el ingreso. Por favor intente nuevamente.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleNewDetection = () => {
    simulateDetection();
    setIsManualEntry(false);
    setManualPlate('');
  };

  const detectedPlate = isManualEntry
    ? manualPlate
    : currentDetection?.plate || '';
  const isValid = isManualEntry
    ? manualPlate.length >= 5
    : currentDetection?.isValid || false;

  return (
    <div className="max-w-4xl mx-auto">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Ingreso de Vehículo
        </h1>
        <p className="text-gray-600">Registrar nuevo vehículo ingresando a la instalación</p>
      </div>

      {/* Success Modal */}
      {showSuccess && entryResult && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                ¡Ingreso Confirmado!
              </h2>
              <p className="text-gray-600 mb-6">
                Vehículo registrado exitosamente
              </p>

              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="text-3xl font-bold text-gray-900 font-mono mb-2">
                  {entryResult.licensePlate}
                </div>
                <div className="text-sm text-gray-600">
                  {translateCategory(entryResult.category)}
                </div>
                <div className="text-sm text-gray-500 mt-2">
                  {new Date(entryResult.entryTime).toLocaleString()}
                </div>
              </div>

              <p className="text-sm text-gray-500">
                Redirigiendo al panel de control...
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Detection Display */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900">
              Detección de Patente
            </h2>
            <button
              onClick={handleNewDetection}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title="Detectar Nueva Patente"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>

          {/* Detection Display */}
          {!isManualEntry && currentDetection ? (
            <div
              className={`p-8 rounded-xl border-2 mb-6 ${
                isValid
                  ? 'bg-green-50 border-green-300'
                  : 'bg-amber-50 border-amber-300'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-gray-600">
                  Auto-Detectado
                </span>
                {isValid ? (
                  <CheckCircle className="w-6 h-6 text-green-600" />
                ) : (
                  <AlertTriangle className="w-6 h-6 text-amber-600" />
                )}
              </div>

              <div className="text-4xl font-bold text-gray-900 tracking-wider font-mono text-center mb-4">
                {currentDetection.plate}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Confianza:</span>
                  <span className="font-semibold">
                    {(currentDetection.confidence * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      isValid ? 'bg-green-600' : 'bg-amber-600'
                    }`}
                    style={{ width: `${currentDetection.confidence * 100}%` }}
                  />
                </div>
              </div>

              {!isValid && (
                <div className="mt-4 p-3 bg-amber-100 rounded-lg">
                  <p className="text-sm text-amber-800">
                    ⚠️ Detección de baja confianza. Considere ingreso manual.
                  </p>
                </div>
              )}
            </div>
          ) : !isManualEntry ? (
            <div className="text-center py-12 mb-6">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Car className="w-10 h-10 text-gray-400" />
              </div>
              <p className="text-gray-500 mb-4">No se detectó patente</p>
              <button
                onClick={handleNewDetection}
                className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium inline-flex items-center gap-2 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Detectar Patente
              </button>
            </div>
          ) : null}

          {/* Manual Entry Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isManualEntry}
                  onChange={(e) => setIsManualEntry(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  Ingreso Manual de Patente
                </span>
              </label>
            </div>

            {isManualEntry && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ingresar Patente
                </label>
                <input
                  type="text"
                  value={manualPlate}
                  onChange={(e) =>
                    setManualPlate(e.target.value.toUpperCase())
                  }
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-lg tracking-wider uppercase"
                  placeholder="ABC123 o AB123CD"
                />
              </div>
            )}
          </div>

          {isTrainingMode && (
            <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="text-sm text-amber-800">
                <div className="font-semibold mb-1">💡 Consejo de Entrenamiento:</div>
                <p>
                  En producción, el sistema detecta automáticamente las patentes
                  usando cámaras. Use ingreso manual solo cuando la detección falle.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Entry Form */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">
            Detalles de Ingreso
          </h2>

          <div className="space-y-6">
            {/* License Plate Display */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Número de Patente
              </label>
              <div className="bg-gray-900 text-white p-4 rounded-lg text-center">
                <div className="text-3xl font-bold font-mono tracking-widest">
                  {detectedPlate || '---'}
                </div>
              </div>
            </div>

            {/* Vehicle Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Categoría de Vehículo
              </label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: 'car', label: 'Auto', icon: '🚗' },
                  { value: 'motorcycle', label: 'Moto', icon: '🏍️' },
                  { value: 'van', label: 'Camioneta/SUV', icon: '🚙' },
                  { value: 'truck', label: 'Camión', icon: '🚚' },
                ].map((category) => (
                  <button
                    key={category.value}
                    onClick={() =>
                      setSelectedCategory(category.value as VehicleCategory)
                    }
                    className={`p-4 rounded-lg border-2 transition-all ${
                      selectedCategory === category.value
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-2xl mb-2">{category.icon}</div>
                    <div className="text-sm font-medium text-gray-900">
                      {category.label}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Entry Time */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hora de Ingreso
              </label>
              <div className="bg-gray-50 p-3 rounded-lg text-gray-900 font-medium">
                {new Date().toLocaleString()}
              </div>
            </div>

            {/* Validation Status */}
            <div
              className={`p-4 rounded-lg ${
                isValid
                  ? 'bg-green-50 border border-green-200'
                  : 'bg-red-50 border border-red-200'
              }`}
            >
              <div className="flex items-center gap-2">
                {isValid ? (
                  <>
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <span className="text-sm font-medium text-green-800">
                      Listo para confirmar ingreso
                    </span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                    <span className="text-sm font-medium text-red-800">
                      Patente inválida - verifique la detección o ingrese manualmente
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-4 rounded-lg font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmEntry}
                disabled={!isValid || isProcessing}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-3 px-4 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
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