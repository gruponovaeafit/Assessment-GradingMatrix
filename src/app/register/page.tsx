"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import imageCompression from "browser-image-compression";
import { Spinner } from "../components/UI/Loading";

export default function RegisterPerson() {
  const router = useRouter();

  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [imagen, setImagen] = useState<File | null>(null);
  const [Photo, setPhoto] = useState("");
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [mensaje, setMensaje] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [isError, setIsError] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [fileName, setFileName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);


  const handleImageChange = async (file: File) => {
    try {
      // Comprimir sin destruir calidad: el servidor guardará a 512px y buena calidad
      const options = {
        maxSizeMB: 0.4,
        maxWidthOrHeight: 512,
        useWebWorker: true,
        fileType: "image/webp",
        initialQuality: 0.85,
      };

      const compressedFile = await imageCompression(file, options);

      if (compressedFile.size > 600 * 1024) {
        setMensaje("La imagen es muy pesada. Usa una foto más pequeña.");
        setIsError(true);
        return;
      }

      setImagen(compressedFile);
      setIsError(false);
    } catch (error) {
      console.error("Error al comprimir imagen", error);
      setMensaje("Error procesando la imagen");
      setIsError(true);
    }
  };

  const startCamera = async () => {
    const noCameraAPI = !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia;
    const insecureContext = typeof window !== 'undefined' && !window.isSecureContext; // HTTP (ej. 192.168.x.x) sin HTTPS

    if (noCameraAPI || insecureContext) {
      setMensaje(
        noCameraAPI
          ? 'Tu navegador no soporta la cámara aquí. Usa el botón "Elegir archivo" para subir una foto.'
          : 'La cámara solo está disponible con HTTPS. Usa el botón "Elegir archivo" más abajo para subir una foto.'
      );
      setIsError(true);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraActive(true);
      setIsError(false);
      setMensaje('');
    } catch (err) {
      console.error('No se pudo acceder a la cámara', err);
      setMensaje('No se pudo acceder a la cámara. Usa el botón "Elegir archivo" para subir una foto.');
      setIsError(true);
    }
  };

  const stopCamera = () => {
    try {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    } catch (e) {
      // ignore
    }
    streamRef.current = null;
    setCameraActive(false);
  };

  const capturePhoto = async () => {
    try {
      const video = videoRef.current;
      if (!video) return;

      const canvas = canvasRef.current || document.createElement('canvas');
      const width = 512; // tamaño mayor, luego se comprimirá
      const height = Math.round((video.videoHeight / video.videoWidth) * width) || 512;
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(video, 0, 0, width, height);

      await new Promise<void>((res) => {
        canvas.toBlob(async (blob) => {
          if (!blob) return res();
          const file = new File([blob], `photo-${Date.now()}.webp`, { type: 'image/webp' });
          // Mostrar preview inmediato
          setPhoto(URL.createObjectURL(blob));
          // Pasar por la compresión/validación existente
          await handleImageChange(file);
          res();
        }, 'image/webp', 0.85);
      });

      stopCamera();
    } catch (err) {
      console.error('Error capturando foto', err);
      setMensaje('Error capturando la foto');
      setIsError(true);
    }
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nombre || !correo) {
      setMensaje("Por favor completa los campos obligatorios");
      setIsError(true);
      return;
    }

    setEnviando(true);

    try {
      const formData = new FormData();
      formData.append("nombre", nombre);
      formData.append("correo", correo);

      if (imagen) {
        formData.append("image", imagen);
      }

      const token = localStorage.getItem("authToken");

      const response = await fetch("/api/register", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setMensaje("✅ Persona inscrita exitosamente");
        setIsError(false);
        setPhoto(data.url || "");
        setNombre("");
        setCorreo("");
        setImagen(null);
      } else {
        setMensaje(`❌ Error: ${data.error}`);
        setIsError(true);
      }
    } catch (err) {
      console.error(err);
      setMensaje("❌ Error al conectar con el servidor");
      setIsError(true);
    } finally {
      setEnviando(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("authToken");
    const role = localStorage.getItem("authRole");

    if (!token || (role !== "registrador" && role !== "admin")) {
      router.push("/auth/login");
      return;
    }

    setCheckingAuth(false);
  }, [router]);

  useEffect(() => {
    if (mensaje) {
      const timer = setTimeout(() => setMensaje(""), 5000);
      return () => clearTimeout(timer);
    }
  }, [mensaje]);

  if (checkingAuth) {
    return (
      <div className="flex flex-col items-center justify-center w-full min-h-screen bg-white px-4 py-8">
        <Spinner size="lg" />
        <p className="text-gray-600 mt-4">Verificando acceso...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center w-full min-h-screen bg-white px-4 py-8">
      <div className="w-full max-w-md mx-auto flex items-center justify-center">
        <form
          onSubmit={handleSubmit}
          className="flex flex-col items-center gap-4 p-8 w-full max-w-[380px] bg-white shadow-lg rounded-2xl border border-gray-100"
        >
          <h1 className="text-3xl font-extrabold mb-4 text-gray-900 text-center">
            Inscribir Aspirante
          </h1>

          <div className="w-full">
            <label className="block text-lg font-semibold mb-1 text-gray-800">
              Nombre
            </label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder:text-gray-500 bg-white"
            />
          </div>

          <div className="w-full">
            <label className="block text-lg font-semibold mb-1 text-gray-800">
              Correo Electrónico
            </label>
            <input
              type="email"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900 placeholder:text-gray-500 bg-white"
            />
          </div>

          <div className="w-full">
            <label className="block text-lg font-semibold mb-1 text-gray-800">
              Foto del Aspirante
            </label>

            {!cameraActive ? (
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={startCamera}
                  className="px-4 py-2 rounded-md bg-purple-600 text-white"
                >
                  Tomar foto con cámara
                </button>
                <span className="text-sm text-gray-700 font-medium">o usa el selector de archivos</span>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <video ref={videoRef} className="w-full rounded-md bg-black" playsInline />
                <div className="flex gap-2">
                  <button type="button" onClick={capturePhoto} className="px-4 py-2 rounded-md bg-green-600 text-white">Capturar</button>
                  <button type="button" onClick={stopCamera} className="px-4 py-2 rounded-md bg-gray-300">Cancelar</button>
                </div>
              </div>
            )}

            {/* Selector de archivos con texto visible */}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setFileName(file.name);
                    handleImageChange(file);
                    setPhoto(URL.createObjectURL(file));
                  }
                }}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 rounded-md border-2 border-gray-400 bg-white text-gray-800 font-medium hover:bg-gray-50"
              >
                Seleccionar archivo
              </button>
              <span className="text-sm font-medium text-gray-800 min-w-0">
                {fileName || "Ningún archivo seleccionado"}
              </span>
            </div>
            <canvas ref={canvasRef} style={{ display: 'none' }} />
          </div>

          {/* Zona de vista previa: siempre visible */}
          <div className="flex flex-col items-center gap-1 mt-2">
            <div className="w-28 h-28 rounded-full border-4 border-purple-600 flex items-center justify-center overflow-hidden bg-gray-100 shrink-0">
              {Photo ? (
                <img
                  src={Photo}
                  alt="Foto del aspirante"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-gray-500 text-xs text-center px-2">Sin foto</span>
              )}
            </div>
            <span className="text-sm text-gray-600 font-medium">Vista previa</span>
          </div>

          <button
            type="submit"
            disabled={enviando}
            className="w-full rounded-lg bg-purple-700 text-white py-3 font-semibold"
          >
            {enviando ? "Inscribiendo..." : "Inscribir"}
          </button>

          {mensaje && (
            <p
              className={`text-center font-medium ${
                isError ? "text-red-600" : "text-green-600"
              }`}
            >
              {mensaje}
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
