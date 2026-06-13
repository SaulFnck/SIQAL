import { Request, Response, NextFunction } from 'express';

/**
 * Middleware para el manejo centralizado de errores.
 * Captura y procesa fallos de validación de Mongoose, duplicidad de llaves únicas,
 * errores de carga de archivos (Multer) y errores genéricos del servidor.
 */
export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Imprimir el error en consola para debugging interno
  console.error('--- Error Detectado ---');
  console.error(err);
  console.error('-----------------------');

  // 1. Error de validación de Mongoose (campos faltantes, tipos incorrectos, etc.)
  if (err.name === 'ValidationError') {
    const detalles: Record<string, string> = {};

    for (const campo of Object.keys(err.errors)) {
      detalles[campo] = err.errors[campo].message;
    }

    return res.status(400).json({
      success: false,
      error: 'Error de validación de esquema',
      detalles
    });
  }

  // 2. Error de índice único duplicado en MongoDB (código 11000)
  if (err.code === 11000) {
    const campoDuplicado = Object.keys(err.keyValue || {})[0] || 'campo';
    const valorDuplicado = err.keyValue ? err.keyValue[campoDuplicado] : '';
    
    return res.status(400).json({
      success: false,
      error: 'Registro duplicado',
      detalles: {
        [campoDuplicado]: `El valor '${valorDuplicado}' ya está en uso y debe ser único.`
      }
    });
  }

  // 3. Error de Multer (carga de archivos, ej: límite de tamaño superado)
  if (err.name === 'MulterError') {
    return res.status(400).json({
      success: false,
      error: 'Error al subir archivos de evidencia',
      detalles: {
        evidencias: `Error de carga de archivos: ${err.message}`
      }
    });
  }

  // 4. Error genérico interno del servidor (500)
  const status = err.status || 500;
  return res.status(status).json({
    success: false,
    error: 'Error interno del servidor',
    mensaje: err.message || 'Ha ocurrido un error inesperado en el servidor.'
  });
};
