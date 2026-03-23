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
  handleSubmit: (e: React.FormEvent, isImpostor?: boolean, onError?: (msg: string) => void) => Promise<void>;
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

  // Clean up object URLs on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (photo) URL.revokeObjectURL(photo);
    };
  }, [photo]);

  const handleImageSelect = async (file: File) => {
    // 🧹 Liberar la URL anterior si existe para evitar fugas de memoria
    if (photo) URL.revokeObjectURL(photo);

    const tempUrl = URL.createObjectURL(file);
    setFileName(file.name);
    setPhoto(tempUrl);

    const result = await compressImage(file);
    if (isCompressError(result)) {
      setMensaje(result.error);
      setIsError(true);
      setImagen(null);
      setFileName('');
      setPhoto('');
      URL.revokeObjectURL(tempUrl);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setImagen(result.file);
    setIsError(false);
  };

  const handleSubmit = async (e: React.FormEvent, isImpostor = false, onError?: (msg: string) => void) => {
    e.preventDefault();

    if (!nombre || !correo) {
      const msg = 'Recuerda llenar los campos de texto';
      if (onError) {
        onError(msg);
      } else {
        setMensaje(msg);
      }
      setIsError(true);
      return;
    }

    setEnviando(true);

    try {
      const formData = new FormData();
      formData.append('nombre', nombre);
      formData.append('correo', correo);
      formData.append('isImpostor', isImpostor ? 'true' : 'false');
      if (imagen) {
        formData.append('image', imagen);
      }

      const response = await fetch('/api/register', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setIsError(false);
        setSuccessModalId(data.id ?? null);
      } else {
        const msg = `Error: ${data.error}`;
        if (onError) {
          onError(msg);
        } else {
          setMensaje(msg);
        }
        setIsError(true);
      }
    } catch (err) {
      console.error(err);
      const msg = 'Error al conectar con el servidor';
      if (onError) {
        onError(msg);
      } else {
        setMensaje(msg);
      }
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