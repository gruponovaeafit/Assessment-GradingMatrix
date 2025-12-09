"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useStoredId } from "../../Hooks/UseStoreId";
import { useAdminAuth } from "../../Hooks/useAdminAuth";

export default function Login() {
  const { saveData } = useStoredId();
  const { loginAsAdmin } = useAdminAuth();

  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

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
      
      if (data.role === "admin") {
        loginAsAdmin();
        router.push("/final");
      } else if (data.role === "calificador") {
        saveData(data.ID_Grupo, data.ID_Calificador, data.ID_Base);
        router.push(`/graderPage`);
      } else {
        router.push("/dashboard");
      }
    } catch (err) {
      setError("Error al iniciar sesión. Verifica tus credenciales.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center w-full min-h-screen bg-no-repeat bg-cover bg-center gradient_purple px-4">
      <div
        className="relative bg-no-repeat bg-center bg-contain w-full max-w-[400px] h-[550px] sm:h-[600px] flex items-center justify-center"
        style={{ backgroundImage: "url('/Frame_general.svg')" }}
      >
        <form onSubmit={handleLogin} className="flex flex-col items-center gap-4 p-4 sm:p-6 w-full max-w-[320px]">
          <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-8 text-white text-center">Ingresar Credenciales</h1>
          <div className="mb-2 sm:mb-4 w-full">
            <label className="block text-lg sm:text-xl font-bold mb-2 text-white text-center">Correo electrónico</label>
            <input
              type="email"
              placeholder="Correo Electrónico"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 border-2 border-primary bg-white text-black rounded-md focus:outline-none focus:ring-2 focus:ring-primary placeholder-gray-500 text-sm sm:text-base"
            />
          </div>

          <div className="mb-2 sm:mb-4 w-full">
            <label className="block text-lg sm:text-xl font-bold mb-2 text-white text-center">Contraseña</label>
            <input
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 border-2 border-primary bg-white text-black rounded-md focus:outline-none focus:ring-2 focus:ring-primary placeholder-gray-500 text-sm sm:text-base"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="rounded-md bg-primary-dark hover:bg-primary disabled:bg-primary/50 disabled:cursor-not-allowed text-white text-lg sm:text-xl p-3 sm:p-4 font-semibold w-full"
          >
            {isLoading ? "Cargando..." : "Iniciar Sesión"}
          </button>

          {error && <p className="text-error text-sm font-medium text-center">{error}</p>}
        </form>
      </div>
      <footer className="mb-5 w-full text-lg sm:text-xl text-center mt-10 sm:mt-20 italic text-white">
        POWERED BY <span className="font-bold text-2xl sm:text-3xl text-primary-light">Nova</span>
      </footer>
    </div>
  );
}