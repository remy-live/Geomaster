// Revenir sur ses pas avec le compas ne doit pas effacer l'arc déjà tracé,
// ni en poser un second par-dessus. L'encre couvre tous les angles visités.
const { chromium } = require('playwright');
const path = require('path');
// La page testée est celle du dépôt, quel que soit l'endroit où il est cloné.
const PAGE = 'file://' + path.resolve(__dirname, '..', 'index.html');
// Le navigateur : celui que Playwright a installé, sauf indication contraire.
const NAVIGATEUR = process.env.GM_CHROME || undefined;
(async () => {
  const b = await chromium.launch({ executablePath: NAVIGATEUR });
  let fail = 0;
  const ck = (l, ok, d) => { console.log(`  ${ok ? '✓' : '✗'} ${l}${d ? ' — ' + d : ''}`); if (!ok) fail++; };
  const page = await (await b.newContext({ viewport: { width: 1024, height: 768 } })).newPage();
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.goto(PAGE); await page.waitForTimeout(1400);

  // parcours : une suite d'angles en degrés, parcourus par pas de `pas` degrés
  const tracer = (parcours, pas) => page.evaluate(({ parcours, pas }) => {
    const app = window.app;
    app.entities = []; app.historyPast = []; app.saveState();
    if (!app.activeWidgets.compass) app.toggleWidget('compass');
    const w = app.compassWidget;
    w.x = 400; w.y = 400; w.angle = 0; w.radius = 120;
    const rc = app.canvas.getBoundingClientRect();
    const cl = (sx, sy) => ({ X: sx * app.view.zoom + app.view.x + rc.left, Y: sy * app.view.zoom + app.view.y + rc.top });
    const ev = (t, X, Y, bt) => (t === 'pointerup' ? window : app.canvas).dispatchEvent(new PointerEvent(t, {
      pointerId: 3, pointerType: 'mouse', isPrimary: true, button: 0, buttons: bt,
      clientX: X, clientY: Y, bubbles: true, cancelable: true }));
    const D = Math.PI / 180;
    const sur = (a) => cl(400 + 120 * Math.cos(a * D), 400 + 120 * Math.sin(a * D));
    let cur = parcours[0], p = sur(cur);
    ev('pointerdown', p.X, p.Y, 1);
    for (let i = 1; i < parcours.length; i++) {
      const but = parcours[i], sens = but > cur ? 1 : -1;
      while (Math.abs(but - cur) > 1e-9) {
        cur += sens * Math.min(pas, Math.abs(but - cur));
        const q = sur(cur); ev('pointermove', q.X, q.Y, 1);
      }
    }
    const f = sur(cur); ev('pointerup', f.X, f.Y, 0);
    const arcs = app.entities.filter(e => e.constructor.name === 'CompassArc');
    const anims = app.entities.filter(e => e.constructor.name === 'ToolAnimation');
    return {
      arcs: arcs.map(a => ({ d: +(a.startAngle / D).toFixed(1), f: +(a.endAngle / D).toFixed(1),
        span: +(Math.abs(a.endAngle - a.startAngle) / D).toFixed(1), ccw: !!a.counterClockwise })),
      anims: anims.map(a => ({ d: +((a.startState.angle || 0) / D).toFixed(1),
        f: +((a.endState.angle || 0) / D).toFixed(1) })),
    };
  }, { parcours, pas });

  /* Le défaut d'origine dépendait de la VITESSE du retour : le code guettait un
     changement de sens de plus d'un degré par image. Un retour soigneux passait
     dessous et l'arc se rétractait ; un retour rapide était vu, mais refermait
     l'arc pour en ouvrir un second au même endroit. Les trois vitesses doivent
     donner le même trait. */
  console.log('\n=== aller 0→60°, retour à 30° : le trait reste entier ===');
  for (const pas of [10, 3, 0.5]) {
    const r = await tracer([0, 60, 30], pas);
    console.log(`  retour par pas de ${pas}° : ${JSON.stringify(r.arcs)}`);
    ck(`pas de ${pas}° : un seul arc`, r.arcs.length === 1, String(r.arcs.length));
    ck(`pas de ${pas}° : il couvre bien 0° à 60°`,
       r.arcs.length === 1 && Math.abs(r.arcs[0].d) < 0.5 && Math.abs(r.arcs[0].f - 60) < 0.5,
       JSON.stringify(r.arcs[0]));
  }

  console.log('\n=== l\'encre couvre tous les angles visités ===');
  for (const [nom, parcours, pas, att] of [
    ['retour au-delà du départ 0→60→-20', [0, 60, -20], 2, [-20, 60]],
    ['va-et-vient 0→40→10→55', [0, 40, 10, 55], 1, [0, 55]],
    ['sens antihoraire seul 0→-70', [0, -70], 2, [-70, 0]],
    ['tour complet 0→400', [0, 400], 3, [0, 360]],
    ['plus d\'un tour, puis retour 0→500→300', [0, 500, 300], 3, [0, 360]],
  ]) {
    const r = await tracer(parcours, pas);
    console.log(`  ${nom} : ${JSON.stringify(r.arcs)}`);
    ck(`${nom} : un seul arc`, r.arcs.length === 1, String(r.arcs.length));
    ck(`${nom} : de ${att[0]}° à ${att[1]}°`,
       r.arcs.length === 1 && Math.abs(r.arcs[0].d - att[0]) < 0.5 && Math.abs(r.arcs[0].f - att[1]) < 0.5,
       JSON.stringify(r.arcs[0]));
    // le rejeu doit redessiner exactement ce trait-là
    ck(`${nom} : le rejeu balaie le même intervalle`,
       r.anims.length === 1 && Math.abs(r.anims[0].d - att[0]) < 0.5 && Math.abs(r.anims[0].f - att[1]) < 0.5,
       JSON.stringify(r.anims));
  }

  ck('aucune erreur JS', errs.length === 0, errs.slice(0, 3).join(' | '));
  await b.close();
  console.log(`\n${fail ? `=== ${fail} échec(s) ===` : '=== tout passe ==='}`);
  process.exit(fail ? 1 : 0);
})();
