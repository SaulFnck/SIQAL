import express from 'express';
import cors from 'cors';
import path from 'path';
import reportRoutes from './routes/reportRoutes';
import draftRoutes from './routes/draftRoutes';
import { errorHandler } from './middlewares/errorHandler';

const app = express();

// Middlewares globales
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir de forma estática la carpeta de evidencias
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Página de bienvenida / status con diseño premium
app.get('/', (req, res) => {
  res.status(200).send(`
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>API ODS8 - SIQAL</title>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700&display=swap" rel="stylesheet">
      <style>
        body {
          margin: 0;
          font-family: 'Outfit', system-ui, sans-serif;
          background: linear-gradient(135deg, #0b0f19 0%, #111827 50%, #1e1b4b 100%);
          color: #f8fafc;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          overflow: hidden;
        }
        .container {
          position: relative;
        }
        .container::before {
          content: '';
          position: absolute;
          width: 300px;
          height: 300px;
          background: radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, rgba(99, 102, 241, 0) 70%);
          top: -150px;
          left: -150px;
          z-index: 0;
        }
        .container::after {
          content: '';
          position: absolute;
          width: 300px;
          height: 300px;
          background: radial-gradient(circle, rgba(56, 189, 248, 0.15) 0%, rgba(56, 189, 248, 0) 70%);
          bottom: -150px;
          right: -150px;
          z-index: 0;
        }
        .card {
          background: rgba(17, 24, 39, 0.7);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 28px;
          padding: 48px;
          max-width: 520px;
          width: 90vw;
          text-align: center;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
          position: relative;
          z-index: 1;
        }
        h1 {
          font-size: 2.4rem;
          font-weight: 700;
          margin: 0 0 12px 0;
          background: linear-gradient(to right, #38bdf8, #818cf8, #c084fc);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          letter-spacing: -0.5px;
        }
        p {
          color: #94a3b8;
          font-size: 1.05rem;
          line-height: 1.6;
          margin: 0 0 28px 0;
          font-weight: 300;
        }
        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(16, 185, 129, 0.1);
          color: #34d399;
          border: 1px solid rgba(16, 185, 129, 0.2);
          padding: 8px 20px;
          border-radius: 100px;
          font-size: 0.85rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .status-dot {
          width: 8px;
          height: 8px;
          background-color: #10b981;
          border-radius: 50%;
          box-shadow: 0 0 8px #10b981;
          animation: pulse 2s infinite;
        }
        @keyframes pulse {
          0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
          70% { transform: scale(1); box-shadow: 0 0 0 8px rgba(16, 185, 129, 0); }
          100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
        }
        .routes-section {
          margin-top: 36px;
          text-align: left;
          background: rgba(0, 0, 0, 0.25);
          border: 1px solid rgba(255, 255, 255, 0.03);
          border-radius: 18px;
          padding: 24px;
        }
        .routes-section h3 {
          margin: 0 0 16px 0;
          font-size: 0.95rem;
          color: #cbd5e1;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          padding-bottom: 10px;
        }
        .route-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.9rem;
          margin: 10px 0;
        }
        .method {
          font-weight: 700;
          font-size: 0.75rem;
          padding: 3px 8px;
          border-radius: 6px;
          min-width: 50px;
          text-align: center;
        }
        .method.post { background: rgba(99, 102, 241, 0.15); color: #818cf8; }
        .method.get { background: rgba(56, 189, 248, 0.15); color: #38bdf8; }
        .method.delete { background: rgba(239, 68, 68, 0.15); color: #f87171; }
        .path {
          font-family: 'Courier New', Courier, monospace;
          color: #e2e8f0;
          font-size: 0.85rem;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="card">
          <h1>API ODS8 - SIQAL</h1>
          <p>Servidor de backend activo. Procesa denuncias y almacena borradores temporales con esquemas Mongoose y almacenamiento en MongoDB Atlas.</p>
          <div class="status-badge">
            <span class="status-dot"></span>
            Online / Servidor Listo
          </div>
          <div class="routes-section">
            <h3>Endpoints de la API REST</h3>
            <div class="route-item">
              <span class="method post">POST</span>
              <span class="path">/api/reports</span>
            </div>
            <div class="route-item">
              <span class="method get">GET</span>
              <span class="path">/api/reports</span>
            </div>
            <div class="route-item">
              <span class="method get">GET</span>
              <span class="path">/api/reports/:folio</span>
            </div>
            <div class="route-item">
              <span class="method post">POST</span>
              <span class="path">/api/drafts</span>
            </div>
            <div class="route-item">
              <span class="method get">GET</span>
              <span class="path">/api/drafts</span>
            </div>
            <div class="route-item">
              <span class="method delete">DELETE</span>
              <span class="path">/api/drafts/:id</span>
            </div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `);
});

// Registrar rutas
app.use('/api/reports', reportRoutes);
app.use('/api/drafts', draftRoutes);

// Interceptor global de errores (ValidationError, MulterError, etc.)
app.use(errorHandler);

export default app;
