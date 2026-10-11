import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { api } from '../api/client.js';
import { useReveal, ProductCard, toEmbed, SocialLinks } from '../components/ui.jsx';
import { useCart } from '../store/cart.jsx';
import { useNotice } from '../store/notice.jsx';
import { formatPrice } from '../utils/currency.js';
import { FALLBACK_PRODUCTS, FALLBACK_CATEGORIES, FALLBACK_OFFERS, FALLBACK_VIDEOS } from '../data/fallback.js';

async function getOrFallback(path, fallback) {
  try {
    const r = await api.get(path);
    return Array.isArray(r) && r.length > 0 ? r : fallback;
  } catch { return fallback; }
}

export function Shop({ config }) {
  const [products, setProducts] = useState(FALLBACK_PRODUCTS);
  const [cats, setCats] = useState(FALLBACK_CATEGORIES);
  const [q, setQ] = useState('');
  const [params] = useSearchParams();
  useReveal([products.length]);
  useEffect(() => {
    getOrFallback('/api/products', FALLBACK_PRODUCTS).then(setProducts);
    getOrFallback('/api/categories', FALLBACK_CATEGORIES).then(setCats);
  }, []);
  const cat = params.get('cat') || '';
  const list = useMemo(() => products.filter((p) =>
    (!cat || p.category_slug === cat) &&
    (!q || ((p.name || '') + (p.ingredients || '')).toLowerCase().includes(q.toLowerCase()))), [products, cat, q]);
  return (
    <main className="container reveal">
      <h1>Tienda <span className="emoji" aria-hidden>🌸</span></h1>
      <p style={{ opacity: .75 }}>Jabones elaborados a mano, sin químicos dañinos. Elige con calma.</p>
      <div style={{ display: 'flex', gap: '.6rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
        <input className="input" style={{ maxWidth: 300 }} placeholder="Buscar lavanda, avena..." value={q} onChange={(e) => setQ(e.target.value)} />
        <Link to="/tienda" className="btn" style={{ background: '#fff', border: '1px solid #ddd' }}>Todas</Link>
        {cats.map((c) => <Link key={c.id} to={`/tienda?cat=${c.slug}`} className="btn" style={{ background: '#fff', border: '1px solid #ddd' }}>{c.name}</Link>)}
      </div>
      <div className="grid grid-3">
        {list.map((p) => <ProductCard key={p.id} product={p} config={config} />)}
      </div>
      {list.length === 0 && <p style={{ opacity: .6 }}>Sin resultados… respira y prueba otra búsqueda 🍃</p>}
    </main>
  );
}

export function ProductDetail({ config }) {
  const { slug } = useParams();
  const [p, setP] = useState(null);
  const [related, setRelated] = useState([]);
  const [error, setError] = useState(false);
  const { add, qtyById, setQty } = useCart();
  const [added, setAdded] = useState(false);
  const [bigImg, setBigImg] = useState(0);
  useReveal([p?.id]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const found = await api.get(`/api/products/${slug}`);
        if (!alive) return;
        if (found?.id || found?.name) {
          setP(found);
          const all = await getOrFallback('/api/products', FALLBACK_PRODUCTS);
          setRelated(all.filter((x) => x.slug !== found.slug).slice(0, 3));
          return;
        }
        throw new Error('empty');
      } catch {
        if (!alive) return;
        const fb = FALLBACK_PRODUCTS.find((x) => x.slug === slug) || FALLBACK_PRODUCTS[0];
        setP(fb);
        setRelated(FALLBACK_PRODUCTS.filter((x) => x.slug !== fb.slug).slice(0, 3));
        setError(true);
      }
    })();
    return () => { alive = false; };
  }, [slug]);

  if (!p) return <main className="container"><p>Cargando con calma... 🍃</p></main>;
  const qty = qtyById(p.id);
  const imgs = p.images?.length ? p.images : (p.image ? [p.image] : ['/logo.jpg']);
  const onAdd = () => { add(p, 1); setAdded(true); setTimeout(() => setAdded(false), 1300); };
  return (
    <main className="container reveal">
      <Link to="/tienda">← Volver a la tienda</Link>
      {error && <p style={{ opacity: .6, fontSize: '.85rem' }}>Mostrando información guardada (sin conexión al panel).</p>}
      <div className="detail-grid" style={{ marginTop: '1rem' }}>
        <div>
          <img src={imgs[Math.min(bigImg, imgs.length - 1)] || '/logo.jpg'} alt={p.name} loading="lazy" style={{ width: '100%', borderRadius: '1.5rem', aspectRatio: '4/3', objectFit: 'cover' }} />
          {imgs.length > 1 && (
            <div style={{ display: 'flex', gap: '.5rem', marginTop: '.5rem' }}>
              {imgs.map((src, i) => (
                <img key={i} src={src} alt="" onClick={() => setBigImg(i)} style={{ width: 64, height: 64, borderRadius: '.7rem', objectFit: 'cover', cursor: 'pointer', border: i === bigImg ? '2px solid var(--verde)' : '1px solid #eee' }} />
              ))}
            </div>
          )}
        </div>
        <div>
          <h1>{p.name}</h1>
          <div><span className="price">{formatPrice(p.offer_price || p.price, config)}</span>{p.offer_price && <span className="price-old">{formatPrice(p.price, config)}</span>}</div>
          <p>{p.stock > 0 ? (p.stock <= 3 ? `🔥 ¡Solo quedan ${p.stock}!` : `✅ Stock disponible (${p.stock})`) : '⏳ Agotado temporalmente'}</p>
          <p>🌿 <strong>Ingredientes:</strong> {p.ingredients || 'nobles y naturales'}</p>
          <p>✨ <strong>Beneficios:</strong> {p.benefits || 'Piel suave y calma'}</p>
          <p>🤲 <strong>Modo de uso:</strong> {p.how_to_use || 'Humedece, enjabona con calma, enjuaga'}</p>
          {p.video_url && (/youtube|youtu\.be/.test(p.video_url) || p.video_url.includes('embed')
            ? <div className="card" style={{ padding: '.6rem', marginTop: '.8rem' }}>
                <strong>🎥 Ritual de uso</strong>
                <iframe width="100%" height="240" src={toEmbed(p.video_url)} title={`${p.name} en video`} frameBorder="0" allowFullScreen loading="lazy" style={{ borderRadius: '1rem', marginTop: '.4rem' }} />
              </div>
            : <p><a href={p.video_url} target="_blank" rel="noreferrer">🎥 Ver ritual de uso</a></p>)}
          {qty > 0 ? (
            <span className="qty">
              <button onClick={() => setQty(p.id, qty - 1)} aria-label="Quitar uno">−</button>
              <strong>{qty} en canasta</strong>
              <button onClick={onAdd} aria-label="Sumar uno">+</button>
            </span>
          ) : (
            <button className={`btn btn-verde${added ? ' btn-added' : ''}`} onClick={onAdd} disabled={p.stock === 0}>
              {added ? <>¡Sumado <span className="emoji" aria-hidden>✓</span></> : <>Añadir al carrito <span className="emoji" aria-hidden>🛒</span></>}
            </button>
          )}
          <div style={{ marginTop: '.6rem' }}><Link to="/carrito">Ir a la canasta →</Link></div>
        </div>
      </div>
      {related.length > 0 && (
        <section style={{ marginTop: '2.8rem' }}>
          <h2>También te abraza 🤍</h2>
          <div className="grid grid-3">
            {related.map((r) => <ProductCard key={r.id} product={r} config={config} />)}
          </div>
        </section>
      )}
    </main>
  );
}

