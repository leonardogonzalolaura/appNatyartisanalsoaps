import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams, Navigate } from 'react-router-dom';
import { api } from '../api/client.js';
import { brandLogo } from '../components/ui.jsx';
import { useNotice } from '../store/notice.jsx';

const NAV_GROUPS = [
  { id: 'contenido', label: 'Contenido', emoji: '🧺', items: [
    { key: 'products', label: 'Productos', emoji: '🧼', desc: 'Lo que vendes' },
    { key: 'banners', label: 'Banners', emoji: '🖼️', desc: 'Hero del inicio' },
    { key: 'categories', label: 'Categorías', emoji: '🌼', desc: 'Agrupan tu tienda' },
    { key: 'videos', label: 'Videos', emoji: '🎥', desc: 'Rituales y redes' },
    { key: 'testimonials', label: 'Testimonios', emoji: '💌', desc: 'Lo que dicen' },
  ]},
  { id: 'ventas', label: 'Ventas', emoji: '💰', items: [
    { key: 'offers', label: 'Ofertas', emoji: '✨', desc: 'Promos y cupones' },
    { key: 'orders', label: 'Pedidos WA', emoji: '🛒', desc: 'Pedidos WhatsApp' },
  ]},
  { id: 'sistema', label: 'Sistema', emoji: '⚙️', items: [
    { key: 'settings', label: 'Ajustes', emoji: '⚙️', desc: 'Logo, moneda, redes' },
  ]},
];
const NAV_FLAT = Object.fromEntries(
  NAV_GROUPS.flatMap((g) => g.items.map((i) => [i.key, { ...i, group: g.label, groupEmoji: g.emoji }]))
);

