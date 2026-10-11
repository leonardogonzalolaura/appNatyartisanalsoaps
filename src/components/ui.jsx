import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useCart } from '../store/cart.jsx';
import { formatPrice } from '../utils/currency.js';

// Logo de marca configurable desde /admin → Ajustes. Si el producto o
// registro no tiene foto propia, el comodín sigue siendo /logo.jpg.
export const brandLogo = (config) => config?.logo || '/logo.jpg';

// Reveal global: observa TODO .reveal presente y futuro (navegación + datos
// asíncronos). Si una página olvida llamar useReveal, igual se vuelve visible.
export function RevealManager() {
  const { pathname } = useLocation();
  useEffect(() => {
    const show = (el) => el.classList.add('visible');
    const scan = () => document.querySelectorAll('.reveal:not(.visible)').forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.top < window.innerHeight * 0.92) show(el);
    });
    scan();
    const t = setTimeout(scan, 600); // seguridad: nada queda invisible
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && show(e.target)),
      { threshold: 0.08 }
    );
    document.querySelectorAll('.reveal:not(.visible)').forEach((el) => io.observe(el));
    const mo = new MutationObserver(() => {
      scan();
      document.querySelectorAll('.reveal:not(.visible)').forEach((el) => io.observe(el));
    });
    mo.observe(document.getElementById('root'), { childList: true, subtree: true });
    window.addEventListener('scroll', scan, { passive: true });
    return () => { clearTimeout(t); io.disconnect(); mo.disconnect(); window.removeEventListener('scroll', scan); };
  }, [pathname]);
  return null;
}

export function useReveal(deps = []) {
  useEffect(() => {
    const els = document.querySelectorAll('.reveal:not(.visible)');
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && e.target.classList.add('visible')),
      { threshold: 0.12 }
    );
    els.forEach((el) => io.observe(el));
    const t = setTimeout(() => els.forEach((el) => el.classList.add('visible')), 800);
    return () => { io.disconnect(); clearTimeout(t); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

const NAV_LINKS = [
  ['/', 'Inicio', '🏠'],
  ['/tienda', 'Tienda', '🧼'],
  ['/ofertas', 'Ofertas', '✨'],
  ['/videos', 'Videos', '🎥'],
  ['/nosotros', 'Nosotros', '🌿'],
  ['/contacto', 'Contacto', '💌']
];

export function Header({ config }) {
  const { items, total, count } = useCart();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const [bump, setBump] = useState(false);
  useEffect(() => {
    if (count === 0) return;
    setBump(true);
    const t = setTimeout(() => setBump(false), 500);
    return () => clearTimeout(t);
  }, [count]);
  // Cerrar drawer al navegar + bloquear scroll de fondo + cerrar con Escape
  useEffect(() => { setOpen(false); }, [pathname]);
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', onKey); };
  }, [open ]);
  void items;
  return (
    <>
      {config?.announcement_enabled === 1 && (
        <div className="topbar">🌿 {config?.announcement_text || 'Envíos con amor — Jabones 100% artesanales'}</div>
      )}
      <div className="container nav">
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '.7rem', textDecoration: 'none' }} onClick={() => setOpen(false)}>
          <img src={brandLogo(config)} alt="Naty" style={{ width: 52, height: 52, borderRadius: '50%', objectFit: 'cover' }} />
          <strong style={{ color: 'var(--verde)', fontSize: '1.15rem' }}>Jabones Artesanales Naty</strong>
        </Link>
        <button className={`hamburger${open ? ' open' : ''}`} onClick={() => setOpen(!open)} aria-label={open ? 'Cerrar menú' : 'Abrir menú'} aria-expanded={open}>
          <span /><span />
        </button>
        <nav className="nav-links nav-desktop">
          {NAV_LINKS.map(([to, label]) => <NavLink key={to} to={to}>{label}</NavLink>)}
          <NavLink to="/carrito" className={`cart-badge${bump ? ' bump' : ''}`}>🛒 Carrito ({count}) · {formatPrice(total, config)}</NavLink>
        </nav>
      </div>
      <div className={`drawer-overlay${open ? ' show' : ''}`} onClick={() => setOpen(false)} aria-hidden={!open} />
      <aside className={`drawer${open ? ' open' : ''}`} aria-hidden={!open} aria-label="Menú">
        <div className="drawer-head">
          <img src={brandLogo(config)} alt="Naty" />
          <div><strong>Naty 🌿</strong><small>Hecho a mano</small></div>
          <button className="drawer-close" onClick={() => setOpen(false)} aria-label="Cerrar menú">✕</button>
        </div>
        <nav className="drawer-links">
          {NAV_LINKS.map(([to, label, emoji]) => (
            <NavLink key={to} to={to} className={({ isActive }) => (isActive ? 'active' : '')}>
              <span className="emoji" aria-hidden>{emoji}</span> {label}
            </NavLink>
          ))}
          <NavLink to="/carrito" className={({ isActive }) => `drawer-cart${isActive ? ' active' : ''}`}>
            <span className="emoji" aria-hidden>🛒</span> Canasta ({count}) · {formatPrice(total, config)}
          </NavLink>
        </nav>
        {config?.whatsapp && (
          <a className="btn btn-wa drawer-wa" href={`https://wa.me/${config.whatsapp}`} target="_blank" rel="noreferrer">
            <span className="emoji" aria-hidden>💬</span> Escríbenos
          </a>
        )}
      </aside>
    </>
  );
}

