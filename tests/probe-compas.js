// Le compas s'ouvre-t-il par sa pastille, et le crayon/molette tracent-ils ?
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
  const page = await (await b.newContext({ viewport: { width: 1024, height: 768 }, hasTouch: true })).newPage();
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.goto(PAGE); await page.waitForTimeout(1400);

  const r = await page.evaluate(() => {
    const app = window.app;
    app.toggleWidget('compass');
    const w = app.compassWidget;
    w.x = 400; w.y = 400; w.angle = 0; w.radius = 120;
    const G = (lx, ly) => w.toGlobal(lx, ly);
    const zone = (lx, ly) => { const g = G(lx, ly); return w.getHitZone(g.x, g.y); };
    const po = w.constructor.pastilleOuverture(w.radius);
    return {
      pastille: zone(po.x, po.y),
      pastilleBord: zone(po.x + po.r + 6, po.y),
      mine: zone(w.radius, 0),
      crayonMilieu: zone(w.radius, -45),
      crayonHaut: zone(w.radius, -70),
      molette: zone(w.radius, -35),
      branchePointe: zone(10, -60),
      bras: zone(w.radius * 0.75, -120),
      loin: zone(w.radius + 120, 60),
      po: [po.x, po.y, po.r],
    };
  });
  console.log('  ' + JSON.stringify(r));
  ck('la pastille ouvre le compas', r.pastille === 'resize');
  ck('son pourtour aussi (cible large)', r.pastilleBord === 'resize');
  ck('la mine trace', r.mine === 'trace');
  ck('le milieu du crayon trace', r.crayonMilieu === 'trace');
  ck('le haut du crayon trace', r.crayonHaut === 'trace');
  ck('la molette trace', r.molette === 'trace');
  ck('la branche pointe déplace', r.branchePointe === 'move');
  ck('le bras fait tourner', r.bras === 'rotate');
  ck('loin du compas : rien', r.loin === null);

  // ouverture réelle : saisir la pastille et tirer, sans saut
  const o = await page.evaluate(() => {
    const app = window.app, w = app.compassWidget, cont = app.canvas.parentElement;
    w.x = 400; w.y = 400; w.angle = 0; w.radius = 120;
    app.render();
    const rc = app.canvas.getBoundingClientRect();
    const cl = (sx, sy) => ({ X: sx * app.view.zoom + app.view.x + rc.left, Y: sy * app.view.zoom + app.view.y + rc.top });
    const po = w.constructor.pastilleOuverture(w.radius);
    const g = w.toGlobal(po.x, po.y);
    const a = cl(g.x, g.y);
    const ev = (t, X, Y, bt) => (t === 'pointerup' ? window : app.canvas).dispatchEvent(new PointerEvent(t, {
      pointerId: 3, pointerType: 'touch', isPrimary: true, button: 0, buttons: bt,
      clientX: X, clientY: Y, bubbles: true, cancelable: true }));
    ev('pointerdown', a.X, a.Y, 1);
    const apresPrise = w.radius;
    // on tire de 60px vers la droite
    ev('pointermove', a.X + 60, a.Y, 1);
    const apresTirage = w.radius;
    ev('pointerup', a.X + 60, a.Y, 0);
    return { avant: 120, apresPrise: Math.round(apresPrise), apresTirage: Math.round(apresTirage), mode: app.draggedWidgetMode };
  });
  console.log('  ' + JSON.stringify(o));
  ck('la simple prise ne change pas l\'écartement', Math.abs(o.apresPrise - 120) <= 1, `${o.apresPrise}`);
  ck('tirer de 60px ouvre d\'environ 60px', Math.abs(o.apresTirage - 180) <= 4, `${o.apresTirage}`);
  ck('aucune erreur JS', errs.length === 0, errs.slice(0, 2).join(' | '));
  await b.close();
  console.log(`\n${fail ? `=== ${fail} échec(s) ===` : '=== tout passe ==='}`);
  process.exit(fail ? 1 : 0);
})();
