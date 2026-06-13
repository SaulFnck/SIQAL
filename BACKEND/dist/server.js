"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const db_1 = require("./config/db");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const PORT = process.env.PORT || 3000;
const startServer = async () => {
    // Conectar a la base de datos MongoDB Atlas
    await (0, db_1.connectDB)();
    // Iniciar el servidor Express
    app_1.default.listen(PORT, () => {
        console.log(`===================================================`);
        console.log(`  Servidor API ODS8 iniciado con éxito.`);
        console.log(`  Puerto: ${PORT}`);
        console.log(`  Entorno Local: http://localhost:${PORT}`);
        console.log(`===================================================`);
    });
};
startServer();
