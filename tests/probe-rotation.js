// Tourner toute la figure : appui long sur la main, puis on tourne. Ce sont les
// OBJETS qui tournent, pas la vue — donc la figure reste la même figure.
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
  const page = await (await b.newContext({ viewport: { width: 1400, height: 1000 } })).newPage();
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.goto(PAGE); await page.waitForTimeout(1400);

  const figure = () => page.evaluate(() => {
    const app = window.app;
    const pt = (n) => app.entities.find(e => e.constructor.name === 'Point' && e.label === n);
    const cm = (x, y) => { const a = pt(x), c = pt(y); return a && c ? +(Math.hypot(a.x - c.x, a.y - c.y) / 50).toFixed(3) : null; };
    const co = {}; 'ABC'.split('').forEach(n => { const p = pt(n); if (p) co[n] = [Math.round(p.x), Math.round(p.y)]; });
    const A = pt('A'), B = pt('B');
    return { co, AB: cm('A', 'B'), AC: cm('A', 'C'), BC: cm('B', 'C'),
             cap: +(Math.atan2(B.y - A.y, B.x - A.x) * 180 / Math.PI).toFixed(1),
             objets: app.entities.length,
             vue: { x: Math.round(app.view.x), y: Math.round(app.view.y), z: app.view.zoom } };
  });

  const poser = () => page.evaluate(() => {
    const app = window.app;
    app.entities = []; app.historyPast = []; app.stepInstructions = {};
    if (app.cslOublier) app.cslOublier();
    app.view = { x: 0, y: 0, zoom: 1 }; app.saveState();
    app.executerConsigne('Trace un triangle ABC tel que AB = 5 cm, AC = 4 cm et BC = 3 cm');
    app.executerConsigne('Trace la médiatrice de [AB]');
    app.render();
  });

  console.log('\n=== un quart de tour : la figure tourne, elle ne se déforme pas ===');
  await poser();
  const avant = await figure();
  await page.evaluate(() => window.app.tournerFigure(90));
  const apres = await figure();
  console.log('  ' + JSON.stringify(avant.co) + ' → ' + JSON.stringify(apres.co));
  /* Une rotation conserve les longueurs : c'est ce qui la distingue d'une
     déformation. Les trois côtés doivent se retrouver au millième près. */
  ck('les trois longueurs sont conservées',
     avant.AB === apres.AB && avant.AC === apres.AC && avant.BC === apres.BC,
     `${apres.AB} / ${apres.AC} / ${apres.BC}`);
  ck('la figure a bien tourné de 90°',
     Math.abs(((apres.cap - avant.cap) + 360) % 360 - 90) < 0.2, `${avant.cap}° → ${apres.cap}°`);
  /* Ce sont les OBJETS qui tournent, pas la vue : les instruments, l'export, le
     lien élève et le rejeu continuent de parler de la même figure. */
  ck('la vue n\'a pas bougé', JSON.stringify(avant.vue) === JSON.stringify(apres.vue),
     JSON.stringify(apres.vue));
  ck('aucun objet ajouté ni perdu', avant.objets === apres.objets,
     `${avant.objets} → ${apres.objets}`);
  /* La médiatrice est accrochée au milieu de [AB] : elle doit avoir suivi. */
  const med = await page.evaluate(() => {
    const app = window.app;
    const d = app.entities.find(e => e.constructor.name === 'PerpendicularLine');
    const pt = (n) => app.entities.find(e => e.constructor.name === 'Point' && e.label === n);
    const A = pt('A'), B = pt('B'), m = d && d.p1;
    if (!m) return null;
    return { ecart: +Math.hypot(m.x - (A.x + B.x) / 2, m.y - (A.y + B.y) / 2).toFixed(2) };
  });
  ck('la médiatrice a suivi son segment', med && med.ecart < 0.01, JSON.stringify(med));

  console.log('\n=== une rotation, une annulation ===');
  await page.evaluate(() => window.app.undo());
  const retour = await figure();
  console.log('  ' + JSON.stringify(retour.co));
  ck('un seul « annuler » remet tout en place',
     JSON.stringify(retour.co) === JSON.stringify(avant.co), JSON.stringify(retour.co));

  console.log('\n=== appui long sur la main : on tourne ===');
  await poser();
  const dep = await figure();
  const ecran = await page.evaluate(() => {
    const app = window.app;
    app.setTool('pan');
    const c = app.centreDeLaFigure(), b = app.canvas.getBoundingClientRect();
    return { x: b.left + c.x * app.view.zoom + app.view.x, y: b.top + c.y * app.view.zoom + app.view.y };
  });
  await page.mouse.move(ecran.x + 200, ecran.y);
  await page.mouse.down();
  await page.waitForTimeout(700);
  const arme = await page.evaluate(() => !!window.app.rotationFigure);
  ck('l\'appui long arme la rotation', arme === true);
  await page.mouse.move(ecran.x, ecran.y + 200, { steps: 8 });
  await page.waitForTimeout(120);
  const bulle = await page.evaluate(() => {
    const b = document.getElementById('bulleRotation');
    return b ? { vu: getComputedStyle(b).display !== 'none', txt: b.textContent } : null;
  });
  console.log('  ' + JSON.stringify(bulle));
  /* Sans l'angle affiché, on tourne à l'estime : « un quart de tour » se vise
     très mal à main levée. */
  ck('l\'angle est affiché pendant qu\'on tourne',
     bulle && bulle.vu && /-?\d+°/.test(bulle.txt), JSON.stringify(bulle));
  await page.mouse.up();
  await page.waitForTimeout(150);
  const gestee = await figure();
  ck('la bulle disparaît au relâchement',
     await page.evaluate(() => getComputedStyle(document.getElementById('bulleRotation')).display === 'none'));
  ck('le geste a tourné la figure sans la déformer',
     gestee.AB === dep.AB && gestee.AC === dep.AC && gestee.BC === dep.BC
     && Math.abs(gestee.cap - dep.cap) > 30,
     `${dep.cap}° → ${gestee.cap}°`);

  console.log('\n=== partir tout de suite, c\'est déplacer ===');
  /* La main reste la main : c'est l'IMMOBILITÉ qui demande la rotation. */
  await poser();
  await page.evaluate(() => window.app.setTool('pan'));
  const v0 = await page.evaluate(() => ({ x: window.app.view.x, y: window.app.view.y }));
  const co0 = (await figure()).co;
  await page.mouse.move(500, 500);
  await page.mouse.down();
  await page.mouse.move(560, 520, { steps: 5 });
  await page.waitForTimeout(700);
  const pendant = await page.evaluate(() => ({ rot: !!window.app.rotationFigure,
                                               view: { x: window.app.view.x, y: window.app.view.y } }));
  await page.mouse.up();
  const co1 = (await figure()).co;
  console.log('  ' + JSON.stringify(pendant));
  ck('aucune rotation ne s\'arme', pendant.rot === false);
  ck('la vue s\'est déplacée', pendant.view.x - v0.x === 60 && pendant.view.y - v0.y === 20,
     JSON.stringify(pendant.view));
  ck('et la figure n\'a pas bougé d\'un pixel', JSON.stringify(co1) === JSON.stringify(co0));

  console.log('\n=== Échap annule la rotation en cours ===');
  await poser();
  await page.evaluate(() => window.app.setTool('pan'));
  const co2 = (await figure()).co;
  await page.mouse.move(ecran.x + 200, ecran.y);
  await page.mouse.down();
  await page.waitForTimeout(700);
  await page.mouse.move(ecran.x, ecran.y + 200, { steps: 6 });
  await page.waitForTimeout(100);
  await page.keyboard.press('Escape');
  await page.mouse.up();
  await page.waitForTimeout(150);
  const co3 = (await figure()).co;
  console.log('  ' + JSON.stringify(co3));
  ck('la figure revient exactement où elle était',
     JSON.stringify(co3) === JSON.stringify(co2), JSON.stringify(co3));

  console.log('\n=== une feuille vide ne tourne pas ===');
  const vide = await page.evaluate(() => {
    const app = window.app;
    app.entities = []; app.historyPast = []; app.saveState();
    return app.tournerFigure(90);
  });
  ck('elle le dit au lieu de faire semblant', vide === false, String(vide));

  ck('aucune erreur JS', errs.length === 0, errs.slice(0, 3).join(' | '));
  await b.close();
  console.log(`\n${fail ? `=== ${fail} échec(s) ===` : '=== tout passe ==='}`);
  process.exit(fail ? 1 : 0);
})();
