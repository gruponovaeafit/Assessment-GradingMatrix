async function enviarCalificacion() {
    const response = await fetch("/api/add-calificacion", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ID_Persona: 8,
        ID_Grupo: 1,
        ID_Base: 2,
        ID_Calificador: 3,
        Calificacion: 4.5
      }),
    });
  
    const data = await response.json();
  // data recibido en test hook
  }

export default enviarCalificacion;