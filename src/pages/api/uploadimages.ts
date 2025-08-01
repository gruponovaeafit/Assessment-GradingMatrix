import { IncomingForm, File } from 'formidable';
import { promises as fs } from 'fs';
import type { NextApiRequest, NextApiResponse } from 'next';
import { BlobServiceClient } from '@azure/storage-blob';

export const config = {
  api: {
    bodyParser: false,
  },
};

const parseForm = (req: NextApiRequest): Promise<{ fields: any; files: { image?: File | File[] } }> => {
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
    const { files } = await parseForm(req);
    const file = Array.isArray(files.image) ? files.image[0] : files.image;

    if (!file || !file.filepath) {
      return res.status(400).json({ error: 'Archivo no válido o no enviado' });
    }

    const AZURE_STORAGE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING!;
    const containerName = 'imagenes';

    const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);
    const containerClient = blobServiceClient.getContainerClient(containerName);

    const blobName = `${Date.now()}-${file.originalFilename}`;
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);

    await blockBlobClient.uploadFile(file.filepath, {
      blobHTTPHeaders: { blobContentType: file.mimetype || 'application/octet-stream' },
    });

    // Eliminamos archivo temporal si estás en local
    await fs.unlink(file.filepath);

    return res.status(200).json({ url: blockBlobClient.url });
  } catch (err) {
    console.error('Error al subir la imagen:', err);
    return res.status(500).json({ error: 'Error al subir la imagen' });
  }
}
