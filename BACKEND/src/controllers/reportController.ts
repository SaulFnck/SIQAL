import { Request, Response, NextFunction } from 'express';
import { Report } from '../models/Report';
import { generateFolio } from '../utils/folioGenerator';
import { calculateResponseDate } from '../utils/dateCalculator';

/**
 * Crea una nueva denuncia formal.
 * Admite JSON estándar o multipart/form-data (con archivos adjuntos).
 */
export const createReport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    let reportData = req.body;

    // Si viene como multipart/form-data, extraemos la información de formData
    if (req.body && typeof req.body.formData === 'string') {
      try {
        reportData = JSON.parse(req.body.formData);
      } catch (err) {
        return res.status(400).json({
          success: false,
          error: 'Formato de datos inválido',
          detalles: {
            formData: 'El campo formData debe ser un JSON string válido.'
          }
        });
      }
    }

    // Regla de Negocio 1: Purga de datos personales en denuncias anónimas
    if (reportData.tipoReporte === 'anonimo') {
      if (reportData.datosContacto) {
        delete reportData.datosContacto;
      }
    }

    // Regla de Negocio 2: Generar folio único en el servidor (ODS8-[TimestampCorto])
    reportData.folio = generateFolio();

    // Regla de Negocio 3: Configurar fecha de envío y calcular fecha estimada de respuesta (+5 días hábiles)
    const fechaEnvio = reportData.fechaEnvio ? new Date(reportData.fechaEnvio) : new Date();
    reportData.fechaEnvio = fechaEnvio;
    reportData.fechaRespuesta = calculateResponseDate(fechaEnvio);

    // Regla de Negocio 4: Procesamiento de archivos de evidencia subidos mediante Multer
    const files = req.files as Express.Multer.File[];
    if (files && files.length > 0) {
      const relativePaths = files.map(file => `/uploads/${file.filename}`);
      reportData.evidencias = [...(reportData.evidencias || []), ...relativePaths];
    }

    // Crear la instancia del documento y guardarla en MongoDB Atlas
    const newReport = new Report(reportData);
    await newReport.save();

    return res.status(201).json({
      success: true,
      data: newReport
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Recupera el listado completo de denuncias guardadas (para el UserDashboard / Historial).
 */
export const getAllReports = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const reports = await Report.find().sort({ fechaEnvio: -1 });
    return res.status(200).json({
      success: true,
      count: reports.length,
      data: reports
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Busca y retorna los detalles de una denuncia por su folio único.
 */
export const getReportByFolio = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { folio } = req.params;
    const report = await Report.findOne({ folio });

    if (!report) {
      return res.status(404).json({
        success: false,
        error: 'Denuncia no encontrada',
        mensaje: `No existe ninguna denuncia registrada con el folio: ${folio}`
      });
    }

    return res.status(200).json({
      success: true,
      data: report
    });
  } catch (error) {
    next(error);
  }
};
