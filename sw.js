// Chrome sólo ofrece instalar una app si tiene uno de estos archivos.
//
// Este trabajador hace UNA sola cosa además de existir: guarda las fotos
// del catálogo en el teléfono. La primera vez que una foto aparece en
// pantalla se baja de la nube y queda guardada; las siguientes veces sale
// del disco del teléfono, instantánea y sin gastar internet.
//
// IMPORTANTE: sólo intercepta los pedidos de fotos de nuestro almacenamiento.
// Todo lo demás pasa directo al navegador, igual que antes. Interceptar todo
// rompía al lector de comprobantes (usa trabajadores internos y pedidos
// especiales que no sobreviven el rebote), así que no se toca nada más.

// Si algún día hace falta que los teléfonos borren las fotos guardadas y
// las vuelvan a bajar, subí este archivo cambiando el número de versión.
const CACHE_FOTOS = "fotos-v1";

// Sólo las fotos de nuestro bucket público. Nada más.
const ES_FOTO = (url) =>
  url.indexOf("fanxjjhocudfeiqinbac.supabase.co/storage/v1/object/public/fotos/") >= 0;

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (evento) => {
  evento.waitUntil(
    (async () => {
      // Borra versiones viejas del guardado de fotos, si las hubiera
      const nombres = await caches.keys();
      for (const n of nombres) {
        if (n.indexOf("fotos-") === 0 && n !== CACHE_FOTOS) await caches.delete(n);
      }
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (evento) => {
  const pedido = evento.request;

  // Cualquier cosa que no sea una foto nuestra: no la tocamos.
  // Al no llamar respondWith, el navegador la maneja solo, como siempre.
  if (pedido.method !== "GET" || !ES_FOTO(pedido.url)) return;

  evento.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_FOTOS);

      // 1) ¿Ya la tenemos en el teléfono? Se sirve al instante.
      const guardada = await cache.match(pedido);
      if (guardada) return guardada;

      // 2) No está: se baja de la nube y se guarda para la próxima.
      const respuesta = await fetch(pedido);
      if (respuesta && respuesta.ok) {
        // clone(): una copia va al guardado, la original a la pantalla
        cache.put(pedido, respuesta.clone()).catch(() => {});
      }
      return respuesta;
    })()
  );
});

// La app puede pedirle cosas al trabajador con postMessage:
// - "borrar-fotos": vacía el guardado (por si hace falta liberar espacio)
self.addEventListener("message", (evento) => {
  if (evento.data === "borrar-fotos") {
    evento.waitUntil(caches.delete(CACHE_FOTOS));
  }
});
