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
  const [mensaje, setMensaje] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [isError, setIsError] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [fileName, setFileName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [successModalId, setSuccessModalId] = useState<number | null>(null);


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
        setIsError(false);
        setSuccessModalId(data.id ?? null);
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

            {/* Abre la cámara en móvil (capture="environment"); en escritorio puede ofrecer cámara o archivos según el navegador */}
            <div className="flex flex-wrap items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setFileName(file.name);
                    handleImageChange(file);
                    setPhoto(URL.createObjectURL(file));
                  }
                  e.target.value = '';
                }}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 rounded-md bg-purple-600 text-white font-medium hover:bg-purple-700"
              >
                Tomar foto
              </button>
              <span className="text-sm font-medium text-gray-800 min-w-0">
                {fileName || "Sin foto seleccionada"}
              </span>
            </div>
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

      {/* Modal: registro exitoso con ID */}
      {successModalId !== null && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => {
            setSuccessModalId(null);
            setNombre("");
            setCorreo("");
            setImagen(null);
            setPhoto("");
            setFileName("");
            setMensaje("");
            if (fileInputRef.current) fileInputRef.current.value = "";
          }}
        >
          <div
            className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 border-2 border-green-500"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900 mb-2">¡Registro exitoso!</p>
              <p className="text-gray-600 mb-1">La persona fue registrada correctamente.</p>
              <p className="text-lg font-semibold text-purple-600 mt-3">
                ID asignado: <span className="font-bold">{successModalId}</span>
              </p>
              <button
                type="button"
                onClick={() => {
                  setSuccessModalId(null);
                  setNombre("");
                  setCorreo("");
                  setImagen(null);
                  setPhoto("");
                  setFileName("");
                  setMensaje("");
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                className="mt-6 w-full rounded-lg bg-purple-600 text-white py-3 font-semibold hover:bg-purple-700 transition"
              >
                Continuar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