export function Footer({ config }) {
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div className="footer-col footer-brand">
          <img src={brandLogo(config)} alt="Jabones Artesanales Naty" />
          <strong>Jabones Artesanales Naty</strong>
          <p>Hecho a mano · Sin químicos dañinos 🌿<br />Lotes pequeños con amor para tu piel, tus mascotas y el planeta.</p>
          <SocialLinks config={config} />
        </div>
        <nav className="footer-col" aria-label="Tienda">
          <h4>Tienda 🧼</h4>
          <Link to="/tienda">Todos los jabones</Link>
          <Link to="/tienda?cat=corporales">Corporales</Link>
          <Link to="/tienda?cat=faciales">Faciales</Link>
          <Link to="/tienda?cat=mascotas">Mascotas</Link>
          <Link to="/ofertas">Ofertas ✨</Link>
        </nav>
        <nav className="footer-col" aria-label="Ayuda">
          <h4>Ayuda 🍃</h4>
          <Link to="/nosotros">Nuestra historia</Link>
          <Link to="/videos">Rituales en video</Link>
          <Link to="/carrito">Mi canasta</Link>
          <Link to="/contacto">Contacto</Link>
        </nav>
        <div className="footer-col" aria-label="Contacto">
          <h4>Contacto 💌</h4>
          {config?.whatsapp
            ? <a href={`https://wa.me/${config.whatsapp}`} target="_blank" rel="noreferrer">💬 Escríbenos por WhatsApp</a>
            : <span style={{ opacity: .65 }}>WhatsApp por configurar en /admin</span>}
          <span>🕘 {config?.schedule || 'Lun–Sáb 9am–7pm'}</span>
          {config?.address && <span>📍 {config.address}</span>}
          <span>💳 Pago contra entrega o transferencia</span>
        </div>
      </div>
      <div className="footer-bottom">
        <small>© {new Date().getFullYear()} Naty · Hecho con calma 🌿</small>
        <Link to="/admin/login"><small>Panel administrable</small></Link>
      </div>
      {config?.whatsapp && (
        <a className="btn btn-wa wa-float" href={`https://wa.me/${config.whatsapp}?text=${encodeURIComponent('Hola Naty 🌿 quiero info de tus jabones')}`} target="_blank" rel="noreferrer">
          <span className="emoji" aria-hidden>💬</span> WhatsApp
        </a>
      )}
    </footer>
  );
}

export function CartToast({ config }) {
  const { lastAdded } = useCart();
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (!lastAdded) return;
    setShow(true);
    const t = setTimeout(() => setShow(false), 2600);
    return () => clearTimeout(t);
  }, [lastAdded]);
  void config;
  if (!lastAdded) return null;
  return (
    <div className={`cart-toast${show ? ' show' : ''}`} role="status">
      🧺 {lastAdded.name} sumado a tu canasta <Link to="/carrito">Ver carrito →</Link>
    </div>
  );
}

