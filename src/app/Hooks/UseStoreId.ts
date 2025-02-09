import { useState, useEffect } from "react";

const STORAGE_KEY = "storedData"; // Nueva clave para almacenar el objeto

// Definir la estructura del objeto que guardarás
interface StoredData {
  idGrupo: number | null;
  id_Calificador: string | null;
  id_base: string | null;
}


export const useStoredId = () => {
  const [storedData, setStoredData] = useState<StoredData>({
    idGrupo: null,
    id_Calificador: null,
    id_base:  null,
  });

  // Cargar datos desde localStorage al iniciar
  useEffect(() => {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
      setStoredData(JSON.parse(savedData)); // Convertimos de string a objeto
    }
  }, []);

  // Guardar datos en localStorage cuando cambian
  const saveData = (idGrupo: number | null, id_Calificador: string | null, id_base: string | null) => { 
    
    const newData = { idGrupo, id_Calificador, id_base };
    setStoredData(newData);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newData)); // Convertimos a JSON
  };

  return { storedData, saveData };
};
