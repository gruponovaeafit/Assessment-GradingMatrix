"use client";
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Persona {
  ID: number;
  Participante: string;
  Correo: string;
  Grupo: string;
  role: string;
}

const GroupGeneration: React.FC = () => {
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [groupsGenerated, setGroupsGenerated] = useState<Persona[][]>([]);
  const router = useRouter();

  useEffect(() => {
    const fetchPersonas = async () => {
      try {
        const response = await fetch("/api/users");
        if (!response.ok) throw new Error('Error al cargar las personas');
        const data = await response.json();
        setPersonas(data);
      } catch (error) {
        console.error("Error al obtener personas:", error);
      }
    };

    fetchPersonas();
  }, []);

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formElement = e.currentTarget;
    const formData = new FormData(formElement);
    const numGroups = Number(formData.get('groups'));

    if (!numGroups || numGroups <= 0 || numGroups > 10) {
      alert('Por favor, ingrese un número válido de grupos.');
      return;
    }

    const lideres = personas.filter(p => p.role === "1");
    const otros = personas.filter(p => p.role !== "1");

    const shuffle = <T,>(arr: T[]) => [...arr].sort(() => Math.random() - 0.5);
    const lideresShuffle = shuffle(lideres);
    const otrosShuffle = shuffle(otros);

    const groups: Persona[][] = Array.from({ length: numGroups }, () => []);

    for (let i = 0; i < Math.min(numGroups, lideresShuffle.length); i++) {
      groups[i].push(lideresShuffle[i]);
    }

    let remainingLideres = lideresShuffle.slice(numGroups);
    remainingLideres.forEach((persona, index) => {
      groups[index % numGroups].push(persona);
    });

    otrosShuffle.forEach((persona, index) => {
      groups[index % numGroups].push(persona);
    });

    setGroupsGenerated(groups);
  };

  const handleUploadGroups = async () => {
    try {
      const response = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groups: groupsGenerated })
      });

      if (!response.ok) {
        throw new Error('Error al subir los grupos a la base de datos');
      }

      alert('Grupos subidos exitosamente a la base de datos');
    } catch (error) {
      console.error('Error al subir los grupos:', error);
      alert('Hubo un error al subir los grupos');
    }
  };

  return (
    <div className='flex flex-col items-center justify-center min-h-screen py-4 sm:py-8 px-4 gradient_purple'>
      <h1 className='text-xl sm:text-2xl font-bold mb-6 sm:mb-10 mt-4 sm:mt-10 text-white text-center'>Genera los Grupos</h1>
      <form onSubmit={handleFormSubmit} className='flex flex-col items-center justify-center bg-white/10 rounded-lg p-4 w-full max-w-[300px] backdrop-blur-sm'>
        <input 
          type="number" 
          placeholder='Cantidad de grupos' 
          name='groups'
          className='placeholder-white/70 bg-primary-dark border-none rounded-lg outline-none p-2 w-full text-white text-sm sm:text-base'
        />
        <button type='submit' className='mt-4 bg-primary hover:bg-primary-light text-white py-2 px-4 rounded-lg w-full font-semibold text-sm sm:text-base'>Generar grupos</button>
        <button type='button' className='mt-4 bg-black/30 hover:bg-black/50 text-white py-2 px-4 rounded-lg w-full text-sm sm:text-base' onClick={() => router.push('/dashboardadmin')}>
          Ir al panel de calificaciones
        </button>
        {groupsGenerated.length > 0 && (
          <button type='button' onClick={handleUploadGroups} className='mt-4 bg-success hover:bg-success-dark text-white py-2 px-4 rounded-lg w-full font-semibold text-sm sm:text-base'>
            Subir Grupos a la Base de Datos
          </button>
        )}
      </form>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 sm:mt-8 w-full max-w-4xl px-2'>
        {groupsGenerated.map((group, index) => (
          <div key={index} className='flex flex-col justify-center items-center p-3 sm:p-4 bg-white/10 rounded-lg shadow-md w-full mb-4 shadow-black/20 backdrop-blur-sm'>
            <h2 className='text-base sm:text-lg font-semibold text-white mb-2 sm:mb-3'>Grupo {index + 1}</h2>
            <ul className='w-full'>
              {group.map((member) => (
                <li key={member.ID} className='flex flex-col gap-1 bg-black/20 rounded-lg mb-2 sm:mb-3 p-2 sm:p-3'>
                  <span className='text-primary-light font-bold text-sm'>#{member.ID}</span>
                  <span className='text-white text-sm'>
                    {member.Participante} <span className='text-white/60 text-xs'>({member.Correo})</span>
                  </span>
                  <span className='text-white/80 text-xs'>Rol: {member.role} | Grupo: {member.Grupo}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GroupGeneration;
