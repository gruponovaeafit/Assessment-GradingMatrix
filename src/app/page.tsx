"use client";
import Image from "next/image";
import {useRouter} from "next/navigation"

export default function Home() {
  const router = useRouter()
  return (
    <div className="flex flex-col items-center justify-center w-full min-h-screen bg-white px-4">
      <div className="w-full max-w-md mx-auto mt-16 mb-8">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-center text-gray-900 mb-2 tracking-tight leading-tight">Assessment Grading Matrix</h1>
        <p className="text-center text-gray-500 text-lg sm:text-xl mb-10">Sistema moderno y sobrio para calificar y gestionar el Assessment fácilmente.</p>
        <div className="flex flex-col gap-6 bg-white shadow-lg rounded-2xl px-8 py-10 border border-gray-100">
          <h2 className="text-2xl font-bold text-gray-800 text-center mb-4">¿Qué quieres hacer?</h2>
          <button
            onClick={() => router.push("/register")}
            className="rounded-lg bg-[color:var(--color-accent)] hover:bg-[#5B21B6] text-white text-lg font-semibold py-3 transition shadow"
          >
            Registrar
          </button>
          <button
            onClick={() => router.push("/auth/login")}
            className="rounded-lg bg-[color:var(--color-accent)] hover:bg-[#5B21B6] text-white text-lg font-semibold py-3 transition shadow"
          >
            Iniciar Sesion
          </button>
        </div>
      </div>
      <footer className="mb-5 w-full text-lg sm:text-xl text-center mt-10 sm:mt-20 italic text-gray-400">
        POWERED BY <span className="font-bold text-2xl sm:text-3xl text-[color:var(--color-accent)]">Nova</span>
      </footer>
    </div>
  );
}
