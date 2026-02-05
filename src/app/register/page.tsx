"use client";

import { useState, useEffect } from "react";
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


  const handleImageChange = async (file: File) => {
    try {
      const options = {
        maxSizeMB: 0.01,          // 🎯 10 KB
        maxWidthOrHeight: 256,    // suficiente para avatar
        useWebWorker: true,
        fileType: "image/webp",   // 🔥 clave
        initialQuality: 0.6,
      };

      const compressedFile = await imageCompression(file, options);

      // 🔒 Validación final de tamaño (extra safety)
      if (compressedFile.size > 15000) {
        setMensaje("La imagen sigue siendo muy pesada");
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <div className="w-full">
            <label className="block text-lg font-semibold mb-1 text-gray-800">
              Foto del Aspirante
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImageChange(file);
              }}
              className="w-full"
            />
          </div>

          {Photo && (
            <img
              src={Photo}
              alt="Foto participante"
              className="w-24 h-24 rounded-full object-cover border-4 border-purple-600 mt-2"
            />
          )}

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
