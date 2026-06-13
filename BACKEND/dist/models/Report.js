"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Report = void 0;
const mongoose_1 = require("mongoose");
const EmpresaSchema = new mongoose_1.Schema({
    razonSocial: { type: String, required: [true, 'La razón social de la empresa es requerida'] },
    giroComercial: { type: String, required: [true, 'El giro comercial es requerido'] },
    calle: { type: String, required: [true, 'La calle es requerida'] },
    numero: { type: String, required: [true, 'El número es requerido'] },
    colonia: { type: String, required: [true, 'La colonia es requerida'] },
    ciudad: { type: String, required: [true, 'La ciudad es requerida'] },
    codigoPostal: { type: String, required: [true, 'El código postal es requerido'] },
    tieneSindicato: { type: String, required: [true, 'Especificar si tiene sindicato es requerido'] }
}, { _id: false });
const VinculoLaboralSchema = new mongoose_1.Schema({
    puesto: { type: String, required: [true, 'El puesto es requerido'] },
    tipoContrato: { type: String, required: [true, 'El tipo de contrato es requerido'] },
    antiguedad: { type: String, required: [true, 'La antigüedad es requerida'] },
    sigueLaborando: { type: String, required: [true, 'Especificar si sigue laborando es requerido'] },
    fechaTermino: { type: Date }
}, { _id: false });
const DetallesAbusoSchema = new mongoose_1.Schema({
    categoriasAbuso: {
        type: [String],
        validate: {
            validator: (v) => Array.isArray(v) && v.length > 0,
            message: 'Debe seleccionar al menos una categoría de abuso'
        },
        required: [true, 'Las categorías de abuso son requeridas']
    },
    fechaInicioHechos: { type: Date, required: [true, 'La fecha de inicio de los hechos es requerida'] },
    descripcionDetallada: { type: String, required: [true, 'La descripción detallada del abuso es requerida'] },
    nombreAgresor: { type: String },
    cargoAgresor: { type: String }
}, { _id: false });
const TestigosYAntecedentesSchema = new mongoose_1.Schema({
    existenTestigos: { type: String, required: [true, 'Especificar si existen testigos es requerido'] },
    nombresTestigos: { type: String },
    reportePrevio: { type: String, required: [true, 'Especificar si existe un reporte previo es requerido'] }
}, { _id: false });
const DatosContactoSchema = new mongoose_1.Schema({
    nombre: { type: String },
    email: { type: String },
    telefono: { type: String }
}, { _id: false });
const ReportSchema = new mongoose_1.Schema({
    folio: { type: String, required: true, unique: true },
    tipoReporte: {
        type: String,
        required: [true, 'El tipo de reporte es requerido ("anonimo" o "confidencial")'],
        enum: {
            values: ['anonimo', 'confidencial'],
            message: 'El tipo de reporte debe ser "anonimo" o "confidencial"'
        }
    },
    empresa: { type: EmpresaSchema, required: [true, 'Los datos de la empresa son requeridos'] },
    vinculoLaboral: { type: VinculoLaboralSchema, required: [true, 'Los datos del vínculo laboral son requeridos'] },
    detallesAbuso: { type: DetallesAbusoSchema, required: [true, 'Los detalles del abuso son requeridos'] },
    evidencias: { type: [String], default: [] },
    testigosYAntecedentes: { type: TestigosYAntecedentesSchema, required: [true, 'Los datos de testigos y antecedentes son requeridos'] },
    datosContacto: {
        type: DatosContactoSchema,
        validate: {
            validator: function (val) {
                if (this.tipoReporte === 'confidencial') {
                    return val && val.nombre && val.email && val.telefono;
                }
                return true;
            },
            message: 'Los datos de contacto (nombre, email y teléfono) son requeridos para reportes confidenciales.'
        }
    },
    estado: {
        type: String,
        enum: ['pendiente', 'en-revision', 'resuelto'],
        default: 'pendiente'
    },
    fechaEnvio: { type: Date, default: Date.now },
    fechaRespuesta: { type: Date, required: true }
}, {
    versionKey: false,
    timestamps: false
});
exports.Report = (0, mongoose_1.model)('Report', ReportSchema, 'reports');
