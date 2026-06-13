"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Draft = void 0;
const mongoose_1 = require("mongoose");
const DraftSchema = new mongoose_1.Schema({
    idBorrador: { type: String, required: [true, 'El ID del borrador es requerido'], unique: true },
    pasoIncompleto: {
        type: Number,
        required: [true, 'El paso incompleto es requerido'],
        min: [1, 'El paso mínimo es 1'],
        max: [5, 'El paso máximo es 5']
    },
    descripcionPaso: { type: String, required: [true, 'La descripción del paso es requerida'] },
    formData: { type: mongoose_1.Schema.Types.Mixed, default: {} },
    ultimaModificacion: { type: Date, default: Date.now }
}, {
    versionKey: false,
    timestamps: false
});
// Middleware pre-save para actualizar automáticamente la fecha de modificación
DraftSchema.pre('save', function (next) {
    this.ultimaModificacion = new Date();
    next();
});
exports.Draft = (0, mongoose_1.model)('Draft', DraftSchema, 'drafts');
