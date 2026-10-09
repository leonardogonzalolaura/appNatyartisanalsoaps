// Infraestructura SQLite: único lugar con SQL. Si mañana es Postgres,
// se crea PostgresProductRepository con los mismos métodos (L de SOLID).
import sqlite3 from 'sqlite3';
import { mkdirSync, existsSync } from 'fs';
import { dirname } from 'path';
import { env } from '../../../config/env.js';

if (!existsSync(dirname(env.DB_FILE))) mkdirSync(dirname(env.DB_FILE), { recursive: true });

export const db = new sqlite3.Database(env.DB_FILE, (err) => {
  if (err) console.error('DB error', err.message);
  else init();
});

const run = (sql, params = []) => new Promise((res, rej) => db.run(sql, params, function (e) { e ? rej(e) : res(this); }));
const all = (sql, params = []) => new Promise((res, rej) => db.all(sql, params, (e, r) => (e ? rej(e) : res(r))));
const get = (sql, params = []) => new Promise((res, rej) => db.get(sql, params, (e, r) => (e ? rej(e) : res(r))));

function init() {
  db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY, email TEXT UNIQUE, password TEXT, name TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`);
    db.run(`CREATE TABLE IF NOT EXISTS categories(id TEXT PRIMARY KEY, name TEXT, slug TEXT UNIQUE, description TEXT, image TEXT, sort_order INTEGER DEFAULT 0, active INTEGER DEFAULT 1)`);
    db.run(`CREATE TABLE IF NOT EXISTS products(id TEXT PRIMARY KEY, category_id TEXT, name TEXT, slug TEXT UNIQUE, price REAL, offer_price REAL, stock INTEGER DEFAULT 0, ingredients TEXT, benefits TEXT, how_to_use TEXT, image TEXT, images TEXT, video_url TEXT, featured INTEGER DEFAULT 0, active INTEGER DEFAULT 1, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`);
    db.run(`CREATE TABLE IF NOT EXISTS banners(id TEXT PRIMARY KEY, title TEXT, subtitle TEXT, cta_text TEXT, cta_link TEXT, image TEXT, sort_order INTEGER DEFAULT 0, active INTEGER DEFAULT 1, starts_at TEXT, ends_at TEXT)`);
    db.run(`CREATE TABLE IF NOT EXISTS offers(id TEXT PRIMARY KEY, title TEXT, description TEXT, type TEXT, coupon_code TEXT, starts_at TEXT, ends_at TEXT, active INTEGER DEFAULT 1)`);
    db.run(`CREATE TABLE IF NOT EXISTS videos(id TEXT PRIMARY KEY, title TEXT, url TEXT, sort_order INTEGER DEFAULT 0, active INTEGER DEFAULT 1)`);
    db.run(`CREATE TABLE IF NOT EXISTS testimonials(id TEXT PRIMARY KEY, author TEXT, content TEXT, rating INTEGER DEFAULT 5, active INTEGER DEFAULT 1)`);
    db.run(`CREATE TABLE IF NOT EXISTS orders_log(id TEXT PRIMARY KEY, customer_name TEXT, items TEXT, total REAL, coupon TEXT, created_at DATETIME DEFAULT CURRENT_TIMESTAMP)`);
    db.run(`CREATE TABLE IF NOT EXISTS site_config(id TEXT PRIMARY KEY, whatsapp TEXT, instagram TEXT, tiktok TEXT, facebook TEXT, announcement_text TEXT, announcement_enabled INTEGER DEFAULT 1, about_text TEXT, schedule TEXT, address TEXT, currency_code TEXT DEFAULT 'COP', currency_symbol TEXT DEFAULT '$')`);
    db.run(`ALTER TABLE site_config ADD COLUMN currency_code TEXT DEFAULT 'COP'`, () => {});
    db.run(`ALTER TABLE site_config ADD COLUMN currency_symbol TEXT DEFAULT '$'`, () => {});
    db.get(`SELECT * FROM site_config WHERE id='main'`, (e, r) => {
      if (!r) db.run(`INSERT INTO site_config(id, whatsapp, announcement_text, about_text, schedule, currency_code, currency_symbol) VALUES('main','','Envíos con amor — Jabones 100% artesanales','Naty elabora jabones a mano, en lotes pequeños, sin químicos dañinos.','Lun–Sáb 9am–7pm','COP','$')`);
      else db.run(`UPDATE site_config SET currency_code=COALESCE(currency_code,'COP'), currency_symbol=COALESCE(currency_symbol,'$') WHERE id='main'`);
    });
  });
}

export const sqliteHelpers = { run, all, get };
export const uid = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
export const slugify = (s = '') => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
