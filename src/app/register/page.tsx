"use client";

import { Spinner } from "@/components/UI/Loading";
import { useRegisterAuth } from "@/features/register/hooks/useRegisterAuth";
import { RegisterContainer } from "@/features/register/components/RegisterContainer";

export default function RegisterPerson() {
  const { checkingAuth } = useRegisterAuth();

  if (checkingAuth) {
    return (
      <div className="flex flex-col items-center justify-center w-full min-h-screen bg-white px-4 py-8">
        <Spinner size="lg" />
        <p className="text-gray-600 mt-4">Verificando acceso...</p>
      </div>
    );
  }

  return <RegisterContainer />;
}

