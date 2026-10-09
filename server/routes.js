import { Router } from 'express';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import { existsSync, mkdirSync } from 'fs';
import { env } from './config/env.js';
import { sqliteHelpers, uid } from './infrastructure/persistence/sqlite/db.js';
import { sign, requireAuth, errorHandler } from './infrastructure/http/middlewares/auth.js';
import { storageFactory } from './infrastructure/storage/storage.factory.js';
import { productController, bannerController, categoryController, offerController, videoController, testimonialController, offerPublic, orderController, configController } from './presentation/controllers/controllers.js';

if (!existsSync(env.UPLOAD_DIR)) mkdirSync(env.UPLOAD_DIR, { recursive: true });
const upload = multer({ dest: env.UPLOAD_DIR, limits: { fileSize: 5 * 1024 * 1024 } });

export function buildRouter() {
  const r = Router();

  // Auth admin (único usuario gestionado por seed)
  r.post('/api/auth/login', async (req, res, next) => {
    try {
      const u = await sqliteHelpers.get(`SELECT * FROM users WHERE email=?`, [req.body.email]);
      if (!u || !bcrypt.compareSync(req.body.password || '', u.password)) return res.status(401).json({ error: 'Credenciales inválidas' });
      res.json({ token: sign(u), user: { email: u.email, name: u.name } });
    } catch (e) { next(e); }
  });

  // Públicos
  r.get('/api/products', productController.list);
  r.get('/api/products/:slug', productController.get);
  r.get('/api/banners', bannerController.list);
  r.get('/api/categories', categoryController.list);
  r.get('/api/offers/active', offerPublic.active);
  r.get('/api/offers', offerController.list);
  r.get('/api/videos', videoController.list);
  r.get('/api/testimonials', testimonialController.list);
  r.get('/api/config/public', configController.get);
  r.post('/api/orders', orderController.create);

  // Protegidos (admin)
  const admin = requireAuth;
  r.post('/api/products', admin, productController.create);
  r.put('/api/products/:id', admin, productController.update);
  r.delete('/api/products/:id', admin, productController.remove);
  for (const [path, c] of [['banners', bannerController], ['categories', categoryController], ['offers', offerController], ['videos', videoController], ['testimonials', testimonialController]]) {
    r.post(`/api/${path}`, admin, c.create);
    r.put(`/api/${path}/:id`, admin, c.update);
    r.delete(`/api/${path}/:id`, admin, c.remove);
  }
  r.get('/api/orders', admin, orderController.list);
  r.get('/api/config', admin, configController.get);
  r.put('/api/config', admin, configController.update);
  r.post('/api/upload', admin, upload.single('file'), (req, res) => {
    const url = storageFactory().save(req.file);
    res.json({ url });
  });
  r.get('/api/health', (req, res) => res.json({ ok: true, service: 'naty-backend' }));
  r.use(errorHandler);
  return r;
}
