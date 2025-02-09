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
    <div className="flex flex-col items-center justify-items-center mt-[30px]">
      <h1 className="text-2xl font-bold mb-8">Inscribir Persona</h1>
      <form onSubmit={handleSubmit} className="  p-5 rounded-md  bg-gray-300 bg-opacity-10">
        <div className="mb-4">
          <label className="block text-gray-300 text-sm font-bold mb-2">Nombre</label>
          <input
            type="text"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-600 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-violet-700"
          />
        </div>
        <div className="mb-4">
          <label className="block text-gray-300 text-sm font-bold mb-2">Correo</label>
          <input
            type="email"
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-600 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-violet-700"
          />
        </div>
        <button
          type="submit"

          className="rounded-md bg-gray-300 bg-opacity-20 text-white text-xl p-4 font-semibold w-full"
        >
          Inscribir
        </button>
      </form>
    

     
      {mensaje && <p className="mt-4 text-lg font-medium text-center text-green-400">{mensaje}</p>}
    </div>
  );
}
