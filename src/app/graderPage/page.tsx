import React from 'react';

const GraderPage: React.FC = () => {
    return (
        <div className='flex flex-col items-center gap-4' >
            <h1 className='text-4xl font-regular mt-[50] mb-[20]'>Escoje la base que vas a calificar</h1>
            
             <div className='flex justify-center items-center gap-4'>
                <div className='bg-gray-300 bg-opacity-10 shadow-md rounded-lg p-6 '>
                    <h2 className='text-2xl font-semibold mb-4'>Base 1</h2>
                    <button className='rounded-md bg-gray-300 bg-opacity-20 text-white text-xl p-4 font-semibold w-full'>
                        Ingresar a Base 1
                    </button>
                </div>
                <div className='bg-gray-300 bg-opacity-10 shadow-md rounded-lg p-6'>
                    <h2 className='text-2xl font-semibold mb-4'>Base 2</h2>
                    <button className='rounded-md bg-gray-300 bg-opacity-20 text-white text-xl p-4 font-semibold w-full'>
                        Ingresar a Base 2
                    </button>
                </div>
            </div>


        </div>
    );
};

export default GraderPage;