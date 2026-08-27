// Équerre qui tourne sur la règle : se colle-t-elle ? Pointe de compas sur
// l'origine de la règle : se pose-t-elle ?
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
  const page = await (await b.newContext({ viewport: { width: 1280, height: 900 } })).newPage();
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.goto(PAGE); await page.waitForTimeout(1400);

  const deg = (r) => Math.round(r * 180 / Math.PI * 10) / 10;

  console.log('\n=== équerre qui tourne, coin posé sur la règle ===');
  const eq = await page.evaluate(() => {
    const app = window.app;
    app.isObjectMagnetActive = true;
    if (!app.activeWidgets.ruler) app.toggleWidget('ruler');
    if (!app.activeWidgets.setsquare) app.toggleWidget('setsquare');
    const rul = app.rulerWidget, sq = app.setSquareWidget;
    rul.x = 300; rul.y = 400; rul.angle = 0.30;      // règle inclinée
    const org = rul.toGlobal(120, 0);                 // coin posé SUR la graduation
    sq.x = org.x; sq.y = org.y;
    const rc = app.canvas.getBoundingClientRect();
    const cl = (sx, sy) => ({ X: sx * app.view.zoom + app.view.x + rc.left, Y: sy * app.view.zoom + app.view.y + rc.top });
    const ev = (t, X, Y, bt) => (t === 'pointerup' ? window : app.canvas).dispatchEvent(new PointerEvent(t, {
      pointerId: 5, pointerType: 'mouse', isPrimary: true, button: 0, buttons: bt,
      clientX: X, clientY: Y, bubbles: true, cancelable: true }));
    const essai = (viseDeg) => {
      sq.angle = rul.angle;                    // état de départ neutre
      // on saisit la poignée de rotation, puis on vise l'angle demandé
      const zone = 'rotate';
      app.draggedWidget = sq; app.draggedWidgetMode = zone;
      app.widgetStartState = app.getWidgetState(sq);
      app.widgetRotationOffset = 0;
      const vise = viseDeg * Math.PI / 180;
      const p = { x: sq.x + 300 * Math.cos(vise), y: sq.y + 300 * Math.sin(vise) };
      const c = cl(p.x, p.y);
      ev('pointermove', c.X, c.Y, 1);
      const a = sq.angle;
      app.draggedWidget = null; app.draggedWidgetMode = null;
      return a;
    };
    const R = rul.angle;
    const out = {
      regle: R,
      a_proche: essai((R) * 180 / Math.PI + 3),           // 3° de la règle
      a_perp: essai((R + Math.PI / 2) * 180 / Math.PI - 4), // 4° de la perpendiculaire
      a_loin: essai((R) * 180 / Math.PI + 25),            // 25° : hors magnétisme
    };
    // coin ÉLOIGNÉ de la règle : plus de magnétisme instrument-instrument
    sq.x = 900; sq.y = 100;
    out.a_hors = essai((R) * 180 / Math.PI + 3);
    return out;
  });
  const R = eq.regle;
  console.log(`  règle à ${deg(R)}° | approche 3° -> ${deg(eq.a_proche)}° | perp -4° -> ${deg(eq.a_perp)}° | 25° -> ${deg(eq.a_loin)}° | coin ailleurs -> ${deg(eq.a_hors)}°`);
  const pres = (a, c) => Math.abs(Math.atan2(Math.sin(a - c), Math.cos(a - c))) < 0.001;
  ck('à 3° de la règle : collée sur la règle', pres(eq.a_proche, R));
  ck('à 4° de la perpendiculaire : collée à 90°', pres(eq.a_perp, R + Math.PI / 2));
  ck('à 25° : rien ne colle', !pres(eq.a_loin, R), `${deg(eq.a_loin)}°`);
  ck('coin loin de la règle : aucun magnétisme', !pres(eq.a_hors, R), `${deg(eq.a_hors)}°`);

  console.log('\n=== pointe du compas sur l\'origine de la règle ===');
  const co = await page.evaluate(() => {
    const app = window.app;
    if (!app.activeWidgets.compass) app.toggleWidget('compass');
    const rul = app.rulerWidget, w = app.compassWidget;
    rul.x = 300; rul.y = 400; rul.angle = 0.30;
    const org = rul.toGlobal(0, 0);
    const rc = app.canvas.getBoundingClientRect();
    const cl = (sx, sy) => ({ X: sx * app.view.zoom + app.view.x + rc.left, Y: sy * app.view.zoom + app.view.y + rc.top });
    const ev = (t, X, Y, bt) => (t === 'pointerup' ? window : app.canvas).dispatchEvent(new PointerEvent(t, {
      pointerId: 6, pointerType: 'mouse', isPrimary: true, button: 0, buttons: bt,
      clientX: X, clientY: Y, bubbles: true, cancelable: true }));
    const poser = (dx, dy) => {
      w.x = org.x + 200; w.y = org.y + 200;
      app.draggedWidget = w; app.draggedWidgetMode = 'move';
      app.widgetOffset = { x: 0, y: 0 };
      const c = cl(org.x + dx, org.y + dy);
      ev('pointermove', c.X, c.Y, 1);
      const p = { x: w.x, y: w.y };
      app.draggedWidget = null; app.draggedWidgetMode = null;
      return p;
    };
    return { org: [Math.round(org.x), Math.round(org.y)],
             proche: poser(6, 5), loin: poser(40, 40) };
  });
  console.log(`  origine ${co.org} | lâché à 8px -> [${Math.round(co.proche.x)},${Math.round(co.proche.y)}] | à 57px -> [${Math.round(co.loin.x)},${Math.round(co.loin.y)}]`);
  ck('pointe posée exactement sur l\'origine', Math.hypot(co.proche.x - co.org[0], co.proche.y - co.org[1]) < 1.5);
  ck('à 57px : pas de magnétisme forcé', Math.hypot(co.loin.x - co.org[0], co.loin.y - co.org[1]) > 20);
  ck('aucune erreur JS', errs.length === 0, errs.slice(0, 2).join(' | '));
  await b.close();
  console.log(`\n${fail ? `=== ${fail} échec(s) ===` : '=== tout passe ==='}`);
  process.exit(fail ? 1 : 0);
})();
