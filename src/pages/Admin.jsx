import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams, Navigate } from 'react-router-dom';
import { api } from '../api/client.js';

const TABS = [
  ['dashboard', '🏠 Inicio'],
  ['banners', '🖼️ Banners'],
  ['categories', '🌼 Categorías'],
  ['products', '🧼 Productos'],
  ['offers', '✨ Ofertas'],
  ['videos', '🎥 Videos'],
  ['testimonials', '💌 Testimonios'],
  ['orders', '🛒 Pedidos WA'],
  ['settings', '⚙️ Ajustes/Redes']
];

export function AdminLogin() {
  const [email, setEmail] = useState('admin@naty.pe');
  const [password, setPassword] = useState('');
  const nav = useNavigate();
  const [busy, setBusy] = useState(false);
  if (localStorage.getItem('naty_token')) return <Navigate to="/admin?tab=dashboard" replace />;
  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      const r = await api.post('/api/auth/login', { email, password });
      localStorage.setItem('naty_token', r.token);
      nav('/admin?tab=dashboard', { replace: true });
    } catch { alert('Credenciales inválidas. Usa el seed: admin@naty.pe / naty123'); }
    finally { setBusy(false); }
  };
  return (
    <main className="container" style={{ maxWidth: 440, paddingTop: '3rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
        <img src="/logo.jpg" alt="Naty" style={{ width: 84, height: 84, borderRadius: '50%', objectFit: 'cover', boxShadow: 'var(--sombra)' }} />
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

async function handleImage(e, setForm, form) {
  const file = e.target.files?.[0];
  if (!file) return;
  const r = await api.upload(file);
  setForm({ ...form, image: r.url });
  alert('Imagen subida con éxito 🌸');
}

function prettyItems(raw) {
  try {
    const arr = JSON.parse(raw || '[]');
    if (!Array.isArray(arr) || arr.length === 0) return '—';
    return arr.map((i) => `${i.name} x${i.qty}`).join(', ');
  } catch { return raw || '—'; }
}

const TAB_TITLES = {
  dashboard: '🏠 Inicio',
  banners: '🖼️ Banners',
  categories: '🌼 Categorías',
  products: '🧼 Productos',
  offers: '✨ Ofertas',
  videos: '🎥 Videos',
  testimonials: '💌 Testimonios',
  orders: '🛒 Pedidos WhatsApp',
  settings: '⚙️ Ajustes y redes'
};

function logout() {
  if (!confirm('¿Cerrar sesión del panel? 🌿')) return;
  localStorage.removeItem('naty_token');
  window.location.href = '/admin/login';
}

function AdminLayout({ tab, children }) {
  return (
    <main className="container admin-page">
      <div className="admin-topbar">
        <Link to="/admin?tab=dashboard" className="admin-brand">
          <img src="/logo.jpg" alt="Naty" />
          <div><strong>Panel Naty 🌿</strong><small>{TAB_TITLES[tab] || ''}</small></div>
        </Link>
        <div className="admin-top-actions">
          <Link className="btn btn-ghost btn-small" to="/">← Ver tienda</Link>
          <button className="btn btn-danger btn-small" onClick={logout}>Salir ⎋</button>
        </div>
      </div>
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
  const [rows, load] = useCrud(tab === 'dashboard' || tab === 'settings' || tab === 'orders' ? 'products' : tab);
  const [form, setForm] = useState({});
  const [editing, setEditing] = useState(null);
  const [orders, setOrders] = useState([]);
  const [settings, setSettings] = useState(null);
  const [allCats, setAllCats] = useState([]);
  useEffect(() => {
    if (tab === 'orders') api.get('/api/orders').then(setOrders).catch(() => {});
    if (tab === 'settings') api.get('/api/config').then(setSettings).catch(() => {});
    if (tab === 'products') api.get('/api/categories').then(setAllCats).catch(() => {});
  }, [tab]);

  const save = async (e) => {
    e.preventDefault();
    try {
      if (tab === 'settings') { await api.put('/api/config', settings); alert('Ajustes guardados 🌿'); return; }
      if (editing) await api.put(`/api/${tab}/${editing}`, form);
      else await api.post(`/api/${tab}`, form);
      setForm({}); setEditing(null); load();
      alert('Guardado con éxito ✨');
    } catch (err) { alert('Revisa los campos: ' + err.message); }
  };
  const del = async (id) => {
    if (!confirm('¿Eliminar? Respira antes de confirmar 🍃')) return;
    await api.del(`/api/${tab}/${id}`); load();
  };

  if (tab === 'settings') return (
    <AdminLayout tab={tab}>
      <div><h1>⚙️ Ajustes y redes</h1>
        {settings && (
          <form onSubmit={save} className="form-grid">
            {[['whatsapp', 'WhatsApp (solo números, ej: 573001234567)'], ['instagram', 'Instagram URL'], ['tiktok', 'TikTok URL'], ['facebook', 'Facebook URL'], ['announcement_text', 'Texto barra superior'], ['about_text', 'Texto Nosotros'], ['schedule', 'Horario'], ['address', 'Dirección'], ['currency_code', 'Moneda (ej: COP, PEN, MXN, USD)'], ['currency_symbol', 'Símbolo moneda (ej: $, S/)']].map(([k, label]) => (
              <label key={k}>{label}<input className="input" value={settings[k] || ''} onChange={(e) => setSettings({ ...settings, [k]: e.target.value })} placeholder={k === 'currency_code' ? 'COP' : k === 'currency_symbol' ? '$' : ''} /></label>
            ))}
            <small style={{ opacity: .7 }}>Por defecto: COP $ pesos colombianos. Si vendes en soles usa PEN y S/.</small>
            <label><input type="checkbox" checked={settings.announcement_enabled === 1} onChange={(e) => setSettings({ ...settings, announcement_enabled: e.target.checked ? 1 : 0 })} /> Mostrar barra anuncio</label>
            <button className="btn btn-verde">Guardar 🌿</button>
          </form>)}
      </div>
    </AdminLayout>);

  if (tab === 'orders') return (
    <AdminLayout tab={tab}>
      <div><h1>🛒 Pedidos por WhatsApp</h1>
        <div className="table-wrap"><table className="table"><thead><tr><th>Fecha</th><th>Cliente</th><th>Total</th><th>Detalle</th></tr></thead>
          <tbody>{orders.map((o) => <tr key={o.id}><td>{o.created_at}</td><td>{o.customer_name}</td><td>$ {o.total}</td><td>{prettyItems(o.items)}</td></tr>)}</tbody>
        </table></div>
        {orders.length === 0 && <p className="admin-hint">Aún no hay pedidos. Cuando alguien finalice por WhatsApp aparecerán aquí 🍃</p>}
      </div>
    </AdminLayout>);

  if (tab === 'dashboard') return (
    <AdminLayout tab={tab}>
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

  return (
    <AdminLayout tab={tab}>
      <div>
        <h1 style={{ textTransform: 'capitalize' }}>{tab} ✨</h1>
        <form onSubmit={save} className="form-grid">
          {(tab === 'products' || tab === 'categories') && (
            <label>Nombre*<input className="input" value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></label>)}
          {(tab === 'banners' || tab === 'offers' || tab === 'videos') && (
            <label>Título*<input className="input" value={form.title || ''} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></label>)}
          {tab === 'testimonials' && (
            <label>Autor / cliente*<input className="input" value={form.author || ''} onChange={(e) => setForm({ ...form, author: e.target.value })} placeholder="Ej: María 🌸" required /></label>)}
          {(tab === 'products' || tab === 'categories' || tab === 'banners') && (
            <label>Foto<input type="file" accept="image/*" onChange={(e) => handleImage(e, setForm, form)} />{form.image && <img src={form.image} alt="" style={{ width: 120, borderRadius: 12, marginTop: 6 }} />}</label>)}
          {tab === 'products' && (<>
            <label>Categoría<select className="select" value={form.category_id || ''} onChange={(e) => setForm({ ...form, category_id: e.target.value || null })}>
              <option value="">Sin categoría</option>
              {allCats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select></label>
            <label>Precio (en tu moneda administrable)*<input className="input" type="number" step="0.01" value={form.price || ''} onChange={(e) => setForm({ ...form, price: e.target.value })} required /></label>
            <label>Precio oferta (opcional)<input className="input" type="number" step="0.01" value={form.offer_price || ''} onChange={(e) => setForm({ ...form, offer_price: e.target.value })} /></label>
            <label>Stock<input className="input" type="number" value={form.stock || ''} onChange={(e) => setForm({ ...form, stock: e.target.value })} /></label>
            <label>Ingredientes<textarea className="textarea" value={form.ingredients || ''} onChange={(e) => setForm({ ...form, ingredients: e.target.value })} placeholder="avena, lavanda, aceite de oliva..." /></label>
            <label>Beneficios<textarea className="textarea" value={form.benefits || ''} onChange={(e) => setForm({ ...form, benefits: e.target.value })} /></label>
            <label>Modo de uso<textarea className="textarea" value={form.how_to_use || ''} onChange={(e) => setForm({ ...form, how_to_use: e.target.value })} placeholder="Humedece, enjabona con calma, enjuaga..." /></label>
            <label>Video (URL YouTube/TikTok, opcional)<input className="input" value={form.video_url || ''} onChange={(e) => setForm({ ...form, video_url: e.target.value })} placeholder="https://..." /></label>
            <label><input type="checkbox" checked={!!form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked ? 1 : 0 })} /> Destacado en inicio</label>
          </>)}
          {tab === 'categories' && (
            <label>Descripción<textarea className="textarea" value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Cuidado diario con aceites nobles..." /></label>)}
          {tab === 'banners' && (<>
            <label>Subtítulo<textarea className="textarea" value={form.subtitle || ''} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} placeholder="Lavanda, avena y manzanilla..." /></label>
            <label>Texto del botón<input className="input" value={form.cta_text || ''} onChange={(e) => setForm({ ...form, cta_text: e.target.value })} placeholder="Ver tienda" /></label>
            <label>Enlace del botón<input className="input" value={form.cta_link || ''} onChange={(e) => setForm({ ...form, cta_link: e.target.value })} placeholder="/tienda" /></label>
          </>)}
          {tab === 'offers' && (<>
            <label>Descripción<textarea className="textarea" value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="En tu primera canasta..." /></label>
            <label>Tipo<select className="select" value={form.type || 'cupon'} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              <option value="cupon">Cupón</option>
              <option value="porcentaje">Porcentaje</option>
              <option value="pack_3x2">Pack 3x2</option>
            </select></label>
            <label>Cupón<input className="input" value={form.coupon_code || ''} onChange={(e) => setForm({ ...form, coupon_code: e.target.value })} placeholder="NATY10 (opcional)" /></label>
          </>)}
          {tab === 'videos' && (
            <label>URL del video*<input className="input" value={form.url || ''} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="Pega link YouTube/TikTok..." required /></label>)}
          {tab === 'testimonials' && (<>
            <label>Testimonio*<textarea className="textarea" value={form.content || ''} onChange={(e) => setForm({ ...form, content: e.target.value })} placeholder="Mi piel respira paz desde que uso Naty..." required /></label>
            <label>Estrellas (1-5)<input className="input" type="number" min="1" max="5" value={form.rating || 5} onChange={(e) => setForm({ ...form, rating: e.target.value })} /></label>
          </>)}
          <div style={{ display: 'flex', gap: '.6rem', flexWrap: 'wrap' }}>
            <button className="btn btn-verde">{editing ? 'Actualizar 🌿' : 'Publicar ✨'}</button>
            {editing && <button type="button" className="btn btn-ghost" onClick={() => { setEditing(null); setForm({}); }}>Cancelar</button>}
          </div>
        </form>
        <div className="table-wrap"><table className="table admin-table" style={{ marginTop: '1rem' }}>
          <thead><tr><th>Ítem</th><th style={{ width: 110 }}>Acciones</th></tr></thead>
          <tbody>{rows.map((r) => (
            <tr key={r.id}><td>{r.name || r.title || (r.author ? `${r.author} — ${(r.content || '').slice(0, 60)}` : r.url)}</td>
              <td><div className="row-actions">
                <button className="icon-btn" title="Editar" onClick={() => { setEditing(r.id); setForm(r); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>✏️</button>
                <button className="icon-btn danger" title="Eliminar" onClick={() => del(r.id)}>🗑️</button>
              </div></td></tr>))}
          </tbody>
        </table></div>
      </div>
    </AdminLayout>
  );
}

function Sidebar({ tab }) {
  return (
    <aside className="sidebar">
      <small className="sidebar-label">Gestionar</small>
      {TABS.map(([k, label]) => <Link key={k} to={`/admin?tab=${k}`} className={tab === k ? 'active' : ''}>{label}</Link>)}
    </aside>
  );
}
