import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import sessionRoutes from './routes/sessionRoutes.js';
import fileRoutes from './routes/fileRoutes.js';
import { config } from './utils/config.js';

export const app = express();

// Security HTTP headers with relaxed Content Security Policy for file previews
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' }
  })
);

// CORS configuration
app.use(
  cors({
    origin: [config.clientOrigin, 'http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
  })
);

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Healthcheck endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'QRPrint API', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/sessions', sessionRoutes);
app.use('/api/files', fileRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({ error: err.message || 'Internal Server Error' });
});