export function Offers() {
  const [offers, setOffers] = useState(FALLBACK_OFFERS);
  useReveal([offers.length]);
  useEffect(() => { getOrFallback('/api/offers/active', FALLBACK_OFFERS).then(setOffers); }, []);
  return (
    <main className="container reveal"><h1>Ofertas ✨</h1>
      <p style={{ opacity: .75 }}>Promociones vigentes, actualizadas desde el panel.</p>
      <div className="grid grid-3">{offers.map((o) => (
        <div key={o.id} className="card" style={{ padding: '1.5rem', background: '#FFF6E3' }}>
          <span className="badge badge-oferta">{o.type}</span><h3>{o.title}</h3><p>{o.description}</p>
          {o.coupon_code && <p><code>Cupón: {o.coupon_code}</code> — escríbelo en el carrito.</p>}
          <Link className="btn btn-verde" to="/tienda">Aprovechar 🌸</Link>
        </div>))}
      </div>
      {offers.length === 0 && <p style={{ opacity: .6 }}>No hay ofertas activas ahora. Vuelve a respirar pronto 🍃</p>}
    </main>);
}

export function Videos() {
  const [videos, setVideos] = useState(FALLBACK_VIDEOS);
  useReveal([videos.length]);
  useEffect(() => { getOrFallback('/api/videos', FALLBACK_VIDEOS).then(setVideos); }, []);
  return (
    <main className="container reveal"><h1>Rituales en video 🎥</h1>
      <p style={{ opacity: .75 }}>Aprende a cuidar tu piel y tus espacios con calma.</p>
      <div className="grid grid-3">{videos.map((v) => (
        <div key={v.id} className="card" style={{ padding: '1.3rem' }}>
          <h3>{v.title}</h3>
          {/youtube|youtu.be/.test(v.url || '') || v.url?.includes('embed')
            ? <iframe width="100%" height="220" src={(v.url || '').replace('watch?v=', 'embed/').replace('youtu.be/', 'www.youtube.com/embed/')} title={v.title} frameBorder="0" allowFullScreen style={{ borderRadius: '1rem' }} loading="lazy" />
            : <a href={v.url} target="_blank" rel="noreferrer">Ver en {v.url?.includes('tiktok') ? 'TikTok' : 'red social'} →</a>}
        </div>))}
      </div>
      {videos.length === 0 && <p style={{ opacity: .6 }}>Pronto nuevos rituales 🎬</p>}
    </main>);
}

