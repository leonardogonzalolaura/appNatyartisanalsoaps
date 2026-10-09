// Storage agnóstico: hoy disco local de Lightsail, mañana S3 sin tocar controladores.
import { existsSync, mkdirSync } from 'fs';
import { env } from '../../config/env.js';
if (!existsSync(env.UPLOAD_DIR)) mkdirSync(env.UPLOAD_DIR, { recursive: true });

export class LocalStorageService {
  save(file) { return `/uploads/${file.filename}`; }
  urlFor(path) { return path; }
}
// Futuro: export class S3StorageService { save(file){...subir a S3...} }
export function storageFactory() { return new LocalStorageService(); }
