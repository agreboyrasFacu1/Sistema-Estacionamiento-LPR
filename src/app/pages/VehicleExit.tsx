import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { useParking } from '../contexts/ParkingContext';
import { useAuth } from '../contexts/AuthContext';
import {
  CheckCircle,
  AlertTriangle,
  Loader2,
  RefreshCw,
  DollarSign,
  Clock,
  Calendar,
  Printer,
} from 'lucide-react';
import { calculateParkingFee, formatDuration, translateCategory } from '../data/mockData';

export const VehicleExit: React.FC = () => {
  const {
    vehicles,
    currentDetection,
    simulateDetection,
    processExit,
    searchVehicle,
  } = useParking();
  const { isTrainingMode } = useAuth();
  const navigate = useNavigate();

  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  const [manualPlate, setManualPlate] = useState('');
  const [isManualSearch, setIsManualSearch] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [exitResult, setExitResult] = useState<any>(null);
  const [searchError, setSearchError] = useState('');

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
        setSearchError('Vehículo no encontrado en el sistema');
      }
    }
  }, [currentDetection]);

  const handleManualSearch = () => {
    setSearchError('');
    const vehicle = searchVehicle(manualPlate);
    if (vehicle) {
      setSelectedVehicle(vehicle);
    } else {
      setSelectedVehicle(null);
      setSearchError('Vehículo no encontrado. Verifique el número de placa.');
    }
  };

  const handleProcessExit = async () => {
    if (!selectedVehicle) return;

    setIsProcessing(true);

    try {
      const result = await processExit(selectedVehicle.id);
      setExitResult(result);
      setShowSuccess(true);
    } catch (error) {
      console.error('Exit error:', error);
      toast.error('Error al procesar salida. Por favor intente nuevamente.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePrintReceipt = () => {
    // Simulate printing
    alert('¡Recibo impreso exitosamente!');
  };

  const handleNewTransaction = () => {
    setShowSuccess(false);
    setSelectedVehicle(null);
    setManualPlate('');
    setSearchError('');
    simulateDetection();
  };

  const calculateCurrentFee = () => {
    if (!selectedVehicle) return 0;
    const entryTime = new Date(selectedVehicle.entryTime);
    const durationMinutes = Math.round(
      (Date.now() - entryTime.getTime()) / (1000 * 60)
    );
    return calculateParkingFee(selectedVehicle.category, durationMinutes);
  };

  const getCurrentDuration = () => {
    if (!selectedVehicle) return 0;
    const entryTime = new Date(selectedVehicle.entryTime);
    return Math.round((Date.now() - entryTime.getTime()) / (1000 * 60));
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Salida de Vehículos y Pago
        </h1>
        <p className="text-gray-600">Procesar salida de vehículo y cobrar pago</p>
      </div>

      {/* Success Modal */}
      {showSuccess && exitResult && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                ¡Pago Completado!
              </h2>
              <p className="text-gray-600 mb-6">
                Vehículo registrado exitosamente
              </p>

              <div className="bg-gray-50 rounded-lg p-6 mb-6 space-y-3">
                <div className="text-3xl font-bold text-gray-900 font-mono">
                  {exitResult.licensePlate}
                </div>
                <div className="text-sm text-gray-600">
                  Duración: {formatDuration(exitResult.duration || 0)}
                </div>
                <div className="text-3xl font-bold text-green-600">
                  ${exitResult.amount?.toFixed(2)}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handlePrintReceipt}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-4 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
                >
                  <Printer className="w-4 h-4" />
                  Imprimir Recibo
                </button>
                <button
                  onClick={handleNewTransaction}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-medium transition-colors"
                >
                  Nueva Transacción
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Search Section */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">
                Buscar Vehículo
              </h2>
              <button
                onClick={() => {
                  simulateDetection();
                  setIsManualSearch(false);
                }}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Nueva Detección"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
            </div>

            {/* Auto Detection */}
            {!isManualSearch && currentDetection && (
              <div className="mb-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-3">
                  <div className="text-sm text-blue-800 mb-2 font-medium">
                    Placa Auto-Detectada
                  </div>
                  <div className="text-2xl font-bold text-gray-900 font-mono">
                    {currentDetection.plate}
                  </div>
                </div>
              </div>
            )}

            {/* Manual Search */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={isManualSearch}
                  onChange={(e) => setIsManualSearch(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <label className="text-sm font-medium text-gray-700">
                  Búsqueda Manual
                </label>
              </div>

              {isManualSearch && (
                <div>
                  <input
                    type="text"
                    value={manualPlate}
                    onChange={(e) =>
                      setManualPlate(e.target.value.toUpperCase())
                    }
                    onKeyPress={(e) =>
                      e.key === 'Enter' && handleManualSearch()
                    }
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-lg uppercase mb-3"
                    placeholder="ABC-1234"
                  />
                  <button
                    onClick={handleManualSearch}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                  >
                    Buscar
                  </button>
                </div>
              )}
            </div>

            {/* Search Error */}
            {searchError && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-red-800">{searchError}</div>
                </div>
              </div>
            )}

            {isTrainingMode && (
              <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="text-sm text-amber-800">
                  <div className="font-semibold mb-1">💡 Consejo de Entrenamiento:</div>
                  <p>
                    El sistema detecta automáticamente la placa del vehículo que sale.
                    La búsqueda manual es solo para excepciones.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Current Parked Vehicles */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              Vehículos en la Instalación
            </h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {vehicles
                .filter((v) => !v.exitTime)
                .map((vehicle) => (
                  <button
                    key={vehicle.id}
                    onClick={() => setSelectedVehicle(vehicle)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      selectedVehicle?.id === vehicle.id
                        ? 'bg-blue-50 border border-blue-200'
                        : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    <div className="font-mono font-semibold text-gray-900">
                      {vehicle.licensePlate}
                    </div>
                    <div className="text-xs text-gray-600">
                      {translateCategory(vehicle.category)} •{' '}
                      {new Date(vehicle.entryTime).toLocaleTimeString()}
                    </div>
                  </button>
                ))}
            </div>
          </div>
        </div>

        {/* Payment Section */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">
              Resumen de Pago
            </h2>

            {selectedVehicle ? (
              <div className="space-y-6">
                {/* Vehicle Info */}
                <div className="bg-gray-900 text-white p-6 rounded-lg">
                  <div className="text-sm text-gray-400 mb-2">
                    Placa
                  </div>
                  <div className="text-4xl font-bold font-mono tracking-widest">
                    {selectedVehicle.licensePlate}
                  </div>
                  <div className="text-sm text-gray-400 mt-2">
                    {translateCategory(selectedVehicle.category)}
                  </div>
                </div>

                {/* Time Details */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 text-gray-600 mb-2">
                      <Calendar className="w-4 h-4" />
                      <span className="text-sm font-medium">Hora de Entrada</span>
                    </div>
                    <div className="text-lg font-semibold text-gray-900">
                      {new Date(selectedVehicle.entryTime).toLocaleString()}
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 text-gray-600 mb-2">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm font-medium">Duración</span>
                    </div>
                    <div className="text-lg font-semibold text-gray-900">
                      {formatDuration(getCurrentDuration())}
                    </div>
                  </div>
                </div>

                {/* Fee Calculation */}
                <div className="border-t border-gray-200 pt-6">
                  <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-gray-700 font-medium">
                        Monto Total
                      </span>
                      <DollarSign className="w-6 h-6 text-green-600" />
                    </div>
                    <div className="text-5xl font-bold text-green-600">
                      ${calculateCurrentFee().toFixed(2)}
                    </div>
                    <div className="text-sm text-gray-600 mt-2">
                      Tarifa de estacionamiento por {formatDuration(getCurrentDuration())}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => navigate('/dashboard')}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-4 px-4 rounded-lg font-medium transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleProcessExit}
                    disabled={isProcessing}
                    className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white py-4 px-4 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors text-lg"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Procesando...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-5 h-5" />
                        Confirmar Pago y Salida
                      </>
                    )}
                  </button>
                </div>

                {/* Warning for inconsistencies */}
                {getCurrentDuration() > 1440 && (
                  <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                      <div className="text-sm text-amber-800">
                        <div className="font-semibold mb-1">
                          Duración Prolongada Detectada
                        </div>
                        <p>
                          El vehículo ha estado estacionado por más de 24 horas. Por favor
                          verifique antes de procesar.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-16 text-gray-500">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <DollarSign className="w-10 h-10 text-gray-400" />
                </div>
                <p>Busque o detecte un vehículo para procesar la salida</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};