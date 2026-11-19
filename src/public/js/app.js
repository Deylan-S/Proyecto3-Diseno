// JavaScript del navegador. La pagina funciona sin esto, solo hace la experiencia mas fluida.
(function () {
  'use strict';

  var anuncios = document.getElementById('anuncios');

  /** Anuncia un mensaje a lectores de pantalla (región aria-live). */
  function anunciar(texto) {
    if (!anuncios) return;
    anuncios.textContent = '';
    window.setTimeout(function () { anuncios.textContent = texto; }, 50);
  }

  function enviarFormulario(form, url) {
    var datos = new URLSearchParams(new FormData(form));
    return fetch(url || form.action, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' },
      body: datos,
      credentials: 'same-origin',
    }).then(function (respuesta) { return respuesta.json(); });
  }

  // 1. Llevar el foco al resumen de errores o al título de confirmación.
  var enfocar = document.querySelector('[data-enfocar]');
  if (enfocar) enfocar.focus();

  // 2. Confirmar acciones destructivas (cancelar pedido).
  document.querySelectorAll('form[data-confirmar]').forEach(function (form) {
    form.addEventListener('submit', function (evento) {
      if (!window.confirm(form.getAttribute('data-confirmar'))) evento.preventDefault();
    });
  });

  // 3. Agregar al carrito sin recargar la página.
  var insignia = document.querySelector('[data-carrito-cantidad]');
  var textoCarrito = document.querySelector('[data-carrito-texto]');

  function actualizarCarrito(cantidad) {
    if (insignia) {
      insignia.textContent = cantidad;
      insignia.hidden = cantidad === 0;
    }
    if (textoCarrito) textoCarrito.textContent = ', ' + cantidad + (cantidad === 1 ? ' artículo' : ' artículos');
  }

  document.querySelectorAll('form[data-agregar-carrito]').forEach(function (form) {
    form.addEventListener('submit', function (evento) {
      evento.preventDefault();
      var boton = form.querySelector('button[type="submit"]');
      var textoOriginal = boton.innerHTML;
      boton.disabled = true;

      enviarFormulario(form)
        .then(function (respuesta) {
          actualizarCarrito(respuesta.cantidad);
          anunciar(respuesta.mensaje);
          if (respuesta.ok) {
            boton.innerHTML = '✓ Agregado';
            window.setTimeout(function () { boton.innerHTML = textoOriginal; boton.disabled = false; }, 1600);
          } else {
            boton.innerHTML = textoOriginal;
            boton.disabled = false;
            mostrarAviso(respuesta.mensaje, 'error');
          }
        })
        .catch(function () { form.submit(); });
    });
  });

  /** Aviso visual temporal en la parte superior del contenido. */
  function mostrarAviso(mensaje, tipo) {
    var contenedor = document.querySelector('main .contenedor');
    if (!contenedor) return;
    var aviso = document.createElement('div');
    aviso.className = 'aviso aviso--' + tipo;
    var parrafo = document.createElement('p');
    parrafo.textContent = mensaje;
    aviso.appendChild(parrafo);
    contenedor.insertBefore(aviso, contenedor.firstChild);
    window.setTimeout(function () { aviso.remove(); }, 6000);
  }

  // 4. Checkout: mostrar solo el panel del método de pago elegido.
  var paneles = document.querySelectorAll('[data-panel-pago]');
  function mostrarPanelPago() {
    var elegido = document.querySelector('input[name="metodoPago"]:checked');
    paneles.forEach(function (panel) {
      panel.hidden = !elegido || panel.getAttribute('data-panel-pago') !== elegido.value;
    });
  }
  if (paneles.length) {
    document.querySelectorAll('input[name="metodoPago"]').forEach(function (radio) {
      radio.addEventListener('change', mostrarPanelPago);
    });
    mostrarPanelPago();
  }

  // 5. Checkout: actualizar el resumen y el total sin recargar.
  var formCheckout = document.querySelector('form[data-checkout]');
  var resumen = document.querySelector('[data-resumen]');
  if (formCheckout && resumen) {
    var errorCupon = formCheckout.querySelector('[data-error-cupon]');
    var campoCupon = formCheckout.querySelector('#campo-cupon');
    var ultimoTotal = null;

    var recotizar = function (anunciarCupon) {
      resumen.setAttribute('aria-busy', 'true');
      enviarFormulario(formCheckout, '/checkout/cotizacion')
        .then(function (respuesta) {
          if (!respuesta.ok) return;
          resumen.innerHTML = respuesta.html;
          if (errorCupon) {
            errorCupon.textContent = respuesta.errorCupon || '';
            errorCupon.hidden = !respuesta.errorCupon;
            campoCupon.setAttribute('aria-invalid', respuesta.errorCupon ? 'true' : 'false');
          }
          var total = resumen.querySelector('[data-total]');
          if (respuesta.errorCupon && anunciarCupon) {
            anunciar(respuesta.errorCupon);
          } else if (total && total.textContent !== ultimoTotal) {
            anunciar('Total actualizado: ' + total.textContent);
          }
          ultimoTotal = total ? total.textContent : null;
        })
        .finally(function () { resumen.setAttribute('aria-busy', 'false'); });
    };

    // El resumen lo anunciamos nosotros (solo el total), así que quitamos la región viva.
    resumen.removeAttribute('aria-live');

    formCheckout.querySelector('#campo-provincia').addEventListener('change', function () { recotizar(false); });
    formCheckout.querySelectorAll('input[name="metodoEnvio"]').forEach(function (radio) {
      radio.addEventListener('change', function () { recotizar(false); });
    });

    // El botón "Aplicar" del cupón recalcula sin salir de la página.
    var botonCupon = formCheckout.querySelector('button[formaction="/checkout/recalcular"]');
    if (botonCupon) {
      botonCupon.addEventListener('click', function (evento) {
        evento.preventDefault();
        recotizar(true);
      });
    }
    if (campoCupon) {
      campoCupon.addEventListener('keydown', function (evento) {
        if (evento.key === 'Enter') {
          evento.preventDefault();
          recotizar(true);
        }
      });
    }
  }
})();
