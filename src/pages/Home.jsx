import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client.js';
import { Petals, useReveal, ProductCard } from '../components/ui.jsx';
import { formatPrice } from '../utils/currency.js';
import { FALLBACK_BANNERS, FALLBACK_CATEGORIES, FALLBACK_PRODUCTS, FALLBACK_OFFERS } from '../data/fallback.js';

export function Home({ config }) {
  const [data, setData] = useState({ banners: FALLBACK_BANNERS, categories: FALLBACK_CATEGORIES, products: FALLBACK_PRODUCTS, offers: FALLBACK_OFFERS, videos: [], testimonials: [] });
  useReveal([data.products.length]);
  useEffect(() => {
    const or = async (path, fb) => { try { const r = await api.get(path); return r?.length ? r : fb; } catch { return fb; } };
    Promise.all([
      or('/api/banners', FALLBACK_BANNERS),
      or('/api/categories', FALLBACK_CATEGORIES),
      or('/api/products?featured=1', FALLBACK_PRODUCTS),
      or('/api/offers/active', FALLBACK_OFFERS),
      api.get('/api/videos').catch(() => []),
      api.get('/api/testimonials').catch(() => [])
    ]).then(([banners, categories, products, offers, videos, testimonials]) =>
      setData({ banners, categories, products, offers, videos: videos.slice(0, 3), testimonials: testimonials.slice(0, 3) }));
  }, []);
  const hero = data.banners[0];
  return (
    <main>
      <section className="container reveal" style={{ position: 'relative', marginTop: '1rem', borderRadius: '2rem', overflow: 'hidden', background: '#fff', boxShadow: 'var(--sombra)' }}>
        <Petals />
        <div className="hero-grid">
          <div>
            <span className="badge">🌿 Hecho a mano · Sin químicos dañinos</span>
            <h1 style={{ margin: '.6rem 0' }}>{hero?.title || 'Paz para tu piel, amor en cada jabón'}</h1>
            <p style={{ opacity: .8 }}>{hero?.subtitle || 'Lavanda, avena, manzanilla y aceites nobles. Respira, cuídate, florece.'}</p>
            <div style={{ display: 'flex', gap: '.7rem', marginTop: '1rem', flexWrap: 'wrap' }}>
              <Link className="btn btn-verde" to={hero?.cta_link || '/tienda'}>{hero?.cta_text || 'Ver tienda'} <span className="emoji" aria-hidden>🌸</span></Link>
              <Link className="btn" style={{ background: '#fff', border: '1px solid #ddd' }} to="/ofertas">Ofertas <span className="emoji" aria-hidden>✨</span></Link>
            </div>
          </div>
          <img className="hero-img" src={hero?.image || '/logo.jpg'} alt="Naty" />
        </div>
      </section>

      <section className="container reveal" style={{ marginTop: '2rem' }}>
        <h2>Categorías 🌼</h2>
        <div className="grid grid-4">
          {data.categories.map((c) => (
            <Link key={c.id} to={`/tienda?cat=${c.slug}`} className="card" style={{ textDecoration: 'none', padding: '1rem', textAlign: 'center' }}>
              <img src={c.image || '/logo.jpg'} alt={c.name} style={{ width: '100%', height: 140, objectFit: 'cover', borderRadius: '1rem' }} />
              <h3>{c.name}</h3>
              <small style={{ opacity: .7 }}>{c.description || ''}</small>
            </Link>
          ))}
          {data.categories.length === 0 && <p style={{ opacity: .6 }}>Tus categorías aparecerán aquí cuando las crees en /admin.</p>}
        </div>
      </section>

      <section className="container reveal" style={{ marginTop: '2rem' }}>
        <h2>Destacados 🧼</h2>
        <p style={{ opacity: .75 }}>Nuestros favoritos en {config?.currency_code || 'COP'} {config?.currency_symbol || '$'} — precios visibles siempre.</p>
        <div className="grid grid-3">
          {data.products.map((p) => <ProductCard key={p.id} product={p} config={config} />)}
        </div>
      </section>

      {data.offers.length > 0 && (
        <section className="container reveal" style={{ marginTop: '2rem' }}>
          <h2>Ofertas activas ✨</h2>
          <div className="grid grid-3">
            {data.offers.map((o) => (
              <div key={o.id} className="card" style={{ padding: '1.2rem', background: '#FFF6E3' }}>
                <span className="badge badge-oferta">{o.type}</span>
                <h3>{o.title}</h3>
                <p style={{ opacity: .8 }}>{o.description}</p>
                {o.coupon_code && <code>Usa: {o.coupon_code}</code>}
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="container reveal" style={{ marginTop: '2rem', background: '#fff', borderRadius: '2rem', padding: '1.5rem', boxShadow: 'var(--sombra)' }}>
        <h2>Un ritual de calma 🍃</h2>
        <p style={{ opacity: .8 }}>Sin sulfatos agresivos · Aceites nobles · Aromas que abrazan. Cada jabón se cura 4 semanas para cuidar tu piel y tu paz.</p>
        <div className="grid grid-3">
          {[['🌿', 'Natural', 'Ingredientes nobles y trazables'], ['🤲', 'Hecho a mano', 'Lotes pequeños con amor'], ['🐾', 'Pet friendly', 'Línea suave para mascotas']].map(([e, t, d]) => (
            <div key={t} style={{ textAlign: 'center' }}><div style={{ fontSize: '2rem' }}>{e}</div><strong>{t}</strong><div style={{ opacity: .7 }}>{d}</div></div>
          ))}
        </div>
      </section>

      {data.testimonials.length > 0 && (
        <section className="container reveal" style={{ marginTop: '2rem' }}>
          <h2>Lo que sienten 💌</h2>
          <div className="grid grid-3">
            {data.testimonials.map((t) => (
              <div key={t.id} className="card" style={{ padding: '1.2rem' }}>
                <p style={{ fontStyle: 'italic' }}>“{t.content}”</p>
                <strong>— {t.author}</strong>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