export function MiniCartBar({ config }) {
  const { items, total, count } = useCart();
  const { pathname } = useLocation();
  const [nearFooter, setNearFooter] = useState(false);
  // La minibarra se esconde con fundido cuando el footer está visible
  // para no tapar sus links, y reaparece al subir.
  useEffect(() => {
    const footer = document.querySelector('footer.site-footer');
    if (!footer) return;
    const io = new IntersectionObserver(([e]) => setNearFooter(e.isIntersecting), { threshold: 0.05 });
    io.observe(footer);
    return () => io.disconnect();
  }, [pathname]);
  // Avisa al CSS para que el flotante de WhatsApp no se encime.
  useEffect(() => {
    const show = items.length > 0 && !nearFooter;
    document.body.classList.toggle('has-minicart', show);
    return () => document.body.classList.remove('has-minicart');
  }, [items.length, nearFooter]);
  if (items.length === 0) return null;
  if (pathname.startsWith('/carrito') || pathname.startsWith('/admin')) return null;
  return (
    <div className={`minicart${nearFooter ? ' hidden-bar' : ''}`} aria-hidden={nearFooter}>
      <span>🛒 {count} · <strong>{formatPrice(total, config)}</strong></span>
      <Link className="btn btn-verde" style={{ padding: '.6rem 1.1rem' }} to="/carrito">Ver canasta →</Link>
    </div>
  );
}

