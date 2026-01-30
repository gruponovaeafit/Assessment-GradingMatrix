"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useStoredId } from "../../Hooks/UseStoreId";
import { useAdminAuth } from "../../Hooks/useAdminAuth";
import { Spinner } from "../../components/UI/Loading";

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
      
      // Guardar token si viene en la respuesta
      if (data.token) {
        localStorage.setItem("authToken", data.token);
      }

      if (data.role) {
        localStorage.setItem("authRole", data.role);
      }
      
      if (data.role === "admin") {
        loginAsAdmin(data.token);
        router.push("/admin");
      } else if (data.role === "registrador") {
        router.push("/register");
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
    <div className="flex flex-col items-center justify-center w-full min-h-screen bg-white px-4">
      <div className="w-full max-w-md mx-auto flex items-center justify-center">
        <form onSubmit={handleLogin} className="flex flex-col items-center gap-4 p-8 w-full max-w-[380px] bg-white shadow-lg rounded-2xl border border-gray-100">
          <h1 className="text-3xl font-extrabold mb-4 text-gray-900 text-center">Ingresar Credenciales</h1>
          <div className="mb-2 w-full">
            <label className="block text-lg font-semibold mb-1 text-gray-800">Correo Electrónico</label>
            <input
              type="email"
              placeholder="Correo Electrónico"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
              className="w-full px-3 py-2 border border-gray-300 bg-white text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent)] placeholder-gray-400 text-base disabled:opacity-50"
            />
          </div>

          <div className="mb-2 w-full">
            <label className="block text-lg font-semibold mb-1 text-gray-800">Contraseña</label>
            <input
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
              className="w-full px-3 py-2 border border-gray-300 bg-white text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-[color:var(--color-accent)] placeholder-gray-400 text-base disabled:opacity-50"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 rounded-lg bg-[color:var(--color-accent)] hover:bg-[#5B21B6] text-white text-lg font-semibold py-3 transition shadow flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Spinner size="sm" />
                <span>Iniciando sesión...</span>
              </>
            ) : (
              "Iniciar Sesión"
            )}
          </button>

          {error && <p className="text-error text-sm font-medium text-center">{error}</p>}
        </form>
      </div>
      <footer className="mb-5 w-full text-lg sm:text-xl text-center mt-10 sm:mt-20 italic text-gray-400">
        POWERED BY <span className="font-bold text-2xl sm:text-3xl text-[color:var(--color-accent)]">Nova</span>
      </footer>
    </div>
  );
}
