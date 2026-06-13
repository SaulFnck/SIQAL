"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteDraft = exports.upsertDraft = exports.getAllDrafts = void 0;
const Draft_1 = require("../models/Draft");
/**
 * Recupera todos los borradores activos en la base de datos.
 */
const getAllDrafts = async (req, res, next) => {
    try {
        const drafts = await Draft_1.Draft.find().sort({ ultimaModificacion: -1 });
        return res.status(200).json({
            success: true,
            count: drafts.length,
            data: drafts
        });
    }
    catch (error) {
        next(error);
    }
};
exports.getAllDrafts = getAllDrafts;
/**
 * Crea o actualiza (upsert) un borrador basado en su idBorrador.
 */
const upsertDraft = async (req, res, next) => {
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
        const updatedDraft = await Draft_1.Draft.findOneAndUpdate({ idBorrador }, {
            idBorrador,
            pasoIncompleto,
            descripcionPaso,
            formData,
            ultimaModificacion: new Date()
        }, { new: true, upsert: true, runValidators: true });
        return res.status(200).json({
            success: true,
            data: updatedDraft
        });
    }
    catch (error) {
        next(error);
    }
};
exports.upsertDraft = upsertDraft;
/**
 * Elimina un borrador específico usando el idBorrador provisto.
 */
const deleteDraft = async (req, res, next) => {
    try {
        const { id } = req.params; // 'id' corresponde al idBorrador
        const deletedDraft = await Draft_1.Draft.findOneAndDelete({ idBorrador: id });
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
    }
    catch (error) {
        next(error);
    }
};
exports.deleteDraft = deleteDraft;
