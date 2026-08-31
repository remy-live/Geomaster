// La pastille d'ouverture du compas doit rester SOUS le curseur pendant tout
// le geste — sinon on tire une poignée qui n'est plus là où l'on appuie.
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

  const essai = (cible, prise) => page.evaluate(({ cible, prise }) => {
    const app = window.app, rc = app.canvas.getBoundingClientRect();
    const cl = (s) => ({ X: s.x*app.view.zoom+app.view.x+rc.left, Y: s.y*app.view.zoom+app.view.y+rc.top });
    const ev = (t, s, bt) => { const c = cl(s); (t==='pointerup'?window:app.canvas).dispatchEvent(new PointerEvent(t,{
      pointerId:3, pointerType:'mouse', isPrimary:true, button:0, buttons:bt, clientX:c.X, clientY:c.Y,
      bubbles:true, cancelable:true })); };
    app.entities = []; app.historyPast = []; app.saveState(); app.setTool('select');
    if (!app.activeWidgets.compass) app.toggleWidget('compass');
    // seuls les autres instruments pourraient aimanter : on les range
    for (const w of ['ruler', 'setsquare', 'protractor']) if (app.activeWidgets[w]) app.toggleWidget(w);
    const co = app.compassWidget;
    co.x = 500; co.y = 500; co.radius = 100; co.angle = 0;
    const po = co.constructor.pastilleOuverture(co.radius);
    // on peut saisir la pastille en son centre, ou un peu à côté dans son disque
    const gp = co.toGlobal(po.x + (prise ? prise[0] : 0), po.y + (prise ? prise[1] : 0));
    const zone = co.getHitZone(gp.x, gp.y);
    ev('pointerdown', gp, 1);
    const rayonAppui = +co.radius.toFixed(2), angleAppui = +co.angle.toFixed(4);
    for (let i = 1; i <= 12; i++) ev('pointermove', { x: gp.x+(cible.x-gp.x)*i/12, y: gp.y+(cible.y-gp.y)*i/12 }, 1);
    ev('pointerup', cible, 0);
    const po2 = co.constructor.pastilleOuverture(co.radius);
    const gp2 = co.toGlobal(po2.x + (prise ? prise[0] : 0), po2.y + (prise ? prise[1] : 0));
    return { zone, saut: +Math.hypot(rayonAppui - 100, angleAppui).toFixed(3),
             rayon: +co.radius.toFixed(1), angleDeg: +(co.angle*180/Math.PI).toFixed(2),
             derive: +Math.hypot(gp2.x - cible.x, gp2.y - cible.y).toFixed(2) };
  }, { cible, prise });

  console.log('\n=== la poignée ne quitte pas le curseur ===');
  // Le décalage venait d'un écart mémorisé en polaire alors qu'il est constant
  // en cartésien local : il variait donc avec le rayon. Mesuré à 50 px avant
  // correction pour une ouverture portée de 100 à 300 px.
  for (const [nom, cible] of [
    ['on ouvre à ~300 vers la droite', { x: 830, y: 465 }],
    ['on referme à ~60', { x: 595, y: 465 }],
    ['on tire vers le bas', { x: 560, y: 800 }],
    ['on tire vers le haut', { x: 700, y: 250 }],
    ['on tire vers la gauche', { x: 220, y: 520 }],
  ]) {
    const r = await essai(cible, null);
    console.log(`  ${nom} : ${JSON.stringify(r)}`);
    ck(`${nom} : la pastille reste sous le curseur`, r.derive < 1, `${r.derive} px`);
    ck(`${nom} : pas de saut à l'appui`, r.saut < 0.01, String(r.saut));
  }

  console.log('\n=== même en la saisissant de travers ===');
  for (const prise of [[8, 0], [-8, 5], [0, -9]]) {
    const r = await essai({ x: 830, y: 430 }, prise);
    ck(`saisie décalée de (${prise[0]}, ${prise[1]}) : toujours sous le curseur`,
       r.zone === 'resize' && r.derive < 1, `${r.zone} ${r.derive} px`);
  }

  ck('aucune erreur JS', errs.length === 0, errs.slice(0, 3).join(' | '));
  await b.close();
  console.log(`\n${fail ? `=== ${fail} échec(s) ===` : '=== tout passe ==='}`);
  process.exit(fail ? 1 : 0);
})();