export function AdminLogin() {
  const [email, setEmail] = useState('admin@naty.pe');
  const [password, setPassword] = useState('');
  const nav = useNavigate();
  const [busy, setBusy] = useState(false);
  const { toast } = useNotice();
  if (localStorage.getItem('naty_token')) return <Navigate to="/admin?tab=dashboard" replace />;
  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      const r = await api.post('/api/auth/login', { email, password });
      localStorage.setItem('naty_token', r.token);
      toast('Bienvenida de nuevo, Naty 🌿', 'ok');
      nav('/admin?tab=dashboard', { replace: true });
    } catch (err) {
      // Distingue sin conexión (red) de credenciales wrong (401)
      const offline = err instanceof TypeError || /failed to fetch|networkerror|load failed/i.test(err?.message || '');
      toast(offline
        ? 'No se pudo contactar al servidor. Revisa tu conexión e inténtalo de nuevo 🍃'
        : 'Correo o contraseña incorrectos. Revisa e inténtalo de nuevo 🌿', 'error');
    }
    finally { setBusy(false); }
  };
  return (
    <main className="container" style={{ maxWidth: 440, paddingTop: '3rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
        <img src={brandLogo()} alt="Naty" style={{ width: 84, height: 84, borderRadius: '50%', objectFit: 'cover', boxShadow: 'var(--sombra)' }} />
      </div>
      <h1 style={{ textAlign: 'center' }}>Bienvenida Naty 🌿</h1>
      <p style={{ opacity: .7 }}>Gestiona tu tienda con calma, todo en español y con vista previa.</p>
      <form onSubmit={submit} className="form-grid">
        <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Correo" />
        <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Contraseña" />
        <button className="btn btn-verde" disabled={busy}>{busy ? 'Entrando…' : 'Entrar al panel ✨'}</button>
      </form>
    </main>
  );
}

function useCrud(path) {
  const [rows, setRows] = useState([]);
  const load = () => api.get(`/api/${path}`).then(setRows).catch(() => {});
  useEffect(() => { load(); }, [path]);
  return [rows, load];
}

async function handleImage(e, setForm, form, notify) {
  const file = e.target.files?.[0];
  if (!file) return;
  try {
    const r = await api.upload(file);
    setForm({ ...form, image: r.url });
    notify?.('Imagen subida con éxito 🌸', 'ok');
  } catch {
    notify?.('No se pudo subir la imagen. Intenta con una más liviana 🍃', 'error');
  }
}

function prettyItems(raw) {
  try {
    const arr = JSON.parse(raw || '[]');
    if (!Array.isArray(arr) || arr.length === 0) return '—';
    return arr.map((i) => `${i.name} x${i.qty}`).join(', ');
  } catch { return raw || '—'; }
}

// Sección colapsable del formulario. En escritorio el CSS la muestra
// siempre abierta e idéntica a antes; en móvil colapsa por grupos.
function AdminSection({ title, emoji, open, children }) {
  return (
    <details className="admin-section" open={open}>
      <summary className="admin-summary"><span className="emoji" aria-hidden>{emoji}</span> {title} <span className="admin-caret" aria-hidden>▾</span></summary>
      <div className="admin-section-body">{children}</div>
    </details>
  );
}

function rowLabel(r) {
  return r.name || r.title || (r.author ? `${r.author} — ${(r.content || '').slice(0, 60)}` : r.url) || 'Ítem';
}

function stockBadge(stock) {
  const s = Number(stock ?? 0);
  if (s <= 0) return <span className="badge badge-off">Agotado</span>;
  if (s <= 3) return <span className="badge badge-oferta">¡Solo {s}!</span>;
  return <span className="badge badge-ok">Stock {s}</span>;
}

// Tarjetas para móvil: misma data y mismos handlers que la tabla.
// En escritorio el CSS las oculta y se usa la tabla de siempre.
function AdminCards({ tab, rows, onEdit, onDel }) {
  return (
    <div className="admin-cards">
      {rows.map((r) => (
        <article key={r.id} className="card admin-card">
          {(tab === 'products' || tab === 'categories' || tab === 'banners') && (
            <img src={r.image || '/logo.jpg'} alt="" loading="lazy" />
          )}
          <div className="admin-card-info">
            <strong>{rowLabel(r)}</strong>
            <div className="admin-card-meta">
              {tab === 'products' && (<>
                <span className="price-sm">${Number(r.offer_price || r.price || 0).toLocaleString('es-CO')}</span>
                {stockBadge(r.stock)}
                {!!r.featured && <span className="badge">⭐ Destacado</span>}
              </>)}
              {tab === 'offers' && (<>
                <span className="badge badge-oferta">{r.type || 'cupon'}</span>
                {r.coupon_code && <code>{r.coupon_code}</code>}
              </>)}
              {tab === 'testimonials' && <span className="badge">{'★'.repeat(Math.min(5, Number(r.rating) || 5))}</span>}
              {(tab === 'videos' || tab === 'categories' || tab === 'banners') && r.description && (
                <small>{String(r.description).slice(0, 80)}</small>)}
              {tab === 'videos' && r.url && <small>{String(r.url).slice(0, 48)}…</small>}
              {tab === 'banners' && r.subtitle && <small>{String(r.subtitle).slice(0, 80)}</small>}
            </div>
          </div>
          <div className="admin-card-actions">
            <button className="icon-btn" title="Editar" onClick={() => onEdit(r)}>✏️</button>
            <button className="icon-btn danger" title="Eliminar" onClick={() => onDel(r.id, rowLabel(r))}>🗑️</button>
          </div>
        </article>
      ))}
      {rows.length === 0 && <p className="admin-hint">Sin resultados 🍃</p>}
    </div>
  );
}

function AdminSearch({ value, onChange, total }) {
  return (
    <div className="admin-search">
      <input className="input" placeholder="🔍 Buscar…" value={value} onChange={(e) => onChange(e.target.value)} />
      <small>{total} ítems</small>
    </div>
  );
}

// Modal reutilizable para crear/editar: la lista queda siempre visible
// detrás y el formulario vive dentro. En móvil es hoja inferior.
function AdminModal({ title, onClose, children }) {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', onKey); };
  }, [onClose]);
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog" role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <strong>{title}</strong>
          <button type="button" className="drawer-close" onClick={onClose} aria-label="Cerrar">✕</button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}

function sectionSubtitle(tab) {
  if (tab === 'dashboard') return '🏠 Inicio';
  const s = NAV_FLAT[tab];
  return s ? `${s.emoji} ${s.label} — ${s.desc}` : '';
}

