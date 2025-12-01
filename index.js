// index.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PUERTO || 3001;

// CORS para Expo
app.use(cors({
  origin: [
    'http://localhost:19006',
    'exp://your-app.exp.direct',
    'https://tu-app.expo.dev'  // Tu app en Expo Go
  ],
  credentials: true
}));

app.use(express.json());

// Importar rutas
import usuarioRoutes from './rutas/rutasUsuarios.js'; // Ajusta según tus rutas
app.use('/api', usuarioRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Backend funcionando' });
});

app.listen(PORT, () => {
  console.log(`🚀 Backend ejecutándose en puerto ${PORT}`);
  console.log(`📍 Entorno: ${process.env.ENTORNO || 'desarrollo'}`);
});