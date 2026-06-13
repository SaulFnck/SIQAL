import { Router } from 'express';
import { getAllDrafts, upsertDraft, deleteDraft } from '../controllers/draftController';

const router = Router();

// GET /api/drafts - Listar todos los borradores activos
router.get('/', getAllDrafts);

// POST /api/drafts - Guardar o actualizar (upsert) el progreso de un borrador
router.post('/', upsertDraft);

// DELETE /api/drafts/:id - Eliminar un borrador (usualmente después de enviarse exitosamente)
router.delete('/:id', deleteDraft);

export default router;
