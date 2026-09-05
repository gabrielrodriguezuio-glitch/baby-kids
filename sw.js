// Chrome sólo ofrece instalar una app si tiene uno de estos archivos.
// Este es el mínimo posible: se registra y no toca ningún pedido.
//
// Antes interceptaba todo y lo reenviaba a la red. Eso parecía inofensivo,
// pero rompía al lector de comprobantes: usa trabajadores internos y pedidos
// especiales que no sobreviven ese rebote. Sin el interceptor, todo pasa
// directo al navegador y funciona igual.

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (evento) => {
  evento.waitUntil(self.clients.claim());
});
