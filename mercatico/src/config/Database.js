// Patron Singleton: una sola base de datos en memoria para todo
// Los datos se pierden cuando se apaga el servidor

class Database {
  static instancia = null;

  constructor() {
    if (Database.instancia) {
      throw new Error('Database es un Singleton, use Database.getInstance()');
    }
    this.usuarios = [];
    this.productos = [];
    this.categorias = [];
    this.ordenes = [];
    this.notificaciones = [];
    this.auditoria = [];
    this.resenas = [];
    this.cupones = {};
    this.contadores = { orden: 1000, compra: 500, notificacion: 0, usuario: 100, producto: 100, resena: 0 };
  }

  static getInstance() {
    if (!Database.instancia) {
      Database.instancia = new Database();
    }
    return Database.instancia;
  }

  // genera ids como u101, p101, r1...
  siguienteId(tipo, prefijo) {
    this.contadores[tipo]++;
    return prefijo + this.contadores[tipo];
  }

  // ----- usuarios -----
  buscarUsuario(id) {
    return this.usuarios.find((u) => u.id === id) || null;
  }

  buscarUsuarioPorEmail(email) {
    const correo = String(email || '').trim().toLowerCase();
    return this.usuarios.find((u) => u.email === correo) || null;
  }

  agregarUsuario(usuario) {
    this.usuarios.push(usuario);
    return usuario;
  }

  // devuelve { idVendedor: tienda } para mostrar el nombre de la tienda en las vistas
  obtenerTiendas() {
    const tiendas = {};
    for (const u of this.usuarios) {
      if (u.tienda) tiendas[u.id] = u.tienda;
    }
    return tiendas;
  }

  // ----- productos -----
  buscarProducto(id) {
    return this.productos.find((p) => p.id === id) || null;
  }

  productosDeVendedor(vendedorId) {
    return this.productos.filter((p) => p.vendedorId === vendedorId);
  }

  // ----- ordenes -----
  siguienteCodigoOrden() {
    this.contadores.orden++;
    return { id: String(this.contadores.orden), codigo: 'MT-' + this.contadores.orden };
  }

  siguienteCompra() {
    this.contadores.compra++;
    return 'C-' + this.contadores.compra;
  }

  guardarOrden(orden) {
    this.ordenes.unshift(orden); // la mas reciente de primero
    return orden;
  }

  buscarOrden(id) {
    return this.ordenes.find((o) => o.id === id) || null;
  }

  ordenesDeComprador(usuarioId) {
    return this.ordenes.filter((o) => o.compradorId === usuarioId);
  }

  ordenesDeVendedor(vendedorId) {
    return this.ordenes.filter((o) => o.vendedorId === vendedorId);
  }

  ordenesDeCompra(compraId) {
    return this.ordenes.filter((o) => o.compraId === compraId);
  }

  // ----- notificaciones -----
  agregarNotificacion({ usuarioId, canal, asunto, mensaje, ordenId }) {
    this.contadores.notificacion++;
    const notificacion = {
      id: this.contadores.notificacion,
      usuarioId,
      canal,
      asunto,
      mensaje,
      ordenId,
      fecha: new Date(),
      leida: false,
    };
    this.notificaciones.unshift(notificacion);
    return notificacion;
  }

  notificacionesDe(usuarioId) {
    return this.notificaciones.filter((n) => n.usuarioId === usuarioId);
  }

  // ----- reseñas -----
  agregarResena(resena) {
    this.resenas.unshift(resena);
    return resena;
  }

  resenasDeProducto(productoId) {
    return this.resenas.filter((r) => r.productoId === productoId);
  }

  resenaDe(ordenId, productoId) {
    return this.resenas.find((r) => r.ordenId === ordenId && r.productoId === productoId) || null;
  }

  // promedio de estrellas de un producto o de varios
  calificacionDe(productoIds) {
    const ids = Array.isArray(productoIds) ? productoIds : [productoIds];
    const lista = this.resenas.filter((r) => ids.includes(r.productoId));
    if (lista.length === 0) return { promedio: 0, cantidad: 0 };

    let suma = 0;
    for (const r of lista) suma += r.calificacion;
    return { promedio: Math.round((suma / lista.length) * 10) / 10, cantidad: lista.length };
  }

  // ----- cupones -----
  buscarCupon(codigo) {
    return this.cupones[String(codigo || '').trim().toUpperCase()] || null;
  }
}

module.exports = Database;
