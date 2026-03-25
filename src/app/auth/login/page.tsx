"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useStoredId } from "@/hooks/useStoredId";
import { useAuth } from "@/lib/auth/AuthContext";
import { Box } from "@/components/UI/Box";
import { InputBox } from "@/components/UI/InputBox";
import { Button } from "@/components/UI/Button";
import { notify, NotificationProvider } from "@/components/UI/Notification";

export default function Login() {
  const { saveData } = useStoredId();
  const { login } = useAuth();

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
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Credenciales incorrectas");
      }

      const data = await response.json();

      if (data.role === "admin") {
        const isSuper = Boolean(data.superAdmin);
        login({
          id: data.ID_Calificador || 0,
          email: email,
          role: "admin",
          isSuperAdmin: isSuper,
          assessmentId: data.assessmentId || null,
        });
        router.push(isSuper ? "/super-admin" : "/admin");
      } else if (data.role === "registrador") {
        login({
          id: data.ID_Calificador,
          email: email,
          role: "registrador",
          isSuperAdmin: false,
          assessmentId: data.assessmentId || null,
        });
        router.push("/register");
      } else if (data.role === "calificador") {
        saveData(data.ID_Grupo, data.ID_Calificador, data.ID_Base);
        login({
          id: data.ID_Calificador,
          email: email,
          role: "calificador",
          isSuperAdmin: false,
          assessmentId: data.assessmentId || null,
        });
        router.push(`/grader`);
      } else {
        router.push("/dashboard");
      }
    } catch (err: any) {
      const message = err instanceof Error ? err.message : "Error al iniciar sesión. Verifica tus credenciales.";
      setError(message);
      notify({
        title: "Error de Acceso",
        titleColor: "#ef4444",
        subtitle: message,
        subtitleColor: "#6b7280",
        borderColor: "#ef4444",
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col space-y-6 items-center justify-center h-dvh bg-gray-100 px-4 py-8 lg:py-6">

      {/* Header */}
      <div className="text-center w-full max-w-2xl">
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

        </Box>
      </form>

      {/* Footer */}
      <footer className="text-gray-400 text-base xl:text-lg italic">
        POWERED BY{" "}
        <span className="font-bold text-2xl text-purple-400">Nova</span>
      </footer>
      <NotificationProvider />
    </div>
  );
}