// Píldora fija que aparece al bajar en móvil para no perder de vista
// en qué sección estás. Solo existe en ≤820px (por CSS).
function SectionPill({ tab, count }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const anchor = document.querySelector('.sidebar');
    if (!anchor) return;
    const io = new IntersectionObserver(([e]) => setShow(!e.isIntersecting && e.boundingClientRect.top < 0), { threshold: 0 });
    io.observe(anchor);
    return () => io.disconnect();
  }, [tab]);
  const goMenu = () => {
    document.querySelector('.sidebar')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  return (
    <button className={`section-pill${show ? ' show' : ''}`} onClick={goMenu} aria-hidden={!show} tabIndex={show ? 0 : -1}>
      <span>{sectionSubtitle(tab)}</span>
      {count != null && <span className="side-count">{count}</span>}
      <span className="section-pill-up" aria-hidden>↑ menú</span>
    </button>
  );
}

function AdminLayout({ tab, count, children }) {
  const [brand, setBrand] = useState('/logo.jpg');
  const { confirmDialog } = useNotice();
  useEffect(() => {
    let alive = true;
    api.get('/api/config/public').then((c) => alive && c?.logo && setBrand(c.logo)).catch(() => {});
    const sync = () => api.get('/api/config/public').then((c) => alive && c?.logo && setBrand(c.logo)).catch(() => {});
    window.addEventListener('focus', sync);
    return () => { alive = false; window.removeEventListener('focus', sync); };
  }, [tab]);
  const doLogout = async () => {
    const ok = await confirmDialog('Se cerrará tu sesión del panel. Podrás entrar de nuevo cuando quieras 🌿', {
      title: '¿Cerrar sesión?', okLabel: 'Sí, salir'
    });
    if (!ok) return;
    localStorage.removeItem('naty_token');
    window.location.href = '/admin/login';
  };
  return (
    <main className="container admin-page">
      <div className="admin-topbar">
        <Link to="/admin?tab=dashboard" className="admin-brand">
          <img src={brand} alt="Naty" />
          <div><strong>Panel Naty 🌿</strong><small>{sectionSubtitle(tab)}</small></div>
        </Link>
        <div className="admin-top-actions">
          <Link className="btn btn-ghost btn-small" to="/">← Ver tienda</Link>
          <button className="btn btn-danger btn-small" onClick={doLogout}>Salir ⎋</button>
        </div>
      </div>
      <SectionPill tab={tab} count={count} />
      <div className="admin-shell">
        <Sidebar tab={tab} />
        <div className="admin-content">{children}</div>
      </div>
    </main>
  );
}

