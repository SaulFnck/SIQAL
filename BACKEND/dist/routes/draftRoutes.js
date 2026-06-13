"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const draftController_1 = require("../controllers/draftController");
const router = (0, express_1.Router)();
// GET /api/drafts - Listar todos los borradores activos
router.get('/', draftController_1.getAllDrafts);
// POST /api/drafts - Guardar o actualizar (upsert) el progreso de un borrador
router.post('/', draftController_1.upsertDraft);
// DELETE /api/drafts/:id - Eliminar un borrador (usualmente después de enviarse exitosamente)
router.delete('/:id', draftController_1.deleteDraft);
exports.default = router;
