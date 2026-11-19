// Configuracion de Express siguiendo MVC:
//  Modelos       -> src/models y src/patrones
//  Vistas        -> src/views (EJS)
//  Controladores -> src/controllers
const path = require('path');
const express = require('express');
const session = require('express-session');

require('./config/inicializar'); // crea la base de datos y carga los datos de prueba
const rutas = require('./routes/rutas');
const { cargarDatosVista, verificarCSRF, encabezadosSeguridad } = require('./middleware/middlewares');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.disable('x-powered-by');

app.use(encabezadosSeguridad);
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(session({
  secret: 'mercatico-proyecto3',
  resave: false,
  saveUninitialized: true,
  cookie: { httpOnly: true, sameSite: 'lax', maxAge: 1000 * 60 * 60 * 4 }, // 4 horas
}));

app.use(cargarDatosVista);
app.use(verificarCSRF);
app.use(rutas);

// pagina 404
app.use((req, res) => {
  res.status(404).render('error', {
    titulo: 'Página no encontrada',
    mensaje: 'No encontramos lo que buscaba. Puede volver al catálogo.',
  });
});

// errores del servidor
app.use((error, req, res, next) => {
  console.error(error);
  res.status(500).render('error', {
    titulo: 'Algo salió mal',
    mensaje: 'Tuvimos un problema al procesar su solicitud. Intente de nuevo en unos minutos.',
  });
});

module.exports = app;
