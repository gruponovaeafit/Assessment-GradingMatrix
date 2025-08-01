// pages/api/add-calificaciones.ts
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
    console.error("❌ Error conectando a MSSQL:", error);
    throw new Error("No se pudo conectar a la base de datos");
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Método no permitido" });
  }

  const calificaciones = req.body;

  if (!Array.isArray(calificaciones) || calificaciones.length === 0) {
    return res.status(400).json({ message: "Se requiere un arreglo de calificaciones" });
  }

  try {
    const pool = await connectToDatabase();
    const transaction = new sql.Transaction(pool);
    await transaction.begin();

    // Bloque NUEVO: Si no viene ID_Grupo, lo buscamos usando el ID_Calificador
    for (const cal of calificaciones) {
      if (cal.ID_Grupo === undefined || cal.ID_Grupo === null) {
        const result = await pool.request()
          .input("ID", sql.Int, cal.ID_Calificador)
          .query("SELECT ID_Grupo FROM Calificadores WHERE ID = @ID");
        if (result.recordset.length === 0) {
          throw new Error("No se encontró el calificador para extraer su grupo");
        }
        cal.ID_Grupo = result.recordset[0].ID_Grupo;
      }
    }

    for (const cal of calificaciones) {
      const {
        ID_Persona,
        ID_Grupo,
        ID_Base,
        ID_Calificador,
        Calificacion_1,
        Calificacion_2,
        Calificacion_3
      } = cal;

      console.log("🔍 Recibido:", cal);

      if (
        ID_Persona === undefined || ID_Grupo === undefined || ID_Base === undefined || ID_Calificador === undefined ||
        Calificacion_1 === undefined || Calificacion_2 === undefined || Calificacion_3 === undefined ||
        isNaN(Number(Calificacion_1)) || isNaN(Number(Calificacion_2)) || isNaN(Number(Calificacion_3))
      ) {
        console.error("❌ Datos inválidos detectados:", cal);
        throw new Error("Faltan campos obligatorios o hay valores inválidos en alguna calificación");
      }

      const request = new sql.Request(transaction);

      await request
        .input("ID_Grupo", sql.Int, ID_Grupo)
        .input("ID_Base", sql.Int, ID_Base)
        .input("ID_Calificador", sql.Int, ID_Calificador)
        .input("ID_Persona", sql.Int, ID_Persona)
        .input("Calificacion_1", sql.Float, Number(Calificacion_1))
        .input("Calificacion_2", sql.Float, Number(Calificacion_2))
        .input("Calificacion_3", sql.Float, Number(Calificacion_3))
        .query(`
          MERGE CalificacionesPorPersona AS target
          USING (
            SELECT @ID_Grupo AS ID_Grupo, @ID_Base AS ID_Base, @ID_Calificador AS ID_Calificador, @ID_Persona AS ID_Persona
          ) AS source
          ON target.ID_Grupo = source.ID_Grupo AND target.ID_Base = source.ID_Base
             AND target.ID_Calificador = source.ID_Calificador AND target.ID_Persona = source.ID_Persona
          WHEN MATCHED THEN
            UPDATE SET Calificacion_1 = @Calificacion_1, Calificacion_2 = @Calificacion_2,
                       Calificacion_3 = @Calificacion_3, Fecha_Calificacion = GETDATE()
          WHEN NOT MATCHED THEN
            INSERT (ID_Grupo, ID_Base, ID_Calificador, ID_Persona,
                    Calificacion_1, Calificacion_2, Calificacion_3, Fecha_Calificacion)
            VALUES (@ID_Grupo, @ID_Base, @ID_Calificador, @ID_Persona,
                    @Calificacion_1, @Calificacion_2, @Calificacion_3, GETDATE());
        `);
    }

    await transaction.commit();

    // ⚙️ Después del commit, rotar el grupo del calificador
    const calificadorID = calificaciones[0].ID_Calificador;

    // 1. Obtener el grupo actual
    const result = await pool.request()
      .input("ID", sql.Int, calificadorID)
      .query("SELECT ID_Grupo FROM Calificadores WHERE ID = @ID");

    if (result.recordset.length === 0) {
      throw new Error("No se encontró el calificador para rotación");
    }

    const grupoActual = result.recordset[0].ID_Grupo;
    const totalGruposQuery = await pool.request().query("SELECT COUNT(*) AS Total FROM Grupos");
    const totalGrupos = totalGruposQuery.recordset[0].Total;
    const siguienteGrupo = grupoActual % totalGrupos + 1;

    // 2. Actualizar al siguiente grupo
    await pool.request()
      .input("ID", sql.Int, calificadorID)
      .input("NuevoGrupo", sql.Int, siguienteGrupo)
      .query("UPDATE Calificadores SET ID_Grupo = @NuevoGrupo WHERE ID = @ID");

    console.log(`🔁 Calificador ${calificadorID} rotado del grupo ${grupoActual} al grupo ${siguienteGrupo}`);

    res.status(200).json({
      message: "✅ Calificaciones procesadas correctamente",
      nuevoGrupo: siguienteGrupo,
    });

  } catch (error) {
    console.error("❌ Error en procesamiento de calificaciones:", error);
    res.status(500).json({
      message: "Error al procesar las calificaciones",
      error: (error as Error).message,
    });
  }
}
