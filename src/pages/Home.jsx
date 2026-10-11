import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client.js';
import { Petals, useReveal, ProductCard, toEmbed, toAutoplayEmbed, parseGallery } from '../components/ui.jsx';
import { FALLBACK_BANNERS, FALLBACK_CATEGORIES, FALLBACK_PRODUCTS, FALLBACK_OFFERS } from '../data/fallback.js';

function useReducedMotion() {
  const [reduce, setReduce] = useState(() => typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  useEffect(() => {
    if (!window.matchMedia) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const fn = (e) => setReduce(e.matches);
    mq.addEventListener('change', fn);
    return () => mq.removeEventListener('change', fn);
  }, []);
  return reduce;
}

const hasMessage = (b) => !!(b?.title || b?.subtitle || b?.cta_text);
const isVideo = (b) => b?.media_type === 'video' && !!(b?.video_url || '').trim();
// Video sin mensaje: ocupa todo el banner. Con mensaje: layout dividido.
const isFullbleed = (b) => isVideo(b) && !hasMessage(b);

// Medio de un slide: video (YouTube autoplay mudo) o foto(s) con fundido.
function HeroMedia({ banner, reduce }) {
  const gallery = parseGallery(banner.images, banner.image);
  const [g, setG] = useState(0);
  useEffect(() => { setG(0); }, [banner.id]);
  useEffect(() => {
    if (reduce || gallery.length < 2 || isVideo(banner)) return;
    const t = setTimeout(() => setG((v) => (v + 1) % gallery.length), 5000);
    return () => clearTimeout(t);
  }, [g, gallery.length, reduce, banner]);
  if (isVideo(banner)) {
    const src = reduce ? toEmbed(banner.video_url) : toAutoplayEmbed(banner.video_url);
    return (
      <div className="hero-video">
        <img src={banner.image || '/logo.jpg'} alt="" aria-hidden loading="lazy" className="hero-poster" />
        <iframe src={src} title={banner.title || 'Video Naty'} frameBorder="0" loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen />
      </div>
    );
  }
  if (gallery.length > 1) {
    return (
      <div className="hero-xfade">
        {gallery.map((src, k) => (
          <img key={src + k} src={src} alt={k === 0 ? 'Naty' : ''} loading={k === 0 ? 'eager' : 'lazy'} className={k === g ? 'on' : ''} />
        ))}
      </div>
    );
  }
  return <img className="hero-img" src={gallery[0] || '/logo.jpg'} alt="Naty" />;
}

function HeroSlider({ banners }) {
  const slides = banners?.length ? banners : FALLBACK_BANNERS;
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduce = useReducedMotion();
  const n = slides.length;
  useEffect(() => { setI(0); }, [n]);
  useEffect(() => {
    if (reduce || paused || n < 2) return;
    const t = setTimeout(() => setI((v) => (v + 1) % n), 6000);
    return () => clearTimeout(t);
  }, [i, paused, n, reduce]);
  const go = (d) => setI((v) => (v + d + n) % n);
  return (
    <section className="container reveal hero-shell" style={{ position: 'relative', marginTop: '1rem', borderRadius: '2rem', overflow: 'hidden', background: '#fff', boxShadow: 'var(--sombra)' }}
      onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <Petals />
      <div className="hero-viewport">
        <div className="hero-track" style={{ transform: `translateX(-${i * 100}%)` }}>
          {slides.map((b) => (
            <div key={b.id || b.slug || b.title} className={`hero-slide${isFullbleed(b) ? ' hero-fullbleed' : ''}`}>
              {isFullbleed(b) ? (
                <HeroMedia banner={b} reduce={reduce} />
              ) : (
                <div className="hero-grid">
                  <div>
                    <span className="badge">🌿 Hecho a mano · Sin químicos dañinos</span>
                    <h1 style={{ margin: '.6rem 0' }}>{b.title || 'Paz para tu piel, amor en cada jabón'}</h1>
                    <p style={{ opacity: .8 }}>{b.subtitle || 'Lavanda, avena, manzanilla y aceites nobles. Respira, cuídate, florece.'}</p>
                    <div style={{ display: 'flex', gap: '.7rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                      <Link className="btn btn-verde" to={b.cta_link || '/tienda'}>{b.cta_text || 'Ver tienda'} <span className="emoji" aria-hidden>🌸</span></Link>
                      <Link className="btn" style={{ background: '#fff', border: '1px solid #ddd' }} to="/ofertas">Ofertas <span className="emoji" aria-hidden>✨</span></Link>
                    </div>
                  </div>
                  <HeroMedia banner={b} reduce={reduce} />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      {n > 1 && (<>
        <button className="hero-arrow left" onClick={() => go(-1)} aria-label="Anterior">‹</button>
        <button className="hero-arrow right" onClick={() => go(1)} aria-label="Siguiente">›</button>
        <div className="hero-dots">
          {slides.map((b, k) => (
            <button key={b.id || k} className={`hero-dot${k === i ? ' on' : ''}`} onClick={() => setI(k)} aria-label={`Ir al banner ${k + 1}`} />
          ))}
        </div>
      </>)}
    </section>
  );
}

export function Home({ config }) {
  const [data, setData] = useState({ banners: FALLBACK_BANNERS, categories: FALLBACK_CATEGORIES, products: FALLBACK_PRODUCTS, offers: FALLBACK_OFFERS, videos: [], testimonials: [] });
  useReveal([data.products.length, data.banners.length]);
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
  return (
    <main>
      <HeroSlider banners={data.banners} />

      <section className="container reveal" style={{ marginTop: '2.8rem' }}>
        <h2>Categorías 🌼</h2>
        <div className="grid grid-4">
          {data.categories.map((c) => (
            <Link key={c.id} to={`/tienda?cat=${c.slug}`} className="card" style={{ textDecoration: 'none', padding: '1.3rem', textAlign: 'center' }}>
              <img src={c.image || '/logo.jpg'} alt={c.name} style={{ width: '100%', height: 160, objectFit: 'cover', borderRadius: '1rem' }} />
              <h3>{c.name}</h3>
              <small style={{ opacity: .7 }}>{c.description || ''}</small>
            </Link>
          ))}
          {data.categories.length === 0 && <p style={{ opacity: .6 }}>Tus categorías aparecerán aquí cuando las crees en /admin.</p>}
        </div>
      </section>

      <section className="container reveal" style={{ marginTop: '2.8rem' }}>
        <h2>Destacados 🧼</h2>
        <p style={{ opacity: .75 }}>Nuestros favoritos en {config?.currency_code || 'COP'} {config?.currency_symbol || '$'} — precios visibles siempre.</p>
        <div className="grid grid-3">
          {data.products.map((p) => <ProductCard key={p.id} product={p} config={config} />)}
        </div>
      </section>

      {data.offers.length > 0 && (
        <section className="container reveal" style={{ marginTop: '2.8rem' }}>
          <h2>Ofertas activas ✨</h2>
          <div className="grid grid-3">
            {data.offers.map((o) => (
              <div key={o.id} className="card" style={{ padding: '1.5rem', background: '#FFF6E3' }}>
                <span className="badge badge-oferta">{o.type}</span>
                <h3>{o.title}</h3>
                <p style={{ opacity: .8 }}>{o.description}</p>
                {o.coupon_code && <code>Usa: {o.coupon_code}</code>}
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="container reveal" style={{ marginTop: '2.8rem', background: '#fff', borderRadius: '2rem', padding: '2rem', boxShadow: 'var(--sombra)' }}>
        <h2>Un ritual de calma 🍃</h2>
        <p style={{ opacity: .8 }}>Sin sulfatos agresivos · Aceites nobles · Aromas que abrazan. Cada jabón se cura 4 semanas para cuidar tu piel y tu paz.</p>
        <div className="grid grid-3">
          {[['🌿', 'Natural', 'Ingredientes nobles y trazables'], ['🤲', 'Hecho a mano', 'Lotes pequeños con amor'], ['🐾', 'Pet friendly', 'Línea suave para mascotas']].map(([e, t, d]) => (
            <div key={t} style={{ textAlign: 'center' }}><div style={{ fontSize: '2rem' }}>{e}</div><strong>{t}</strong><div style={{ opacity: .7 }}>{d}</div></div>
          ))}
        </div>
      </section>

      {data.testimonials.length > 0 && (
        <section className="container reveal" style={{ marginTop: '2.8rem' }}>
          <h2>Lo que sienten 💌</h2>
          <div className="grid grid-3">
            {data.testimonials.map((t) => (
              <div key={t.id} className="card" style={{ padding: '1.5rem' }}>
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
