// Catálogo demo local: la web SIEMPRE muestra información aunque el backend
// esté apagado. Cuando el backend responde, se reemplaza por datos reales (/admin).
export const FALLBACK_CONFIG = {
  logo: '/logo.jpg',
  whatsapp: '',
  instagram: '',
  tiktok: '',
  facebook: '',
  announcement_text: 'Envíos con amor — Jabones 100% artesanales',
  announcement_enabled: 1,
  about_text: 'Naty elabora jabones a mano, en lotes pequeños, sin químicos dañinos, para cuidar tu piel, tus mascotas y el planeta.',
  schedule: 'Lun–Sáb 9am–7pm',
  address: '',
  currency_code: 'COP',
  currency_symbol: '$'
};

export const FALLBACK_CATEGORIES = [
  { id: 'c1', name: 'Corporales', slug: 'corporales', description: 'Cuidado diario con aceites nobles', image: '/logo.jpg' },
  { id: 'c2', name: 'Faciales', slug: 'faciales', description: 'Suavidad y calma para tu rostro', image: '/logo.jpg' },
  { id: 'c3', name: 'Mascotas', slug: 'mascotas', description: 'Línea suave para tus peluditos', image: '/logo.jpg' },
  { id: 'c4', name: 'Packs', slug: 'packs', description: 'Regala rituales completos', image: '/logo.jpg' }
];

export const FALLBACK_PRODUCTS = [
  { id: 'p1', name: 'Jabón Lavanda Calma', slug: 'jabon-lavanda-calma', price: 18000, offer_price: 15000, stock: 12, ingredients: 'lavanda, aceite de oliva, manteca de karité', benefits: 'Relaja y suaviza la piel', how_to_use: 'Uso diario corporal. Humedece, enjabona con calma, enjuaga.', image: '/logo.jpg', images: ['/logo.jpg'], video_url: '', featured: 1, category_slug: 'corporales' },
  { id: 'p2', name: 'Jabón Avena Miel', slug: 'jabon-avena-miel', price: 16000, offer_price: null, stock: 8, ingredients: 'avena, miel, caléndula', benefits: 'Nutre pieles sensibles', how_to_use: 'Rostro y cuerpo, uso diario.', image: '/logo.jpg', images: ['/logo.jpg'], video_url: '', featured: 1, category_slug: 'faciales' },
  { id: 'p3', name: 'Jabón Carbón Detox', slug: 'jabon-carbon-detox', price: 19000, offer_price: null, stock: 5, ingredients: 'carbón activado, tea tree', benefits: 'Limpieza profunda y suave', how_to_use: '2-3 veces por semana.', image: '/logo.jpg', images: ['/logo.jpg'], video_url: '', featured: 1, category_slug: 'corporales' },
  { id: 'p4', name: 'Jabón Manzanilla Bebé', slug: 'jabon-manzanilla-bebe', price: 17000, offer_price: null, stock: 10, ingredients: 'manzanilla, avena coloidal', benefits: 'Hipoalergénico, pieles delicadas', how_to_use: 'Pieles delicadas y de bebé.', image: '/logo.jpg', images: ['/logo.jpg'], video_url: '', featured: 1, category_slug: 'mascotas' }
];

export const FALLBACK_BANNERS = [
  { id: 'b1', title: 'Paz para tu piel, amor en cada jabón', subtitle: 'Lavanda, avena y manzanilla. Hecho a mano, sin químicos dañinos.', cta_text: 'Ver tienda', cta_link: '/tienda', image: '/logo.jpg' }
];

export const FALLBACK_OFFERS = [
  { id: 'o1', title: 'Bienvenida Naty 10%', description: 'En tu primera canasta por WhatsApp', type: 'cupon', coupon_code: 'NATY10' }
];

export const FALLBACK_VIDEOS = [
  { id: 'v1', title: 'Cómo usamos el jabón de lavanda', url: 'https://www.youtube.com/embed/dQw4w9WgXcQ' }
];

export const FALLBACK_TESTIMONIALS = [
  { id: 't1', author: 'María 🌸', content: 'Mi piel respira paz desde que uso Naty. El de avena es mi ritual.' }
];
