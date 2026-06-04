import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Camera,
  X,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Edit3,
  CameraOff,
  Timer,
  Keyboard,
} from 'lucide-react';
import { validatePlate } from '../data/mockData';

interface CameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPlateDetected: (plate: string) => void;
  title?: string;
}

type CameraStep = 'requesting' | 'live' | 'capturing' | 'analyzing' | 'detected' | 'denied' | 'error' | 'no_plate';
type Mode = 'camera' | 'manual';

const COUNTDOWN_SECONDS = 10;

const extractPlate = (text: string): string | null => {
  const cleaned = text.toUpperCase().replace(/[^A-Z0-9]/g, ' ');
  const tokens = cleaned.split(/\s+/);
  for (const token of tokens) {
    if (/^[A-Z]{3}\d{3}$/.test(token)) return token;
    if (/^[A-Z]{2}\d{3}[A-Z]{2}$/.test(token)) return token;
  }
  const alphaNum = cleaned.replace(/\s/g, '');
  for (let i = 0; i <= alphaNum.length - 6; i++) {
    const s6 = alphaNum.slice(i, i + 6);
    const s7 = alphaNum.slice(i, i + 7);
    if (/^[A-Z]{3}\d{3}$/.test(s6)) return s6;
    if (/^[A-Z]{2}\d{3}[A-Z]{2}$/.test(s7)) return s7;
  }
  return null;
};

const preprocessCanvas = (canvas: HTMLCanvasElement): void => {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    const contrast = Math.min(255, Math.max(0, (gray - 128) * 1.8 + 128));
    data[i] = data[i + 1] = data[i + 2] = contrast;
  }
  ctx.putImageData(imageData, 0, 0);
};

