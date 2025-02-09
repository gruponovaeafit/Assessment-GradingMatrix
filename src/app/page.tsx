"use client";
import Image from "next/image";
import {useRouter} from "next/navigation"

export default function Home() {
  const router = useRouter()
  return (
    <div className="flex flex-col items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)] mt-[100]">
        <h1 className="text-3xl font-regular text-center">Panel de calificaciones <span className="font-bold text-violet-700">Assessment 2025-1</span></h1>
        <div className="flex flex-col items-center gap-4">
          

          <h2 className="text-xl">¿Eres Registrador?</h2>
          <button className="rounded-md bg-gray-300 bg-opacity-20 text-white text-xl p-4 font-bold w-full"
          onClick={()=>{router.push("/subscribeusers")}}>Ingresa Aquí</button>

          <h2 className="text-xl">¿Eres calificador de base?</h2>
          <button className="rounded-md bg-gray-300 bg-opacity-20 text-white text-xl p-4 font-bold w-full"
          onClick={()=>{router.push("/auth/login")}}>Ingresa Aquí</button>

          <h2 className="text-xl">¿Eres Admin?</h2>
          <button className="rounded-md bg-gray-300 bg-opacity-20 text-white text-xl p-4 font-bold w-full"
          onClick={()=>{router.push("/auth/login")}}>WambiSpace</button>
          
        </div>
    </div>
  );
}
