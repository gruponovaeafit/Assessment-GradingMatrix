"use client";
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Persona {
    ID: number;
    Nombre: string;
    Correo: string;
}

const GroupGeneration: React.FC = () => {
    const [personas, setPersonas] = useState<Persona[]>([]);
    const [groupsGenerated, setGroupsGenerated] = useState<Persona[][]>([]);
    const router = useRouter();

    // Obtener las personas de la base de datos
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

        // Distribuir las personas en grupos
        const shuffled = [...personas].sort(() => 0.5 - Math.random());
        const groups: Persona[][] = Array.from({ length: numGroups }, () => []);

        shuffled.forEach((persona, index) => {
            groups[index % numGroups].push(persona);
        });

        setGroupsGenerated(groups);
    };

    const handleUploadGroups = async () => {
        try {
            const response = await fetch('/api/groups', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
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
        <div className='flex flex-col items-center justify-center min-h-screen py-2'>
            <h1 className='text-2xl font-bold mb-[40] mt-[40]'>Genera los Grupos</h1>
            <form onSubmit={handleFormSubmit} className='flex flex-col items-center justify-center bg-white bg-opacity-5 rounded-lg p-4 m-[20] w-[300px]'>
                <input 
                    type="number" 
                    placeholder='Cantidad de grupos' 
                    name='groups'
                    className='placeholder-white placeholder-bold bg-violet-700 border-none rounded-lg outline-none p-2 w-full'
                />
                <button type='submit' className='mt-4 bg-gray-300 bg-opacity-10 text-white py-2 px-4 rounded-lg w-full'>Generar grupos</button>
                <button className='mt-4 bg-gray-300 bg-opacity-10 text-white py-2 px-4 rounded-lg w-full' onClick={() => router.push('/dashboardadmin')}>
                    Ir al panel de calificaciones
                </button>
                {groupsGenerated.length > 0 && (
                    <button type='button' onClick={handleUploadGroups} className='mt-4 bg-green-500 text-white py-2 px-4 rounded-lg w-full'>
                        Subir Grupos a la Base de Datos
                    </button>
                )}
            </form>
            <div className='grid grid-cols-1 gap-4 md:grid-cols-2 m-[20]'>
                {groupsGenerated && groupsGenerated.map((group, index) => (
                    <div key={index} className='flex flex-col justify-center items-center p-4 bg-white bg-opacity-5 rounded-lg shadow-md w-[360px] mb-[20] shadow-gray-300/20'>
                      <h2 className='text-lg font-semibold text-white mb-[10]'>Grupo {index + 1}</h2>
                      <ul>
                        {group.map((member) => (
                          <li key={member.ID} className='flex items-center justify-start gap-2 bg-gray-300 bg-opacity-10 rounded-lg mb-[10] p-[5]'>
                            <span className='text-violet-700 font-bold'>#{member.ID}</span>
                            <span className='text-white'>{member.Nombre} (<span className='text-gray-400'>{member.Correo}</span>)</span>
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
