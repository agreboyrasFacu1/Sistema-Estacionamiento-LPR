import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { useParking } from '../contexts/ParkingContext';
import {
  Search as SearchIcon,
  Car,
  AlertCircle,
  X,
  Clock,
  CheckCircle,
  LogOut,
  Star,
  Banknote,
  CreditCard,
  Gift,
  FileX,
  Printer,
} from 'lucide-react';
import { formatDuration, translateCategory, getCategoryIcon, formatCurrency, getEffectiveSubscriberStatus } from '../data/mockData';
import { VehicleEntry } from '../types';

const LostTicketModal: React.FC<{
  vehicles: VehicleEntry[];
  onClose: () => void;
  onProcessExit: (vehicle: VehicleEntry) => void;
  getSubscriberByPlate: (plate: string) => any;
}> = ({ vehicles, onClose, onProcessExit, getSubscriberByPlate }) => {
  const [query, setQuery] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleEntry | null>(null);

  const activeVehicles = vehicles.filter((v) => !v.exitTime);
  const filtered = query
    ? activeVehicles.filter((v) => v.licensePlate.includes(query.toUpperCase()))
    : activeVehicles;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-amber-50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-amber-100 rounded-lg flex items-center justify-center">
              <FileX className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h2 className="font-bold text-gray-900">Ticket Extraviado</h2>
              <p className="text-xs text-gray-500">Busque el vehículo y reemita el ticket</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-amber-100 rounded-lg text-gray-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {!selectedVehicle ? (
            <>
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  autoFocus
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono uppercase text-sm"
                  placeholder="Buscar patente parcial o completa (ej: ABC o ABC123)"
                />
              </div>

              <div className="max-h-72 overflow-y-auto space-y-2">
                {filtered.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <Car className="w-10 h-10 mx-auto mb-2 text-gray-200" />
                    <p className="text-sm">
                      {query ? `No se encontraron vehículos con "${query}"` : 'No hay vehículos activos'}
                    </p>
                  </div>
                ) : (
                  filtered.map((vehicle) => {
                    const dur = Math.round((Date.now() - new Date(vehicle.entryTime).getTime()) / (1000 * 60));
                    const sub = getSubscriberByPlate(vehicle.licensePlate);
                    return (
                      <button
                        key={vehicle.id}
                        onClick={() => setSelectedVehicle(vehicle)}
                        className="w-full text-left p-3.5 bg-gray-50 hover:bg-amber-50 hover:border-amber-300 border border-transparent rounded-xl transition-all"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-gray-900">{vehicle.licensePlate}</span>
                              {sub && <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />}
                            </div>
                            <div className="text-xs text-gray-500 mt-0.5">
                              {getCategoryIcon(vehicle.category)} {translateCategory(vehicle.category)} ·
                              Entrada: {new Date(vehicle.entryTime).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-semibold text-amber-700">{formatDuration(dur)}</div>
                            <div className="text-xs text-gray-400">estacionado</div>
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>

              {query && filtered.length > 0 && (
                <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2.5">
                  ⚠ Verifique físicamente que el vehículo corresponde a la patente antes de emitir el ticket
                </p>
              )}
            </>
          ) : (
            /* Selected vehicle — show ticket preview */
            <div className="space-y-4">
              <button
                onClick={() => setSelectedVehicle(null)}
                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700"
              >
                ← Volver a la búsqueda
              </button>

              <div className="border-2 border-amber-200 rounded-xl overflow-hidden">
                <div className="bg-amber-600 text-white p-4 text-center">
                  <p className="text-xs text-amber-100 mb-1">TICKET DE INGRESO REEMITIDO</p>
                  <div className="text-3xl font-bold font-mono tracking-widest">{selectedVehicle.licensePlate}</div>
                </div>
                <div className="p-4 space-y-3 bg-white">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />Hora de ingreso
                    </span>
                    <span className="font-semibold">{new Date(selectedVehicle.entryTime).toLocaleString('es-CL')}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Categoría</span>
                    <span className="font-semibold">{getCategoryIcon(selectedVehicle.category)} {translateCategory(selectedVehicle.category)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Tiempo transcurrido</span>
                    <span className="font-semibold text-amber-700">
                      {formatDuration(Math.round((Date.now() - new Date(selectedVehicle.entryTime).getTime()) / (1000 * 60)))}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handlePrint}
                  className="flex-1 bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-700 py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors"
                >
                  <Printer className="w-4 h-4" />
                  Imprimir Ticket
                </button>
                <button
                  onClick={() => { onClose(); onProcessExit(selectedVehicle); }}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Procesar Salida
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const Search: React.FC = () => {
  const { vehicles, getSubscriberByPlate } = useParking();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  const [showLostTicket, setShowLostTicket] = useState(false);

  const filteredVehicles = vehicles.filter(
    (v) => searchTerm === '' || v.licensePlate.toLowerCase().includes(searchTerm.toLowerCase())
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
              <button onClick={() => setSelectedVehicle(null)} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-gray-900 text-white rounded-xl p-5 text-center">
                <div className="text-xs text-gray-400 mb-1">
                  {getCategoryIcon(selectedVehicle.category)} {translateCategory(selectedVehicle.category)}
                </div>
                <div className="text-4xl font-bold font-mono tracking-widest">{selectedVehicle.licensePlate}</div>
              </div>

              {(() => {
                const sub = getSubscriberByPlate(selectedVehicle.licensePlate);
                if (!sub) return null;
                const effStatus = getEffectiveSubscriberStatus(sub);
                return (
                  <div className={`flex items-center gap-2 p-3 rounded-lg border ${effStatus === 'expired' ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'}`}>
                    <Star className={`w-4 h-4 flex-shrink-0 ${effStatus === 'expired' ? 'text-red-500' : 'text-amber-500 fill-amber-400'}`} />
                    <div>
                      <p className={`text-sm font-medium ${effStatus === 'expired' ? 'text-red-800' : 'text-amber-800'}`}>{sub.name}</p>
                      <p className={`text-xs ${effStatus === 'expired' ? 'text-red-600' : 'text-amber-600'}`}>
                        {sub.type === 'monthly'
                          ? effStatus === 'expired' ? '⚠ Abono VENCIDO — se cobra tarifa normal' : 'Abono mensual ACTIVO'
                          : `${sub.discount}% descuento`}
                      </p>
                    </div>
                  </div>
                );
              })()}

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
                      {selectedVehicle.paymentMethod === 'cash' ? 'Efectivo' : selectedVehicle.paymentMethod === 'card' ? 'Tarjeta' : 'Combinado'}
                    </div>
                  </div>
                )}
              </div>

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
                      <div className="text-2xl font-bold text-green-600">{formatCurrency(selectedVehicle.amount ?? 0)}</div>
                      {selectedVehicle.paymentSplit && (
                        <div className="text-xs text-gray-400 mt-1">
                          Efectivo {formatCurrency(selectedVehicle.paymentSplit.cash)} + Tarjeta {formatCurrency(selectedVehicle.paymentSplit.card)}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {selectedVehicle.hasError && (
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                  <p className="text-sm text-red-800">{selectedVehicle.errorMessage || 'Error detectado'}</p>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button onClick={() => setSelectedVehicle(null)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 rounded-xl font-medium">
                  Cerrar
                </button>
                {!selectedVehicle.exitTime && (
                  <button
                    onClick={() => { setSelectedVehicle(null); navigate('/exit'); }}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2.5 rounded-xl font-medium flex items-center justify-center gap-2"
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

      {/* Lost Ticket Modal */}
      {showLostTicket && (
        <LostTicketModal
          vehicles={vehicles}
          onClose={() => setShowLostTicket(false)}
          onProcessExit={(vehicle) => navigate('/exit')}
          getSubscriberByPlate={getSubscriberByPlate}
        />
      )}

      {/* Page Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Búsqueda de Vehículos</h1>
          <p className="text-gray-500">Buscar y consultar historial de vehículos</p>
        </div>
        <button
          onClick={() => setShowLostTicket(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-colors border bg-amber-50 border-amber-300 text-amber-700 hover:bg-amber-100"
        >
          <FileX className="w-4 h-4" />
          Ticket Extraviado
        </button>
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
              <p className="text-sm">
                {searchTerm ? `No hay vehículos activos con patente "${searchTerm}"` : 'No hay vehículos activos'}
              </p>
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
                        <td className="py-3.5 px-5 text-sm text-gray-700">
                          {getCategoryIcon(vehicle.category)} {translateCategory(vehicle.category)}
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
                            className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline"
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
                      <td className="py-3.5 px-5 font-mono font-semibold text-gray-900">{vehicle.licensePlate}</td>
                      <td className="py-3.5 px-5 text-sm text-gray-600">
                        {getCategoryIcon(vehicle.category)} {translateCategory(vehicle.category)}
                      </td>
                      <td className="py-3.5 px-5 text-sm text-gray-700">{formatDuration(vehicle.duration || 0)}</td>
                      <td className="py-3.5 px-5">
                        {vehicle.isFreeExit ? (
                          <span className="text-xs text-blue-600 font-medium bg-blue-50 px-2 py-0.5 rounded-full">Sin cargo</span>
                        ) : (
                          <span className="font-semibold text-green-600">{formatCurrency(vehicle.amount ?? 0)}</span>
                        )}
                      </td>
                      <td className="py-3.5 px-5">
                        {vehicle.paymentMethod ? (
                          <div className="flex items-center gap-1 text-xs text-gray-600">
                            {vehicle.paymentMethod === 'cash' ? (
                              <><Banknote className="w-3.5 h-3.5" />Efectivo</>
                            ) : vehicle.paymentMethod === 'card' ? (
                              <><CreditCard className="w-3.5 h-3.5" />Tarjeta</>
                            ) : (
                              <>
                                <Banknote className="w-3.5 h-3.5" />
                                <CreditCard className="w-3.5 h-3.5" />
                                Combinado
                              </>
                            )}
                          </div>
                        ) : '-'}
                      </td>
                      <td className="py-3.5 px-5 text-sm text-gray-600">
                        {vehicle.exitTime ? new Date(vehicle.exitTime).toLocaleString('es-CL') : '-'}
                      </td>
                      <td className="py-3.5 px-5">
                        <button onClick={() => setSelectedVehicle(vehicle)} className="text-blue-600 hover:text-blue-700 text-sm font-medium hover:underline">
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
