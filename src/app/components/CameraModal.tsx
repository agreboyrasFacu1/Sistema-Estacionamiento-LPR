import React, { useEffect, useRef, useState } from 'react';
import {
  Camera,
  X,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Video,
  Edit3,
} from 'lucide-react';
import { useParking } from '../contexts/ParkingContext';
import {
  forceSimulatedDetection,
  simulatedLprProvider,
  webcamDemoLprProvider,
} from '../domain/lpr';
import type { LprFrame } from '../domain/lpr';
import { normalizePlate, validatePlate } from '../domain/plates';
import { LPRDetection } from '../types';

interface CameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPlateDetected: (plate: string) => void;
  title?: string;
}

type CameraState = 'initializing' | 'scanning' | 'detected' | 'error' | 'unavailable';
type CameraMode = 'webcam-demo' | 'simulated' | 'manual-fallback';

const canvasToBlob = (canvas: HTMLCanvasElement, quality = 0.95): Promise<Blob | null> =>
  new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));

const clampChannel = (value: number): number =>
  Math.max(0, Math.min(255, Math.round(value)));

const tuneCanvasForOcr = (
  canvas: HTMLCanvasElement,
  mode: 'contrast' | 'threshold'
) => {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  for (let index = 0; index < data.length; index += 4) {
    const gray = data[index] * 0.299 + data[index + 1] * 0.587 + data[index + 2] * 0.114;
    const adjusted =
      mode === 'threshold'
        ? gray > 145 ? 255 : 0
        : clampChannel((gray - 128) * 1.9 + 142);

    data[index] = adjusted;
    data[index + 1] = adjusted;
    data[index + 2] = adjusted;
  }

  ctx.putImageData(imageData, 0, 0);
};

const createCanvasFromVideoCrop = (
  video: HTMLVideoElement,
  sourceWidth: number,
  sourceHeight: number,
  cropScale: number,
  mode?: 'contrast' | 'threshold'
): HTMLCanvasElement => {
  const cropWidth = Math.round(sourceWidth * 0.86);
  const cropHeight = Math.round(sourceHeight * 0.42);
  const cropX = Math.round((sourceWidth - cropWidth) / 2);
  const cropY = Math.round((sourceHeight - cropHeight) / 2);
  const targetWidth = Math.max(1200, Math.round(cropWidth * cropScale));
  const targetHeight = Math.max(420, Math.round(cropHeight * cropScale));
  const target = document.createElement('canvas');
  const ctx = target.getContext('2d');

  target.width = targetWidth;
  target.height = targetHeight;

  if (!ctx) return target;

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, target.width, target.height);
  ctx.drawImage(video, cropX, cropY, cropWidth, cropHeight, 0, 0, target.width, target.height);

  if (mode) tuneCanvasForOcr(target, mode);

  return target;
};

const createOcrFrameVariants = async (
  video: HTMLVideoElement,
  canvas: HTMLCanvasElement
): Promise<LprFrame[]> => {
  const sourceWidth = video.videoWidth || 640;
  const sourceHeight = video.videoHeight || 360;
  const ctx = canvas.getContext('2d');

  canvas.width = sourceWidth;
  canvas.height = sourceHeight;
  ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);

  const canvases = [
    createCanvasFromVideoCrop(video, sourceWidth, sourceHeight, 3, 'contrast'),
    createCanvasFromVideoCrop(video, sourceWidth, sourceHeight, 3.5, 'threshold'),
    createCanvasFromVideoCrop(video, sourceWidth, sourceHeight, 2.5),
    canvas,
  ];
  const blobs = await Promise.all(canvases.map((item) => canvasToBlob(item)));

  return blobs.filter((blob): blob is Blob => Boolean(blob));
};

