"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useStoredId } from "../../Hooks/UseStoreId";

export default function Login() {
  const { saveId } = useStoredId();


  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const adminEmail = "admin@example.com";
  const adminPassword = "admin123";


  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);


    if (email === adminEmail && password === adminPassword) {
      router.push("/dashboardadmin");
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
        saveId(data.ID_Grupo);
        router.push(`/graderPage`);
      } else {
        router.push("/dashboard");
      }
    } catch (err) {
      setError("Error al iniciar sesión. Verifica tus credenciales.");
    }
  };

  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <h1 className="text-4xl font-bold mb-6">Iniciar Sesión</h1>
      <form
        onSubmit={handleLogin}
        className="flex flex-col items-center gap-4 bg-gray-300 bg-opacity-20 p-6 rounded-lg w-80"
      >
        <input
          type="email"
          placeholder="Correo Electrónico"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="p-2 border-none rounded-md w-full text-black placeholder-gray-700"
          required
        />
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="p-2 border-none rounded-md w-full text-black placeholder-gray-700"
          required
        />
        <button
          type="submit"
          className="rounded-md bg-gray-300 bg-opacity-20 text-white text-xl p-4 font-bold w-full"
        >
          Iniciar Sesión
        </button>
        {error && <p className="text-red-500 text-sm">{error}</p>}
      </form>
    </div>
  );
} 
