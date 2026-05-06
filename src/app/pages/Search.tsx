import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { useParking } from '../contexts/ParkingContext';
import {
  Search as SearchIcon,
  Car,
  AlertCircle,
  X,
  Clock,
  DollarSign,
  CheckCircle,
  LogOut,
  Star,
  Banknote,
  CreditCard,
  Gift,
} from 'lucide-react';
import { formatDuration, translateCategory, getCategoryIcon } from '../data/mockData';

export const Search: React.FC = () => {
  const { vehicles, getSubscriberByPlate } = useParking();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);

  const filteredVehicles = vehicles.filter(
    (v) =>
      searchTerm === '' ||
      v.licensePlate.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeVehicles = filteredVehicles.filter((v) => !v.exitTime);
  const exitedVehicles = filteredVehicles.filter((v) => v.exitTime);

  return (
    <div className="max-w-6xl mx-auto">
      {/* Vehicle Detail Modal */}
      {selectedVehicle && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="font-bold text-gray-900">Detalles del Vehículo</h2>
              <button onClick={() => setSelectedVehicle(null)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Plate */}
              <div className="bg-gray-900 text-white rounded-xl p-5 text-center">
                <div className="text-xs text-gray-400 mb-1">
                  {getCategoryIcon(selectedVehicle.category)} {translateCategory(selectedVehicle.category)}
                </div>
                <div className="text-4xl font-bold font-mono tracking-widest">
                  {selectedVehicle.licensePlate}
                </div>
              </div>

              {/* Subscriber info */}
              {(() => {
                const sub = getSubscriberByPlate(selectedVehicle.licensePlate);
                if (!sub) return null;
                return (
                  <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
                    <div>
                      <p className="text-sm font-medium text-amber-800">{sub.name}</p>
                      <p className="text-xs text-amber-600">
                        {sub.type === 'monthly' ? 'Abonado mensual' : `${sub.discount}% descuento`} · {sub.status === 'active' ? 'Activo' : 'Inactivo'}
                      </p>
                    </div>
                  </div>
                );
              })()}

              {/* Details */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
                  <div className="flex items-center gap-1.5 text-gray-500 mb-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span className="text-xs font-medium">Entrada</span>
                  </div>
                  <div className="text-sm font-semibold text-gray-900">
                    {new Date(selectedVehicle.entryTime).toLocaleString('es-CL')}
                  </div>
                </div>

                {selectedVehicle.exitTime ? (
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
                    <div className="flex items-center gap-1.5 text-gray-500 mb-1">
                      <Clock className="w-3.5 h-3.5" />
                      <span className="text-xs font-medium">Salida</span>
                    </div>
                    <div className="text-sm font-semibold text-gray-900">
                      {new Date(selectedVehicle.exitTime).toLocaleString('es-CL')}
                    </div>
                  </div>
                ) : (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                    <div className="text-xs font-medium text-blue-600 mb-1">Duración actual</div>
                    <div className="text-sm font-semibold text-blue-800">
                      {formatDuration(Math.round((Date.now() - new Date(selectedVehicle.entryTime).getTime()) / (1000 * 60)))}
                    </div>
                  </div>
                )}

                {selectedVehicle.duration && (
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
                    <div className="text-xs font-medium text-gray-500 mb-1">Duración total</div>
                    <div className="text-sm font-semibold text-gray-900">{formatDuration(selectedVehicle.duration)}</div>
                  </div>
                )}

                {selectedVehicle.paymentMethod && (
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-3">
                    <div className="flex items-center gap-1.5 text-gray-500 mb-1">
                      {selectedVehicle.paymentMethod === 'cash' ? <Banknote className="w-3.5 h-3.5" /> : <CreditCard className="w-3.5 h-3.5" />}
                      <span className="text-xs font-medium">Medio de pago</span>
                    </div>
                    <div className="text-sm font-semibold text-gray-900">
                      {selectedVehicle.paymentMethod === 'cash' ? 'Efectivo' : 'Tarjeta'}
                    </div>
                  </div>
                )}
              </div>

              {/* Amount */}
              {selectedVehicle.exitTime && (
                <div className={`rounded-xl p-4 text-center border-2 ${selectedVehicle.isFreeExit ? 'bg-blue-50 border-blue-200' : 'bg-green-50 border-green-200'}`}>
                  {selectedVehicle.isFreeExit ? (
                    <div className="flex items-center justify-center gap-2 text-blue-700">
                      <Gift className="w-5 h-5" />
                      <span className="font-semibold">Salida sin cargo (&lt;5 min)</span>
                    </div>
                  ) : (
                    <>
                      <div className="text-xs text-gray-500 mb-1">Monto pagado</div>
                      <div className="text-3xl font-bold text-green-600">${selectedVehicle.amount?.toFixed(2)}</div>
                    </>
                  )}
                </div>
              )}

              {selectedVehicle.hasError && (
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                  <p className="text-sm text-red-800">{selectedVehicle.errorMessage || 'Error detectado en este vehículo'}</p>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button onClick={() => setSelectedVehicle(null)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 rounded-xl font-medium transition-colors">
                  Cerrar
                </button>
                {!selectedVehicle.exitTime && (
                  <button
                    onClick={() => { setSelectedVehicle(null); navigate('/exit'); }}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Procesar Salida
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Búsqueda de Vehículos</h1>
        <p className="text-gray-500">Buscar y consultar historial de vehículos</p>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 mb-6">
        <div className="relative">
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value.toUpperCase())}
            className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-lg uppercase tracking-wider"
            placeholder="Buscar por patente (ej. ABC123)"
          />
        </div>
        {searchTerm && (
          <p className="text-sm text-gray-500 mt-2">
            {filteredVehicles.length} resultado{filteredVehicles.length !== 1 ? 's' : ''} para "{searchTerm}"
          </p>
        )}
      </div>

      {/* Results */}
      <div className="space-y-5">
        {/* Active Vehicles */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between p-5 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">
              Vehículos Activos{' '}
              <span className="text-gray-400 font-normal">({activeVehicles.length})</span>
            </h2>
            <span className="text-xs bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full font-medium">Estacionados ahora</span>
          </div>

          {activeVehicles.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <Car className="w-10 h-10 mx-auto mb-2 text-gray-200" />
              <p className="text-sm">No hay vehículos activos</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-3 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Patente</th>
                    <th className="text-left py-3 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Categoría</th>
                    <th className="text-left py-3 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Entrada</th>
                    <th className="text-left py-3 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Duración</th>
                    <th className="text-left py-3 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Estado</th>
                    <th className="text-left py-3 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wide"></th>
                  </tr>
                </thead>
                <tbody>
                  {activeVehicles.map((vehicle) => {
                    const duration = Math.round((Date.now() - new Date(vehicle.entryTime).getTime()) / (1000 * 60));
                    const sub = getSubscriberByPlate(vehicle.licensePlate);
                    return (
                      <tr key={vehicle.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                        <td className="py-3.5 px-5">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-semibold text-gray-900">{vehicle.licensePlate}</span>
                            {sub && <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />}
                          </div>
                        </td>
                        <td className="py-3.5 px-5">
                          <span className="text-sm text-gray-700">{getCategoryIcon(vehicle.category)} {translateCategory(vehicle.category)}</span>
                        </td>
                        <td className="py-3.5 px-5 text-sm text-gray-600">
                          {new Date(vehicle.entryTime).toLocaleString('es-CL')}
                        </td>
                        <td className="py-3.5 px-5">
                          <span className="font-medium text-gray-900">{formatDuration(duration)}</span>
                        </td>
                        <td className="py-3.5 px-5">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                            Estacionado
                          </span>
                        </td>
                        <td className="py-3.5 px-5">
                          <button
                            onClick={() => setSelectedVehicle(vehicle)}
                            className="text-blue-600 hover:text-blue-700 text-sm font-medium hover:underline"
                          >
                            Ver →
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Exited Vehicles */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between p-5 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">
              Historial de Salidas{' '}
              <span className="text-gray-400 font-normal">({exitedVehicles.length})</span>
            </h2>
            <span className="text-xs bg-green-100 text-green-700 px-2.5 py-1 rounded-full font-medium">Completadas</span>
          </div>

          {exitedVehicles.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <CheckCircle className="w-10 h-10 mx-auto mb-2 text-gray-200" />
              <p className="text-sm">No hay transacciones completadas</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-3 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Patente</th>
                    <th className="text-left py-3 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Categoría</th>
                    <th className="text-left py-3 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Duración</th>
                    <th className="text-left py-3 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Monto</th>
                    <th className="text-left py-3 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Pago</th>
                    <th className="text-left py-3 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Salida</th>
                    <th className="text-left py-3 px-5 text-xs font-semibold text-gray-500 uppercase tracking-wide"></th>
                  </tr>
                </thead>
                <tbody>
                  {exitedVehicles.map((vehicle) => (
                    <tr key={vehicle.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="py-3.5 px-5">
                        <span className="font-mono font-semibold text-gray-900">{vehicle.licensePlate}</span>
                      </td>
                      <td className="py-3.5 px-5 text-sm text-gray-600">
                        {getCategoryIcon(vehicle.category)} {translateCategory(vehicle.category)}
                      </td>
                      <td className="py-3.5 px-5 text-sm text-gray-700">
                        {formatDuration(vehicle.duration || 0)}
                      </td>
                      <td className="py-3.5 px-5">
                        {vehicle.isFreeExit ? (
                          <span className="text-xs text-blue-600 font-medium bg-blue-50 px-2 py-0.5 rounded-full">Sin cargo</span>
                        ) : (
                          <span className="font-semibold text-green-600">${vehicle.amount?.toFixed(2)}</span>
                        )}
                      </td>
                      <td className="py-3.5 px-5">
                        {vehicle.paymentMethod ? (
                          <div className="flex items-center gap-1 text-xs text-gray-600">
                            {vehicle.paymentMethod === 'cash' ? <Banknote className="w-3.5 h-3.5" /> : <CreditCard className="w-3.5 h-3.5" />}
                            {vehicle.paymentMethod === 'cash' ? 'Efectivo' : 'Tarjeta'}
                          </div>
                        ) : '-'}
                      </td>
                      <td className="py-3.5 px-5 text-sm text-gray-600">
                        {vehicle.exitTime ? new Date(vehicle.exitTime).toLocaleString('es-CL') : '-'}
                      </td>
                      <td className="py-3.5 px-5">
                        <button
                          onClick={() => setSelectedVehicle(vehicle)}
                          className="text-blue-600 hover:text-blue-700 text-sm font-medium hover:underline"
                        >
                          Ver →
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
