"use client";
import Image from "next/image";
import {useRouter} from "next/navigation"

export default function Home() {
  const router = useRouter()
  return (
    <div   className="flex flex-col items-center justify-center min-h-screen bg-no-repeat bg-cover bg-center"
  style={{ backgroundImage: "url('/gradientemorado.svg')" }}>
    <span className="font-bold text-3xl text-white-700">Assessment 2025-1</span>
      <div className="flex flex-col items-center justify-center gap-12 bg-no-repeat bg-center bg-contain w-[400px] h-[600px] "
      style={{ backgroundImage: "url('/marco.svg')" }}
      >
      <h1 className="text-3xl font-regular text-center">¿Quién eres?</h1>
      <button
       onClick={() => router.push("/subscribeusers")}
       className="w-[260px] h-[50px] bg-no-repeat bg-contain bg-center"
       style={{ backgroundImage: "url('/Botón Registrador.svg')" }}
      />
      <button
       onClick={() => router.push("/auth/login")}
       className="w-[260px] h-[50px] bg-no-repeat bg-contain bg-center"
       style={{ backgroundImage: "url('/botóncal.svg')" }}
      />
      <button
       onClick={() => router.push("/auth/login")}
       className="w-[260px] h-[50px] bg-no-repeat bg-contain bg-center"
       style={{ backgroundImage: "url('/botónadm.svg')" }}
      />    
      </div>
  </div>
 );
}
