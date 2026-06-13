export interface IEmpresa {
  razonSocial: string;
  giroComercial: string;
  calle: string;
  numero: string;
  colonia: string;
  ciudad: string;
  codigoPostal: string;
  tieneSindicato: string; // 'Si' | 'No'
}

export interface IVinculoLaboral {
  puesto: string;
  tipoContrato: string;
  antiguedad: string;
  sigueLaborando: string; // 'Si' | 'No'
}

export interface IDetallesAbuso {
  categoriasAbuso: string[];
  fechaInicioHechos: string; // yyyy-MM-dd
  descripcionDetallada: string;
  nombreAgresor?: string;
  cargoAgresor?: string;
}

export interface ITestigosYAntecedentes {
  existenTestigos: string; // 'Si' | 'No'
  nombresTestigos?: string;
  reportePrevio: string;
}

export interface IDatosContacto {
  nombre?: string;
  email?: string;
  telefono?: string;
}

export interface IReportData {
  tipoReporte: 'anonimo' | 'confidencial';
  empresa: IEmpresa;
  vinculoLaboral: IVinculoLaboral;
  detallesAbuso: IDetallesAbuso;
  testigosYAntecedentes: ITestigosYAntecedentes;
  datosContacto?: IDatosContacto;
  evidencias?: string[];
}

export interface IReport extends IReportData {
  _id: string;
  folio: string;
  estado: 'pendiente' | 'en-revision' | 'resuelto';
  fechaEnvio: string;
  fechaRespuesta: string;
}

export interface IDraft {
  _id?: string;
  idBorrador: string;
  pasoIncompleto: number;
  descripcionPaso: string;
  formData: Partial<IReportData>;
  ultimaModificacion?: string;
}

// Get the API URL from environment variables, fallback to localhost:3000
const API_BASE_URL = 
  process.env.NEXT_PUBLIC_API_URL || 
  process.env.VITE_API_URL || 
  'http://localhost:3000';

/**
 * Obtener todos los reportes (historial) del backend
 */
export async function getReports(): Promise<IReport[]> {
  const response = await fetch(`${API_BASE_URL}/api/reports`);
  if (!response.ok) {
    throw new Error('Error al obtener el historial de reportes');
  }
  const result = await response.json();
  return result.data || [];
}

/**
 * Enviar un nuevo reporte con posibles evidencias adjuntas
 */
export async function submitReport(
  reportData: IReportData,
  files: File[]
): Promise<IReport> {
  const formData = new FormData();
  
  // Agregar los datos del reporte como un string JSON en 'formData'
  formData.append('formData', JSON.stringify(reportData));
  
  // Agregar los archivos en el campo 'evidencias'
  files.forEach((file) => {
    formData.append('evidencias', file);
  });

  const response = await fetch(`${API_BASE_URL}/api/reports`, {
    method: 'POST',
    body: formData, // No poner content-type header, el navegador lo configura automáticamente con el boundary
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error || 'Error al enviar el reporte de abuso');
  }

  const result = await response.json();
  return result.data;
}

/**
 * Obtener todos los borradores guardados en el backend
 */
export async function getDrafts(): Promise<IDraft[]> {
  const response = await fetch(`${API_BASE_URL}/api/drafts`);
  if (!response.ok) {
    throw new Error('Error al obtener los borradores');
  }
  const result = await response.json();
  return result.data || [];
}

/**
 * Guardar o actualizar un borrador en el backend (upsert)
 */
export async function saveDraft(draft: IDraft): Promise<IDraft> {
  const response = await fetch(`${API_BASE_URL}/api/drafts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(draft),
  });

  if (!response.ok) {
    throw new Error('Error al guardar el borrador en el servidor');
  }

  const result = await response.json();
  return result.data;
}

/**
 * Eliminar un borrador del backend
 */
export async function deleteDraft(idBorrador: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/drafts/${idBorrador}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    throw new Error('Error al eliminar el borrador');
  }
}
