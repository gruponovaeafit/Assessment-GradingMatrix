"use client";
import React from 'react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

const GroupGeneration: React.FC = () => {
    const [groupsGenerated, setGroupsGenerated] = useState<string[][]>([]);
    const router = useRouter();
    const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
  
      const formElement = e.currentTarget;
      const formData = new FormData(formElement);

      if (!formData.get('groups') || Number(formData.get('groups')) <= 0 || Number(formData.get('groups')) > 10) {
        alert('Por favor, ingrese un número válido de grupos.');
        return;
    }
  
      try {
        const response = await fetch("/api/groupG", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
            
          body: JSON.stringify(Object.fromEntries(formData.entries())), // Convierte FormData a JSON
        });
      
        if (!response.ok) {
         
          throw new Error(`HTTP error! status: ${response.status}`);
        }
      
        setGroupsGenerated(await response.json().then((data) => data.groups));
        
      } catch (error) {
        console.error("Error sending form:", error);
      }
    };

    return (
        <div className='flex flex-col items-center justify-center min-h-screen py-2'>
            <h1 className='text-3xl font-bold mb-[20]'>Genera los grupos de manera aleatoria</h1>
            <form onSubmit={handleFormSubmit} className='flex flex-col items-center justify-center bg-white bg-opacity-10 rounded-lg p-4 m-[20] w-[300px]'>
                <input 
                    type="number" 
                    placeholder='Cantidad de grupos' 
                    name='groups'
                    className='placeholder-white placeholder-semibold bg-white bg-opacity-30 border-none rounded-lg outline-none p-2'
                />
                <button type='submit' className='mt-2 bg-blue-500 text-white py-2 px-4 rounded-lg'>Generar grupos</button>
            </form>
            <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                {groupsGenerated && groupsGenerated.map((group, index) => (
                    <div key={index} className='flex flex-col justify-center items-center p-4 bg-white bg-opacity-10 rounded-lg shadow-md w-[250px]'>
                        <h2 className='text-lg font-semibold text-white'>Grupo {index + 1}</h2>
                        <ul>
                            {group.map((member, memberIndex) => (
                                <li key={memberIndex} className='text-white'>{member}</li>
                            ))}
                        </ul>
                        <button className='mt-4 bg-blue-500 text-white py-2 px-4 rounded-lg'>
                            Asignar Calificadores
                        </button>
                    </div>
                ))}
               
            </div>
            <button className='mt-4 bg-gray bg-opacity-50 text-white py-2 px-4 rounded-lg' onClick={() => router.push('/dashboard')}>
                Ir al panel de calificaciones
            </button>

            
        </div>
    );
};

export default GroupGeneration;