export const CameraModal: React.FC<CameraModalProps> = ({
  isOpen,
  onClose,
  onPlateDetected,
  title = 'Camara LPR',
}) => {
  const { recordLprCorrection } = useParking();
  const [cameraState, setCameraState] = useState<CameraState>('initializing');
  const [mode, setMode] = useState<CameraMode>('webcam-demo');
  const [detection, setDetection] = useState<LPRDetection | null>(null);
  const [correctedPlate, setCorrectedPlate] = useState('');
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isReadingFrame, setIsReadingFrame] = useState(false);
  const [dots, setDots] = useState(0);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dotsRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stableDetectionRef = useRef({ plate: '', count: 0 });

  const stopStream = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  };

  const cleanup = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (dotsRef.current) clearInterval(dotsRef.current);
    stopStream();
  };

  const applyDetection = (nextDetection: LPRDetection) => {
    setDetection(nextDetection);
    setCorrectedPlate(nextDetection.plate);
    setCameraState('detected');
  };

  const resetStableDetection = () => {
    stableDetectionRef.current = { plate: '', count: 0 };
  };

  const confirmStableDetection = (nextDetection: LPRDetection): boolean => {
    const plate = normalizePlate(nextDetection.plate);

    if (stableDetectionRef.current.plate === plate) {
      stableDetectionRef.current.count += 1;
    } else {
      stableDetectionRef.current = { plate, count: 1 };
    }

    return stableDetectionRef.current.count >= 2;
  };

  const scheduleAutomaticScan = (delay = 1200) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      void captureFrame('webcam-demo');
    }, delay);
  };

  const startSimulated = async () => {
    cleanup();
    setMode('simulated');
    setCameraState('scanning');
    setDetection(null);
    setCorrectedPlate('');
    setErrorMessage('');
    setIsReadingFrame(false);
    resetStableDetection();

    timeoutRef.current = setTimeout(async () => {
      applyDetection(await simulatedLprProvider.detect());
    }, 900);
  };

  const startWebcam = async (deviceId = selectedDeviceId) => {
    cleanup();
    setMode('webcam-demo');
    setCameraState('initializing');
    setDetection(null);
    setCorrectedPlate('');
    setErrorMessage('');
    setIsReadingFrame(false);
    resetStableDetection();

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraState('unavailable');
      setErrorMessage('El navegador no permite acceder a la camara. Revise permisos o utilice el ingreso manual.');
      return;
    }

    try {
      const availableDevices = await webcamDemoLprProvider.listDevices?.();
      setDevices(availableDevices || []);
      const constraints: MediaStreamConstraints = {
        video: deviceId ? { deviceId: { exact: deviceId } } : true,
        audio: false,
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraState('scanning');
      scheduleAutomaticScan();
    } catch {
      setCameraState('unavailable');
      setErrorMessage('No se pudo acceder a la camara. Revise permisos o utilice el ingreso manual.');
    }
  };

  const captureFrame = async (captureMode: CameraMode = mode) => {
    if (captureMode === 'simulated') {
      applyDetection(forceSimulatedDetection());
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) {
      if (captureMode === 'webcam-demo') {
        scheduleAutomaticScan();
        return;
      }
      applyDetection(await webcamDemoLprProvider.detect());
      return;
    }

    try {
      setIsReadingFrame(true);
      setErrorMessage('');
      const frame = await createOcrFrameVariants(video, canvas);

      if (!frame.length || !webcamDemoLprProvider.detectFromFrame) {
        applyDetection(await webcamDemoLprProvider.detect());
        return;
      }

      const nextDetection = await webcamDemoLprProvider.detectFromFrame(frame);
      if (captureMode === 'webcam-demo' && !confirmStableDetection(nextDetection)) {
        setCameraState('scanning');
        scheduleAutomaticScan(650);
        return;
      }
      applyDetection(nextDetection);
    } catch {
      setDetection(null);
      setCorrectedPlate('');
      if (captureMode === 'webcam-demo') {
        setCameraState('scanning');
        setErrorMessage('');
        scheduleAutomaticScan(900);
        return;
      }
      setCameraState('detected');
      setErrorMessage('No se pudo validar la lectura de la patente. Intente nuevamente o ingrese la patente manualmente.');
    } finally {
      setIsReadingFrame(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    void startWebcam();
    dotsRef.current = setInterval(() => {
      setDots((value) => (value + 1) % 4);
    }, 500);
    return cleanup;
  }, [isOpen]);

  const handleDeviceChange = (deviceId: string) => {
    setSelectedDeviceId(deviceId);
    void startWebcam(deviceId);
  };

  const handleAccept = () => {
    const plate = normalizePlate(correctedPlate);
    if (!validatePlate(plate)) {
      setErrorMessage('Formato de patente invalido. Use ABC123 o AB123CD.');
      return;
    }

    const detectedPlate = detection?.plate || plate;
    const confidence = detection?.confidence ?? 1;
    recordLprCorrection(detectedPlate, plate, confidence);
    onPlateDetected(plate);
    cleanup();
    onClose();
  };

  const handleClose = () => {
    cleanup();
    onClose();
  };

  if (!isOpen) return null;

  const confidence = detection ? Math.round(detection.confidence * 100) : 0;
  const sourceLabel = mode === 'webcam-demo' ? 'Camara LPR' : mode === 'simulated' ? 'Lectura asistida' : 'Manual';

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center">
              <Camera className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="font-semibold text-gray-900">{title}</h2>
              <p className="text-xs text-gray-500">Reconocimiento automatico de patente</p>
            </div>
          </div>
          <button onClick={handleClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 pt-5 grid grid-cols-1 md:grid-cols-3 gap-3">
          <button
            onClick={() => void startWebcam()}
            className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition-colors ${mode === 'webcam-demo' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
          >
            <Video className="w-4 h-4" />
            Camara LPR
          </button>
          <button
            onClick={() => void startSimulated()}
            className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition-colors ${mode === 'simulated' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
          >
            <Camera className="w-4 h-4" />
            Lectura asistida
          </button>
          <button
            onClick={() => {
              cleanup();
              setMode('manual-fallback');
              setCameraState('detected');
              setDetection(null);
              setCorrectedPlate('');
              setErrorMessage('');
              setIsReadingFrame(false);
              resetStableDetection();
            }}
            className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition-colors ${mode === 'manual-fallback' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
          >
            <Edit3 className="w-4 h-4" />
            Manual
          </button>
        </div>

        {devices.length > 1 && mode === 'webcam-demo' && (
          <div className="px-6 pt-3">
            <select
              value={selectedDeviceId}
              onChange={(event) => handleDeviceChange(event.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Camara predeterminada</option>
              {devices.map((device, index) => (
                <option key={device.deviceId || index} value={device.deviceId}>
                  {device.label || `Camara ${index + 1}`}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="relative bg-gray-950 mx-6 mt-5 rounded-xl overflow-hidden" style={{ aspectRatio: '16/9' }}>
          {mode === 'webcam-demo' && cameraState !== 'unavailable' && (
            <video ref={videoRef} className="absolute inset-0 h-full w-full object-cover" muted playsInline autoPlay />
          )}
          <canvas ref={canvasRef} className="hidden" />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.2)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.2)_1px,transparent_1px)] bg-[length:40px_40px] opacity-30" />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className={`border-2 ${cameraState === 'detected' ? 'border-green-400' : 'border-blue-400/70'} rounded w-56 h-20 transition-all`} />
          </div>

          {cameraState === 'initializing' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white bg-black/45">
              <Loader2 className="w-10 h-10 text-blue-400 animate-spin mb-3" />
              <p className="text-sm text-gray-200">Iniciando camara{'.'.repeat(dots)}</p>
            </div>
          )}

          {cameraState === 'scanning' && (
            <div className="absolute inset-0 flex flex-col items-center justify-end p-4">
              <div className="absolute top-3 left-3 rounded-full bg-black/70 px-3 py-1 text-xs font-medium text-green-300">
                {sourceLabel}
              </div>
              <div className="rounded-full bg-black/70 px-4 py-1.5 text-xs font-medium tracking-wider text-blue-200">
                {isReadingFrame ? `LEYENDO PATENTE${'.'.repeat(dots)}` : `LECTURA AUTOMATICA ACTIVA${'.'.repeat(dots)}`}
              </div>
            </div>
          )}

          {cameraState === 'detected' && detection && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/35">
              <div className="bg-black/85 rounded-xl px-6 py-4 text-center border border-green-500/50 shadow-lg shadow-green-500/20">
                <div className="text-xs text-green-400 mb-1 font-medium tracking-widest">PATENTE DETECTADA</div>
                <div className="text-3xl font-bold text-white font-mono tracking-widest mb-2">{detection.plate}</div>
                <div className="text-xs text-green-300">
                  {confidence}% confianza estimada
                </div>
              </div>
            </div>
          )}

          {cameraState === 'unavailable' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 bg-black/60">
              <AlertTriangle className="w-10 h-10 text-amber-300 mb-3" />
              <p className="text-white font-semibold mb-1">Webcam no disponible</p>
              <p className="text-gray-300 text-sm">{errorMessage}</p>
            </div>
          )}
        </div>

        {(cameraState === 'detected' || mode === 'manual-fallback') && (
          <div className="mx-6 mt-3 rounded-xl border border-gray-200 bg-gray-50 p-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Patente a usar / correccion manual
            </label>
            <input
              value={correctedPlate}
              onChange={(event) => setCorrectedPlate(event.target.value.toUpperCase())}
              maxLength={7}
              placeholder="ABC123 o AB123CD"
              className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-center font-mono text-2xl tracking-widest uppercase focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {detection && correctedPlate && normalizePlate(detection.plate) !== normalizePlate(correctedPlate) && (
              <p className="mt-2 text-xs text-amber-700">
                Se registrara correccion LPR: {detection.plate} -&gt; {normalizePlate(correctedPlate)}.
              </p>
            )}
          </div>
        )}

        {errorMessage && cameraState !== 'unavailable' && (
          <div className="mx-6 mt-3 flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg p-3">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{errorMessage}</p>
          </div>
        )}

        <div className="px-6 py-5 flex flex-wrap gap-3">
          <button onClick={handleClose} className="flex-1 min-w-32 bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-4 rounded-xl font-medium transition-colors">
            Cancelar
          </button>
          {cameraState === 'scanning' && (
            <button disabled className="flex-1 min-w-40 bg-blue-100 text-blue-700 py-3 px-4 rounded-xl font-medium flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Lectura automatica
            </button>
          )}
          {cameraState === 'unavailable' && (
            <button onClick={() => void startSimulated()} className="flex-1 min-w-40 bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors">
              <RefreshCw className="w-4 h-4" />
              Lectura asistida
            </button>
          )}
          {cameraState === 'detected' && !detection && mode === 'webcam-demo' && (
            <button onClick={() => void startWebcam()} className="flex-1 min-w-40 bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors">
              <RefreshCw className="w-4 h-4" />
              Intentar nuevamente
            </button>
          )}
          {(cameraState === 'detected' || mode === 'manual-fallback') && (
            <button onClick={handleAccept} className="flex-1 min-w-40 bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors shadow-sm">
              <CheckCircle className="w-4 h-4" />
              Usar patente
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
