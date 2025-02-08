"use client";
import React from 'react';
import { useRouter } from 'next/router';

const GroupGeneration: React.FC = () => {
    

    const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
  
      const formElement = e.currentTarget;
      const formData = new FormData(formElement);
  
      try {
        const response = await fetch("/api/forms/groupG", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(Object.fromEntries(formData.entries())), // Convierte FormData a JSON
        });
      
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
      
        const data = await response.json();
        console.log("Response data:", data);
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
                    className='placeholder-white placeholder-semibold bg-white bg-opacity-30 border-none rounded-lg outline-none p-2'
                />
                <button type='submit' className='mt-2 bg-blue-500 text-white py-2 px-4 rounded-lg'>Generar grupos</button>
            </form>
            <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                {['Equipo A', 'Equipo B', 'Equipo C', 'Equipo D'].map((team, index) => (
                    <div key={index} className=' flex flex-col justify-center items-center p-4 bg-white bg-opacity-10 rounded-lg shadow-md w-[250px]'>
                        <h2 className='text-lg font-semibold text-white'>{team}</h2>
            
                        <ul>
                            <li className='text-white'>Miembro 1</li>
                            <li className='text-white'>Miembro 2</li>
                            <li className='text-white'>Miembro 3</li>
                            <li className='text-white'>Miembro 4</li>
                        </ul>
                    </div>
                ))}
            </div>

            
        </div>
    );
};

export default GroupGeneration;