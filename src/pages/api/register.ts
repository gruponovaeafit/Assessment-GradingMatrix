import { IncomingForm, File } from 'formidable';
import { promises as fs } from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { BlobServiceClient } from '@azure/storage-blob';
import type { NextApiRequest, NextApiResponse } from 'next';
import sql, { config as SqlConfig } from 'mssql';

export const config = {
  api: {
    bodyParser: false,
  },
};

// MSSQL config
const dbConfig: SqlConfig = {
  user: process.env.DB_USER as string,
  password: process.env.DB_PASS as string,
  database: process.env.DB_NAME as string,
  server: process.env.DB_SERVER as string,
  port: parseInt(process.env.DB_PORT ?? '1433', 10),
  options: {
    encrypt: true,
    trustServerCertificate: false,
  },
};

const parseForm = (
  req: NextApiRequest
): Promise<{ fields: any; files: { image?: File | File[] } }> => {
  const form = new IncomingForm({ keepExtensions: true });

  return new Promise((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) reject(err);
      else resolve({ fields, files });
    });
  });
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const { fields, files } = await parseForm(req);
    const file = Array.isArray(files.image) ? files.image[0] : files.image;

    const nombre = fields.nombre?.toString().trim();
    const correo = fields.correo?.toString().trim();

    if (!nombre || !correo || !file || !file.filepath) {
      return res.status(400).json({ error: 'Nombre, correo e imagen son obligatorios' });
    }

    // Subir imagen a Azure Blob
    const AZURE_STORAGE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING!;
    const containerName = 'assessment';
    const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);
    const containerClient = blobServiceClient.getContainerClient(containerName);

    await containerClient.createIfNotExists();

    const extension = file.originalFilename?.split('.').pop() || 'jpg';
    const blobName = `${uuidv4()}.${extension}`;
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    await blockBlobClient.uploadFile(file.filepath, {
      blobHTTPHeaders: {
        blobContentType: file.mimetype || 'application/octet-stream',
      },
    });

    await fs.unlink(file.filepath); // limpiar archivo temporal

    const photoUrl = blockBlobClient.url;

    // Insertar en base de datos MSSQL
    const pool = await sql.connect(dbConfig);

    await pool.request()
      .input('Nombre', sql.NVarChar, nombre)
      .input('Correo', sql.NVarChar, correo)
      .input('Photo', sql.NVarChar, photoUrl)
      .query('INSERT INTO Personas (Nombre, Correo, Photo) VALUES (@Nombre, @Correo, @Photo)');

    await pool.close();

    return res.status(200).json({ message: 'Persona registrada correctamente', url: photoUrl });
  } catch (error: any) {
    console.error('❌ Error en el registro:', error);

    if (error.number === 2627) {
      return res.status(400).json({ error: 'El correo ya está registrado' });
    }

    return res.status(500).json({ error: 'Error al registrar la persona' });
  }
}