export const CameraModal: React.FC<CameraModalProps> = ({
  isOpen,
  onClose,
  onPlateDetected,
  title = 'Cámara LPR',
}) => {
  const [mode, setMode] = useState<Mode>('camera');
  const [step, setStep] = useState<CameraStep>('requesting');
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);
  const [detectedPlate, setDetectedPlate] = useState('');
  const [editedPlate, setEditedPlate] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [confidence, setConfidence] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const [ocrStatus, setOcrStatus] = useState('');
  const [manualInput, setManualInput] = useState('');
  const [manualError, setManualError] = useState('');

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (countdownRef.current) clearInterval(countdownRef.current);
  }, []);

  const captureFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 360;
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    stopStream();
    runOCR(canvas);
  }, [stopStream]);

  const startCountdown = useCallback(() => {
    setCountdown(COUNTDOWN_SECONDS);
    let remaining = COUNTDOWN_SECONDS;
    countdownRef.current = setInterval(() => {
      remaining -= 1;
      setCountdown(remaining);
      if (remaining <= 0) {
        if (countdownRef.current) clearInterval(countdownRef.current);
        captureFrame();
      }
    }, 1000);
  }, [captureFrame]);

  const startCamera = useCallback(async () => {
    setStep('requesting');
    setDetectedPlate('');
    setEditedPlate('');
    setIsEditing(false);
    setErrorMsg('');
    setOcrStatus('');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setStep('live');
      startCountdown();
    } catch (err: any) {
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setStep('denied');
        // Auto-switch to manual after denial
        setTimeout(() => setMode('manual'), 800);
      } else {
        setErrorMsg(err.message || 'No se pudo acceder a la cámara');
        setStep('error');
        setTimeout(() => setMode('manual'), 800);
      }
    }
  }, [startCountdown]);

  const runOCR = async (canvas: HTMLCanvasElement) => {
    setStep('analyzing');
    setOcrStatus('Preprocesando imagen…');

    try {
      preprocessCanvas(canvas);
      setOcrStatus('Cargando motor OCR…');

      const { createWorker } = await import('tesseract.js');
      const worker = await createWorker('eng', 1, {
        logger: (m: any) => {
          if (m.status === 'recognizing text') {
            setOcrStatus(`Reconociendo… ${Math.round(m.progress * 100)}%`);
          }
        },
      });

      await worker.setParameters({
        tessedit_char_whitelist: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
        tessedit_pageseg_mode: '7' as any,
      });

      setOcrStatus('Analizando imagen…');
      const {
        data: { text, confidence: conf },
      } = await worker.recognize(canvas);
      await worker.terminate();

      const plate = extractPlate(text);
      if (plate) {
        setDetectedPlate(plate);
        setEditedPlate(plate);
        setConfidence(Math.min(conf / 100, 0.99));
        setStep('detected');
      } else {
        setStep('no_plate');
      }
    } catch (e: any) {
      setErrorMsg(e.message || 'Error al ejecutar OCR');
      setStep('error');
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    setMode('camera');
    setManualInput('');
    setManualError('');
    startCamera();
    return () => stopStream();
  }, [isOpen]);

  const handleManualCapture = () => {
    if (countdownRef.current) clearInterval(countdownRef.current);
    captureFrame();
  };

  const handleAccept = () => {
    const plate = (isEditing ? editedPlate : detectedPlate).toUpperCase();
    if (plate && validatePlate(plate)) {
      onPlateDetected(plate);
      handleClose();
    }
  };

  const handleRetry = () => {
    stopStream();
    setMode('camera');
    startCamera();
  };

  const handleClose = () => {
    stopStream();
    onClose();
  };

  const handleManualSubmit = () => {
    const plate = manualInput.toUpperCase().trim();
    if (!plate) {
      setManualError('Ingrese una patente');
      return;
    }
    if (!validatePlate(plate)) {
      setManualError('Formato inválido. Use ABC123 o AB123CD');
      return;
    }
    onPlateDetected(plate);
    handleClose();
  };

  const switchToManual = () => {
    stopStream();
    setMode('manual');
  };

  const finalPlate = (isEditing ? editedPlate : detectedPlate).toUpperCase();
  const plateValid = validatePlate(finalPlate);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center">
              {mode === 'camera' ? (
                <Camera className="w-5 h-5 text-blue-600" />
              ) : (
                <Keyboard className="w-5 h-5 text-blue-600" />
              )}
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">{title}</h2>
              <p className="text-xs text-gray-500">
                {mode === 'camera' ? 'Lectura OCR de patente en tiempo real' : 'Ingreso manual de patente'}
              </p>
            </div>
          </div>
          <button onClick={handleClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode tabs */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => { stopStream(); setMode('camera'); startCamera(); }}
            className={`flex-1 py-2.5 text-sm font-medium flex items-center justify-center gap-1.5 transition-colors ${
              mode === 'camera'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Camera className="w-4 h-4" />
            Cámara
          </button>
          <button
            onClick={switchToManual}
            className={`flex-1 py-2.5 text-sm font-medium flex items-center justify-center gap-1.5 transition-colors ${
              mode === 'manual'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Keyboard className="w-4 h-4" />
            Ingreso Manual
          </button>
        </div>

        {mode === 'manual' ? (
          /* ── MANUAL MODE ── */
          <div className="p-6 space-y-4">
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-5 text-center">
              <Keyboard className="w-10 h-10 text-gray-400 mx-auto mb-3" />
              <p className="text-sm text-gray-600 font-medium mb-1">Ingrese la patente manualmente</p>
              <p className="text-xs text-gray-400">Formatos: ABC123 o AB123CD</p>
            </div>

            <div>
              <input
                type="text"
                value={manualInput}
                onChange={(e) => {
                  setManualInput(e.target.value.toUpperCase());
                  setManualError('');
                }}
                onKeyDown={(e) => e.key === 'Enter' && handleManualSubmit()}
                className={`w-full px-4 py-4 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-2xl tracking-widest uppercase text-center transition-all ${
                  manualError
                    ? 'border-red-400 bg-red-50'
                    : manualInput && validatePlate(manualInput)
                    ? 'border-green-400 bg-green-50'
                    : 'border-gray-300 bg-gray-50'
                }`}
                placeholder="ABC123"
                maxLength={7}
                autoFocus
              />
              {manualError && (
                <p className="text-xs text-red-600 mt-1.5 text-center">{manualError}</p>
              )}
              {manualInput && validatePlate(manualInput) && !manualError && (
                <div className="flex items-center justify-center gap-1.5 mt-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                  <p className="text-xs text-green-600">Formato válido</p>
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-1">
              <button onClick={handleClose} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-4 rounded-xl font-medium transition-colors">
                Cancelar
              </button>
              <button
                onClick={handleManualSubmit}
                disabled={!manualInput || !validatePlate(manualInput)}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-3 px-4 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors shadow-sm"
              >
                <CheckCircle className="w-4 h-4" />
                Confirmar
              </button>
            </div>
          </div>
        ) : (
          /* ── CAMERA MODE ── */
          <>
            {/* Viewport */}
            <div className="relative bg-gray-950 mx-6 mt-5 rounded-xl overflow-hidden" style={{ aspectRatio: '16/9' }}>
              <video
                ref={videoRef}
                className={`absolute inset-0 w-full h-full object-cover ${step === 'live' ? 'block' : 'hidden'}`}
                autoPlay
                playsInline
                muted
              />
              <canvas
                ref={canvasRef}
                className={`absolute inset-0 w-full h-full object-cover ${(step === 'analyzing' || step === 'detected' || step === 'no_plate') ? 'block' : 'hidden'}`}
              />

              {/* Corner brackets */}
              {(step === 'live' || step === 'detected') && (
                <>
                  <div className="absolute top-6 left-6 w-10 h-10 border-t-2 border-l-2 border-blue-400 opacity-80 pointer-events-none" />
                  <div className="absolute top-6 right-6 w-10 h-10 border-t-2 border-r-2 border-blue-400 opacity-80 pointer-events-none" />
                  <div className="absolute bottom-6 left-6 w-10 h-10 border-b-2 border-l-2 border-blue-400 opacity-80 pointer-events-none" />
                  <div className="absolute bottom-6 right-6 w-10 h-10 border-b-2 border-r-2 border-blue-400 opacity-80 pointer-events-none" />
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className={`border-2 ${step === 'detected' ? 'border-green-400' : 'border-blue-400/60'} rounded w-52 h-16 transition-colors duration-500`} />
                  </div>
                </>
              )}

              {/* Live badges */}
              {step === 'live' && (
                <>
                  <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/70 rounded-full px-3 py-1 pointer-events-none">
                    <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                    <span className="text-xs text-green-400 font-medium">EN VIVO</span>
                  </div>
                  <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-black/70 rounded-full px-3 py-1 pointer-events-none">
                    <Timer className="w-3 h-3 text-amber-300" />
                    <span className={`text-xs font-bold ${countdown <= 3 ? 'text-red-400' : 'text-amber-300'}`}>
                      {countdown}s
                    </span>
                  </div>
                  <div className="absolute bottom-3 left-0 right-0 flex justify-center pointer-events-none">
                    <div className="bg-black/70 rounded-full px-4 py-1.5">
                      <p className="text-xs text-blue-300 font-medium">
                        Centre la patente — captura automática en {countdown}s
                      </p>
                    </div>
                  </div>
                </>
              )}

              {/* Requesting */}
              {step === 'requesting' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
                  <Loader2 className="w-10 h-10 text-blue-400 animate-spin mb-3" />
                  <p className="text-sm text-gray-300">Solicitando permiso de cámara…</p>
                  <p className="text-xs text-gray-500 mt-1">Acepte el permiso en la barra del navegador</p>
                </div>
              )}

              {/* Analyzing */}
              {step === 'analyzing' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60">
                  <Loader2 className="w-10 h-10 text-blue-400 animate-spin mb-3" />
                  <p className="text-sm text-white font-medium">{ocrStatus || 'Procesando…'}</p>
                </div>
              )}

              {/* Detected */}
              {step === 'detected' && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-green-900/80 rounded-full px-3 py-1">
                    <CheckCircle className="w-3 h-3 text-green-400" />
                    <span className="text-xs text-green-400 font-medium">PATENTE LEÍDA</span>
                  </div>
                  <div className="bg-black/85 rounded-xl px-6 py-4 text-center border border-green-500/50 shadow-lg shadow-green-500/20">
                    <div className="text-xs text-green-400 mb-1 font-medium tracking-widest">OCR DETECTÓ</div>
                    <div className="text-3xl font-bold text-white font-mono tracking-widest mb-2">{detectedPlate}</div>
                    <div className="flex items-center gap-2 justify-center">
                      <div className="bg-gray-700 rounded-full h-1.5" style={{ width: '80px' }}>
                        <div className="bg-green-400 h-1.5 rounded-full" style={{ width: `${confidence * 100}%` }} />
                      </div>
                      <span className="text-xs text-green-400">{(confidence * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                </div>
              )}

              {/* No plate */}
              {step === 'no_plate' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 bg-black/40">
                  <AlertTriangle className="w-10 h-10 text-amber-400 mb-3" />
                  <p className="text-white font-semibold">No se detectó ninguna patente</p>
                  <p className="text-gray-300 text-sm mt-1">Reintente o use el ingreso manual</p>
                </div>
              )}

              {/* Denied */}
              {step === 'denied' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
                  <div className="w-16 h-16 bg-red-900/50 rounded-full flex items-center justify-center mb-3">
                    <CameraOff className="w-8 h-8 text-red-400" />
                  </div>
                  <p className="text-white font-semibold mb-1">Permiso de cámara denegado</p>
                  <p className="text-gray-400 text-sm">
                    Cambiando a ingreso manual…
                  </p>
                </div>
              )}

              {/* Error */}
              {step === 'error' && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
                  <div className="w-16 h-16 bg-orange-900/50 rounded-full flex items-center justify-center mb-3">
                    <AlertTriangle className="w-8 h-8 text-orange-400" />
                  </div>
                  <p className="text-white font-semibold mb-1">Cámara no disponible</p>
                  <p className="text-gray-400 text-sm">{errorMsg || 'Cambiando a ingreso manual…'}</p>
                </div>
              )}
            </div>

            {/* Info bar */}
            {step === 'detected' && (
              <div className="mx-6 mt-3">
                <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-lg p-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-green-800">
                      Patente leída con {(confidence * 100).toFixed(0)}% de confianza
                    </p>
                    <p className="text-xs text-green-600">Confirme o corrija si la lectura no es correcta</p>
                  </div>
                </div>
              </div>
            )}

            {/* Manual correction input */}
            {step === 'detected' && isEditing && (
              <div className="mx-6 mt-3">
                <input
                  type="text"
                  value={editedPlate}
                  onChange={(e) => setEditedPlate(e.target.value.toUpperCase())}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-xl tracking-widest uppercase text-center ${
                    plateValid ? 'border-blue-400 bg-blue-50' : 'border-red-400 bg-red-50'
                  }`}
                  placeholder="ABC123 o AB123CD"
                  maxLength={7}
                  autoFocus
                />
                {!plateValid && editedPlate.length >= 6 && (
                  <p className="text-xs text-red-600 mt-1 text-center">Formato inválido</p>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="px-6 py-5 space-y-2">
              {step === 'live' && (
                <div className="flex gap-3">
                  <button onClick={switchToManual} className="flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-4 rounded-xl font-medium transition-colors">
                    <Keyboard className="w-4 h-4" />
                    Manual
                  </button>
                  <button
                    onClick={handleManualCapture}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors shadow-sm"
                  >
                    <Camera className="w-4 h-4" />
                    Capturar ahora
                  </button>
                </div>
              )}

              {step === 'requesting' && (
                <div className="flex gap-3">
                  <button onClick={switchToManual} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-4 rounded-xl font-medium transition-colors">
                    Ingresar Manual
                  </button>
                  <button onClick={handleClose} className="px-4 py-3 text-gray-500 hover:bg-gray-50 rounded-xl font-medium transition-colors">
                    Cancelar
                  </button>
                </div>
              )}

              {step === 'analyzing' && (
                <button disabled className="w-full bg-gray-200 text-gray-500 py-3 px-4 rounded-xl font-medium flex items-center justify-center gap-2 cursor-not-allowed">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analizando…
                </button>
              )}

              {step === 'detected' && (
                <div className="flex gap-3">
                  <button onClick={handleRetry} className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-4 rounded-xl font-medium transition-colors">
                    <RefreshCw className="w-4 h-4" />
                    Reintentar
                  </button>
                  <button
                    onClick={() => setIsEditing((v) => !v)}
                    className={`flex items-center gap-2 px-4 py-3 rounded-xl font-medium border transition-colors ${isEditing ? 'bg-blue-50 border-blue-300 text-blue-700' : 'bg-white border-gray-300 text-gray-600 hover:bg-gray-50'}`}
                  >
                    <Edit3 className="w-4 h-4" />
                    {isEditing ? 'Editando' : 'Corregir'}
                  </button>
                  <button
                    onClick={handleAccept}
                    disabled={!plateValid}
                    className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-3 px-4 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Aceptar
                  </button>
                </div>
              )}

              {(step === 'denied' || step === 'error' || step === 'no_plate') && (
                <div className="flex gap-3">
                  <button onClick={switchToManual} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors">
                    <Keyboard className="w-4 h-4" />
                    Ingresar Manual
                  </button>
                  <button onClick={handleRetry} className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-4 rounded-xl font-medium transition-colors">
                    <RefreshCw className="w-4 h-4" />
                    Reintentar
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
