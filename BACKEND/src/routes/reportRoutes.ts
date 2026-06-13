import { Router } from 'express';
import { createReport, getAllReports, getReportByFolio } from '../controllers/reportController';
import { upload } from '../middlewares/upload';

const router = Router();

// POST /api/reports - Registra una denuncia. Soporta archivos adjuntos en el campo 'evidencias'
router.post('/', upload.array('evidencias'), createReport);

// GET /api/reports - Obtiene el historial de todas las denuncias
router.get('/', getAllReports);

// GET /api/reports/:folio - Recupera una denuncia específica por su folio
router.get('/:folio', getReportByFolio);

export default router;
