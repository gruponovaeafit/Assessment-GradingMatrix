import { useState, useEffect } from "react";

const STORAGE_KEY = "storedId"; // Clave para almacenar en localStorage

export const useStoredId = () => {
  const [storedId, setStoredId] = useState<number | null>(null);

  // Cargar la ID guardada en localStorage (si existe)
  useEffect(() => {
    const savedId = localStorage.getItem(STORAGE_KEY);
    if (savedId) {
      setStoredId(parseInt(savedId, 10));
    }
  }, []);

  // Guardar en localStorage cuando cambia la ID
  const saveId = (id: number | null) => {
    setStoredId(id);
    if (id !== null) {
      localStorage.setItem(STORAGE_KEY, id.toString());
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  return { storedId, saveId };
};
