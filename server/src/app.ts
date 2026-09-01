import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import sessionRoutes from './routes/sessionRoutes';
import fileRoutes from './routes/fileRoutes';
import whatsappRoutes from './routes/whatsappRoutes';
import { config } from './utils/config';

export const app = express();

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' }
  })
);

app.use(
  cors({
    origin: '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'QrShareIt API', timestamp: new Date().toISOString() });
});

app.use('/api/sessions', sessionRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/whatsapp', whatsappRoutes);

app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled Server Error:', err);
  res.status(500).json({ error: err.message || 'Internal Server Error' });
});
