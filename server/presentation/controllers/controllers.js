// Controllers delgados: solo HTTP, delegan a use-cases/repos (S de SOLID).
import { SqliteProductRepository, makeCrud } from '../../infrastructure/persistence/sqlite/repositories.js';
import { sqliteHelpers, uid } from '../../infrastructure/persistence/sqlite/db.js';
import { CreateProduct } from '../../application/use-cases/products.usecases.js';

export const productRepo = new SqliteProductRepository();
const banners = makeCrud('banners', {}, 'sort_order ASC, rowid DESC');
const categories = makeCrud('categories');
const offers = makeCrud('offers');
const videos = makeCrud('videos');
const testimonials = makeCrud('testimonials');

export const productController = {
  list: async (req, res, next) => { try { res.json(await productRepo.list(req.query)); } catch (e) { next(e); } },
  get: async (req, res, next) => { try { const p = await productRepo.getBySlug(req.params.slug); p ? res.json(p) : res.status(404).json({ error: 'No encontrado' }); } catch (e) { next(e); } },
  create: async (req, res, next) => { try { res.status(201).json(await CreateProduct(productRepo).execute(req.body)); } catch (e) { next(e); } },
  update: async (req, res, next) => { try { res.json(await productRepo.update(req.params.id, req.body)); } catch (e) { next(e); } },
  remove: async (req, res, next) => { try { await productRepo.remove(req.params.id); res.json({ ok: true }); } catch (e) { next(e); } }
};

export function crudController(repo) {
  return {
    list: async (req, res, next) => { try { res.json(await repo.list()); } catch (e) { next(e); } },
    create: async (req, res, next) => { try { res.status(201).json(await repo.create(req.body)); } catch (e) { next(e); } },
    update: async (req, res, next) => { try { res.json(await repo.update(req.params.id, req.body)); } catch (e) { next(e); } },
    remove: async (req, res, next) => { try { await repo.remove(req.params.id); res.json({ ok: true }); } catch (e) { next(e); } }
  };
}

export const bannerController = crudController(banners);
export const categoryController = crudController(categories);
export const offerController = crudController(offers);
export const videoController = crudController(videos);
export const testimonialController = crudController(testimonials);

export const offerPublic = {
  active: async (req, res, next) => {
    try {
      const now = new Date().toISOString().slice(0, 10);
      const rows = await sqliteHelpers.all(`SELECT * FROM offers WHERE active=1 AND (starts_at IS NULL OR starts_at='' OR starts_at<=?) AND (ends_at IS NULL OR ends_at='' OR ends_at>=?)`, [now, now]);
      res.json(rows);
    } catch (e) { next(e); }
  }
};

export const orderController = {
  list: async (req, res, next) => { try { res.json(await sqliteHelpers.all(`SELECT * FROM orders_log ORDER BY created_at DESC LIMIT 200`)); } catch (e) { next(e); } },
  create: async (req, res, next) => {
    try {
      const id = uid();
      await sqliteHelpers.run(`INSERT INTO orders_log(id, customer_name, items, total, coupon) VALUES(?,?,?,?,?)`,
        [id, req.body.name || '', JSON.stringify(req.body.items || []), req.body.total || 0, req.body.coupon || '']);
      res.status(201).json({ ok: true });
    } catch (e) { next(e); }
  }
};

export const configController = {
  get: async (req, res, next) => { try { res.json(await sqliteHelpers.get(`SELECT * FROM site_config WHERE id='main'`)); } catch (e) { next(e); } },
  update: async (req, res, next) => {
    try {
      const keys = ['whatsapp', 'instagram', 'tiktok', 'facebook', 'announcement_text', 'announcement_enabled', 'about_text', 'schedule', 'address', 'currency_code', 'currency_symbol', 'logo'];
      const sets = keys.filter((k) => req.body[k] !== undefined);
      if (sets.length) await sqliteHelpers.run(`UPDATE site_config SET ${sets.map((k) => `${k}=?`).join(',')} WHERE id='main'`, sets.map((k) => req.body[k]));
      res.json(await sqliteHelpers.get(`SELECT * FROM site_config WHERE id='main'`));
    } catch (e) { next(e); }
  }
};
