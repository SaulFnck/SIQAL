"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateFolio = void 0;
/**
 * Genera un folio único con el formato: ODS8-[TimestampCorto]
 * Se utiliza una representación en base 36 del timestamp actual combinada
 * con un sufijo aleatorio de 3 caracteres para garantizar unicidad.
 */
const generateFolio = () => {
    const timestampCorto = Date.now().toString(36).toUpperCase();
    const randomSuffix = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `ODS8-${timestampCorto}${randomSuffix}`;
};
exports.generateFolio = generateFolio;
