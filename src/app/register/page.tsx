"use client";
import { useState, useEffect } from "react";

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
    <div className="flex flex-col items-center justify-center w-full min-h-screen bg-no-repeat bg-cover bg-center gradient_purple px-4 py-8">
      <div
        className="relative bg-no-repeat bg-center bg-contain w-full max-w-[400px] h-auto min-h-[500px] flex items-center justify-center"
        style={{ backgroundImage: "url('/Frame_general.svg')" }}
      >
        <form onSubmit={handleSubmit} className="flex flex-col items-center gap-3 sm:gap-4 p-4 sm:p-6 w-full max-w-[320px]">
          <h1 className="text-xl sm:text-2xl font-bold mb-2 sm:mb-4 text-black text-center">Inscribir Aspirante</h1>

          <div className="mb-1 sm:mb-2 w-full">
            <label className="block text-lg sm:text-xl font-bold mb-1 text-black text-center">Nombre</label>
            <input
              type="text"
              placeholder="Nombre del aspirante"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
              className="w-full px-3 py-2 border-2 border-primary bg-white text-black rounded-md focus:outline-none focus:ring-2 focus:ring-primary placeholder-gray-500 text-sm sm:text-base"
            />
          </div>

          <div className="mb-1 sm:mb-2 w-full">
            <label className="block text-lg sm:text-xl font-bold mb-1 text-black text-center">Correo Electrónico</label>
            <input
              type="email"
              placeholder="Correo del aspirante"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              required
              className="w-full px-3 py-2 border-2 border-primary bg-white text-black rounded-md focus:outline-none focus:ring-2 focus:ring-primary placeholder-gray-500 text-sm sm:text-base"
            />
          </div>

          <div className="mb-1 sm:mb-2 w-full">
            <label className="block text-lg sm:text-xl font-bold mb-1 text-black text-center">Foto de Aspirante</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                setImagen(file || null);
              }}
              className="w-full text-black text-sm file:rounded-md file:border-0 file:bg-primary-dark file:text-white file:px-3 file:py-2 file:cursor-pointer file:hover:bg-primary"
            />
          </div>

          {Photo && (
            <div className="w-full text-center">
              <img src={Photo} alt="Imagen subida" className="w-20 h-20 sm:w-24 sm:h-24 rounded-full mx-auto mt-2 border-4 border-primary" />
            </div>
          )}

          <button
            type="submit"
            disabled={enviando}
            className={`w-full rounded-md bg-primary-dark hover:bg-primary text-white text-lg sm:text-xl p-3 sm:p-4 font-semibold ${enviando ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {enviando ? "Enviando..." : "Inscribir"}
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
