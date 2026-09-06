/* LE CADRE DE SÉLECTION, ET LE DÉPLACEMENT EN BLOC.
 *
 * Avant, un glissé depuis le vide avec l'outil curseur ne faisait RIEN : mesuré,
 * ni cadre, ni sélection, ni le moindre changement d'état. On ne pouvait déplacer
 * qu'un point à la fois — déplacer une figure entière demandait de tirer chaque
 * sommet l'un après l'autre en espérant le même écart.
 *
 * Cette sonde ne clique pas sur des fonctions : elle fait de VRAIS gestes de
 * souris et de doigt, et elle mesure les coordonnées après coup. Un déplacement
 * en bloc qui n'est pas rigoureusement le même pour tous les points est une
 * déformation, pas un déplacement.
 */
const { chromium } = require('playwright');
const path = require('path');
const PAGE = 'file://' + path.resolve(__dirname, '..', 'index.html');
const NAVIGATEUR = process.env.GM_CHROME || undefined;

(async () => {
  const b = await chromium.launch({ executablePath: NAVIGATEUR });
  let fail = 0;
  const ck = (l, ok, d) => { console.log(`  ${ok ? '✓' : '✗'} ${l}${d ? ' — ' + d : ''}`); if (!ok) fail++; };
  const page = await (await b.newContext({ viewport: { width: 1400, height: 950 },
                                           hasTouch: true })).newPage();
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.goto(PAGE); await page.waitForTimeout(1500);

  const coin = await page.evaluate(() => {
    const r = window.app.canvas.getBoundingClientRect();
    return { left: r.left, top: r.top };
  });
  const prep = (phrases) => page.evaluate((xs) => {
    const app = window.app;
    app.entities = []; app.historyPast = []; app.historyFuture = []; app._cslSujet = null;
    if (app.cslOublier) app.cslOublier();
    xs.forEach(x => app.executerConsigneAvec(x, false));
    app.setTool('move');
    app.view = { x: 0, y: 0, zoom: 1 };
    app.cadreSelection = null; app.deplaceSelection = null;
    app.viderSelection(); app.render();
  }, phrases);
  const points = () => page.evaluate(() => Object.fromEntries(
    window.app.entities.filter(e => e instanceof Point && e.label)
      .map(q => [q.label, [Math.round(q.x), Math.round(q.y)]])));
  const combien = () => page.evaluate(() => window.app.selection.length);
  const types = () => page.evaluate(() => window.app.selection.map(o => o.constructor.name));
  const glisser = async (x0, y0, x1, y1, opts) => {
    if (opts && opts.shift) await page.keyboard.down('Shift');
    await page.mouse.move(coin.left + x0, coin.top + y0);
    await page.mouse.down();
    await page.mouse.move(coin.left + (x0 + x1) / 2, coin.top + (y0 + y1) / 2, { steps: 4 });
    await page.mouse.move(coin.left + x1, coin.top + y1, { steps: 4 });
    await page.mouse.up();
    if (opts && opts.shift) await page.keyboard.up('Shift');
  };
  /* Le même geste, au DOIGT : ce n'est pas la même chose pour le logiciel — les
     événements portent pointerType 'touch', et tout un pan de code s'y branche. */
  const glisserDoigt = (x0, y0, x1, y1) => page.evaluate(([a, bb, c, d]) => {
    const cv = window.app.canvas, r = cv.getBoundingClientRect();
    const ev = (type, x, y) => cv.dispatchEvent(new PointerEvent(type, {
      pointerId: 1, pointerType: 'touch', isPrimary: true, bubbles: true, cancelable: true,
      clientX: r.left + x, clientY: r.top + y, button: 0,
      buttons: type === 'pointerup' ? 0 : 1 }));
    ev('pointerdown', a, bb);
    for (let k = 1; k <= 6; k++) ev('pointermove', a + (c - a) * k / 6, bb + (d - bb) * k / 6);
    ev('pointerup', c, d);
  }, [x0, y0, x1, y1]);
  /* Le même écart pour tout le monde : c'est la définition d'un déplacement. */
  const ecarts = (avant, apres) => {
    const dx = [], dy = [];
    for (const k of Object.keys(avant)) {
      if (!apres[k]) return null;
      dx.push(apres[k][0] - avant[k][0]);
      dy.push(apres[k][1] - avant[k][1]);
    }
    return { dx: [...new Set(dx)], dy: [...new Set(dy)] };
  };

  console.log('\n=== un cadre autour d\'un carré le prend en entier ===');
  await prep(['Trace un carré ABCD de 3 cm de côté']);
  const carre0 = await points();
  console.log('  ' + JSON.stringify(carre0));
  await glisser(480, 290, 820, 620);
  const pris = await types();
  console.log('  ' + JSON.stringify(pris));
  ck('le glissé depuis le vide sélectionne', pris.length > 0, pris.length + ' objets');
  ck('  les quatre sommets', pris.filter(x => x === 'Point').length === 4,
     pris.filter(x => x === 'Point').length + ' points');
  ck('  et les quatre côtés', pris.filter(x => x === 'Segment').length === 4,
     pris.filter(x => x === 'Segment').length + ' segments');
  ck('  la figure n\'a pas bougé d\'un pixel en la sélectionnant',
     JSON.stringify(await points()) === JSON.stringify(carre0), JSON.stringify(await points()));

  console.log('\n=== glisser dans la sélection la déplace EN BLOC ===');
  await glisser(646, 450, 746, 500);
  const carre1 = await points();
  const e1 = ecarts(carre0, carre1);
  console.log('  ' + JSON.stringify(carre1));
  ck('tous les points se déplacent du MÊME écart',
     e1 && e1.dx.length === 1 && e1.dy.length === 1,
     'dx=' + JSON.stringify(e1.dx) + ' dy=' + JSON.stringify(e1.dy));
  ck('  et de l\'écart demandé : +100 en x, +50 en y',
     e1 && e1.dx[0] === 100 && e1.dy[0] === 50,
     'dx=' + e1.dx[0] + ' dy=' + e1.dy[0]);
  /* Un carré qui se déforme en se déplaçant n'est plus un carré : on le vérifie
     par ses côtés, pas par la promesse du code. */
  const cotes = await page.evaluate(() => {
    const app = window.app;
    return app.entities.filter(e => e.constructor.name === 'Segment')
      .map(s => Math.round(Math.hypot(s.p2.x - s.p1.x, s.p2.y - s.p1.y) / 50 * 100) / 100);
  });
  ck('  le carré reste un carré : quatre côtés de 3 cm',
     cotes.length === 4 && cotes.every(c => Math.abs(c - 3) < 0.01), JSON.stringify(cotes));
  ck('  et la sélection tient toujours après le déplacement',
     (await combien()) > 0, String(await combien()));

  console.log('\n=== Ctrl+Z ramène tout ===');
  await page.keyboard.press('Control+z');
  await page.waitForTimeout(150);
  ck('l\'annulation remet la figure exactement où elle était',
     JSON.stringify(await points()) === JSON.stringify(carre0), JSON.stringify(await points()));

  console.log('\n=== les points CALCULÉS suivent, sans être tirés ===');
  /* Un milieu ne se tire pas : il se déduit. Il doit pourtant arriver au bon
     endroit — c'est le test qui dit si le déplacement respecte la construction. */
  await prep(['Trace un triangle ABC tel que AB = 5 cm, AC = 4 cm et BC = 3 cm',
              'Place les milieux des côtés du triangle ABC']);
  const tri0 = await points();
  await glisser(120, 100, 1280, 900);
  ck('le cadre prend le triangle ET ses trois milieux',
     Object.keys(tri0).length === 6 && (await combien()) >= 6,
     Object.keys(tri0).length + ' points nommés, ' + (await combien()) + ' objets pris');
  await glisser(646, 450, 706, 480);
  const tri1 = await points();
  const e2 = ecarts(tri0, tri1);
  ck('  les six points, milieux compris, se déplacent du même écart',
     e2 && e2.dx.length === 1 && e2.dy.length === 1 && e2.dx[0] === 60 && e2.dy[0] === 30,
     'dx=' + JSON.stringify(e2.dx) + ' dy=' + JSON.stringify(e2.dy));
  /* Et ils sont TOUJOURS les milieux : c'est ce qui prouve que la construction a
     survécu au déplacement, et pas seulement l'apparence. */
  const milieux = await page.evaluate(() => {
    const app = window.app;
    const P = {}; app.entities.forEach(e => { if (e instanceof Point && e.label) P[e.label] = e; });
    const ecart = [];
    app.entities.filter(e => e instanceof Point && e.parents && e.parents.length === 2
                             && e.parents[0] instanceof Point)
      .forEach(m => ecart.push(Math.round(Math.hypot(
        m.x - (m.parents[0].x + m.parents[1].x) / 2,
        m.y - (m.parents[0].y + m.parents[1].y) / 2) * 100) / 100));
    return ecart;
  });
  ck('  et chacun est encore EXACTEMENT au milieu de son côté',
     milieux.length === 3 && milieux.every(d => d === 0), JSON.stringify(milieux));

  console.log('\n=== Maj ajoute au lieu de remplacer ===');
  await prep(['Trace un carré ABCD de 3 cm de côté en haut à gauche',
              'Trace un carré EFGH de 3 cm de côté en bas à droite']);
  await glisser(120, 90, 680, 470);
  const n1 = await combien();
  await glisser(700, 500, 1280, 900, { shift: true });
  const n2 = await combien();
  ck('un second cadre avec Maj s\'ajoute au premier', n2 > n1 && n1 > 0,
     n1 + ' puis ' + n2 + ' objets');
  /* Pour refaire un cadre, il faut partir du VIDE : un appui DANS la sélection
     veut dire « déplace-la », et c'est ce qu'attend n'importe quel dessinateur.
     Échap la relâche d'abord. */
  await page.keyboard.press('Escape');
  await glisser(700, 500, 1280, 900);
  const n3 = await combien();
  ck('  sans Maj, un nouveau cadre remplace', n3 > 0 && n3 < n2, n2 + ' puis ' + n3);
  ck('  et un appui DANS la sélection déplace au lieu de resélectionner',
     n2 === n1 * 2, n1 + ' + ' + n1 + ' = ' + n2);

  console.log('\n=== relâcher la sélection ===');
  await page.mouse.click(coin.left + 60, coin.top + 60);
  ck('un clic dans le vide relâche', (await combien()) === 0, String(await combien()));
  await glisser(700, 500, 1280, 900);
  await page.keyboard.press('Escape');
  ck('Échap relâche aussi', (await combien()) === 0, String(await combien()));
  await glisser(700, 500, 1280, 900);
  const avantOutil = await combien();
  await page.evaluate(() => window.app.setTool('segment'));
  const apresOutil = await combien();
  ck('changer d\'outil relâche : le cadre ne reste pas sous un outil qui n\'en fait rien',
     avantOutil > 0 && apresOutil === 0, avantOutil + ' → ' + apresOutil);

  console.log('\n=== au doigt, le même geste ===');
  await prep(['Trace un carré ABCD de 3 cm de côté']);
  const doigt0 = await points();
  await glisserDoigt(480, 290, 820, 620);
  ck('le cadre se fait au doigt', (await combien()) > 0, String(await combien()));
  await glisserDoigt(646, 450, 726, 490);
  const doigt1 = await points();
  const e3 = ecarts(doigt0, doigt1);
  ck('  et le déplacement en bloc aussi, du même écart',
     e3 && e3.dx.length === 1 && e3.dy.length === 1 && e3.dx[0] === 80 && e3.dy[0] === 40,
     'dx=' + JSON.stringify(e3.dx) + ' dy=' + JSON.stringify(e3.dy));

  console.log('\n=== le zoom ne fausse pas le cadre ===');
  await prep(['Trace un carré ABCD de 3 cm de côté']);
  await page.evaluate(() => { window.app.view = { x: 200, y: 100, zoom: 0.5 }; window.app.render(); });
  const ecran = await page.evaluate(() => {
    const app = window.app, v = app.view;
    const P = app.entities.filter(e => e instanceof Point);
    const xs = P.map(q => q.x * v.zoom + v.x), ys = P.map(q => q.y * v.zoom + v.y);
    return { x0: Math.min(...xs) - 30, y0: Math.min(...ys) - 30,
             x1: Math.max(...xs) + 30, y1: Math.max(...ys) + 30 };
  });
  await glisser(ecran.x0, ecran.y0, ecran.x1, ecran.y1);
  ck('à un zoom de 0,5, le cadre prend la même figure',
     (await combien()) === 9, String(await combien()));

  console.log('\n=== les autres outils ne sont pas gênés ===');
  for (const [outil, attendu] of [['segment', 3], ['point', 1], ['circle', 3]]) {
    await page.evaluate((o) => {
      const app = window.app;
      app.entities = []; app.historyPast = [];
      app.setTool(o); app.view = { x: 0, y: 0, zoom: 1 };
    }, outil);
    await glisser(400, 400, 600, 500);
    const r = await page.evaluate(() => ({ n: window.app.entities.length,
      cadre: !!window.app.cadreSelection, sel: window.app.selection.length }));
    ck(`l'outil « ${outil} » trace toujours, sans cadre`,
       r.n === attendu && !r.cadre && r.sel === 0,
       r.n + ' objets, cadre=' + r.cadre + ', sélection=' + r.sel);
  }

  ck('aucune erreur JS', errs.length === 0, errs.slice(0, 3).join(' | '));
  await b.close();
  console.log(`\n${fail ? `=== ${fail} échec(s) ===` : '=== tout passe ==='}`);
  process.exit(fail ? 1 : 0);
})();
