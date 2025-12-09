"use client";
import Image from "next/image";
import {useRouter} from "next/navigation"

export default function Home() {
  const router = useRouter()
  return (
    <div className="flex flex-col items-center justify-center w-full min-h-screen gradient_purple bg-no-repeat bg-cover bg-center px-4">
      <span className="font-bold text-2xl sm:text-3xl text-white text-center">Aplicativo assessment</span>
      <div className="flex flex-col items-center justify-center gap-8 sm:gap-12 bg-no-repeat bg-center bg-contain w-full max-w-[400px] h-[500px] sm:h-[600px]"
        style={{ backgroundImage: "url('/Frame_general.svg')" }}
      >
        <h1 className="text-2xl sm:text-3xl font-regular text-center text-white">¿Quién eres?</h1>
        <button
          onClick={() => router.push("/register")}
          className="rounded-md bg-primary-dark hover:bg-primary shadow-xl shadow-black/30 text-white text-lg sm:text-xl p-3 sm:p-4 font-bold h-[45px] sm:h-[50px] w-[220px] sm:w-[260px]"
        >
          Registrador/a
        </button> 
        <button
          onClick={() => router.push("/auth/login")}
          className="rounded-md bg-primary-dark hover:bg-primary shadow-xl shadow-black/30 text-white text-lg sm:text-xl p-3 sm:p-4 font-bold h-[45px] sm:h-[50px] w-[220px] sm:w-[260px]"
        >
          Calificador/a
        </button> 
        <button
          onClick={() => router.push("/auth/login")}
          className="rounded-md bg-primary-dark hover:bg-primary shadow-xl shadow-black/30 text-white text-lg sm:text-xl p-3 sm:p-4 font-bold h-[45px] sm:h-[50px] w-[220px] sm:w-[260px]"
        >
          Admin
        </button>  
      </div>
      <footer className="mb-5 w-full text-lg sm:text-xl text-center mt-10 sm:mt-20 italic text-white">
        POWERED BY <span className="font-bold text-2xl sm:text-3xl text-primary-light">Nova</span>
      </footer>
    </div>
  );
}
