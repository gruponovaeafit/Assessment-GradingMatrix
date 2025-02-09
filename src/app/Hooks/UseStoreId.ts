import { useState, useEffect } from "react";

const STORAGE_KEY = "storedId"; // Clave para almacenar en localStorage

export const useStoredId = () => {
  const [storedId, setStoredId] = useState<number | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") { // Asegurar que estamos en el navegador
      const savedId = localStorage.getItem(STORAGE_KEY);
      if (savedId) {
        setStoredId(parseInt(savedId, 10));
      }
    }
  }, []);

  const saveId = (id: number | null) => {
    setStoredId(id);
    if (typeof window !== "undefined") { // Verificar de nuevo antes de usar localStorage
      if (id !== null) {
        localStorage.setItem(STORAGE_KEY, id.toString());
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  };

  return { storedId, saveId };
};
