import type { NextApiRequest, NextApiResponse } from "next";
import sql, { config as SqlConfig } from "mssql";

// Renombrar la constante para que no se llame "config"
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

// Función para conectar a la base de datos
export async function connectToDatabase() {
  try {
    const pool = await sql.connect(dbConfig); // usar dbConfig
    return pool;
  } catch (error) {
    console.error("❌ Error conectando a MSSQL en la nube:", error);
    throw new Error("No se pudo conectar a la base de datos en la nube");
  }
}

// Exportación por defecto para la API
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const pool = await connectToDatabase();
    res.status(200).json({ message: "Conexión exitosa" });
  } catch (error) {
    res.status(500).json({ error: "Error conectando a la base de datos" });
  }
}
