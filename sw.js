// LAS Time Clock 1.1: lets the clock page open when the phone has no signal.
var CACHE = "las-clock-1.1";

self.addEventListener("install", function (e) {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.add(new Request("./", { cache: "reload" })); }));
});

self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.map(function (k) { return k === CACHE ? null : caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

// The page itself: try the network first so updates arrive, and fall back to the saved copy
// when there is no signal or the signal is too weak to answer within four seconds.
self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET" || req.mode !== "navigate") { return; }
  e.respondWith(new Promise(function (resolve) {
    var done = false;
    var timer = setTimeout(function () {
      caches.match("./", { ignoreSearch: true }).then(function (hit) {
        if (hit && !done) { done = true; resolve(hit); }
      });
    }, 4000);
    fetch(req).then(function (res) {
      clearTimeout(timer);
      if (res && res.ok) {
        var copy = res.clone();
        caches.open(CACHE).then(function (c) { c.put("./", copy); });
      }
      if (!done) { done = true; resolve(res); }
    }, function () {
      clearTimeout(timer);
      caches.match("./", { ignoreSearch: true }).then(function (hit) {
        if (!done) { done = true; resolve(hit || Response.error()); }
      });
    });
  }));
});
