import { Schema, model, Document } from 'mongoose';

export interface IDraft extends Document {
  idBorrador: string;
  pasoIncompleto: number;
  descripcionPaso: string;
  formData: any;
  ultimaModificacion: Date;
}

const DraftSchema = new Schema<IDraft>({
  idBorrador: { type: String, required: [true, 'El ID del borrador es requerido'], unique: true },
  pasoIncompleto: {
    type: Number,
    required: [true, 'El paso incompleto es requerido'],
    min: [1, 'El paso mínimo es 1'],
    max: [5, 'El paso máximo es 5']
  },
  descripcionPaso: { type: String, required: [true, 'La descripción del paso es requerida'] },
  formData: { type: Schema.Types.Mixed, default: {} },
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

export const Draft = model<IDraft>('Draft', DraftSchema, 'drafts');
