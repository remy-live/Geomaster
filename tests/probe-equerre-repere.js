// L'équerre : le repère rouge qu'elle affiche, sa pose pendant un rejeu, et le
// curseur qui dit qu'un nom de point se déplace.
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

  console.log('\n=== le repère rouge tombe là où il doit ===');
  /* Deux défauts se cumulaient. Le repère se dessinait APRÈS render(), qui a déjà
     posé la transformation de vue et ne la défait pas : une translation de plus
     l'y ajoutait une seconde fois. Et la détection lisait les coordonnées locales
     sur la position de l'image PRÉCÉDENTE, w.x n'étant affecté qu'en fin de
     traitement — le repère s'allumait donc un pas de souris trop tard. */
  const guide = (vue) => page.evaluate((vue) => {
    const app = window.app;
    app.entities = []; app.historyPast = []; app.saveState(); app.setTool('select');
    app.view = { x: vue.x, y: vue.y, zoom: vue.z };
    const rc = app.canvas.getBoundingClientRect();
    const ev = (t, s, bt) => { const X = s.x*app.view.zoom+app.view.x+rc.left, Y = s.y*app.view.zoom+app.view.y+rc.top;
      (t==='pointerup'?window:app.canvas).dispatchEvent(new PointerEvent(t,{ pointerId:3, pointerType:'mouse',
        isPrimary:true, button:0, buttons:bt, clientX:X, clientY:Y, bubbles:true, cancelable:true })); };
    for (const w of ['setsquare']) if (!app.activeWidgets[w]) app.toggleWidget(w);
    for (const w of ['ruler', 'compass', 'protractor']) if (app.activeWidgets[w]) app.toggleWidget(w);
    app.setTool('segment');
    ev('pointerdown', {x:150,y:500}, 1);
    for (let i = 1; i <= 6; i++) ev('pointermove', {x:150+700*i/6, y:500}, 1);
    ev('pointerup', {x:850,y:500}, 0);
    app.setTool('select');
    // un point SOUS la droite, sur le côté vertical de l'équerre ; loin du milieu
    // du segment, qui s'aimante lui aussi depuis peu
    const P = app.createPointAt(620, 560);
    const sq = app.setSquareWidget; sq.x = 300; sq.y = 500; sq.angle = 0;
    const prise = sq.toGlobal(120, 60);
    ev('pointerdown', prise, 1);
    /* On lit les pixels À L'IMAGE OÙ LE REPÈRE EST ALLUMÉ : il s'éteint dès que
       le côté de l'équerre dépasse le point, et lire après le geste ne
       montrerait plus rien. */
    let quandAllume = null, lu = null, monde = null, attendu = null;
    for (let i = 1; i <= 20; i++) {
      ev('pointermove', { x: prise.x + 400 * i / 20, y: prise.y }, 1);
      const g = app.tempGuideLine;
      if (g && quandAllume === null) {
        quandAllume = +(P.x - sq.x).toFixed(0);
        monde = +g.p1.x.toFixed(1);
        attendu = +(g.p1.x * app.view.zoom + app.view.x).toFixed(1);
        const c = app.canvas, ctx = c.getContext('2d');
        const dpr = c.width / c.getBoundingClientRect().width;
        const yEcran = (300 * app.view.zoom + app.view.y);
        const d = ctx.getImageData(0, Math.round(yEcran * dpr), Math.round(c.width), 2).data;
        const xs = [];
        for (let x = 0; x < Math.round(c.width); x++) { const k = x * 4;
          if (d[k] > 170 && d[k+1] < 100 && d[k+2] < 100 && d[k+3] > 40) xs.push(x / dpr); }
        lu = xs.length ? +(xs.reduce((a, v) => a + v, 0) / xs.length).toFixed(1) : null;
      }
    }
    ev('pointerup', { x: prise.x + 400, y: prise.y }, 0);
    return { quandAllume, monde, attendu, lu };
  }, vue);

  for (const vue of [{ x: 0, y: 0, z: 1 }, { x: 150, y: 60, z: 1 }, { x: 40, y: 20, z: 0.8 }]) {
    const r = await guide(vue);
    const ecart = (r.lu !== null && r.attendu !== null) ? +(r.lu - r.attendu).toFixed(1) : null;
    console.log(`  vue ${JSON.stringify(vue)} → dessiné à ${r.lu}, attendu ${r.attendu} (écart ${ecart})`);
    ck(`vue ${vue.x},${vue.y} zoom ${vue.z} : le repère est au bon endroit`,
       ecart !== null && Math.abs(ecart) < 2, String(ecart));
    ck(`vue ${vue.x},${vue.y} : il s'allume quand le côté ATTEINT le point`,
       r.quandAllume !== null && Math.abs(r.quandAllume) < 6, String(r.quandAllume));
  }

  console.log('\n=== le rejeu pose vraiment l\'équerre ===');
  /* fastForward cherchait l'instrument sous « setsquareWidget », alors qu'il
     s'appelle setSquareWidget : il n'en trouvait aucun, en fabriquait un sous le
     mauvais nom, et l'équerre visible n'était jamais placée — elle restait où
     l'utilisateur l'avait laissée. */
  const rejeu = await page.evaluate(async () => {
    const app = window.app, rc = app.canvas.getBoundingClientRect();
    const ev = (t, s, bt) => { (t==='pointerup'?window:app.canvas).dispatchEvent(new PointerEvent(t,{ pointerId:3,
      pointerType:'mouse', isPrimary:true, button:0, buttons:bt, clientX:s.x+rc.left, clientY:s.y+rc.top,
      bubbles:true, cancelable:true })); };
    app.entities = []; app.historyPast = []; app.stepInstructions = {}; app.saveState();
    app.view = { x: 0, y: 0, zoom: 1 };
    // on range l'équerre très loin : si le rejeu la place, elle reviendra
    if (!app.activeWidgets.setsquare) app.toggleWidget('setsquare');
    app.setSquareWidget.x = -3000; app.setSquareWidget.y = -3000; app.setSquareWidget.angle = 1.2;
    app.setTool('segment');
    ev('pointerdown', {x:640,y:180}, 1);
    for (let i = 1; i <= 6; i++) ev('pointermove', {x:640, y:180+520*i/6}, 1);
    ev('pointerup', {x:640,y:700}, 0);
    app.setTool('select');
    const axe = app.entities.find(e => e.constructor.name === 'Segment');
    const M = app.createPointAt(400, 320); M.label = 'M';
    app.buildSymAxiale([M], axe);
    await new Promise(r => setTimeout(r, 400));
    const idx = app.entities.findIndex(e => e.constructor.name === 'ToolAnimation' && e.widgetType === 'setsquare');
    app.isPlaying = false; app.isToolAnimating = false;
    app.replayIndex = idx + 1; app.fastForward(idx + 1); app.render();
    const sq = app.setSquareWidget;
    if (!sq) return { err: 'aucune équerre' };
    const bout = sq.toGlobal(sq.width, 0);
    return { idx, x: Math.round(sq.x), y: Math.round(sq.y),
             boutX: Math.round(bout.x), pointX: M.x, axeX: 640 };
  });
  console.log('  ' + JSON.stringify(rejeu));
  ck('l\'équerre existe et n\'est plus au fond de la feuille',
     !rejeu.err && rejeu.x === 640 && rejeu.y === 320, JSON.stringify(rejeu));
  /* Le geste réel : on plaque l'équerre contre l'axe et l'on trace VERS le point.
     Son bord gradué doit donc partir du côté du point, pas de l'autre. */
  ck('elle est posée du côté du point, pas de l\'autre',
     rejeu.boutX < rejeu.axeX, `bord vers x=${rejeu.boutX}, axe à ${rejeu.axeX}, point à ${rejeu.pointX}`);

  console.log('\n=== le nom d\'un point annonce qu\'il se déplace ===');
  const curseur = await page.evaluate(() => {
    const app = window.app, rc = app.canvas.getBoundingClientRect();
    const ev = (t, s, bt) => { (t==='pointerup'?window:app.canvas).dispatchEvent(new PointerEvent(t,{ pointerId:3,
      pointerType:'mouse', isPrimary:true, button:0, buttons:bt||0, clientX:s.x+rc.left, clientY:s.y+rc.top,
      bubbles:true, cancelable:true })); };
    app.entities = []; app.historyPast = []; app.saveState(); app.view = { x:0, y:0, zoom:1 };
    app.setTool('segment');
    ev('pointerdown', {x:300,y:400}, 1);
    for (let i = 1; i <= 6; i++) ev('pointermove', {x:300+300*i/6, y:400}, 1);
    ev('pointerup', {x:600,y:400}, 0);
    app.setTool('move');
    const p = app.entities.find(e => e.constructor.name === 'Point');
    const d = p.padding + (p.fontSize || 14) / 2;
    const lire = (s) => { ev('pointermove', s, 0); return app.canvas.style.cursor; };
    return { nom: lire({ x: p.x, y: p.y - d }), trait: lire({ x: 450, y: 400 }),
             vide: lire({ x: 200, y: 700 }) };
  });
  console.log('  ' + JSON.stringify(curseur));
  ck('sur le nom : la main qui prend', curseur.nom === 'grab', curseur.nom);
  ck('sur un trait : le pointeur, comme avant', curseur.trait === 'pointer', curseur.trait);
  ck('dans le vide : rien', curseur.vide === 'default', curseur.vide);

  ck('aucune erreur JS', errs.length === 0, errs.slice(0, 3).join(' | '));
  await b.close();
  console.log(`\n${fail ? `=== ${fail} échec(s) ===` : '=== tout passe ==='}`);
  process.exit(fail ? 1 : 0);
})();
