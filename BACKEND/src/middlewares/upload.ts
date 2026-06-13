import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Asegurarse de que el directorio 'uploads' exista
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configuración de almacenamiento local
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const fileExtension = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${fileExtension}`);
  }
});

// Configuración del middleware de Multer
export const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // Límite de 10 MB por archivo
  }
});
