// Capa Domain: contratos. Los casos de uso dependen de ESTO (D de SOLID),
// nunca del sqlite/postgres concreto. Cambiar de BD = nuevo adaptador.
export class IProductRepository {
  list() { throw new Error('not implemented'); }
  getBySlug() { throw new Error('not implemented'); }
  create() { throw new Error('not implemented'); }
  update() { throw new Error('not implemented'); }
  remove() { throw new Error('not implemented'); }
}
export class IGenericRepository {
  list() { throw new Error('not implemented'); }
  create() { throw new Error('not implemented'); }
  update() { throw new Error('not implemented'); }
  remove() { throw new Error('not implemented'); }
}
export class IStorageService {
  save() { throw new Error('not implemented'); }
  urlFor() { throw new Error('not implemented'); }
}
