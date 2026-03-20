"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useStoredId } from "@/hooks/useStoredId";
import { useAdminAuth } from "@/hooks/useAdminAuth";
import { useGraderAuth } from "@/hooks/useGraderAuth";
import { Box } from "@/components/UI/Box";
import { InputBox } from "@/components/UI/InputBox";
import { Button } from "@/components/UI/Button";

export default function Login() {
  const { saveData } = useStoredId();
  const { loginAsAdmin } = useAdminAuth();
  const { loginAsGrader } = useGraderAuth();

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
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error("Credenciales incorrectas");
      }

      const data = await response.json();

      if (data.role === "admin") {
        const isSuper = Boolean(data.superAdmin);
        loginAsAdmin(isSuper);
        router.push(isSuper ? "/super-admin" : "/admin");
      } else if (data.role === "registrador") {
        router.push("/register");
      } else if (data.role === "calificador") {
        saveData(data.ID_Grupo, data.ID_Calificador, data.ID_Base);
        loginAsGrader();
        router.push(`/grader`);
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
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 px-4 py-8 lg:py-6">

      {/* Header */}
      <div className="text-center mb-4 lg:mb-6 xl:mb-10 w-full max-w-2xl">
        <h1 className="text-4xl sm:text-5xl xl:text-6xl font-extrabold text-purple-400 leading-tight drop-shadow-[3px_4px_1.5px_rgba(0,0,0,0.15)]">
          Assessment Grading Matrix
        </h1>
        <p className="mt-2 xl:mt-4 text-gray-400 text-sm xl:text-lg font-semibold">
          Sistema moderno y sobrio para calificar y gestionar el assessment fácilmente.
        </p>
      </div>

      <form onSubmit={handleLogin} className="w-full max-w-[380px]">
        <Box className="flex flex-col gap-4 xl:gap-5">

          <h2 className="text-xl xl:text-2xl font-bold text-gray-800 text-center">
            Ingresar Credenciales
          </h2>

          <InputBox
            label="Correo Electrónico"
            type="email"
            placeholder="Correo Electrónico"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
          />

          <InputBox
            label="Contraseña"
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
          />

          <Button
            type="submit"
            variant="accent"
            loading={isLoading}
            className="w-full mt-2 py-3 text-lg"
          >
            {!isLoading && "Iniciar Sesión"}
          </Button>

          {error && (
            <p className="text-red-500 text-sm text-center font-medium">
              {error}
            </p>
          )}

        </Box>
      </form>

      {/* Footer */}
      <footer className="mt-6 lg:mt-8 xl:mt-16 text-gray-400 text-base xl:text-lg italic">
        POWERED BY{" "}
        <span className="font-bold text-2xl text-purple-400">Nova</span>
      </footer>
    </div>
  );
}