export interface Base {
  ID_Base: number;
  ID_Assessment: number;
  Numero_Base: number;
  Nombre_Base: string;
  Competencia_Base: string;
  Descripcion_Base: string;
  Comportamiento1_Base: string;
  Comportamiento2_Base: string;
  Comportamiento3_Base: string;
}

export interface Assessment {
  id: number;
  nombre: string;
  activo: boolean;
}

export interface BaseFormData {
  numeroBase: string;
  nombre: string;
  competencia: string;
  descripcion: string;
  comportamiento1: string;
  comportamiento2: string;
  comportamiento3: string;
}