export function ProductCard({ product, config }) {
  const { add, qtyById, setQty } = useCart();
  const [added, setAdded] = useState(false);
  const qty = qtyById(product.id);
  const onAdd = () => {
    add(product, 1);
    setAdded(true);
    setTimeout(() => setAdded(false), 1300);
  };
  return (
    <div className="card product-card" style={{ padding: '1.3rem' }}>
      <Link to={`/producto/${product.slug}`} style={{ textDecoration: 'none' }}>
        <img src={product.images?.[0] || product.image || '/logo.jpg'} alt={product.name} loading="lazy" style={{ width: '100%', height: 205, objectFit: 'cover', borderRadius: '1rem' }} />
      </Link>
      {product.stock <= 3 && <span className="badge badge-oferta">¡Solo quedan {product.stock}!</span>}
      <h3><Link to={`/producto/${product.slug}`} style={{ textDecoration: 'none' }}>{product.name}</Link></h3>
      <div>
        <span className="price">{formatPrice(product.offer_price || product.price, config)}</span>
        {product.offer_price && <span className="price-old">{formatPrice(product.price, config)}</span>}
      </div>
      <div style={{ display: 'flex', gap: '.5rem', marginTop: '.7rem', flexWrap: 'wrap' }}>
        <Link className="btn" style={{ background: '#fff', border: '1px solid #ddd', padding: '.7rem 1.1rem' }} to={`/producto/${product.slug}`}>Ver detalle <span className="emoji" aria-hidden>👁️</span></Link>
        {qty === 0 && (
          <button className={`btn btn-verde${added ? ' btn-added' : ''}`} style={{ padding: '.7rem 1.1rem' }} onClick={onAdd}>
            {added ? <>¡Sumado <span className="emoji" aria-hidden>✓</span></> : <>Añadir <span className="emoji" aria-hidden>🛒</span></>}
          </button>
        )}
      </div>
      {qty > 0 && (
        <div style={{ display: 'flex', gap: '.5rem', marginTop: '.6rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <span className="qty">
            <button onClick={() => setQty(product.id, qty - 1)} aria-label="Quitar uno">−</button>
            <strong>{qty} en canasta</strong>
            <button onClick={() => onAdd()} aria-label="Sumar uno">+</button>
          </span>
          <Link to="/carrito" style={{ fontSize: '.85rem' }}>Ver canasta →</Link>
        </div>
      )}
    </div>
  );
}

// Iconos de marca propios (SVG inline, tamaño emoji): se ven como los
// emojis tradicionales pero con la marca reconocible (la f de Facebook).
// Sin librerías externas, funcionan sin internet.
function Svg({ label, children }) {
  return (
    <svg className="brand-svg" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      {label ? <title>{label}</title> : null}
      {children}
    </svg>
  );
}
const FacebookIcon = () => (
  <Svg label="Facebook">
    <circle cx="12" cy="12" r="10" fill="currentColor" opacity=".16" />
    <path fill="currentColor" d="M13.6 20.5v-6.6h2.2l.3-2.6h-2.5V9.6c0-.8.3-1.3 1.4-1.3h1.2V6c-.2 0-1-.1-1.8-.1-1.9 0-3.1 1.1-3.1 3.2v1.9H9v2.6h2.3v6.9h2.3z" />
  </Svg>
);
const InstagramIcon = () => (
  <Svg label="Instagram">
    <rect x="4" y="4" width="16" height="16" rx="5" fill="none" stroke="currentColor" strokeWidth="2" />
    <circle cx="12" cy="12" r="3.6" fill="none" stroke="currentColor" strokeWidth="2" />
    <circle cx="16.8" cy="7.2" r="1.4" fill="currentColor" />
  </Svg>
);
const TiktokIcon = () => (
  <Svg label="TikTok">
    <ellipse cx="8" cy="17.5" rx="3.2" ry="2.5" fill="currentColor" />
    <path d="M11 17.5V6.2l9-2.3v9.6" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    <ellipse cx="20" cy="13.5" rx="2.6" ry="2.1" fill="currentColor" />
  </Svg>
);
const WhatsappIcon = () => (
  <Svg label="WhatsApp">
    <path d="M12 3.5a8.5 8.5 0 0 0-7.3 12.8L3.5 20.5l4.3-1.1A8.5 8.5 0 1 0 12 3.5z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
    <path fill="currentColor" d="M9.2 8.3c.4 2.7 2.4 4.7 5.1 5.1l1.4-1.4 2 2-1.4 1.4c-3.7-.5-6.9-3.7-7.4-7.4l1.7-1.4-1.4 1.7z" opacity=".9" />
  </Svg>
);

export function SocialLinks({ config, className = 'footer-social' }) {
  const items = [
    config?.instagram && { href: config.instagram, label: 'Instagram', Icon: InstagramIcon },
    config?.tiktok && { href: config.tiktok, label: 'TikTok', Icon: TiktokIcon },
    config?.facebook && { href: config.facebook, label: 'Facebook', Icon: FacebookIcon },
    config?.whatsapp && { href: `https://wa.me/${config.whatsapp}`, label: 'WhatsApp', Icon: WhatsappIcon }
  ].filter(Boolean);
  if (!items.length) return null;
  return (
    <div className={className}>
      {items.map(({ href, label, Icon }) => (
        <a key={label} href={href} target="_blank" rel="noreferrer" aria-label={label}>
          <Icon /> {label}
        </a>
      ))}
    </div>
  );
}

export function Petals() {
  const petals = ['🌸', '🌿', '💜', '🌼', '🍃'];
  return (
    <div className="petals" aria-hidden>
      {petals.map((p, i) => (
        <span key={i} className="petal" style={{ left: `${8 + i * 18}%`, animationDelay: `${i * 2.4}s`, fontSize: '1.3rem' }}>{p}</span>
      ))}
    </div>
  );
}

export function toEmbed(url = '') {
  if (!url) return '';
  if (url.includes('youtube.com/shorts/')) return url.replace('youtube.com/shorts/', 'www.youtube.com/embed/').split('?')[0];
  if (url.includes('youtube.com/watch')) return url.replace('watch?v=', 'embed/');
  if (url.includes('youtu.be/')) return url.replace('youtu.be/', 'www.youtube.com/embed/');
  return url;
}

export function youtubeId(url = '') {
  const m = String(url).match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{6,})/);
  return m ? m[1].split(/[?&#]/)[0] : '';
}

// Embed con autoplay mudo en loop (el loop de YouTube exige playlist=ID).
export function toAutoplayEmbed(url = '') {
  const id = youtubeId(url);
  if (!id) return url;
  return `https://www.youtube.com/embed/${id}?autoplay=1&mute=1&loop=1&playlist=${id}&controls=0&rel=0&playsinline=1`;
}

export function parseGallery(value, fallback) {
  try {
    const v = typeof value === 'string' ? JSON.parse(value || '[]') : (value || []);
    const arr = Array.isArray(v) ? v.filter(Boolean) : [];
    if (arr.length) return arr;
  } catch { /* respaldo */ }
  return fallback ? [fallback] : [];
}
