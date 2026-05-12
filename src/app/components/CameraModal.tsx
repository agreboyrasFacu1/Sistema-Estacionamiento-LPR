import React, { useState, useEffect, useRef } from 'react';
import {
  Camera,
  X,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Wifi,
  WifiOff,
  Loader2,
  ZoomIn,
} from 'lucide-react';
import { SIMULATED_PLATES, validatePlate } from '../data/mockData';

interface CameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPlateDetected: (plate: string) => void;
  title?: string;
}

type CameraState = 'initializing' | 'scanning' | 'detected' | 'error' | 'unavailable';

export const CameraModal: React.FC<CameraModalProps> = ({
  isOpen,
  onClose,
  onPlateDetected,
  title = 'Cámara LPR',
}) => {
  const [cameraState, setCameraState] = useState<CameraState>('initializing');
  const [detectedPlate, setDetectedPlate] = useState('');
  const [confidence, setConfidence] = useState(0);
  const [scanLineY, setScanLineY] = useState(0);
  const [dots, setDots] = useState(0);
  const [errorType, setErrorType] = useState<'camera' | 'network' | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dotsRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const scanRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startCamera = () => {
    setCameraState('initializing');
    setDetectedPlate('');
    setConfidence(0);
    setErrorType(null);

    // Simulate camera initialization
    timeoutRef.current = setTimeout(() => {
      // 10% chance of camera error
      const rand = Math.random();
      if (rand < 0.05) {
        setCameraState('unavailable');
        setErrorType('camera');
        return;
      }
      if (rand < 0.08) {
        setCameraState('error');
        setErrorType('network');
        return;
      }
      setCameraState('scanning');

      // Auto detect after 2-4 seconds
      const detectDelay = 2000 + Math.random() * 2000;
      timeoutRef.current = setTimeout(() => {
        const plate =
          SIMULATED_PLATES[Math.floor(Math.random() * SIMULATED_PLATES.length)];
        const conf = Math.random() * 0.25 + 0.75; // 75-100%
        setDetectedPlate(plate);
        setConfidence(conf);
        setCameraState('detected');
      }, detectDelay);
    }, 1200);
  };

  useEffect(() => {
    if (!isOpen) return;
    startCamera();
    return cleanup;
  }, [isOpen]);

  // Animate scan line
  useEffect(() => {
    if (cameraState !== 'scanning') {
      if (scanRef.current) clearInterval(scanRef.current);
      return;
    }
    let y = 0;
    let dir = 1;
    scanRef.current = setInterval(() => {
      y += dir * 2;
      if (y >= 100) dir = -1;
      if (y <= 0) dir = 1;
      setScanLineY(y);
    }, 16);
    return () => {
      if (scanRef.current) clearInterval(scanRef.current);
    };
  }, [cameraState]);

  // Animate dots
  useEffect(() => {
    dotsRef.current = setInterval(() => {
      setDots((d) => (d + 1) % 4);
    }, 500);
    return () => {
      if (dotsRef.current) clearInterval(dotsRef.current);
    };
  }, []);

  const cleanup = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (dotsRef.current) clearInterval(dotsRef.current);
    if (scanRef.current) clearInterval(scanRef.current);
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
  };

  const handleAccept = () => {
    if (detectedPlate && validatePlate(detectedPlate)) {
      onPlateDetected(detectedPlate);
      onClose();
    }
  };

  const handleRetry = () => {
    cleanup();
    startCamera();
  };

  const handleClose = () => {
    cleanup();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center">
              <Camera className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">{title}</h2>
              <p className="text-xs text-gray-500">Reconocimiento automático de patentes</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Camera View */}
        <div className="relative bg-gray-950 mx-6 mt-5 rounded-xl overflow-hidden" style={{ aspectRatio: '16/9' }}>
          {/* Background noise/grain effect */}
          <div className="absolute inset-0 opacity-5"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
            }}
          />

          {/* Camera grid overlay */}
          <div className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: 'linear-gradient(rgba(59,130,246,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.3) 1px, transparent 1px)',
              backgroundSize: '40px 40px',
            }}
          />

          {/* Corner brackets - targeting reticle */}
          {(cameraState === 'scanning' || cameraState === 'detected') && (
            <>
              {/* Top-left */}
              <div className="absolute top-6 left-6 w-10 h-10 border-t-2 border-l-2 border-blue-400 opacity-80" />
              {/* Top-right */}
              <div className="absolute top-6 right-6 w-10 h-10 border-t-2 border-r-2 border-blue-400 opacity-80" />
              {/* Bottom-left */}
              <div className="absolute bottom-6 left-6 w-10 h-10 border-b-2 border-l-2 border-blue-400 opacity-80" />
              {/* Bottom-right */}
              <div className="absolute bottom-6 right-6 w-10 h-10 border-b-2 border-r-2 border-blue-400 opacity-80" />

              {/* Center focus box */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className={`border-2 ${cameraState === 'detected' ? 'border-green-400' : 'border-blue-400/60'} rounded w-48 h-16 transition-all duration-500`} />
              </div>
            </>
          )}

          {/* Scan line */}
          {cameraState === 'scanning' && (
            <div
              className="absolute left-0 right-0 h-0.5 bg-blue-400 opacity-70 transition-all"
              style={{ top: `${scanLineY}%`, boxShadow: '0 0 8px 2px rgba(59,130,246,0.5)' }}
            />
          )}

          {/* State-specific content */}
          {cameraState === 'initializing' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
              <Loader2 className="w-10 h-10 text-blue-400 animate-spin mb-3" />
              <p className="text-sm text-gray-300">Iniciando cámara{'.'.repeat(dots)}</p>
            </div>
          )}

          {cameraState === 'scanning' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              {/* Status badge */}
              <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/60 rounded-full px-3 py-1">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-xs text-green-400 font-medium">EN VIVO</span>
              </div>
              <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-black/60 rounded-full px-3 py-1">
                <Wifi className="w-3 h-3 text-blue-400" />
                <span className="text-xs text-blue-400 font-medium">LPR</span>
              </div>
              <div className="absolute bottom-3 left-0 right-0 flex justify-center">
                <div className="bg-black/60 rounded-full px-4 py-1.5">
                  <p className="text-xs text-blue-300 font-medium tracking-wider">
                    BUSCANDO PATENTE{'.'.repeat(dots)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {cameraState === 'detected' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-green-900/80 rounded-full px-3 py-1">
                <CheckCircle className="w-3 h-3 text-green-400" />
                <span className="text-xs text-green-400 font-medium">DETECTADA</span>
              </div>

              {/* Detected plate overlay */}
              <div className="bg-black/80 rounded-xl px-6 py-4 text-center border border-green-500/50 shadow-lg shadow-green-500/20">
                <div className="text-xs text-green-400 mb-1 font-medium tracking-widest">PATENTE RECONOCIDA</div>
                <div className="text-3xl font-bold text-white font-mono tracking-widest mb-2">
                  {detectedPlate}
                </div>
                <div className="flex items-center gap-2 justify-center">
                  <div className="flex-1 bg-gray-700 rounded-full h-1.5" style={{ width: '80px' }}>
                    <div
                      className="bg-green-400 h-1.5 rounded-full transition-all"
                      style={{ width: `${confidence * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-green-400">{(confidence * 100).toFixed(0)}%</span>
                </div>
              </div>
            </div>
          )}

          {cameraState === 'unavailable' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
              <div className="w-16 h-16 bg-red-900/50 rounded-full flex items-center justify-center mb-3">
                <Camera className="w-8 h-8 text-red-400" />
              </div>
              <p className="text-white font-semibold mb-1">Cámara no disponible</p>
              <p className="text-gray-400 text-sm">No se puede acceder al dispositivo de cámara. Verifique la conexión.</p>
            </div>
          )}

          {cameraState === 'error' && errorType === 'network' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
              <div className="w-16 h-16 bg-orange-900/50 rounded-full flex items-center justify-center mb-3">
                <WifiOff className="w-8 h-8 text-orange-400" />
              </div>
              <p className="text-white font-semibold mb-1">Error de conexión</p>
              <p className="text-gray-400 text-sm">No se puede conectar con el servidor LPR. Compruebe la red.</p>
            </div>
          )}
        </div>

        {/* Info bar */}
        {cameraState === 'detected' && (
          <div className="mx-6 mt-3">
            <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-lg p-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-green-800">Patente detectada con {(confidence * 100).toFixed(0)}% de confianza</p>
                <p className="text-xs text-green-600">Confirme o reintente si la lectura es incorrecta</p>
              </div>
            </div>
          </div>
        )}

        {(cameraState === 'unavailable' || cameraState === 'error') && (
          <div className="mx-6 mt-3">
            <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg p-3">
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium text-red-800">
                  {cameraState === 'unavailable' ? 'Cámara no disponible' : 'Error de red'}
                </p>
                <p className="text-xs text-red-600">
                  {cameraState === 'unavailable'
                    ? 'Use el ingreso manual de patente como alternativa'
                    : 'Verifique la conexión al servidor LPR y reintente'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="px-6 py-5 space-y-3">
          {cameraState === 'detected' && (
            <div className="flex gap-3">
              <button
                onClick={handleRetry}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-4 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Reintentar
              </button>
              <button
                onClick={handleAccept}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors shadow-sm"
              >
                <CheckCircle className="w-4 h-4" />
                Aceptar Patente
              </button>
            </div>
          )}

          {cameraState === 'scanning' && (
            <div className="flex gap-3">
              <button
                onClick={handleClose}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-4 rounded-xl font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  // Force a detection for demo
                  const plate = SIMULATED_PLATES[Math.floor(Math.random() * SIMULATED_PLATES.length)];
                  const conf = Math.random() * 0.2 + 0.8;
                  setDetectedPlate(plate);
                  setConfidence(conf);
                  setCameraState('detected');
                }}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors"
              >
                <ZoomIn className="w-4 h-4" />
                Forzar Detección
              </button>
            </div>
          )}

          {(cameraState === 'unavailable' || cameraState === 'error') && (
            <div className="flex gap-3">
              <button
                onClick={handleClose}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-4 rounded-xl font-medium transition-colors"
              >
                Ingresar Manualmente
              </button>
              <button
                onClick={handleRetry}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Reintentar
              </button>
            </div>
          )}

          {cameraState === 'initializing' && (
            <button
              onClick={handleClose}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-4 rounded-xl font-medium transition-colors"
            >
              Cancelar
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
