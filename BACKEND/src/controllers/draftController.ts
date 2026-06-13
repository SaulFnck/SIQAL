import { Request, Response, NextFunction } from 'express';
import { Draft } from '../models/Draft';

/**
 * Recupera todos los borradores activos en la base de datos.
 */
export const getAllDrafts = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const drafts = await Draft.find().sort({ ultimaModificacion: -1 });
    return res.status(200).json({
      success: true,
      count: drafts.length,
      data: drafts
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Crea o actualiza (upsert) un borrador basado en su idBorrador.
 */
export const upsertDraft = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { idBorrador, pasoIncompleto, descripcionPaso, formData } = req.body;

    if (!idBorrador) {
      return res.status(400).json({
        success: false,
        error: 'El campo idBorrador es requerido para guardar el progreso.'
      });
    }

    // Buscamos por idBorrador y actualizamos o insertamos (upsert)
    // Se ejecuta con runValidators para asegurar que las validaciones de Mongoose sigan aplicando
    const updatedDraft = await Draft.findOneAndUpdate(
      { idBorrador },
      { 
        idBorrador, 
        pasoIncompleto, 
        descripcionPaso, 
        formData, 
        ultimaModificacion: new Date() 
      },
      { new: true, upsert: true, runValidators: true }
    );

    return res.status(200).json({
      success: true,
      data: updatedDraft
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Elimina un borrador específico usando el idBorrador provisto.
 */
export const deleteDraft = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params; // 'id' corresponde al idBorrador

    const deletedDraft = await Draft.findOneAndDelete({ idBorrador: id });

    if (!deletedDraft) {
      return res.status(404).json({
        success: false,
        error: 'Borrador no encontrado',
        mensaje: `No se encontró ningún borrador activo con el ID: ${id}`
      });
    }

    return res.status(200).json({
      success: true,
      mensaje: `Borrador con ID: ${id} eliminado con éxito`
    });
  } catch (error) {
    next(error);
  }
};
