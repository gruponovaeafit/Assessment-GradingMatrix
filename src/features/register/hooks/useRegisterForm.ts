import { useState, useEffect, useRef } from 'react';
import { compressImage, isCompressError } from '../utils/imageUtils';

export interface UseRegisterFormReturn {
  nombre: string;
  setNombre: (v: string) => void;
  correo: string;
  setCorreo: (v: string) => void;
  imagen: File | null;
  photo: string;
  fileName: string;
  mensaje: string;
  isError: boolean;
  enviando: boolean;
  successModalId: number | null;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  handleImageSelect: (file: File) => Promise<void>;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  resetForm: () => void;
}

export const useRegisterForm = (): UseRegisterFormReturn => {
  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [imagen, setImagen] = useState<File | null>(null);
  const [photo, setPhoto] = useState('');
  const [fileName, setFileName] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [isError, setIsError] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [successModalId, setSuccessModalId] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-dismiss message after 5s
  useEffect(() => {
    if (mensaje) {
      const timer = setTimeout(() => setMensaje(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [mensaje]);

  const handleImageSelect = async (file: File) => {
    setFileName(file.name);
    setPhoto(URL.createObjectURL(file));

    const result = await compressImage(file);
    if (isCompressError(result)) {
      setMensaje(result.error);
      setIsError(true);
      return;
    }

    setImagen(result.file);
    setIsError(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nombre || !correo) {
      setMensaje('Por favor completa los campos obligatorios');
      setIsError(true);
      return;
    }

    setEnviando(true);

    try {
      const formData = new FormData();
      formData.append('nombre', nombre);
      formData.append('correo', correo);

      if (imagen) {
        formData.append('image', imagen);
      }

      const token = localStorage.getItem('authToken');

      const response = await fetch('/api/register', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setIsError(false);
        setSuccessModalId(data.id ?? null);
      } else {
        setMensaje(`❌ Error: ${data.error}`);
        setIsError(true);
      }
    } catch (err) {
      console.error(err);
      setMensaje('❌ Error al conectar con el servidor');
      setIsError(true);
    } finally {
      setEnviando(false);
    }
  };

  const resetForm = () => {
    setSuccessModalId(null);
    setNombre('');
    setCorreo('');
    setImagen(null);
    setPhoto('');
    setFileName('');
    setMensaje('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return {
    nombre,
    setNombre,
    correo,
    setCorreo,
    imagen,
    photo,
    fileName,
    mensaje,
    isError,
    enviando,
    successModalId,
    fileInputRef,
    handleImageSelect,
    handleSubmit,
    resetForm,
  };
};
