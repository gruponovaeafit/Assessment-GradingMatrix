import type { NextApiRequest, NextApiResponse } from "next";
import sql, { config as SqlConfig } from "mssql";

export const dbConfig: SqlConfig = {
  user: process.env.DB_USER as string,
  password: process.env.DB_PASS as string,
  database: process.env.DB_NAME as string,
  server: process.env.DB_SERVER as string,
  port: parseInt(process.env.DB_PORT ?? "1433", 10),
  options: {
    encrypt: true,
    trustServerCertificate: false,
  },
};

export async function connectToDatabase() {
  try {
    const pool = await sql.connect(dbConfig);
    return pool;
  } catch (error) {
    console.error("❌ Error conectando a MSSQL en la nube:", error);
    throw new Error("No se pudo conectar a la base de datos en la nube");
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Método no permitido" });
  }

  try {
    const { ID_Persona, ID_Grupo, ID_Base, ID_Calificador, Calificacion_1, Calificacion_2, Calificacion_3 } = req.body;

    console.log("📥 Datos recibidos en API:", req.body); // Debugging

    if (!ID_Persona || !ID_Grupo || !ID_Base || !ID_Calificador || Calificacion_1 === undefined || Calificacion_2 === undefined || Calificacion_3 === undefined) {
      return res.status(400).json({ message: "Todos los campos son obligatorios" });
    }

    const pool = await connectToDatabase();
    const query = `
      INSERT INTO CalificacionesPorPersona (ID_Grupo, ID_Base, ID_Calificador, Fecha_Calificacion, Calificacion_1, Calificacion_2, Calificacion_3, ID_Persona)
      VALUES (@ID_Grupo, @ID_Base, @ID_Calificador, GETDATE(), @Calificacion_1, @Calificacion_2, @Calificacion_3, @ID_Persona);
    `;

    await pool.request()
      .input("ID_Grupo", sql.Int, ID_Grupo)
      .input("ID_Base", sql.Int, ID_Base)
      .input("ID_Calificador", sql.Int, ID_Calificador)
      .input("Calificacion_1", sql.Float, parseFloat(Calificacion_1))
      .input("Calificacion_2", sql.Float, parseFloat(Calificacion_2))
      .input("Calificacion_3", sql.Float, parseFloat(Calificacion_3)) // Asegurar tipo FLOAT
      .input("ID_Persona", sql.Int, ID_Persona)
      .query(query);

    res.status(200).json({ message: "Calificación guardada correctamente" });
  } catch (error) {
    console.error("❌ Error insertando calificación:", error);
    res.status(500).json({ message: "Error al guardar la calificación" });
  }
}
