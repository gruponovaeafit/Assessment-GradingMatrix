"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Login() {
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
        router.push(`/graderPage`);
      } else {
        router.push("/dashboard");
      }
    } catch (err) {
      setError("Error al iniciar sesión. Verifica tus credenciales.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center ">
       <h1 className="text-2xl font-bold mt-[20] mb-[20]">Ingresa tus credenciales</h1>
      <form
        onSubmit={handleLogin}
        className="flex flex-col items-center gap-4 bg-gray-300 bg-opacity-10 p-6 rounded-lg w-80"
      >
        <input
          type="email"
          placeholder="Correo Electrónico"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-3 py-2 border border-gray-600 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-violet-700"
          required
        />

       
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-3 py-2 border border-gray-600 bg-gray-700 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-violet-700"
          required
        />
        <button
          type="submit"
          className="rounded-md bg-gray-300 bg-opacity-20 text-white text-xl p-4 font-semibold w-full"
        >
          Iniciar Sesión
        </button>
        {error && <p className="text-red-500 text-sm">{error}</p>}
      </form>
    </div>
  );
} 
