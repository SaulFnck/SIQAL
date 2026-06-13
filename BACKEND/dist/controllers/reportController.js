"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getReportByFolio = exports.getAllReports = exports.createReport = void 0;
const Report_1 = require("../models/Report");
const folioGenerator_1 = require("../utils/folioGenerator");
const dateCalculator_1 = require("../utils/dateCalculator");
/**
 * Crea una nueva denuncia formal.
 * Admite JSON estándar o multipart/form-data (con archivos adjuntos).
 */
const createReport = async (req, res, next) => {
    try {
        let reportData = req.body;
        // Si viene como multipart/form-data, extraemos la información de formData
        if (req.body && typeof req.body.formData === 'string') {
            try {
                reportData = JSON.parse(req.body.formData);
            }
            catch (err) {
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
        reportData.folio = (0, folioGenerator_1.generateFolio)();
        // Regla de Negocio 3: Configurar fecha de envío y calcular fecha estimada de respuesta (+5 días hábiles)
        const fechaEnvio = reportData.fechaEnvio ? new Date(reportData.fechaEnvio) : new Date();
        reportData.fechaEnvio = fechaEnvio;
        reportData.fechaRespuesta = (0, dateCalculator_1.calculateResponseDate)(fechaEnvio);
        // Regla de Negocio 4: Procesamiento de archivos de evidencia subidos mediante Multer
        const files = req.files;
        if (files && files.length > 0) {
            const relativePaths = files.map(file => `/uploads/${file.filename}`);
            reportData.evidencias = [...(reportData.evidencias || []), ...relativePaths];
        }
        // Crear la instancia del documento y guardarla en MongoDB Atlas
        const newReport = new Report_1.Report(reportData);
        await newReport.save();
        return res.status(201).json({
            success: true,
            data: newReport
        });
    }
    catch (error) {
        next(error);
    }
};
exports.createReport = createReport;
/**
 * Recupera el listado completo de denuncias guardadas (para el UserDashboard / Historial).
 */
const getAllReports = async (req, res, next) => {
    try {
        const reports = await Report_1.Report.find().sort({ fechaEnvio: -1 });
        return res.status(200).json({
            success: true,
            count: reports.length,
            data: reports
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getAllReports = getAllReports;
/**
 * Busca y retorna los detalles de una denuncia por su folio único.
 */
const getReportByFolio = async (req, res, next) => {
    try {
        const { folio } = req.params;
        const report = await Report_1.Report.findOne({ folio });
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
    }
    catch (error) {
        next(error);
    }
};
exports.getReportByFolio = getReportByFolio;
