const Usuario = require('../models/Usuario');
const Producto = require('../models/Producto');
const Carrito = require('../models/Carrito');

// Datos de prueba: usuarios, productos y cupones.
// Los precios van sin IVA y en multiplos de 100 para que el IVA de exacto.
function cargarDatosIniciales(db) {
  db.usuarios.push(
    new Usuario({ id: 'u1', nombre: 'María Rodríguez Mora', email: 'comprador@mercatico.cr', password: 'demo1234', rol: 'comprador', telefono: '8888-1234' }),
    new Usuario({
      id: 'v1', nombre: 'José Pablo Vargas', email: 'cafe@mercatico.cr', password: 'demo1234', rol: 'vendedor', telefono: '8701-2233',
      tienda: { nombre: 'Café Los Santos', ubicacion: 'Tarrazú, San José', descripcion: 'Café de altura tostado en finca.' },
    }),
    new Usuario({
      id: 'v2', nombre: 'Ana Lucía Brenes', email: 'cacao@mercatico.cr', password: 'demo1234', rol: 'vendedor', telefono: '8455-9012',
      tienda: { nombre: 'Cacao Talamanca', ubicacion: 'Talamanca, Limón', descripcion: 'Cacao orgánico de pequeños productores.' },
    }),
    new Usuario({
      id: 'v3', nombre: 'Carlos Rojas Alfaro', email: 'artesania@mercatico.cr', password: 'demo1234', rol: 'vendedor', telefono: '8320-7788',
      tienda: { nombre: 'Artesanías Sarchí', ubicacion: 'Sarchí, Alajuela', descripcion: 'Artesanía tradicional pintada a mano.' },
    }),
    new Usuario({
      id: 'v4', nombre: 'Keisha Brown Campbell', email: 'caribe@mercatico.cr', password: 'demo1234', rol: 'vendedor', telefono: '8612-4455',
      tienda: { nombre: 'Huerta Caribeña', ubicacion: 'Puerto Viejo, Limón', descripcion: 'Sabores y tejidos del Caribe costarricense.' },
    }),
    new Usuario({ id: 'a1', nombre: 'Administración MercaTico', email: 'admin@mercatico.cr', password: 'admin1234', rol: 'admin', telefono: '2222-0000' }),
  );

  db.categorias.push('Café', 'Cacao y chocolate', 'Artesanía', 'Hogar', 'Alimentos', 'Textiles');

  const productos = [
    { id: 'p1', nombre: 'Café de Tarrazú tostado medio, 340 g', categoria: 'Café', vendedorId: 'v1', precioBase: 5000, stock: 25, pesoKg: 0.4, imagen: 'cafe.svg', destacado: true,
      descripcion: 'Grano entero de altura (1 600 m), notas a chocolate y cítricos. Tostado la semana del envío.' },
    { id: 'p2', nombre: 'Café molido de Dota, tueste oscuro, 500 g', categoria: 'Café', vendedorId: 'v1', precioBase: 6800, stock: 18, pesoKg: 0.55, imagen: 'cafe.svg',
      descripcion: 'Molienda media, ideal para chorreador o cafetera de goteo. Cuerpo intenso y poca acidez.' },
    { id: 'p3', nombre: 'Chorreador de madera con bolsita de tela', categoria: 'Hogar', vendedorId: 'v1', precioBase: 7900, stock: 4, pesoKg: 1.2, imagen: 'hogar.svg', destacado: true,
      descripcion: 'El clásico chorreador costarricense, hecho en madera de guanacaste. Incluye dos bolsitas de tela.' },
    { id: 'p4', nombre: 'Chocolate 70 % cacao de Talamanca, 100 g', categoria: 'Cacao y chocolate', vendedorId: 'v2', precioBase: 2900, stock: 40, pesoKg: 0.12, imagen: 'cacao.svg', destacado: true,
      descripcion: 'Barra artesanal de cacao orgánico cultivado por familias bribris. Sin lecitina ni saborizantes.' },
    { id: 'p5', nombre: 'Nibs de cacao orgánico, 250 g', categoria: 'Cacao y chocolate', vendedorId: 'v2', precioBase: 4200, stock: 12, pesoKg: 0.3, imagen: 'cacao.svg',
      descripcion: 'Trocitos de cacao tostado para batidos, repostería o granola.' },
    { id: 'p6', nombre: 'Kit para hacer chocolate en casa', categoria: 'Cacao y chocolate', vendedorId: 'v2', precioBase: 12500, stock: 0, pesoKg: 1, imagen: 'cacao.svg',
      descripcion: 'Incluye cacao en grano, azúcar de caña, moldes y una guía paso a paso.' },
    { id: 'p7', nombre: 'Carreta típica miniatura pintada a mano', categoria: 'Artesanía', vendedorId: 'v3', precioBase: 15000, stock: 6, pesoKg: 1.5, imagen: 'artesania.svg', destacado: true,
      descripcion: 'Réplica de 30 cm de la carreta de Sarchí, patrimonio de Costa Rica. Cada pieza es única.' },
    { id: 'p8', nombre: 'Juego de 4 posavasos de madera de teca', categoria: 'Artesanía', vendedorId: 'v3', precioBase: 6400, stock: 15, pesoKg: 0.5, imagen: 'artesania.svg',
      descripcion: 'Posavasos con diseño de mandala grabado, sellados para resistir la humedad.' },
    { id: 'p9', nombre: 'Hamaca de algodón tejida a mano', categoria: 'Hogar', vendedorId: 'v3', precioBase: 28000, stock: 3, pesoKg: 2.5, imagen: 'hogar.svg',
      descripcion: 'Hamaca de 2 m para una persona, con cuerdas reforzadas. Colores tierra.' },
    { id: 'p10', nombre: 'Salsa picante caribeña de chile panameño, 150 ml', categoria: 'Alimentos', vendedorId: 'v4', precioBase: 3200, stock: 30, pesoKg: 0.3, imagen: 'alimentos.svg', destacado: true,
      descripcion: 'Receta tradicional de Limón con chile panameño, mango y vinagre de coco.' },
    { id: 'p11', nombre: 'Aceite de coco virgen, 500 ml', categoria: 'Alimentos', vendedorId: 'v4', precioBase: 5800, stock: 20, pesoKg: 0.6, imagen: 'alimentos.svg',
      descripcion: 'Prensado en frío en el Caribe sur. Para cocinar o para el cuidado de la piel.' },
    { id: 'p12', nombre: 'Bolso tejido en fibra natural', categoria: 'Textiles', vendedorId: 'v4', precioBase: 9900, stock: 8, pesoKg: 0.4, imagen: 'textiles.svg',
      descripcion: 'Bolso de mano tejido por artesanas de Limón. Asa reforzada y forro de tela.' },
  ];

  productos.forEach((datos) => db.productos.push(new Producto({ ...datos, alt: Producto.ALT_POR_IMAGEN[datos.imagen] })));

  db.cupones.PURAVIDA = { codigo: 'PURAVIDA', porcentaje: 10 };
  db.cupones.BIENVENIDA = { codigo: 'BIENVENIDA', porcentaje: 15 };
}

