import app from './app';
import { connectDB } from './config/db';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  // Conectar a la base de datos MongoDB Atlas
  await connectDB();

  // Iniciar el servidor Express
  app.listen(PORT, () => {
    console.log(`===================================================`);
    console.log(`  Servidor API ODS8 iniciado con éxito.`);
    console.log(`  Puerto: ${PORT}`);
    console.log(`  Entorno Local: http://localhost:${PORT}`);
    console.log(`===================================================`);
  });
};

startServer();
