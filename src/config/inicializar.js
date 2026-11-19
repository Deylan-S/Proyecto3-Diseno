// Aqui se crean y se conectan las piezas principales una sola vez.
// Los controladores importan checkout y publicador desde este archivo.
const Database = require('./Database');
const { cargarDatosIniciales, crearOrdenesDemo } = require('./seed');
const PublicadorEventos = require('../patrones/observer/PublicadorEventos');
const EVENTOS = require('../patrones/observer/tiposEvento');
const NotificadorEmail = require('../patrones/observer/observadores/NotificadorEmail');
const NotificadorSMS = require('../patrones/observer/observadores/NotificadorSMS');
const ObservadorInventario = require('../patrones/observer/observadores/ObservadorInventario');
const RegistroAuditoria = require('../patrones/observer/observadores/RegistroAuditoria');
const { CheckoutFacade } = require('../patrones/facade/CheckoutFacade');

const db = Database.getInstance();

// Observer: se registran los observadores en el publicador
const publicador = new PublicadorEventos();
const email = new NotificadorEmail(db);
const sms = new NotificadorSMS(db);
const inventario = new ObservadorInventario(db);

publicador.suscribir(EVENTOS.ORDEN_CREADA, email);
publicador.suscribir(EVENTOS.PAGO_RETENIDO, email);
publicador.suscribir(EVENTOS.ORDEN_DESPACHADA, email);
publicador.suscribir(EVENTOS.ORDEN_ENTREGADA, email);
publicador.suscribir(EVENTOS.PAGO_LIQUIDADO, email);
publicador.suscribir(EVENTOS.ORDEN_CANCELADA, email);
publicador.suscribir(EVENTOS.RESENA_PUBLICADA, email);

publicador.suscribir(EVENTOS.PAGO_RETENIDO, sms);
publicador.suscribir(EVENTOS.ORDEN_DESPACHADA, sms);

publicador.suscribir(EVENTOS.ORDEN_CREADA, inventario);
publicador.suscribir(EVENTOS.ORDEN_CANCELADA, inventario);

publicador.suscribir(EVENTOS.TODOS, new RegistroAuditoria(db));

// Facade: el checkout coordina pagos, envios, precios y ordenes
const checkout = new CheckoutFacade(db, publicador);

// datos de prueba (productos, usuarios y algunas ordenes)
if (db.usuarios.length === 0) {
  cargarDatosIniciales(db);
  crearOrdenesDemo(db, checkout);
}

module.exports = { db, publicador, checkout };
