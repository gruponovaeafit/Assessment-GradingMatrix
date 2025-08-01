"use client";
import Image from "next/image";
import {useRouter} from "next/navigation"

export default function Home() {
  const router = useRouter()
  return (
    <div   className="flex flex-col items-center justify-center w-full min-h-screen gradient_purple bg-no-repeat bg-cover bg-center">
    <span className="font-bold text-3xl text-white-700">Assessment 2025-2</span>
      <div className="flex flex-col items-center justify-center gap-12 bg-no-repeat bg-center bg-contain w-[400px] h-[600px] "
      style={{ backgroundImage: "url('/Frame_general.svg')" }}
      >
      <h1 className="text-3xl font-regular text-center">¿Quién eres?</h1>
      <button
       onClick={() => router.push("/subscribeusers")}
       className="rounded-md bg-[#542cb3] shadow-xl shadow-gray-900/50 text-white text-xl p-4 font-bold h-[50px] w-[260px]"
      >
       Registrador/a
      </button> 
      <button
       onClick={() => router.push("/auth/login")}
       className="rounded-md bg-[#542cb3] shadow-xl shadow-gray-900/50 text-white text-xl p-4 font-bold h-[50px] w-[260px]"
      >
       Calificador/a
      </button> 
      <button
       onClick={() => router.push("/auth/login")}
       className="rounded-md bg-[#542cb3] shadow-xl shadow-gray-900/50 text-white text-xl p-4 font-bold h-[50px] w-[260px]"
      >
       Admin
      </button>  
      </div>
     <footer className="mb-[20] w-full text-xl text-center mt-20 m-[0] italic">
       POWERED BY <span className="font-bold text-3xl text-violet-700">Nova</span>
     </footer>
  </div>
 );
}
