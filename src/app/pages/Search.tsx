import React, { useState } from 'react';
import { useParking } from '../contexts/ParkingContext';
import { Search as SearchIcon, Car, AlertCircle, Edit } from 'lucide-react';
import { formatDuration, translateCategory } from '../data/mockData';

export const Search: React.FC = () => {
  const { vehicles } = useParking();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const filteredVehicles = vehicles.filter(
    (v) =>
      searchTerm === '' ||
      v.licensePlate.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeVehicles = filteredVehicles.filter((v) => !v.exitTime);
  const exitedVehicles = filteredVehicles.filter((v) => v.exitTime);

  const handleEdit = (vehicle: any) => {
    setSelectedVehicle(vehicle);
    setShowEditModal(true);
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Buscar Vehículo
        </h1>
        <p className="text-gray-600">
          Buscar y gestionar vehículos en el sistema
        </p>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="relative">
          <SearchIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-lg uppercase"
            placeholder="Buscar por placa (ej. ABC-1234)"
          />
        </div>
      </div>

      {/* Results */}
      <div className="space-y-6">
        {/* Active Vehicles */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Vehículos Activos ({activeVehicles.length})
            </h2>
            <span className="text-sm text-gray-500">Actualmente estacionados</span>
          </div>

          {activeVehicles.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Car className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p>No se encontraron vehículos activos</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                      Placa
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                      Categoría
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                      Hora de Entrada
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                      Duración
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                      Estado
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {activeVehicles.map((vehicle) => {
                    const entryTime = new Date(vehicle.entryTime);
                    const duration = Math.round(
                      (Date.now() - entryTime.getTime()) / (1000 * 60)
                    );

                    return (
                      <tr
                        key={vehicle.id}
                        className="border-b border-gray-100 hover:bg-gray-50"
                      >
                        <td className="py-4 px-4">
                          <span className="font-mono font-semibold text-gray-900">
                            {vehicle.licensePlate}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-gray-700">
                            {translateCategory(vehicle.category)}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-gray-700">
                          {entryTime.toLocaleString()}
                        </td>
                        <td className="py-4 px-4">
                          <span className="font-medium text-gray-900">
                            {formatDuration(duration)}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Estacionado
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <button
                            onClick={() => handleEdit(vehicle)}
                            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                          >
                            Ver
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
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Salidas Recientes ({exitedVehicles.length})
            </h2>
            <span className="text-sm text-gray-500">Transacciones completadas</span>
          </div>

          {exitedVehicles.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p>No hay transacciones completadas</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                      Placa
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                      Categoría
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                      Duración
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                      Monto
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                      Hora de Salida
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                      Estado
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {exitedVehicles.map((vehicle) => (
                    <tr
                      key={vehicle.id}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="py-4 px-4">
                        <span className="font-mono font-semibold text-gray-900">
                          {vehicle.licensePlate}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-gray-700">
                          {translateCategory(vehicle.category)}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-gray-700">
                        {formatDuration(vehicle.duration || 0)}
                      </td>
                      <td className="py-4 px-4">
                        <span className="font-semibold text-green-600">
                          ${vehicle.amount?.toFixed(2)}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-gray-700">
                        {vehicle.exitTime
                          ? new Date(vehicle.exitTime).toLocaleString()
                          : '-'}
                      </td>
                      <td className="py-4 px-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Pagado
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Vehicle Detail Modal */}
      {showEditModal && selectedVehicle && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-lg w-full mx-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Detalles del Vehículo
              </h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-gray-900 text-white p-4 rounded-lg text-center">
                <div className="text-3xl font-bold font-mono">
                  {selectedVehicle.licensePlate}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">Categoría</div>
                  <div className="font-semibold text-gray-900">
                    {translateCategory(selectedVehicle.category)}
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">Estado</div>
                  <div className="font-semibold text-gray-900">
                    {selectedVehicle.exitTime ? 'Salió' : 'Estacionado'}
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">Hora de Entrada</div>
                  <div className="font-semibold text-gray-900 text-sm">
                    {new Date(selectedVehicle.entryTime).toLocaleString()}
                  </div>
                </div>

                {selectedVehicle.exitTime && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="text-sm text-gray-600 mb-1">Hora de Salida</div>
                    <div className="font-semibold text-gray-900 text-sm">
                      {new Date(selectedVehicle.exitTime).toLocaleString()}
                    </div>
                  </div>
                )}
              </div>

              {selectedVehicle.amount && (
                <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                  <div className="text-sm text-gray-600 mb-1">Monto Pagado</div>
                  <div className="text-2xl font-bold text-green-600">
                    ${selectedVehicle.amount.toFixed(2)}
                  </div>
                </div>
              )}

              {selectedVehicle.hasError && (
                <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                    <div className="text-sm text-red-800">
                      {selectedVehicle.errorMessage || 'Error detectado'}
                    </div>
                  </div>
                </div>
              )}

              <button
                onClick={() => setShowEditModal(false)}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-4 rounded-lg font-medium transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
