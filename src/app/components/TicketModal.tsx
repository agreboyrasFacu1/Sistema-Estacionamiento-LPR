import React from 'react';
import { X, Printer, CheckCircle, Car, Clock, DollarSign, CreditCard, Banknote, Gift } from 'lucide-react';
import { VehicleEntry } from '../types';
import { formatDuration, translateCategory, getCategoryIcon } from '../data/mockData';
import { formatCurrencyARSWithCents } from '../utils/currency';

interface TicketModalProps {
  isOpen: boolean;
  vehicle: VehicleEntry | null;
  onClose: () => void;
  onNewTransaction: () => void;
}

export const TicketModal: React.FC<TicketModalProps> = ({
  isOpen,
  vehicle,
  onClose,
  onNewTransaction,
}) => {
  if (!isOpen || !vehicle) return null;

  const entryTime = new Date(vehicle.entryTime);
  const exitTime = vehicle.exitTime ? new Date(vehicle.exitTime) : new Date();
  const ticketNumber = vehicle.ticketNumber || `TKT-${vehicle.id.padStart(8, '0')}`;
  const isNoCharge =
    vehicle.paymentMethod === 'no_charge' ||
    vehicle.paymentMethod === 'subscriber' ||
    (vehicle.amount || 0) === 0;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-start justify-center z-50 p-4 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[calc(100dvh-2rem)] overflow-hidden my-4 flex flex-col">
        {/* Header */}
        <div className="bg-green-600 px-6 py-5 text-white flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-6 h-6" />
              </div>
              <div>
                <h2 className="font-bold text-lg">
                  {isNoCharge ? 'Salida Sin Cargo' : 'Pago Completado'}
                </h2>
                <p className="text-green-100 text-sm">Transacción exitosa</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Ticket content */}
        <div className="p-6 overflow-y-auto">
          {/* Establishment header */}
          <div className="text-center mb-5 pb-4 border-b border-dashed border-gray-300">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-2">
              <span className="text-white font-bold">P</span>
            </div>
            <h3 className="font-bold text-gray-900 text-sm">ESTACIONAMIENTO CENTRAL</h3>
            <p className="text-xs text-gray-500">Control de Acceso Automatizado LPR</p>
            <p className="text-xs text-gray-400 mt-1">Ticket N° {ticketNumber}</p>
          </div>

          {/* Vehicle info */}
          <div className="bg-gray-900 rounded-xl p-4 mb-4 text-center">
            <div className="text-xs text-gray-400 mb-1">{getCategoryIcon(vehicle.category)} {translateCategory(vehicle.category)}</div>
            <div className="text-3xl font-bold text-white font-mono tracking-widest">
              {vehicle.licensePlate}
            </div>
          </div>

          {/* Time details */}
          <div className="space-y-2.5 mb-4">
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <div className="flex items-center gap-2 text-gray-600">
                <Clock className="w-4 h-4 text-blue-500" />
                <span className="text-sm">Hora de Entrada</span>
              </div>
              <span className="text-sm font-semibold text-gray-900">
                {entryTime.toLocaleString('es-CL')}
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <div className="flex items-center gap-2 text-gray-600">
                <Clock className="w-4 h-4 text-green-500" />
                <span className="text-sm">Hora de Salida</span>
              </div>
              <span className="text-sm font-semibold text-gray-900">
                {exitTime.toLocaleString('es-CL')}
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-100">
              <div className="flex items-center gap-2 text-gray-600">
                <Car className="w-4 h-4 text-purple-500" />
                <span className="text-sm">Tiempo de Estadía</span>
              </div>
              <span className="text-sm font-semibold text-gray-900">
                {formatDuration(vehicle.duration || 0)}
              </span>
            </div>
            {vehicle.paymentMethod && !isNoCharge && (
              <div className="flex items-center justify-between py-2 border-b border-gray-100">
                <div className="flex items-center gap-2 text-gray-600">
                  {vehicle.paymentMethod === 'cash' ? (
                    <Banknote className="w-4 h-4 text-emerald-500" />
                  ) : vehicle.paymentMethod === 'mixed' ? (
                    <div className="flex gap-0.5">
                      <Banknote className="w-4 h-4 text-emerald-500" />
                      <CreditCard className="w-4 h-4 text-indigo-500" />
                    </div>
                  ) : (
                    <CreditCard className="w-4 h-4 text-indigo-500" />
                  )}
                  <span className="text-sm">Medio de Pago</span>
                </div>
                <span className="text-sm font-semibold text-gray-900">
                  {vehicle.paymentMethod === 'cash'
                    ? 'Efectivo'
                    : vehicle.paymentMethod === 'mixed'
                    ? 'Mixto'
                    : 'Tarjeta'}
                </span>
              </div>
            )}
            {vehicle.paymentMethod === 'mixed' && vehicle.paymentBreakdown && (
              <div className="py-2 border-b border-gray-100 text-xs text-gray-500 space-y-1">
                {vehicle.paymentBreakdown.map((item) => (
                  <div key={item.method} className="flex justify-between">
                    <span>{item.method === 'cash' ? 'Efectivo' : 'Tarjeta'}</span>
                    <span className="font-semibold text-gray-800">
                      {formatCurrencyARSWithCents(item.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Amount */}
          {isNoCharge ? (
            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 text-center mb-5">
              <div className="flex items-center justify-center gap-2 text-blue-700 mb-1">
                <Gift className="w-5 h-5" />
                <span className="font-semibold">Sin Cargo</span>
              </div>
              <p className="text-sm text-blue-600">
                Ticket interno sin cobro por abonado activo o regla operativa
              </p>
            </div>
          ) : (
            <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 text-center mb-5">
              <div className="flex items-center justify-center gap-2 text-gray-600 mb-1">
                <DollarSign className="w-4 h-4" />
                <span className="text-sm font-medium">Monto Total Pagado</span>
              </div>
              <div className="text-4xl font-bold text-green-600">
                {formatCurrencyARSWithCents(vehicle.amount || 0)}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="text-center text-xs text-gray-400 mb-5 pb-4 border-b border-dashed border-gray-300">
            <p>Gracias por usar nuestro estacionamiento</p>
            <p>Conserve este comprobante</p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handlePrint}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-4 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors"
            >
              <Printer className="w-4 h-4" />
              Imprimir
            </button>
            <button
              onClick={onNewTransaction}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-xl font-medium transition-colors shadow-sm"
            >
              Nueva Transacción
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
