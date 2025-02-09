"use client";
import Image from "next/image";
import {useRouter} from "next/navigation"

export default function Home() {
  const router = useRouter()
  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
        <h1 className="text-4xl font-regular">Panel de calificaciones <span className="font-bold text-violet-700">Assessment 2025-1</span></h1>
        <div className="flex flex-col items-center gap-4">
          <h2 className="text-2xl">¿Eres calificador de base?</h2>
          <button className="rounded-md bg-gray-300 bg-opacity-20 text-white text-xl p-4 font-bold w-full"
          onClick={()=>{router.push("/graderPage")}}>Ingresa Aquí</button>
          <h2 className="text-2xl">¿Eres Admin?</h2>
          <button className="rounded-md bg-gray-300 bg-opacity-20 text-white text-xl p-4 font-bold w-full"
          onClick={()=>{router.push("/adminPage")}}>WambiSpace</button>
          
        </div>
        
        
        
    </div>
  );
}
