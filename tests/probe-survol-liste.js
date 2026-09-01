// Survoler une ligne du tiroir « Objets & Propriétés » doit allumer l'objet
// correspondant sur la feuille — et ne rien changer d'autre.
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

  // deux segments horizontaux bien séparés, et le tiroir ouvert
  await page.evaluate(() => {
    const app = window.app, rc = app.canvas.getBoundingClientRect();
    const cl = (s) => ({ X: s.x*app.view.zoom+app.view.x+rc.left, Y: s.y*app.view.zoom+app.view.y+rc.top });
    const ev = (t, s, bt) => { const c = cl(s); (t==='pointerup'?window:app.canvas).dispatchEvent(new PointerEvent(t,{
      pointerId:3, pointerType:'mouse', isPrimary:true, button:0, buttons:bt, clientX:c.X, clientY:c.Y,
      bubbles:true, cancelable:true })); };
    const gl = (a,c) => { ev('pointerdown',a,1);
      for (let i=1;i<=8;i++) ev('pointermove',{x:a.x+(c.x-a.x)*i/8,y:a.y+(c.y-a.y)*i/8},1); ev('pointerup',c,0); };
    app.entities = []; app.historyPast = []; app.saveState();
    app.setTool('segment'); gl({x:200,y:250},{x:600,y:250}); gl({x:200,y:400},{x:600,y:400});
    app.setTool('select');
    if (!document.getElementById('rightPanel').classList.contains('open')) app.toggleRightPanel();
    app.render();
  });
  await page.waitForTimeout(600);   // le tiroir coulisse

  // compte les pixels orangés dans une fenêtre centrée sur le milieu d'un segment
  const halo = (yFig) => page.evaluate((yFig) => {
    const app = window.app, c = app.canvas, ctx = c.getContext('2d');
    const X = 400*app.view.zoom + app.view.x, Y = yFig*app.view.zoom + app.view.y;
    const dpr = c.width / c.getBoundingClientRect().width;
    const d = ctx.getImageData(Math.round((X-30)*dpr), Math.round((Y-20)*dpr),
                               Math.round(60*dpr), Math.round(40*dpr)).data;
    let orange = 0;
    for (let i = 0; i < d.length; i += 4) {
      const r = d[i], g = d[i+1], bl = d[i+2], a = d[i+3];
      if (a > 10 && r > 150 && g > 60 && g < 210 && bl < 120) orange++;
    }
    return orange;
  }, yFig);
  const lignes = () => page.evaluate(() =>
    [...document.querySelectorAll('#objectList .obj-item')].map(r => r.innerText.replace(/\s+/g, ' ').trim()));
  const survoler = async (i) => { await (await page.$$('#objectList .obj-item'))[i].hover(); await page.waitForTimeout(150); };

  const noms = await lignes();
  console.log('  lignes : ' + JSON.stringify(noms));
  const iSeg = noms.map((t, i) => ({ t, i })).filter(o => /Segment/.test(o.t)).map(o => o.i);
  const iPoint = noms.findIndex(t => /Point/.test(t));
  ck('le tiroir liste bien les objets', iSeg.length === 2 && iPoint >= 0, JSON.stringify(noms));

  console.log('\n=== le halo suit la ligne survolée ===');
  ck('rien n\'est allumé au départ', (await halo(250)) === 0 && (await halo(400)) === 0);
  await survoler(iSeg[0]);
  const a1 = await halo(250), a2 = await halo(400);
  console.log(`  survol du 1er segment : ${a1} px orangés en haut, ${a2} en bas`);
  ck('le segment survolé s\'allume', a1 > 300, String(a1));
  ck('et lui seul', a2 === 0, String(a2));
  await survoler(iSeg[1]);
  const b1 = await halo(250), b2 = await halo(400);
  console.log(`  survol du 2e segment  : ${b1} px orangés en haut, ${b2} en bas`);
  ck('le halo passe à l\'autre segment', b2 > 300 && b1 === 0, `${b1} / ${b2}`);
  await page.mouse.move(640, 820); await page.waitForTimeout(150);
  ck('curseur hors de la liste : plus de halo', (await halo(250)) === 0 && (await halo(400)) === 0);

  console.log('\n=== survoler ne modifie rien ===');
  const avant = await page.evaluate(() => ({ n: window.app.entities.length,
    sel: window.app.selectedObject ? window.app.selectedObject.id : null }));
  await survoler(iSeg[0]);
  const apres = await page.evaluate(() => ({ n: window.app.entities.length,
    sel: window.app.selectedObject ? window.app.selectedObject.id : null,
    survole: !!window.app.objetSurvoleListe }));
  ck('aucun objet créé ni supprimé', apres.n === avant.n, `${avant.n} → ${apres.n}`);
  ck('rien n\'est sélectionné au passage', apres.sel === avant.sel, `${avant.sel} → ${apres.sel}`);
  ck('mais l\'objet survolé est bien retenu', apres.survole === true);

  console.log('\n=== la ligne ne s\'évapore pas sous le curseur ===');
  /* render() reconstruisait la liste entière à chaque image : la ligne qu'on
     survolait était détruite au moment même où l'on s'en servait. Elle n'est
     désormais refaite que si son contenu a changé. */
  const stable = await page.evaluate(() => {
    const app = window.app;
    const avant = document.querySelector('#objectList .obj-item');
    for (let i = 0; i < 5; i++) app.render();
    return document.querySelector('#objectList .obj-item') === avant;
  });
  ck('cinq rendus de suite ne refont pas la liste', stable === true);
  const refait = await page.evaluate(() => {
    const app = window.app;
    const avant = document.querySelector('#objectList .obj-item');
    app.entities = app.entities.filter(e => e.constructor.name !== 'Segment');
    app.render();
    return { change: document.querySelector('#objectList .obj-item') !== avant,
             restant: document.querySelectorAll('#objectList .obj-item').length };
  });
  ck('mais un objet supprimé la refait bel et bien', refait.change === true, JSON.stringify(refait));

  console.log('\n=== un objet masqué ne s\'allume pas ===');
  const masque = await page.evaluate(async () => {
    const app = window.app, rc = app.canvas.getBoundingClientRect();
    const cl = (s) => ({ X: s.x*app.view.zoom+app.view.x+rc.left, Y: s.y*app.view.zoom+app.view.y+rc.top });
    const ev = (t, s, bt) => { const c = cl(s); (t==='pointerup'?window:app.canvas).dispatchEvent(new PointerEvent(t,{
      pointerId:3, pointerType:'mouse', isPrimary:true, button:0, buttons:bt, clientX:c.X, clientY:c.Y,
      bubbles:true, cancelable:true })); };
    app.entities = []; app.historyPast = []; app.saveState(); app.setTool('segment');
    ev('pointerdown',{x:200,y:250},1);
    for (let i=1;i<=8;i++) ev('pointermove',{x:200+400*i/8,y:250},1);
    ev('pointerup',{x:600,y:250},0);
    app.setTool('select');
    const seg = app.entities.find(e => e.constructor.name === 'Segment');
    seg.visible = false;
    app.objetSurvoleListe = seg;
    app.render();
    return true;
  });
  ck('l\'objet masqué reste éteint', masque && (await halo(250)) === 0, String(await halo(250)));

  console.log('\n=== la palette de style ne recouvre plus la liste ===');
  const couvre = await page.evaluate(() => {
    const rows = [...document.querySelectorAll('#objectList .obj-item')];
    const pal = document.getElementById('stylePalettePanel');
    const genes = rows.filter(row => {
      const r = row.getBoundingClientRect();
      if (r.bottom > window.innerHeight) return false;      // simplement plus bas que l'écran
      const el = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
      return el && !row.contains(el);
    }).length;
    return { palette: getComputedStyle(pal).display !== 'none', genes, lignes: rows.length };
  });
  console.log('  ' + JSON.stringify(couvre));
  ck('la palette est bien ouverte (c\'est le cas gênant)', couvre.palette === true);
  ck('aucune ligne visible n\'est recouverte', couvre.genes === 0, String(couvre.genes));

  ck('aucune erreur JS', errs.length === 0, errs.slice(0, 3).join(' | '));
  await b.close();
  console.log(`\n${fail ? `=== ${fail} échec(s) ===` : '=== tout passe ==='}`);
  process.exit(fail ? 1 : 0);
})();
