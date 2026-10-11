import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import './styles/calma.css';
import { CartProvider } from './store/cart.jsx';
import { NoticeProvider } from './store/notice.jsx';
import { Header, Footer, CartToast, MiniCartBar, RevealManager } from './components/ui.jsx';
import { Home } from './pages/Home.jsx';
import { Shop, ProductDetail, Offers, Videos, Static, Cart } from './pages/Shop.jsx';
import { Admin, AdminLogin } from './pages/Admin.jsx';
import { api } from './api/client.js';
import { FALLBACK_CONFIG } from './data/fallback.js';

function RequireAuth() {
  // Se evalúa en cada navegación: si hay token muestra el panel,
  // si no redirige al login. Así el login recién hecho entra al instante.
  const [token, setToken] = useState(() => localStorage.getItem('naty_token'));
  useEffect(() => {
    const sync = () => setToken(localStorage.getItem('naty_token'));
    window.addEventListener('storage', sync);
    window.addEventListener('focus', sync);
    return () => { window.removeEventListener('storage', sync); window.removeEventListener('focus', sync); };
  }, []);
  return token ? <Admin /> : <Navigate to="/admin/login" replace />;
}

function Shell() {
  const [config, setConfig] = useState(FALLBACK_CONFIG);
  const { pathname } = useLocation();
  const isAdmin = pathname.startsWith('/admin');
  useEffect(() => { api.get('/api/config/public').then((c) => c?.announcement_text ? setConfig(c) : null).catch(() => {}); }, []);
  useEffect(() => {
    const icon = document.querySelector("link[rel='icon']");
    if (icon && config?.logo) icon.href = config.logo;
    document.title = 'Jabones Artesanales Naty 🌿';
  }, [config?.logo]);
  return (
    <div className={`app-shell${isAdmin ? ' app-admin' : ''}`}>
      {!isAdmin && <Header config={config} />}
      <Routes>
        <Route path="/" element={<Home config={config} />} />
        <Route path="/tienda" element={<Shop config={config} />} />
        <Route path="/producto/:slug" element={<ProductDetail config={config} />} />
        <Route path="/ofertas" element={<Offers />} />
        <Route path="/videos" element={<Videos />} />
        <Route path="/nosotros" element={<Static kind="nosotros" config={config} />} />
        <Route path="/contacto" element={<Static kind="contacto" config={config} />} />
        <Route path="/carrito" element={<Cart config={config} />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<RequireAuth />} />
      </Routes>
      {!isAdmin && <Footer config={config} />}
      {!isAdmin && <CartToast config={config} />}
      {!isAdmin && <MiniCartBar config={config} />}
    </div>
  );
}

export default function App() {
  return (
    <CartProvider>
      <BrowserRouter>
        <NoticeProvider>
          <RevealManager />
          <Shell />
        </NoticeProvider>
      </BrowserRouter>
    </CartProvider>
  );
}
