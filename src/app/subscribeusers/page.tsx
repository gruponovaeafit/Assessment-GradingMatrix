"use client";
// app/groupGeneration/page.tsx
import { useState } from 'react';
import { useEffect } from 'react'

export default function RegisterPerson() {
  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [mensaje, setMensaje] = useState('');
  

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ nombre, correo }),
      });

      if (response.ok) {
        setMensaje('Persona inscrita exitosamente');
        setNombre('');
        setCorreo('');
      } else {
        const data = await response.json();
        setMensaje(`Error: ${data.error}`);
      }
    } catch (error) {
      setMensaje('Error al conectar con el servidor');
    }
  };

  useEffect(() => {
    if (mensaje) {
      const timer = setTimeout(() => {
        setMensaje('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [mensaje]);

  return (
    <div   className="flex flex-col items-center justify-center w-full min-h-screen bg-no-repeat bg-cover bg-center"
   style={{ backgroundImage: "url('/Bg_gradient_pink.svg')" }}>
     <div
    className="relative bg-no-repeat bg-center bg-contain w-[400px] h-[600px] flex items-center justify-center"
    style={{ backgroundImage: "url('/Frame_general.svg')" }} 
>
    <form onSubmit={handleSubmit} className="flex flex-col items-center gap-4 p-6 w-80">
      <h1 className="text-2xl font-bold mb-8 text-white">Inscribir Aspirante</h1>

      <div className="mb-4 w-full">
        <label className="block text-xl font-bold mb-2 text-white ml-[100px]">Nombre</label>
        <input
          type="text"
          placeholder="Nombre del aspirante"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          required
          className="w-full px-3 py-2 border border-[#542CB3] bg-[#DB0083] text-white rounded-md focus:outline-none focus:ring-2 focus:ring-[#542CB3]"
        />
      </div>

      <div className="mb-4 w-full">
        <label className="block text-xl font-bold mb-2 text-white ml-12">Correo Electrónico</label>
        <input
          type="email"
          placeholder="Correo del aspirante"
          value={correo}
          onChange={(e) => setCorreo(e.target.value)}
          required
          className="w-full px-3 py-2 border border-[#542CB3] bg-[#DB0083] text-white rounded-md focus:outline-none focus:ring-2 focus:ring-[#542CB3]"
        />
      </div>

      <button
        type="submit"
        className="w-full"
      >
        <img
          src="/Button_register.svg"
          alt="Botón Inscribir"
          className="w-full h-auto"
        />
      </button>



      {mensaje && (
        <p className="mt-4 text-lg font-medium text-center text-green-400">{mensaje}</p>
      )}
    </form>
  </div>
</div>
  );
}
