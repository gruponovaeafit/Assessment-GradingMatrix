"use client";
import { useState, useEffect } from "react";

export default function RegisterPerson() {
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [imagen, setImagen] = useState<File | null>(null);
  const [Photo, setPhoto] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [enviando, setEnviando] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nombre || !correo || !imagen) {
      setMensaje("Por favor completa todos los campos");
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
        setMensaje("Persona inscrita exitosamente");
        setPhoto(data.url);
        setNombre("");
        setCorreo("");
        setImagen(null);
      } else {
        setMensaje(`Error: ${data.error}`);
      }
    } catch (err) {
      console.error(err);
      setMensaje("Error al conectar con el servidor");
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
    <div className="flex flex-col items-center justify-center w-full min-h-screen bg-no-repeat bg-cover bg-center bg-[linear-gradient(210deg,#135ce3,#8c4fd5,#ff296e,#d9448f,#b25faf)]">
      <div
        className="relative bg-no-repeat bg-center bg-contain w-[400px] h-auto flex items-center justify-center"
        style={{ backgroundImage: "url('/Frame_general.svg')" }}
      >
        <form onSubmit={handleSubmit} className="flex flex-col items-center gap-4 p-6 w-80">
          <h1 className="text-2xl font-bold mb-4 text-white">Inscribir Aspirante</h1>

          <div className="mb-2 w-full">
            <label className="block text-xl font-bold mb-1 text-white ml-[100px]">Nombre</label>
            <input
              type="text"
              placeholder="Nombre del aspirante"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              required
              className="w-full px-3 py-2 border border-[#542CB3] bg-[#DB0083] text-white rounded-md focus:outline-none focus:ring-2 focus:ring-[#542CB3]"
            />
          </div>

          <div className="mb-2 w-full">
            <label className="block text-xl font-bold mb-1 text-white ml-12">Correo Electrónico</label>
            <input
              type="email"
              placeholder="Correo del aspirante"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              required
              className="w-full px-3 py-2 border border-[#542CB3] bg-[#DB0083] text-white rounded-md focus:outline-none focus:ring-2 focus:ring-[#542CB3]"
            />
          </div>

          <div className="mb-2 w-full">
            <label className="block text-xl font-bold mb-1 text-white ml-16">Foto de Aspirante</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                setImagen(file || null);
              }}
              className="w-full text-white file:rounded-md file:border-0 file:bg-[#542CB3] file:text-white file:px-3 file:py-2 file:cursor-pointer"
            />
          </div>

          {Photo && (
            <div className="w-full text-center">
              <img src={Photo} alt="Imagen subida" className="w-24 h-24 rounded-full mx-auto mt-2" />
            </div>
          )}

          <button type="submit" className="w-full" disabled={enviando}>
            <img
              src="/Button_register.svg"
              alt="Botón Inscribir"
              className={`w-full h-auto ${enviando ? "opacity-50" : ""}`}
            />
          </button>

          {mensaje && (
            <p className="mt-4 text-lg font-medium text-center text-green-400">{mensaje}</p>
          )}
        </form>
      </div>

      <footer className="mb-[20px] w-full text-xl text-center mt-20 italic">
        POWERED BY <span className="font-bold text-3xl text-violet-700">Nova</span>
      </footer>
    </div>
  );
}
