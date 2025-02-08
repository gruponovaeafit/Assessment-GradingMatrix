import Image from "next/image";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center items-center min-h-screen py-2">
      <h1 className="text-4xl font-bold mb-8">Panel de Calificaciones</h1>
      
      <div className="flex flex-col gap-4 w-full w-[600px] rounded-md p-4 bg-gray-50 bg-opacity-10">
        <table className="min-w-full divide-y divide-gray-200 bg-opacity-50 rounded-md">
          <thead className="bg-gray-50 bg-opacity-20">
            <tr>
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
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200 rounded-md">
            <tr>
              
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Grupo 1</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Juan Perez</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">95</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Aprobado</td>
            </tr>
            <tr>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Grupo 2</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Maria Lopez</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">88</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Aprobado</td>
            </tr>
            
          </tbody>
        </table>
      </div>
    </div>
  );
}
