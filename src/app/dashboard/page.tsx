import Image from "next/image";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center items-center min-h-screen py-2">
      <h1 className="text-4xl font-bold mb-8">Panel de Calificaciones</h1>
      <button className=" rounded-md bg-gray-300 bg-opacity-20 mb-8 text-xl p-5 font-bold"> Rotar Base </button>
      
      
      <div className="flex flex-col gap-4  max-w-[800px] rounded-md p-4 bg-gray-50 bg-opacity-10">
        <table className="min-w-full divide-y divide-gray-200 bg-opacity-50 rounded-md">
          <thead className="bg-gray-50 bg-opacity-20 w-full">
            <tr className="min-w-full">
              <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-white  uppercase tracking-wider">
                Grupo
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">
                Participante
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">
                Calificación
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">
                Estado
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-white uppercase tracking-wider">
                Calificadores
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200 rounded-md">
            <tr>
              
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Grupo 1</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Juan Perez</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">95</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Aprobado</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <p>Calificador 1</p>
                <p>Calificador 2</p>
              </td>
             
            </tr>
            <tr>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Grupo 2</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Maria Lopez</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">88</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Aprobado</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <p>Calificador 1</p>
                <p>Calificador 2</p>
              </td>
            </tr>
            
          </tbody>
        </table>
      </div>
    </div>
  );
}
