// Adaptadores concretos (únicos con SQL). Cumplen I*Repository.
import { sqliteHelpers, uid, slugify } from './db.js';
const { run, all, get } = sqliteHelpers;

export class SqliteProductRepository {
  async list({ featured } = {}) {
    let rows = await all(`SELECT p.*, c.slug as category_slug FROM products p LEFT JOIN categories c ON c.id=p.category_id WHERE p.active=1 ORDER BY p.created_at DESC`);
    if (featured) rows = rows.filter((r) => r.featured === 1);
    return rows.map(parseProduct);
  }
  getBySlug(slug) { return get(`SELECT p.*, c.slug as category_slug FROM products p LEFT JOIN categories c ON c.id=p.category_id WHERE p.slug=?`, [slug]).then((r) => (r ? parseProduct(r) : null)); }
  async create(d) {
    const id = uid();
    const slug = slugify(d.name) + '-' + id.slice(-4);
    await run(`INSERT INTO products(id, category_id, name, slug, price, offer_price, stock, ingredients, benefits, how_to_use, image, images, video_url, featured) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [id, d.category_id || null, d.name, slug, d.price, d.offer_price || null, d.stock ?? 0, d.ingredients || '', d.benefits || '', d.how_to_use || '', d.image || '', JSON.stringify(d.images || (d.image ? [d.image] : [])), d.video_url || '', d.featured ? 1 : 0]);
    return this.getBySlug(slug);
  }
  async update(id, d) {
    const cur = await get(`SELECT * FROM products WHERE id=?`, [id]);
    if (!cur) return null;
    await run(`UPDATE products SET category_id=?, name=?, price=?, offer_price=?, stock=?, ingredients=?, benefits=?, how_to_use=?, image=?, images=?, video_url=?, featured=? WHERE id=?`,
      [d.category_id ?? cur.category_id, d.name ?? cur.name, d.price ?? cur.price, d.offer_price ?? cur.offer_price, d.stock ?? cur.stock, d.ingredients ?? cur.ingredients, d.benefits ?? cur.benefits, d.how_to_use ?? cur.how_to_use, d.image ?? cur.image, d.images ? JSON.stringify(d.images) : cur.images, d.video_url ?? cur.video_url, d.featured != null ? (d.featured ? 1 : 0) : cur.featured, id]);
    return get(`SELECT * FROM products WHERE id=?`, [id]).then(parseProduct);
  }
  remove(id) { return run(`DELETE FROM products WHERE id=?`, [id]); }
}

function parseProduct(r) { return { ...r, images: safeParse(r.images, r.image ? [r.image] : []) }; }
function safeParse(s, fb) { try { const v = JSON.parse(s || '[]'); return Array.isArray(v) ? v : fb; } catch { return fb; } }

// Columnas reales por tabla: filtra claves desconocidas para no romper
// con SQLITE_ERROR si el cliente envía un campo de otra entidad.
const TABLE_COLUMNS = {
  banners: ['title', 'subtitle', 'cta_text', 'cta_link', 'image', 'sort_order', 'active', 'starts_at', 'ends_at'],
  categories: ['name', 'slug', 'description', 'image', 'sort_order', 'active'],
  offers: ['title', 'description', 'type', 'coupon_code', 'starts_at', 'ends_at', 'active'],
  videos: ['title', 'url', 'sort_order', 'active'],
  testimonials: ['author', 'content', 'rating', 'active']
};

const clean = (table, d) => {
  const allowed = TABLE_COLUMNS[table];
  const out = {};
  for (const [k, v] of Object.entries(d || {})) {
    if (k === 'id') continue;
    if (!allowed || allowed.includes(k)) out[k] = v;
  }
  return out;
};

export function makeCrud(table, defaults = {}) {
  return {
    list: (orderBy = 'rowid DESC') => all(`SELECT * FROM ${table} ORDER BY ${orderBy}`),
    create: async (d) => {
      const id = uid();
      const data = { ...defaults, ...clean(table, d) };
      const keys = ['id', ...Object.keys(data)];
      const vals = [id, ...Object.values(data)];
      await run(`INSERT INTO ${table}(${keys.join(',')}) VALUES(${keys.map(() => '?').join(',')})`, vals);
      return get(`SELECT * FROM ${table} WHERE id=?`, [id]);
    },
    update: async (id, d) => {
      const data = clean(table, d);
      const sets = Object.keys(data).map((k) => `${k}=?`).join(',');
      if (sets) await run(`UPDATE ${table} SET ${sets} WHERE id=?`, [...Object.values(data), id]);
      return get(`SELECT * FROM ${table} WHERE id=?`, [id]);
    },
    remove: (id) => run(`DELETE FROM ${table} WHERE id=?`, [id])
  };
}
