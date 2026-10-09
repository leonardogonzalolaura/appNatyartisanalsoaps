// Seed inicial: admin + 8 productos demo + categorías + banner + oferta.
import bcrypt from 'bcryptjs';
import { db } from './infrastructure/persistence/sqlite/db.js';
import { uid } from './infrastructure/persistence/sqlite/db.js';

const run = (sql, p = []) => new Promise((res, rej) => db.run(sql, p, function (e) { e ? rej(e) : res(this); }));
await new Promise((r) => setTimeout(r, 800));

await run(`INSERT OR IGNORE INTO users(id,email,password,name) VALUES(?,?,?,?)`,
  ['admin-1', 'admin@naty.pe', bcrypt.hashSync('naty123', 10), 'Naty']);

const cats = [
  [' Corporales', 'corporales', 'Cuidado diario con aceites nobles', '/logo.jpg'],
  ['Faciales', 'faciales', 'Suavidad y calma para tu rostro', '/logo.jpg'],
  ['Mascotas', 'mascotas', 'Línea suave para tus peluditos', '/logo.jpg'],
  ['Packs', 'packs', 'Regala rituales completos', '/logo.jpg']
];
for (const [name, slug, desc, img] of cats)
  await run(`INSERT OR IGNORE INTO categories(id,name,slug,description,image) VALUES(?,?,?,?,?)`, [uid(), name.trim(), slug, desc, img]);

await run(`INSERT OR IGNORE INTO banners(id,title,subtitle,cta_text,cta_link,image,sort_order) VALUES(?,?,?,?,?,?,?)`,
  [uid(), 'Paz para tu piel, amor en cada jabón', 'Lavanda, avena y manzanilla. Hecho a mano, sin químicos dañinos.', 'Ver tienda', '/tienda', '/logo.jpg', 0]);
await run(`INSERT OR IGNORE INTO offers(id,title,description,type,coupon_code,active) VALUES(?,?,?,?,?,?)`,
  [uid(), 'Bienvenida Naty 10%', 'En tu primera canasta por WhatsApp', 'cupon', 'NATY10', 1]);
await run(`INSERT OR IGNORE INTO videos(id,title,url) VALUES(?,?,?)`,
  [uid(), 'Cómo usamos el jabón de lavanda', 'https://www.youtube.com/embed/dQw4w9WgXcQ']);
await run(`INSERT OR IGNORE INTO testimonials(id,author,content) VALUES(?,?,?)`,
  [uid(), 'María 🌸', 'Mi piel respira paz desde que uso Naty. El de avena es mi ritual.']);

const demo = [
  ['Jabón Lavanda Calma', 18000, 15000, 12, 'lavanda, aceite de oliva, manteca de karité', 'Relaja y suaviza', 'Uso diario corporal'],
  ['Jabón Avena Miel', 16000, null, 8, 'avena, miel, caléndula', 'Nutre pieles sensibles', 'Rostro y cuerpo'],
  ['Jabón Carbón Detox', 19000, null, 5, 'carbón activado, tea tree', 'Limpieza profunda suave', '2-3 veces por semana'],
  ['Jabón Manzanilla Bebé', 17000, null, 10, 'manzanilla, avena coloidal', 'Hipoalergénico', 'Pieles delicadas']
];
for (const [name, price, offer, stock, ing, ben, use] of demo)
  await run(`INSERT OR IGNORE INTO products(id,name,slug,price,offer_price,stock,ingredients,benefits,how_to_use,image,images,featured) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)`,
    [uid(), name, name.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + uid().slice(-4), price, offer, stock, ing, ben, use, '/logo.jpg', JSON.stringify(['/logo.jpg']), 1]);

console.log('✅ Seed listo: admin@naty.pe / naty123');
process.exit(0);
