"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDB = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const MONGO_URI = process.env.MONGO_URI || '';
const connectDB = async () => {
    if (!MONGO_URI) {
        console.error('Error: MONGO_URI no está definida en las variables de entorno (.env)');
        process.exit(1);
    }
    try {
        const conn = await mongoose_1.default.connect(MONGO_URI);
        console.log(`Conexión exitosa a MongoDB Atlas: ${conn.connection.host}`);
    }
    catch (error) {
        console.error(`Error de conexión a MongoDB: ${error.message}`);
        process.exit(1);
    }
};
exports.connectDB = connectDB;
