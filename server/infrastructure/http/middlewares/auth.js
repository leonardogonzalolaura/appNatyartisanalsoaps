import jwt from 'jsonwebtoken';
import { env } from '../../../config/env.js';
export function sign(user) { return jwt.sign({ id: user.id, email: user.email }, env.JWT_SECRET, { expiresIn: '7d' }); }
export function requireAuth(req, res, next) {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'No autorizado' });
  try { req.user = jwt.verify(token, env.JWT_SECRET); next(); } catch { return res.status(401).json({ error: 'Sesión vencida' }); }
}
export function errorHandler(err, req, res, next) {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Error interno. Respira y reintenta 🍃' });
}