export function Static({ kind, config }) {
  useReveal([]);
  if (kind === 'nosotros') return (
    <main>
      <section className="container reveal about-hero">
        <div className="about-hero-text">
          <span className="badge">🌿 Nuestra historia</span>
          <h1>Hecho a mano, con calma y con amor</h1>
          <p className="about-lead">{config?.about_text || 'Naty elabora jabones a mano, en lotes pequeños, sin químicos dañinos, para cuidar tu piel, tus mascotas y el planeta.'}</p>
          <div style={{ display: 'flex', gap: '.6rem', flexWrap: 'wrap', marginTop: '1rem' }}>
            <Link className="btn btn-verde" to="/tienda">Conocer los jabones <span className="emoji" aria-hidden>🌸</span></Link>
            <Link className="btn" style={{ background: '#fff', border: '1px solid #ddd' }} to="/videos">Ver rituales 🎥</Link>
          </div>
        </div>
        <img src="/logo.jpg" alt="Jabones Artesanales Naty" loading="lazy" className="about-logo" />
      </section>

      <section className="container reveal" style={{ marginTop: '2.8rem' }}>
        <h2>Nuestros valores 🤍</h2>
        <div className="grid grid-4">
          {[['🌿', 'Natural de verdad', 'Sin sulfatos agresivos, sin parabenos. Ingredientes nobles que puedes leer y reconocer.'],
            ['🤲', 'Hecho a mano', 'Lotes pequeños, cortados y sellados uno a uno, con calma y dedicación.'],
            ['🐾', 'Pet friendly', 'Línea suave para tus peluditos, con aromas delicados y pH cuidado.'],
            ['🌎', 'Amable con el planeta', 'Empaques simples, producción consciente y cero desperdicio innecesario.']].map(([e, t, d]) => (
            <div key={t} className="card about-value"><div className="about-value-emoji">{e}</div><strong>{t}</strong><p>{d}</p></div>
          ))}
        </div>
      </section>

      <section className="container reveal" style={{ marginTop: '2.8rem' }}>
        <h2>Así nace cada jabón 🧼</h2>
        <ol className="about-steps">
          {[['1', '🌻 Selección', 'Elegimos aceites nobles, avena, miel, lavanda y manzanilla de origen confiable.'],
            ['2', '🫧 Saponificación en frío', 'Mezclamos con paciencia para conservar la glicerina natural que suaviza tu piel.'],
            ['3', '🌙 Curado de 4 semanas', 'Cada barra reposa y madura para lograr espuma cremosa y larga duración.'],
            ['4', '🎁 Corte y empaque', 'Cortamos, sellamos y etiquetamos a mano. Ningún jabón es idéntico a otro: esa es su magia.']].map(([n, t, d]) => (
            <li key={n} className="card"><span className="about-step-num">{n}</span><div><strong>{t}</strong><p>{d}</p></div></li>
          ))}
        </ol>
      </section>

      <section className="container reveal" style={{ marginTop: '2.8rem' }}>
        <div className="card about-cta">
          <h2>Tu piel merece paz 🌸</h2>
          <p>Prueba tu primer ritual Naty y siente la diferencia de lo artesanal.</p>
          <div style={{ display: 'flex', gap: '.6rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            <Link className="btn btn-verde" to="/tienda">Ir a la tienda</Link>
            <Link className="btn" style={{ background: '#fff', border: '1px solid #ddd' }} to="/contacto">Hablar con Naty 💌</Link>
          </div>
        </div>
      </section>
    </main>);
  return (
    <main className="container reveal"><h1>Contacto 💌</h1>
      <p>Escríbenos por WhatsApp y te ayudamos con calma.</p>
      {config?.whatsapp
        ? <a className="btn btn-wa" href={`https://wa.me/${config.whatsapp}`} target="_blank" rel="noreferrer"><span className="emoji" aria-hidden>💬</span> Hablar por WhatsApp</a>
        : <p style={{ opacity: .7 }}>Configura tu WhatsApp en /admin → Ajustes para activar el botón.</p>}
      <p style={{ opacity: .7 }}>{config?.schedule || 'Lun–Sáb 9am–7pm'} · {config?.address || ''}</p>
      <SocialLinks config={config} />
      {!config?.instagram && !config?.tiktok && !config?.facebook && !config?.whatsapp && <span style={{ opacity: .6 }}>Tus redes aparecerán aquí cuando las conectes en /admin.</span>}
    </main>);
}

export function Cart({ config }) {
  const { items, setQty, remove, total, clear } = useCart();
  const { alertDialog } = useNotice();
  const [coupon, setCoupon] = useState('');
  const [name, setName] = useState('');
  useReveal([items.length]);
  const checkout = async () => {
    const fmt = (v) => formatPrice(v, config);
    const msg = `Hola Naty, quiero pedir:%0A${items.map((i) => `- ${i.name} x${i.qty} = ${fmt(i.price * i.qty)}`).join('%0A')}%0A%0ATotal: ${fmt(total)}%0A${coupon ? `Cupon: ${coupon}%0A` : ''}Nombre: ${name}`;
    try { await api.post('/api/orders', { items, total, coupon, name }); } catch {}
    clear();
    const wa = config?.whatsapp ? `https://wa.me/${config.whatsapp}?text=${msg}` : null;
    if (wa) window.open(wa, '_blank');
    else alertDialog('Tu pedido quedó guardado, pero la tienda aún no tiene WhatsApp configurado. Escríbenos por redes mientras lo activamos 🌿', { title: 'Pedido guardado 🧺' });
  };
  return (
    <main className="container reveal">
      <p className="cart-steps">🛒 Canasta → <span>💬 Confirmar por WhatsApp</span> → <span>🌿 Recibir con amor</span></p>
      <h1>Tu canasta 🧺</h1>
      {items.length === 0 ? (
        <div className="card cart-empty">
          <div style={{ fontSize: '3rem' }}>🍃</div>
          <h2>Tu canasta está vacía</h2>
          <p>Respira… y elige el ritual que tu piel necesita.</p>
          <Link className="btn btn-verde" to="/tienda">Explorar la tienda <span className="emoji" aria-hidden>🌸</span></Link>
        </div>
      ) : (
      <div className="cart-layout">
        <section className="cart-items">
          {items.map((i) => (
            <article key={i.id} className="card cart-item">
              <img src={i.image || '/logo.jpg'} alt={i.name} loading="lazy" />
              <div className="cart-item-info">
                <strong>{i.name}</strong>
                <small>{formatPrice(i.price, config)} c/u</small>
              </div>
              <span className="qty">
                <button onClick={() => setQty(i.id, i.qty - 1)} aria-label="Quitar uno">−</button>
                <strong>{i.qty}</strong>
                <button onClick={() => setQty(i.id, i.qty + 1)} aria-label="Sumar uno">+</button>
              </span>
              <strong className="cart-sub">{formatPrice(i.price * i.qty, config)}</strong>
              <button className="cart-remove" onClick={() => remove(i.id)} aria-label={`Quitar ${i.name}`}>✕</button>
            </article>))}
          <button className="cart-clear" onClick={clear}>Vaciar canasta</button>
        </section>
        <aside className="card cart-summary">
          <h2>Resumen 🌿</h2>
          <label>Tu nombre<input className="input" placeholder="Ej: Carolina" value={name} onChange={(e) => setName(e.target.value)} /></label>
          <label>Cupón<input className="input" placeholder="Ej: NATY10" value={coupon} onChange={(e) => setCoupon(e.target.value)} /></label>
          <div className="cart-row"><span>{items.reduce((s, i) => s + i.qty, 0)} productos</span><span>{formatPrice(total, config)}</span></div>
          <div className="cart-row"><span>Envío</span><span>Se coordina por WhatsApp 💬</span></div>
          <div className="cart-total"><span>Total</span><strong>{formatPrice(total, config)}</strong></div>
          <button className="btn btn-wa cart-cta" onClick={checkout}><span className="emoji" aria-hidden>💬</span> Finalizar por WhatsApp</button>
          <Link className="cart-keep" to="/tienda">← Seguir explorando</Link>
          <small className="cart-note">Pago contra entrega o transferencia. Sin registros complicados 🍃</small>
        </aside>
      </div>)}
    </main>);
}
