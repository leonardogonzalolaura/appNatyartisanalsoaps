import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import { buildRouter } from './routes.js';

const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use('/uploads', express.static(env.UPLOAD_DIR));
app.use(buildRouter());

app.listen(env.PORT, () => console.log(`🌿 Naty backend en http://localhost:${env.PORT}`));