export function Admin() {
  const [params] = useSearchParams();
  const tab = params.get('tab') || 'dashboard';
  const { toast, confirmDialog } = useNotice();
  const [rows, load] = useCrud(tab === 'dashboard' || tab === 'settings' || tab === 'orders' ? 'products' : tab);
  const [form, setForm] = useState({});
  const [editing, setEditing] = useState(null);
  const [orders, setOrders] = useState([]);
  const [settings, setSettings] = useState(null);
  const [allCats, setAllCats] = useState([]);
  const [filter, setFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  useEffect(() => {
    if (tab === 'orders') api.get('/api/orders').then(setOrders).catch(() => {});
    if (tab === 'settings') api.get('/api/config').then(setSettings).catch(() => {});
    if (tab === 'products') api.get('/api/categories').then(setAllCats).catch(() => {});
  }, [tab]);
  // Al cambiar de pestaña se limpia el formulario y el filtro para no
  // arrastrar datos de otra sección (no afecta lo ya guardado).
  useEffect(() => { setForm({}); setEditing(null); setFilter(''); setModalOpen(false); }, [tab]);

  const visible = rows.filter((r) => {
    const q = filter.trim().toLowerCase();
    if (!q) return true;
    return [r.name, r.title, r.author, r.content, r.url, r.coupon_code, r.description, r.subtitle]
      .filter(Boolean).join(' ').toLowerCase().includes(q);
  });
  const openNew = () => { setForm({}); setEditing(null); setModalOpen(true); };
  const startEdit = (r) => { setEditing(r.id); setForm(r); setModalOpen(true); };
  const closeModal = () => { setModalOpen(false); setEditing(null); setForm({}); };

  const save = async (e) => {
    e.preventDefault();
    try {
      if (tab === 'settings') { await api.put('/api/config', settings); toast('Ajustes guardados 🌿', 'ok'); return; }
      if (editing) await api.put(`/api/${tab}/${editing}`, form);
      else await api.post(`/api/${tab}`, form);
      setForm({}); setEditing(null); setModalOpen(false); load();
      toast('Guardado con éxito ✨', 'ok');
    } catch (err) { toast('Revisa los campos: ' + (err.message || 'error desconocido'), 'error'); }
  };
  const del = async (id, label) => {
    const ok = await confirmDialog(`Se eliminará “${label || 'este ítem'}” de tu tienda. Esta acción no se puede deshacer 🍂`, {
      title: '¿Eliminar?', okLabel: 'Sí, eliminar', danger: true
    });
    if (!ok) return;
    try {
      await api.del(`/api/${tab}/${id}`); load();
      toast('Eliminado 🍂', 'ok');
    } catch (err) { toast('No se pudo eliminar: ' + (err.message || ''), 'error'); }
  };

  const uploadLogo = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const r = await api.upload(file);
      setSettings({ ...settings, logo: r.url });
      toast('Logo actualizado 🌸', 'ok');
    } catch { toast('No se pudo subir el logo. Intenta con una imagen más liviana 🍃', 'error'); }
  };

  if (tab === 'settings') return (
    <AdminLayout tab={tab} count={null}>
      <div><h1>⚙️ Ajustes y redes</h1>
        {settings && (
          <form onSubmit={save} className="form-grid">
            <AdminSection title="Marca" emoji="🖼️" open>
              <label>Logo de marca
                <div style={{ display: 'flex', gap: '.8rem', alignItems: 'center', flexWrap: 'wrap', marginTop: '.3rem' }}>
                  <img src={settings.logo || '/logo.jpg'} alt="Logo actual" style={{ width: 84, height: 84, borderRadius: '50%', objectFit: 'cover', border: '1px solid #eee' }} />
                  <div style={{ display: 'grid', gap: '.4rem' }}>
                    <input type="file" accept="image/*" onChange={uploadLogo} />
                    {settings.logo && settings.logo !== '/logo.jpg' && (
                      <button type="button" className="btn btn-ghost btn-small" onClick={() => setSettings({ ...settings, logo: '/logo.jpg' })}>Volver al logo original</button>
                    )}
                  </div>
                </div>
              </label>
            </AdminSection>
            <AdminSection title="Contacto y redes" emoji="💬">
              {[['whatsapp', 'WhatsApp (solo números, ej: 573001234567)', ''], ['schedule', 'Horario', ''], ['address', 'Dirección', ''], ['instagram', 'Instagram URL', ''], ['tiktok', 'TikTok URL', ''], ['facebook', 'Facebook URL', '']].map(([k, label, ph]) => (
                <label key={k}>{label}<input className="input" value={settings[k] || ''} onChange={(e) => setSettings({ ...settings, [k]: e.target.value })} placeholder={ph} /></label>
              ))}
            </AdminSection>
            <AdminSection title="Textos y moneda" emoji="📝">
              <label>Texto barra superior<input className="input" value={settings.announcement_text || ''} onChange={(e) => setSettings({ ...settings, announcement_text: e.target.value })} /></label>
              <label><input type="checkbox" checked={settings.announcement_enabled === 1} onChange={(e) => setSettings({ ...settings, announcement_enabled: e.target.checked ? 1 : 0 })} /> Mostrar barra anuncio</label>
              <label>Texto Nosotros<textarea className="textarea" value={settings.about_text || ''} onChange={(e) => setSettings({ ...settings, about_text: e.target.value })} /></label>
              <label>Moneda (ej: COP, PEN, MXN, USD)<input className="input" value={settings.currency_code || ''} onChange={(e) => setSettings({ ...settings, currency_code: e.target.value })} placeholder="COP" /></label>
              <label>Símbolo moneda (ej: $, S/)<input className="input" value={settings.currency_symbol || ''} onChange={(e) => setSettings({ ...settings, currency_symbol: e.target.value })} placeholder="$" /></label>
              <small style={{ opacity: .7 }}>Por defecto: COP $ pesos colombianos. Si vendes en soles usa PEN y S/.</small>
            </AdminSection>
            <div className="admin-savebar">
              <button className="btn btn-verde">Guardar 🌿</button>
            </div>
          </form>)}
      </div>
    </AdminLayout>);

  if (tab === 'orders') return (
    <AdminLayout tab={tab} count={orders.length}>
      <div><h1>🛒 Pedidos por WhatsApp</h1>
        <AdminSearch value={filter} onChange={setFilter} total={orders.length} />
        <div className="table-wrap"><table className="table"><thead><tr><th>Fecha</th><th>Cliente</th><th>Total</th><th>Detalle</th></tr></thead>
          <tbody>{orders.filter((o) => !filter.trim() || `${o.customer_name} ${o.items} ${o.total}`.toLowerCase().includes(filter.trim().toLowerCase())).map((o) => <tr key={o.id}><td>{o.created_at}</td><td>{o.customer_name}</td><td>$ {o.total}</td><td>{prettyItems(o.items)}</td></tr>)}</tbody>
        </table></div>
        <div className="admin-cards">
          {orders.filter((o) => !filter.trim() || `${o.customer_name} ${o.items} ${o.total}`.toLowerCase().includes(filter.trim().toLowerCase())).map((o) => (
            <article key={o.id} className="card admin-card">
              <div className="admin-card-info">
                <strong>{o.customer_name || 'Cliente'}</strong>
                <div className="admin-card-meta">
                  <span className="price-sm">$ {o.total}</span>
                  <small>{o.created_at}</small>
                  <small>{prettyItems(o.items)}</small>
                </div>
              </div>
            </article>))}
        </div>
        {orders.length === 0 && <p className="admin-hint">Aún no hay pedidos. Cuando alguien finalice por WhatsApp aparecerán aquí 🍃</p>}
      </div>
    </AdminLayout>);

  if (tab === 'dashboard') return (
    <AdminLayout tab={tab} count={null}>
      <div><h1>Hola Naty, tu tienda respira bien 🌸</h1>
        <div className="grid grid-3">
          {[['🧼', 'Productos', rows.length, '/admin?tab=products'], ['🖼️', 'Nuevo banner', 'subir imagen', '/admin?tab=banners'], ['✨', 'Nueva oferta', '2x1, cupones', '/admin?tab=offers'], ['⚙️', 'Redes/WhatsApp', 'conectar', '/admin?tab=settings']].map(([e, t, d, link]) => (
            <Link key={t} to={link} className="card stat-card">
              <div className="stat-emoji">{e}</div><strong>{t}</strong><div className="stat-sub">{d}</div>
            </Link>))}
        </div>
        <p className="admin-hint">Consejo: publica 1 banner + 1 oferta a la semana para mantener tu web viva. Todo tiene vista previa antes de publicar.</p>
      </div>
    </AdminLayout>);

  const NEW_LABEL = { products: '＋ Nuevo producto', categories: '＋ Nueva categoría', banners: '＋ Nuevo banner', offers: '＋ Nueva oferta', videos: '＋ Nuevo video', testimonials: '＋ Nuevo testimonio' };

  return (
    <AdminLayout tab={tab} count={visible.length}>
      <div>
        <div className="admin-list-head">
          <h1 style={{ textTransform: 'capitalize', margin: 0 }}>{tab} ✨</h1>
          <button className="btn btn-verde btn-small" onClick={openNew}>{NEW_LABEL[tab] || '＋ Nuevo'}</button>
        </div>
        {modalOpen && (
        <AdminModal title={editing ? `Editar — ${rowLabel(form)}` : (NEW_LABEL[tab] || 'Nuevo')} onClose={closeModal}>
        <form onSubmit={save} className="form-grid form-in-modal">
          <AdminSection title="Datos" emoji="📋" open>
            {(tab === 'products' || tab === 'categories') && (
              <label>Nombre*<input className="input" value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></label>)}
            {(tab === 'banners' || tab === 'offers' || tab === 'videos') && (
              <label>Título*<input className="input" value={form.title || ''} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></label>)}
            {tab === 'testimonials' && (
              <label>Autor / cliente*<input className="input" value={form.author || ''} onChange={(e) => setForm({ ...form, author: e.target.value })} placeholder="Ej: María 🌸" required /></label>)}
            {tab === 'products' && (<>
              <label>Categoría<select className="select" value={form.category_id || ''} onChange={(e) => setForm({ ...form, category_id: e.target.value || null })}>
                <option value="">Sin categoría</option>
                {allCats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select></label>
              <label>Precio (en tu moneda administrable)*<input className="input" type="number" inputMode="decimal" step="0.01" value={form.price || ''} onChange={(e) => setForm({ ...form, price: e.target.value })} required /></label>
              <label>Precio oferta (opcional)<input className="input" type="number" inputMode="decimal" step="0.01" value={form.offer_price || ''} onChange={(e) => setForm({ ...form, offer_price: e.target.value })} /></label>
              <label>Stock<input className="input" type="number" inputMode="numeric" value={form.stock || ''} onChange={(e) => setForm({ ...form, stock: e.target.value })} /></label>
            </>)}
            {tab === 'offers' && (
              <label>Tipo<select className="select" value={form.type || 'cupon'} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                <option value="cupon">Cupón</option>
                <option value="porcentaje">Porcentaje</option>
                <option value="pack_3x2">Pack 3x2</option>
              </select></label>)}
          </AdminSection>
          {(tab === 'products' || tab === 'categories' || tab === 'banners' || tab === 'offers' || tab === 'testimonials') && (
            <AdminSection title="Detalle" emoji="📝">
              {tab === 'products' && (<>
                <label>Ingredientes<textarea className="textarea" value={form.ingredients || ''} onChange={(e) => setForm({ ...form, ingredients: e.target.value })} placeholder="avena, lavanda, aceite de oliva..." /></label>
                <label>Beneficios<textarea className="textarea" value={form.benefits || ''} onChange={(e) => setForm({ ...form, benefits: e.target.value })} /></label>
                <label>Modo de uso<textarea className="textarea" value={form.how_to_use || ''} onChange={(e) => setForm({ ...form, how_to_use: e.target.value })} placeholder="Humedece, enjabona con calma, enjuaga..." /></label>
              </>)}
              {tab === 'categories' && (
                <label>Descripción<textarea className="textarea" value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Cuidado diario con aceites nobles..." /></label>)}
              {tab === 'banners' && (
                <label>Subtítulo<textarea className="textarea" value={form.subtitle || ''} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} placeholder="Lavanda, avena y manzanilla..." /></label>)}
              {tab === 'offers' && (<>
                <label>Descripción<textarea className="textarea" value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="En tu primera canasta..." /></label>
                <label>Cupón<input className="input" value={form.coupon_code || ''} onChange={(e) => setForm({ ...form, coupon_code: e.target.value })} placeholder="NATY10 (opcional)" /></label>
              </>)}
              {tab === 'testimonials' && (
                <label>Testimonio*<textarea className="textarea" value={form.content || ''} onChange={(e) => setForm({ ...form, content: e.target.value })} placeholder="Mi piel respira paz desde que uso Naty..." required /></label>)}
            </AdminSection>
          )}
          {(tab === 'products' || tab === 'categories' || tab === 'banners' || tab === 'videos') && (
            <AdminSection title="Multimedia" emoji="🖼️">
              {(tab === 'products' || tab === 'categories' || tab === 'banners') && (
                <label>Foto<input type="file" accept="image/*" onChange={(e) => handleImage(e, setForm, form, toast)} />{form.image && <img src={form.image} alt="" style={{ width: 120, borderRadius: 12, marginTop: 6 }} />}</label>)}
              {tab === 'banners' && (<>
                <label>Texto del botón<input className="input" value={form.cta_text || ''} onChange={(e) => setForm({ ...form, cta_text: e.target.value })} placeholder="Ver tienda" /></label>
                <label>Enlace del botón<input className="input" value={form.cta_link || ''} onChange={(e) => setForm({ ...form, cta_link: e.target.value })} placeholder="/tienda" /></label>
              </>)}
              {tab === 'products' && (
                <label>Video (URL YouTube/TikTok, opcional)<input className="input" value={form.video_url || ''} onChange={(e) => setForm({ ...form, video_url: e.target.value })} placeholder="https://..." /></label>)}
              {tab === 'videos' && (
                <label>URL del video*<input className="input" value={form.url || ''} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="Pega link YouTube/TikTok..." required /></label>)}
              {tab === 'products' && (
                <label><input type="checkbox" checked={!!form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked ? 1 : 0 })} /> Destacado en inicio</label>)}
            </AdminSection>
          )}
          {tab === 'testimonials' && (
            <AdminSection title="Calificación" emoji="⭐">
              <label>Estrellas (1-5)<input className="input" type="number" inputMode="numeric" min="1" max="5" value={form.rating || 5} onChange={(e) => setForm({ ...form, rating: e.target.value })} /></label>
            </AdminSection>
          )}
          <div className="admin-savebar">
            <button className="btn btn-verde">{editing ? 'Actualizar 🌿' : 'Publicar ✨'}</button>
            <button type="button" className="btn btn-ghost" onClick={closeModal}>Cancelar</button>
          </div>
        </form>
        </AdminModal>
        )}
        <AdminSearch value={filter} onChange={setFilter} total={visible.length} />
        <div className="table-wrap"><table className="table admin-table" style={{ marginTop: '1rem' }}>
          <thead><tr><th>Ítem</th><th style={{ width: 110 }}>Acciones</th></tr></thead>
          <tbody>{visible.map((r) => (
            <tr key={r.id}><td>{rowLabel(r)}</td>
              <td><div className="row-actions">
                <button className="icon-btn" title="Editar" onClick={() => startEdit(r)}>✏️</button>
                <button className="icon-btn danger" title="Eliminar" onClick={() => del(r.id, rowLabel(r))}>🗑️</button>
              </div></td></tr>))}
          </tbody>
        </table></div>
        <AdminCards tab={tab} rows={visible} onEdit={startEdit} onDel={del} />
      </div>
    </AdminLayout>
  );
}

