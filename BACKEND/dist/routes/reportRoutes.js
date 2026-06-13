"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const reportController_1 = require("../controllers/reportController");
const upload_1 = require("../middlewares/upload");
const router = (0, express_1.Router)();
// POST /api/reports - Registra una denuncia. Soporta archivos adjuntos en el campo 'evidencias'
router.post('/', upload_1.upload.array('evidencias'), reportController_1.createReport);
// GET /api/reports - Obtiene el historial de todas las denuncias
router.get('/', reportController_1.getAllReports);
// GET /api/reports/:folio - Recupera una denuncia específica por su folio
router.get('/:folio', reportController_1.getReportByFolio);
exports.default = router;
