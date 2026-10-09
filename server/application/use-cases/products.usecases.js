// Casos de uso (Application): solo negocio, reciben repos por parámetro (D de SOLID).
export const ListFeaturedProducts = (repo) => ({ execute: (f) => repo.list(f) });
export const CreateProduct = (repo) => ({
  execute: (d) => {
    if (!d.name || d.price == null) throw Object.assign(new Error('Nombre y precio son obligatorios'), { status: 400 });
    if (Number(d.price) < 0) throw Object.assign(new Error('Precio inválido'), { status: 400 });
    return repo.create(d);
  }
});
// Strategy para promos extensible (O de SOLID): agregar tipo sin modificar las anteriores.
export const OfferStrategies = {
  porcentaje: (total, o) => total * (1 - (Number(o.value) || 0) / 100),
  cupon: (total, o, coupon) => (o.coupon_code && coupon === o.coupon_code ? total * 0.9 : total),
  pack_3x2: (total) => total
};
