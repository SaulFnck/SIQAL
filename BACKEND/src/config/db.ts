import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || '';

export const connectDB = async (): Promise<void> => {
  if (!MONGO_URI) {
    console.error('Error: MONGO_URI no está definida en las variables de entorno (.env)');
    process.exit(1);
  }

  try {
    const conn = await mongoose.connect(MONGO_URI);
    console.log(`Conexión exitosa a MongoDB Atlas: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error de conexión a MongoDB: ${(error as Error).message}`);
    process.exit(1);
  }
};
