import React, { useEffect, useState } from 'react';
import { useParking } from '../contexts/ParkingContext';
import { Camera, Zap } from 'lucide-react';

export const LPRSimulator: React.FC = () => {
  const { simulateDetection } = useParking();
  const [isScanning, setIsScanning] = useState(false);

  const handleSimulate = () => {
    setIsScanning(true);
    simulateDetection();
    setTimeout(() => setIsScanning(false), 1000);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Camera className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-medium text-gray-700">Cámara LPR</span>
        </div>
        <div
          className={`w-2 h-2 rounded-full ${
            isScanning ? 'bg-green-500 animate-pulse' : 'bg-gray-300'
          }`}
        />
      </div>

      <div className="bg-gray-900 rounded-lg aspect-video flex items-center justify-center mb-3 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10" />
        {isScanning && (
          <div className="absolute inset-0 border-2 border-blue-500 animate-pulse" />
        )}
        <div className="relative text-gray-600 text-center p-4">
          <Camera className="w-12 h-12 mx-auto mb-2 opacity-50" />
          <p className="text-xs">Monitoreando entrada/salida</p>
        </div>
      </div>

      <button
        onClick={handleSimulate}
        disabled={isScanning}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-2 px-3 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors"
      >
        <Zap className="w-4 h-4" />
        {isScanning ? 'Escaneando...' : 'Simular Detección'}
      </button>
    </div>
  );
};
