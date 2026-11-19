// Rutas: cada URL con la funcion de su controlador
const express = require('express');
const catalogo = require('../controllers/catalogoController');
const carrito = require('../controllers/carritoController');
const checkout = require('../controllers/checkoutController');
const ordenes = require('../controllers/ordenController');
const paneles = require('../controllers/panelesController');
const productos = require('../controllers/productoController');
const auth = require('../controllers/authController');
const preferencias = require('../controllers/preferenciasController');
const { requiereSesion, requiereRol } = require('../middleware/middlewares');

const router = express.Router();

const soloComprador = requiereRol('comprador');
const soloVendedor = requiereRol('vendedor');
const soloAdmin = requiereRol('admin');

// catalogo
router.get('/', catalogo.inicio);
router.get('/producto/:id', catalogo.detalle);
router.get('/accesibilidad', catalogo.accesibilidad);
router.get('/preferencias', preferencias.mostrar);
router.post('/preferencias', preferencias.guardar);

// carrito
router.get('/carrito', carrito.ver);
router.post('/carrito/agregar', carrito.agregar);
router.post('/carrito/actualizar', carrito.actualizar);
router.post('/carrito/quitar', carrito.quitar);

// checkout (solo compradores)
router.get('/checkout', soloComprador, checkout.mostrar);
router.post('/checkout', soloComprador, checkout.procesar);
router.post('/checkout/recalcular', soloComprador, checkout.recalcular);
router.post('/checkout/cotizacion', soloComprador, checkout.cotizacionParcial);
router.get('/checkout/confirmacion/:compraId', soloComprador, checkout.confirmacion);

// ordenes
router.get('/ordenes', soloComprador, ordenes.misOrdenes);
router.get('/ordenes/:id', requiereSesion, ordenes.detalle);
router.post('/ordenes/:id/acciones', requiereSesion, ordenes.ejecutarAccion);
router.post('/ordenes/:id/resenas', soloComprador, ordenes.resenar);

// vendedor
router.get('/vendedor', soloVendedor, paneles.vendedor);
router.get('/vendedor/productos/nuevo', soloVendedor, productos.nuevo);
router.post('/vendedor/productos', soloVendedor, productos.crear);
router.get('/vendedor/productos/:id/editar', soloVendedor, productos.editar);
router.post('/vendedor/productos/:id', soloVendedor, productos.actualizar);

// administracion y avisos
router.get('/admin', soloAdmin, paneles.admin);
router.get('/notificaciones', requiereSesion, paneles.notificaciones);

// sesion
router.get('/login', auth.formulario);
router.post('/login', auth.entrar);
router.get('/registro', auth.formularioRegistro);
router.post('/registro', auth.registrar);
router.post('/logout', auth.salir);

module.exports = router;