// Crea unas ordenes de ejemplo para que los paneles no esten vacios.
// Usan la misma fachada que una compra normal.
function crearOrdenesDemo(db, checkout) {
  const comprador = db.buscarUsuario('u1');
  const direccion = {
    nombre: 'María Rodríguez Mora', telefono: '8888-1234', provincia: 'Limón', canton: 'Limón', distrito: 'Limón',
    senas: 'Barrio Roosevelt, 100 m norte del parque Vargas, casa verde.',
  };
  const tarjeta = { titular: 'MARIA RODRIGUEZ', numeroTarjeta: '4111 1111 1111 1111', vencimiento: '12/29', cvv: '123' };

  const comprar = (lineas, extra) => {
    const carrito = new Carrito([]);
    lineas.forEach(([id, cantidad]) => carrito.agregar(id, cantidad));
    return checkout.realizarCompra({ usuario: comprador, carrito, direccion, metodoEnvio: 'correos', cupon: '', ...extra });
  };

  // 1) Compra completada: pagada, despachada, entregada y liquidada.
  const completa = comprar([['p7', 1]], { metodoPago: 'tarjeta', datosPago: tarjeta });
  const [ordenCompleta] = completa.ordenes;
  ordenCompleta.despachar('CR123456789');
  ordenCompleta.confirmarEntrega();
  ordenCompleta.liquidar();
  db.agregarResena(ordenCompleta.resenar({
    id: db.siguienteId('resena', 'r'),
    productoId: 'p7',
    calificacion: 5,
    comentario: 'Llegó muy bien empacada y en persona es todavía más bonita.',
  }));

  // 2) Compra en camino.
  const enCamino = comprar([['p1', 2]], { metodoPago: 'tarjeta', datosPago: tarjeta, metodoEnvio: 'courier' });
  enCamino.ordenes[0].despachar('EXP-55821');

  // 3) Compra con SINPE esperando verificación del administrador.
  comprar([['p10', 2], ['p11', 1]], { metodoPago: 'sinpe', datosPago: { telefonoSinpe: '8888-1234', comprobante: '2026111300451' } });

  // Las notificaciones de ejemplo ya se consideran leídas.
  db.notificaciones.forEach((n) => { n.leida = true; });
}

module.exports = { cargarDatosIniciales, crearOrdenesDemo };
