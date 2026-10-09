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
          <div className="footer-social">
            {config?.instagram && <a href={config.instagram} target="_blank" rel="noreferrer" aria-label="Instagram">📸 Instagram</a>}
            {config?.tiktok && <a href={config.tiktok} target="_blank" rel="noreferrer" aria-label="TikTok">🎵 TikTok</a>}
            {config?.facebook && <a href={config.facebook} target="_blank" rel="noreferrer" aria-label="Facebook">📘 Facebook</a>}
            {config?.whatsapp && <a href={`https://wa.me/${config.whatsapp}`} target="_blank" rel="noreferrer" aria-label="WhatsApp">💬 WhatsApp</a>}
          </div>
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
    <div className="card product-card" style={{ padding: '1rem' }}>
      <Link to={`/producto/${product.slug}`} style={{ textDecoration: 'none' }}>
        <img src={product.images?.[0] || product.image || '/logo.jpg'} alt={product.name} loading="lazy" style={{ width: '100%', height: 180, objectFit: 'cover', borderRadius: '1rem' }} />
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
  if (url.includes('youtube.com/watch')) return url.replace('watch?v=', 'embed/');
  if (url.includes('youtu.be/')) return url.replace('youtu.be/', 'www.youtube.com/embed/');
  return url;
}
