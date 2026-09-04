// Donner au clavier la longueur d'un segment ou la valeur d'un angle : on
// double-clique sur le nombre affiché, on tape, la figure obéit.
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
  const rc = await page.evaluate(() => { const r = app.canvas.getBoundingClientRect(); return { l: r.left, t: r.top }; });

  // double-clic sur le nombre affiché, puis saisie
  const taper = async (boite, txt) => {
    await page.mouse.dblclick(rc.l + boite.x, rc.t + boite.y);
    await page.waitForTimeout(150);
    if (!await page.evaluate(() => !!app.activeRenameInput)) return false;
    await page.keyboard.press('Control+a');
    await page.keyboard.type(txt);
    await page.keyboard.press('Enter');
    await page.waitForTimeout(150);
    return true;
  };

  const unSegment = (unite) => page.evaluate((unite) => {
    const app = window.app, rc = app.canvas.getBoundingClientRect();
    const ev = (t, s, bt) => { (t === 'pointerup' ? window : app.canvas).dispatchEvent(new PointerEvent(t, {
      pointerId: 3, pointerType: 'mouse', isPrimary: true, button: 0, buttons: bt,
      clientX: s.x + rc.left, clientY: s.y + rc.top, bubbles: true, cancelable: true })); };
    app.entities = []; app.historyPast = []; app.saveState(); app.view = { x: 0, y: 0, zoom: 1 };
    app.setTool('segment');
    ev('pointerdown', { x: 300, y: 400 }, 1);
    for (let i = 1; i <= 6; i++) ev('pointermove', { x: 300 + 280 * i / 6, y: 400 }, 1);
    ev('pointerup', { x: 580, y: 400 }, 0);
    app.setTool('select');
    const seg = app.entities.find(e => e.constructor.name === 'Segment');
    seg.showLength = true; seg.lengthUnit = unite; app.render();
    return { boite: seg.boiteMesure(app.ctx), texte: seg.texteLongueur() };
  }, unite);

  const lireSegment = () => page.evaluate(() => {
    const seg = app.entities.find(e => e.constructor.name === 'Segment');
    return { texte: seg.texteLongueur(), px: +Math.hypot(seg.p2.x - seg.p1.x, seg.p2.y - seg.p1.y).toFixed(1),
             p1: [seg.p1.x, seg.p1.y] };
  });

  console.log('\n=== la longueur d\'un segment ===');
  /* Tout se traçait à la main : on visait 6 cm et l'on tombait sur 5,6. */
  let s = await unSegment(null);
  ck('au départ, la longueur est celle du geste', s.texte === '5.6', s.texte);
  ck('le double-clic ouvre la mesure', await taper(s.boite, '6'));
  let r = await lireSegment();
  console.log('  ' + JSON.stringify(r));
  // 50 px pour 1 cm : 6 cm valent exactement 300 px
  ck('le segment mesure vraiment 6 cm', r.texte === '6.0' && Math.abs(r.px - 300) < 0.5, `${r.texte}, ${r.px} px`);
  ck('c\'est le second point qui a bougé, pas le premier',
     r.p1[0] === 300 && r.p1[1] === 400, JSON.stringify(r.p1));

  console.log('\n=== dans l\'unité affichée, pas en centimètres ===');
  /* Le champ parle la langue du segment : s'il s'affiche en mm, 40 veut dire
     40 mm — sans quoi on écrirait 4 pour obtenir « 40 mm ». */
  s = await unSegment('mm');
  ck('la mesure s\'affiche en mm', s.texte === '56 mm', s.texte);
  ck('le double-clic ouvre la mesure', await taper(s.boite, '40'));
  r = await lireSegment();
  ck('40 tapé en mm donne 40 mm', r.texte === '40 mm' && Math.abs(r.px - 200) < 0.5, `${r.texte}, ${r.px} px`);

  console.log('\n=== la valeur d\'un angle ===');
  const a = await page.evaluate(() => {
    const app = window.app;
    app.entities = []; app.historyPast = []; app.saveState(); app.view = { x: 0, y: 0, zoom: 1 };
    const A = app.createPointAt(600, 300), O = app.createPointAt(400, 500), B = app.createPointAt(600, 600);
    const ang = new (eval('Angle'))(A, O, B);
    app.addEntity(ang); app.render();
    return { val: +ang.getAngleValue().toFixed(1), boite: ang.boiteMesure(app.ctx) };
  });
  ck('l\'angle vaut ce que valait le geste', Math.abs(a.val - 71.6) < 0.2, String(a.val));
  ck('le double-clic ouvre la valeur', await taper(a.boite, '60'));
  const va = await page.evaluate(() => {
    const ang = app.entities.find(e => e.constructor.name === 'Angle');
    return +ang.getAngleValue().toFixed(2);
  });
  ck('l\'angle vaut 60°', Math.abs(va - 60) < 0.01, String(va));

  console.log('\n=== ce qu\'on ne peut pas faire ===');
  const refus = await page.evaluate(() => {
    const app = window.app;
    const seg = { p1: null, p2: null, lengthUnit: null, showLength: true };
    /* Deux extrémités définies par d'AUTRES objets : les déplacer n'aurait
       aucun sens, elles reviendraient à leur place à la mise à jour suivante. */
    const A = app.createPointAt(100, 100), B = app.createPointAt(200, 100);
    A.parents = [B]; B.parents = [A];
    seg.p1 = A; seg.p2 = B;
    return { lie: app.appliquerMesure(seg, 5),
             negatif: app.appliquerMesure({ p1: app.createPointAt(700, 100), p2: app.createPointAt(800, 100) }, -2),
             angleFou: app.appliquerMesure(Object.assign(Object.create(eval('Angle').prototype),
               { p1: A, p2: B, p3: A, isCounterClockwise: true }), 400) };
  });
  console.log('  ' + JSON.stringify(refus));
  ck('un segment entre deux points liés est refusé', !!refus.lie, refus.lie);
  ck('une longueur négative est refusée', !!refus.negatif, refus.negatif);
  ck('un angle de 400° est refusé', !!refus.angleFou, refus.angleFou);

  console.log('\n=== ce que ça change à l\'écran ===');
  const surface = await page.evaluate(() => {
    const app = window.app, rc = app.canvas.getBoundingClientRect();
    const ev = (t, s) => { app.canvas.dispatchEvent(new PointerEvent(t, { pointerId: 3, pointerType: 'mouse',
      isPrimary: true, button: 0, buttons: 0, clientX: s.x + rc.left, clientY: s.y + rc.top,
      bubbles: true, cancelable: true })); };
    app.entities = []; app.historyPast = []; app.saveState();
    app.setTool('segment');
    const evd = (t, s, bt) => { (t === 'pointerup' ? window : app.canvas).dispatchEvent(new PointerEvent(t, {
      pointerId: 3, pointerType: 'mouse', isPrimary: true, button: 0, buttons: bt,
      clientX: s.x + rc.left, clientY: s.y + rc.top, bubbles: true, cancelable: true })); };
    evd('pointerdown', { x: 300, y: 400 }, 1);
    for (let i = 1; i <= 6; i++) evd('pointermove', { x: 300 + 280 * i / 6, y: 400 }, 1);
    evd('pointerup', { x: 580, y: 400 }, 0);
    const seg = app.entities.find(e => e.constructor.name === 'Segment');
    seg.showLength = true;
    app.setTool('move'); app.render();
    const b = seg.boiteMesure(app.ctx);
    ev('pointermove', { x: b.x, y: b.y }); const surMesure = app.canvas.style.cursor;
    ev('pointermove', { x: 200, y: 800 }); const vide = app.canvas.style.cursor;
    // les deux boutons vivent dans des rangées qui existaient déjà
    const bl = document.getElementById('btnMesFixer'), ba = document.getElementById('btnFixerAngle');
    return { surMesure, vide,
             boutonLongueur: !!(bl && bl.closest('#rowMeasure')),
             boutonAngle: !!(ba && ba.closest('#rowAngle')),
             barres: document.querySelectorAll('#toolbar > *, .tool-btn').length };
  });
  console.log('  ' + JSON.stringify(surface));
  ck('sur une mesure, le curseur dit qu\'on écrit', surface.surMesure === 'text', surface.surMesure);
  ck('ailleurs, rien ne change', surface.vide === 'default', surface.vide);
  ck('le bouton « longueur » est dans la rangée des mesures', surface.boutonLongueur);
  ck('le bouton « angle » est dans la rangée de l\'angle', surface.boutonAngle);

  ck('aucune erreur JS', errs.length === 0, errs.slice(0, 3).join(' | '));
  await b.close();
  console.log(`\n${fail ? `=== ${fail} échec(s) ===` : '=== tout passe ==='}`);
  process.exit(fail ? 1 : 0);
})();
