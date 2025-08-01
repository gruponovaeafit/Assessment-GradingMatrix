"use client";
import Image from "next/image";
import {useRouter} from "next/navigation"

export default function Home() {
  const router = useRouter()
  return (
    <div   className="flex flex-col items-center justify-center w-full min-h-screen bg-no-repeat bg-cover bg-center"
  style={{ backgroundImage: "url('/Bg_gradient_purple.svg')" }}>
    <span className="font-bold text-3xl text-white-700">Assessment 2025-2</span>
      <div className="flex flex-col items-center justify-center gap-12 bg-no-repeat bg-center bg-contain w-[400px] h-[600px] "
      style={{ backgroundImage: "url('/Frame_general.svg')" }}
      >
      <h1 className="text-3xl font-regular text-center">¿Quién eres?</h1>
      <button
       onClick={() => router.push("/register")}
       className="w-[260px] h-[50px] bg-no-repeat bg-contain bg-center"
       style={{ backgroundImage: "url('/Button_registrar.svg')" }}
      />
      <button
       onClick={() => router.push("/auth/login")}
       className="w-[260px] h-[50px] bg-no-repeat bg-contain bg-center"
       style={{ backgroundImage: "url('/Button_grader.svg')" }}
      />
      <button
       onClick={() => router.push("/auth/login")}
       className="w-[260px] h-[50px] bg-no-repeat bg-contain bg-center"
       style={{ backgroundImage: "url('/Button_admin.svg')" }}
      />    
      </div>
     <footer className="mb-[20] w-full text-xl text-center mt-20 m-[0] italic">
       POWERED BY <span className="font-bold text-3xl text-violet-700">Nova</span>
     </footer>
  </div>
 );
}
