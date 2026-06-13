"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateResponseDate = void 0;
/**
 * Calcula la fecha de respuesta sumando 5 días hábiles (excluyendo fines de semana)
 * a partir de la fecha de envío especificada.
 *
 * @param startDate Fecha de inicio (usualmente la fecha de envío del reporte)
 * @returns Nueva fecha calculada con 5 días hábiles agregados
 */
const calculateResponseDate = (startDate) => {
    const resultDate = new Date(startDate.getTime());
    let daysAdded = 0;
    while (daysAdded < 5) {
        resultDate.setDate(resultDate.getDate() + 1);
        const day = resultDate.getDay();
        // 0 es Domingo, 6 es Sábado. Solo sumamos si es un día laboral.
        if (day !== 0 && day !== 6) {
            daysAdded++;
        }
    }
    return resultDate;
};
exports.calculateResponseDate = calculateResponseDate;