function Sidebar({ tab }) {
  const [counts, setCounts] = useState({});
  useEffect(() => {
    let alive = true;
    const jobs = [
      ['products', '/api/products'], ['banners', '/api/banners'],
      ['categories', '/api/categories'], ['offers', '/api/offers'],
      ['videos', '/api/videos'], ['testimonials', '/api/testimonials'],
      ['orders', '/api/orders']
    ];
    Promise.all(jobs.map(([k, p]) => api.get(p)
      .then((r) => [k, Array.isArray(r) ? r.length : null])
      .catch(() => [k, null])))
      .then((es) => alive && setCounts(Object.fromEntries(es)));
    return () => { alive = false; };
  }, []);
  return (
    <aside className="sidebar">
      <Link to="/admin?tab=dashboard" className={`side-home${tab === 'dashboard' ? ' active' : ''}`}>
        <span className="side-emoji" aria-hidden>🏠</span>
        <span><strong>Inicio</strong><small>Resumen del panel</small></span>
      </Link>
      {NAV_GROUPS.map((g) => (
        <section key={g.id} className="side-group" aria-label={g.label}>
          <small className="side-group-label">{g.emoji} {g.label}</small>
          <div className="side-items">
            {g.items.map((it) => (
              <Link key={it.key} to={`/admin?tab=${it.key}`} className={`side-item${tab === it.key ? ' active' : ''}`}>
                <span className="side-emoji" aria-hidden>{it.emoji}</span>
                <span className="side-text"><strong>{it.label}</strong><small>{it.desc}</small></span>
                {counts[it.key] != null && <span className="side-count">{counts[it.key]}</span>}
              </Link>
            ))}
          </div>
        </section>
      ))}
    </aside>
  );
}
