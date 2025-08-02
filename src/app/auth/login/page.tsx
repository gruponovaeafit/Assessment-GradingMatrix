"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useStoredId } from "../../Hooks/UseStoreId";

export default function Login() {
  const { saveData } = useStoredId();


  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const adminEmail = process.env.NEXT_PUBLIC_CRR;
  const adminPassword = process.env.NEXT_PUBLIC_PSS;


  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);


    if (email === adminEmail && password === adminPassword) {
      router.push("/final");
      return;
    }
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error("Credenciales incorrectas");
      }

      const data = await response.json();
     if (data.role === "calificador") {

        saveData(data.ID_Grupo, data.ID_Calificador, data.ID_Base);
        router.push(`/graderPage`);
      } else {
        router.push("/dashboard");
      }
    } catch (err) {
      setError("Error al iniciar sesión. Verifica tus credenciales.");
    }
  };

  return (
    <div   className=" gr flex flex-col items-center justify-center w-full min-h-screen bg-no-repeat bg-cover bg-center bg-[linear-gradient(210deg,#135ce3,#8c4fd5,#ff296e,#d9448f,#b25faf)]"
    >
     <div
    className="relative bg-no-repeat bg-center bg-contain w-[400px] h-[600px] flex items-center justify-center"
    style={{ backgroundImage: "url('/Frame_general.svg')" }} 
>
    <form onSubmit={handleLogin} className="flex flex-col items-center gap-4 p-6 w-80">
      <h1 className="text-2xl font-bold mb-8 text-white">Ingresar Credenciales</h1>
      <div className="mb-4 w-full">
        <label className="block text-xl font-bold mb-2 text-white ml-[50px]">Correo electrónico</label>
         <input
           type="email"
           placeholder="Correo Electrónico"
           value={email}
           onChange={(e) => setEmail(e.target.value)}
           required
           className="w-full px-3 py-2 border border-[#542CB3] bg-[#DB0083] text-white rounded-md focus:outline-none focus:ring-2 focus:ring-[#542CB3]"
         />
      </div>

      <div className="mb-4 w-full">
        <label className="block text-xl font-bold mb-2 text-white ml-20">Contraseña</label>
         <input
           type="password"
           placeholder="Contraseña"
           value={password}
           onChange={(e) => setPassword(e.target.value)}
           required
           className="w-full px-3 py-2 border border-[#542CB3] bg-[#DB0083] text-white rounded-md focus:outline-none focus:ring-2 focus:ring-[#542CB3]"
         />
      </div>

       <button
          type="submit"
         className="rounded-md bg-gray-300 bg-opacity-20 text-white text-xl p-4 font-semibold w-full"
      >
        Iniciar Sesión
       </button>

          {error && <p className="text-red-500 text-sm">{error}</p>}
     </form>
    </div>
    <footer className="mb-[20] w-full text-xl text-center mt-20 m-[0] italic">
     POWERED BY <span className="font-bold text-3xl text-violet-700">Nova</span>
    </footer>
  </div>
 );
}