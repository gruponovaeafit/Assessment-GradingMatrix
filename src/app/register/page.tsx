"use client";
import { useState, useEffect } from "react";
import { Spinner } from "../components/UI/Loading";

export default function RegisterPerson() {
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [imagen, setImagen] = useState<File | null>(null);
  const [Photo, setPhoto] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [isError, setIsError] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nombre || !correo || !imagen) {
      setMensaje("Por favor completa todos los campos");
      setIsError(true);
      return;
    }

    setEnviando(true);

    try {
      const formData = new FormData();
      formData.append("nombre", nombre);
      formData.append("correo", correo);
      formData.append("image", imagen);

      const response = await fetch("/api/register", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setMensaje("✅ Persona inscrita exitosamente");
        setIsError(false);
        setPhoto(data.url);
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
    if (mensaje) {
      const timer = setTimeout(() => {
        setMensaje("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [mensaje]);

  return (
    <div className="flex flex-col items-center justify-center w-full min-h-screen bg-white px-4 py-8">
      <div
        className="w-full max-w-md mx-auto flex items-center justify-center"
      >
        <form onSubmit={handleSubmit} className="flex flex-col items-center gap-4 p-8 w-full max-w-[380px] bg-white shadow-lg rounded-2xl border border-gray-100">
          <h1 className="text-3xl font-extrabold mb-4 text-gray-900 text-center">Inscribir Aspirante</h1>

          <div className="mb-2 w-full">
            <label className="block text-lg font-semibold mb-1 text-gray-800">Nombre</label>
            <input
              type="text"
              placeholder="Nombre del aspirante"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 bg-white text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent)] placeholder-gray-400 text-base"
            />
          </div>

          <div className="mb-2 w-full">
            <label className="block text-lg font-semibold mb-1 text-gray-800">Correo Electrónico</label>
            <input
              type="email"
              placeholder="Correo del aspirante"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 bg-white text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent)] placeholder-gray-400 text-base"
            />
          </div>

          <div className="mb-2 w-full">
            <label className="block text-lg font-semibold mb-1 text-gray-800">Foto de Aspirante</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                setImagen(file || null);
              }}
              className="w-full text-gray-900 text-base file:rounded-md file:border-0 file:bg-[color:var(--color-accent)] file:text-white file:px-3 file:py-2 file:cursor-pointer file:hover:bg-[#5B21B6]"
            />
          </div>

          {Photo && (
            <div className="w-full text-center">
              <img src={Photo} alt="Imagen subida" className="w-20 h-20 sm:w-24 sm:h-24 rounded-full mx-auto mt-2 border-4 border-[color:var(--color-accent)]" />
            </div>
          )}

          <button
            type="submit"
            className="w-full mt-2 rounded-lg bg-[color:var(--color-accent)] hover:bg-[#5B21B6] text-white text-lg font-semibold py-3 transition shadow flex items-center justify-center gap-2"
            disabled={enviando}
          >
            {enviando ? (
              <>
                <Spinner size="sm" />
                <span>Inscribiendo...</span>
              </>
            ) : (
              "Inscribir"
            )}
          </button>

          {mensaje && (
            <p className={`mt-2 sm:mt-4 text-base sm:text-lg font-medium text-center ${isError ? "text-error" : "text-success"}`}>
              {mensaje}
            </p>
          )}
        </form>
      </div>

      <footer className="mb-5 w-full text-lg sm:text-xl text-center mt-10 sm:mt-20 italic text-white">
        POWERED BY <span className="font-bold text-2xl sm:text-3xl text-primary-light">Nova</span>
      </footer>
    </div>
  );
}
