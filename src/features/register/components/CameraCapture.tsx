"use client";

import React, { useRef, useEffect, useState, useCallback } from 'react';
import Image from 'next/image';

interface CameraCaptureProps {
  onCapture: (file: File) => void;
  onClose: () => void;
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [flashOn, setFlashOn] = useState(false);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const startCamera = useCallback(async (mode: 'user' | 'environment') => {
    stopStream();
    setReady(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: mode, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => setReady(true);
      }
    } catch {
      setError('No se pudo acceder a la cámara. Verifica los permisos.');
    }
  }, [stopStream]);

  useEffect(() => {
    startCamera('environment');
    return () => stopStream();
  }, []);

  const handleFlipCamera = () => {
    const newMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(newMode);
    startCamera(newMode);
  };

  const handleFlash = async () => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) return;
    try {
      const newFlash = !flashOn;
      await (track as any).applyConstraints({ advanced: [{ torch: newFlash }] });
      setFlashOn(newFlash);
    } catch {
      // Flash no soportado en este dispositivo
    }
  };

  const handleCapture = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const size = Math.min(video.videoWidth, video.videoHeight);
    const offsetX = (video.videoWidth - size) / 2;
    const offsetY = (video.videoHeight - size) / 2;

    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (facingMode === 'user') {
      ctx.save();
      ctx.scale(-1, 1);
      ctx.drawImage(video, offsetX, offsetY, size, size, -512, 0, 512, 512);
      ctx.restore();
    } else {
      ctx.drawImage(video, offsetX, offsetY, size, size, 0, 0, 512, 512);
    }

    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], `foto_${Date.now()}.jpg`, { type: 'image/jpeg' });
      stopStream();
      onCapture(file);
    }, 'image/jpeg', 0.92);
  };

  const handleCancel = () => {
    stopStream();
    onClose();
  };

  const handleGallery = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      stopStream();
      onCapture(file);
    }
    e.target.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">

      {error ? (
        <div className="flex flex-col items-center justify-center flex-1 gap-4 px-6 text-center">
          <p className="text-white text-lg">{error}</p>
          <button
            onClick={handleCancel}
            className="px-6 py-3 rounded-lg bg-red-500 text-white font-semibold"
          >
            Volver
          </button>
        </div>
      ) : (
        <>
          {/* Visor */}
          <div className="relative w-full flex-1 overflow-hidden">

            {/* Video stream */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
              style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : 'none' }}
            />

            {/* Overlay silueta + círculo guía */}
            {ready && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                {/* Círculo guía */}
                <div className="relative w-[400px] h-[400px]">
                  <div className="absolute inset-0 rounded-full border-4 border-white/50" />
                  {/* Silueta persona centrada dentro del círculo */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Image
                      src="/PersonIcon.svg"
                      alt="Guía de posición"
                      width={280}
                      height={280}
                      className="opacity-30"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Botón voltear cámara — arriba izquierda */}
            <button
              onClick={handleFlipCamera}
              className="absolute top-4 left-4 w-11 h-11 rounded-full bg-black/40 flex items-center justify-center hover:bg-black/60 transition"
            >
              <Image src="/ReloadTableIcon.svg" alt="Voltear cámara" width={22} height={22} />
            </button>

            {/* Botón flash — arriba derecha */}
            <button
              onClick={handleFlash}
              style={{ backgroundColor: flashOn ? 'var(--warning)' : 'rgba(0,0,0,0.4)' }}
              className={`absolute top-4 right-4 w-11 h-11 rounded-full flex items-center justify-center transition ${
                flashOn ? 'bg-[color:var(--warning)]' : 'bg-black/40 hover:bg-black/60'
              }`}
            >
              <Image src="/FlashIcon.svg" alt="Flash" width={22} height={22} />
            </button>

          </div>

          {/* Canvas oculto */}
          <canvas ref={canvasRef} className="hidden" />

          {/* Controles inferiores */}
          <div className="w-full flex items-center justify-between px-10 py-6 bg-black">

            {/* Cancelar — solo ícono */}
            <button
              onClick={handleCancel}
              className="w-12 h-12 rounded-full flex items-center justify-center hover:opacity-80 transition bg-[color:var(--error)]"
            >
              <span className="text-white text-2xl font-bold">✕</span>
            </button>

            {/* Tomar foto */}
            <button
              onClick={handleCapture}
              disabled={!ready}
              className="w-20 h-20 rounded-full bg-white border-4 border-gray-300 flex items-center justify-center shadow-lg hover:scale-105 transition disabled:opacity-50"
            >
              <div className="w-14 h-14 rounded-full bg-white border-2 border-gray-400" />
            </button>

            {/* Galería — solo ícono */}
            <button
              onClick={() => galleryInputRef.current?.click()}
              className="w-12 h-12 rounded-full flex items-center justify-center hover:opacity-80 transition"
            >
              <Image src="/ExportCSVIcon.svg" alt="Galería" width={28} height={28} />
            </button>

            {/* Input galería oculto */}
            <input
              ref={galleryInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleGallery}
            />
          </div>
        </>
      )}
    </div>
  );
};