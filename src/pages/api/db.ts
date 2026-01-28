import type { NextApiRequest, NextApiResponse } from "next";
import sql, { config as SqlConfig, ConnectionPool } from "mssql";

// Configuración de la base de datos
export const dbConfig: SqlConfig = {
  user: process.env.DB_USER as string,
  password: process.env.DB_PASS as string,
  database: process.env.DB_NAME as string,
  server: process.env.DB_SERVER as string,
  port: parseInt(process.env.DB_PORT ?? "1433", 10),
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
  options: {
    encrypt: true,
    trustServerCertificate: false,
  },
};

// Pool global para reutilizar conexiones (singleton pattern)
let globalPool: ConnectionPool | null = null;

// Función para conectar a la base de datos con connection pooling
export async function connectToDatabase(): Promise<ConnectionPool> {
  try {
    if (globalPool && globalPool.connected) {
      return globalPool;
    }
    
    globalPool = await sql.connect(dbConfig);
    return globalPool;
  } catch (error) {
    console.error("❌ Error conectando a MSSQL en la nube:", error);
    throw new Error("No se pudo conectar a la base de datos en la nube");
  }
}

// Función helper para cerrar la conexión (solo para casos especiales)
export async function closeDatabase(): Promise<void> {
  if (globalPool) {
    await globalPool.close();
    globalPool = null;
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
