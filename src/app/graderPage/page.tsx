import React from 'react';

const GraderPage: React.FC = () => {
    return (
        <div className='flex flex-col items-center gap-4' >
            <h1 className='text-4xl font-regular'>Escoje la base que vas a calificar</h1>
            
             <div className='flex flex-col gap-4'>
                <div className='bg-white shadow-md rounded-lg p-6'>
                    <h2 className='text-2xl font-semibold mb-4'>Base 1</h2>
                    <button className='bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-700'>
                        Ingresar a Base 1
                    </button>
                </div>
                <div className='bg-white shadow-md rounded-lg p-6'>
                    <h2 className='text-2xl font-semibold mb-4'>Base 2</h2>
                    <button className='bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-700'>
                        Ingresar a Base 2
                    </button>
                </div>
            </div>


        </div>
    );
};

export default GraderPage;