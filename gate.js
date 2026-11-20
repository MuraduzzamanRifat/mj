/* ═══════════════════════════════════════════════════════════════
   GATE — the entrance sequence on the homepage
   door (click) → ascent through the building, position #50 to #1
   → top-floor menu → a page, or the homepage underneath.

   The gate is an overlay: the full homepage is already in the HTML
   beneath it, so search and AI crawlers read the page as normal.
   It only shows when the inline script in <head> adds `gate-on`
   to <html> (first visit of a browser session, no #anchor in URL).
   ═══════════════════════════════════════════════════════════════ */
(function () {
  var root = document.documentElement;
  var gate = document.getElementById('gate');
  if (!gate) return;
  if (!root.classList.contains('gate-on')) { gate.remove(); return; }

  var REDUCED  = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var door     = document.getElementById('gateDoor');
  var skip     = document.getElementById('gateSkip');
  var home     = document.getElementById('gateHome');
  var posEl    = document.getElementById('gatePos');
  var timers   = [];
  var ASCENT_MS = 3000;

  function stage(name) { gate.setAttribute('data-stage', name); }
  function later(fn, ms) { timers.push(setTimeout(fn, ms)); }
  function remember() { try { sessionStorage.setItem('mj-gate', '1'); } catch (e) {} }

  function showTop() {
    timers.forEach(clearTimeout);
    remember();
    stage('top');
    if (posEl) posEl.textContent = '#1';
    var first = gate.querySelector('.gate-nav a');
    if (first) later(function () { first.focus({ preventScroll: true }); }, 700);
  }

  function countDown() {
    if (!posEl) return;
    var start = performance.now();
    (function tick(now) {
      var t = Math.min(1, (now - start) / ASCENT_MS);
      var e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;   // ease-in-out
      posEl.textContent = '#' + Math.max(1, Math.round(50 - 49 * e));
      if (t < 1 && gate.getAttribute('data-stage') === 'ascent') requestAnimationFrame(tick);
    })(start);
  }

  function enter() {
    if (gate.getAttribute('data-stage') !== 'door') return;
    if (REDUCED) { showTop(); return; }
    stage('opening');                               // door leaves swing open
    later(function () {
      stage('ascent');                              // fly through, then climb
      later(countDown, 500);
      later(showTop, 500 + ASCENT_MS + 250);
    }, 1050);
  }

  function leave() {
    timers.forEach(clearTimeout);
    remember();
    stage('leaving');
    root.classList.remove('gate-on');
    setTimeout(function () {
      gate.remove();
      var main = document.getElementById('top');
      if (main) { main.setAttribute('tabindex', '-1'); main.focus({ preventScroll: true }); }
    }, REDUCED ? 0 : 700);
  }

  door.addEventListener('click', enter);
  if (skip) skip.addEventListener('click', function () {
    if (gate.getAttribute('data-stage') === 'top') leave(); else showTop();
  });
  if (home) home.addEventListener('click', leave);
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape' || !document.getElementById('gate')) return;
    if (gate.getAttribute('data-stage') === 'top') leave(); else showTop();
  });
  // links inside the top-floor menu: remember the visit before leaving the page
  gate.querySelectorAll('.gate-nav a').forEach(function (a) {
    a.addEventListener('click', remember);
  });

  stage('door');
  door.focus({ preventScroll: true });
})();
