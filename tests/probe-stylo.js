// Le stylo simple : il annote, et l'encre SUIT ce qu'elle annote.
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
  await page.goto(PAGE); await page.waitForTimeout(1500);
  await page.evaluate(`
    window.__s = {
      trace(pts){const app=window.app,cv=app.canvas,r=cv.getBoundingClientRect();
        const cl=(q)=>({X:q.x*app.view.zoom+app.view.x+r.left,Y:q.y*app.view.zoom+app.view.y+r.top});
        const ev=(t,q,bt)=>{const c=cl(q);const o={pointerId:6,pointerType:'mouse',isPrimary:true,button:0,buttons:bt,
          clientX:c.X,clientY:c.Y,bubbles:true,cancelable:true};
          (t==='pointerup'?window:cv).dispatchEvent(new PointerEvent(t,o));};
        ev('pointerdown',pts[0],1); for(let i=1;i<pts.length;i++) ev('pointermove',pts[i],1);
        ev('pointerup',pts[pts.length-1],0);},
      // petit arc autour d'un point, comme un codage d'angle
      arc(cx,cy,r,a0,a1,n){const o=[];for(let i=0;i<=n;i++){const a=a0+(a1-a0)*i/n;
        o.push({x:cx+r*Math.cos(a),y:cy+r*Math.sin(a)});}return o;},
      seg(a,bb,n){const o=[];for(let i=0;i<=n;i++){const t=i/n;
        o.push({x:a.x+(bb.x-a.x)*t,y:a.y+(bb.y-a.y)*t});}return o;},
    };`);

  console.log('\n=== l\'encre ne crée aucune géométrie ===');
  const r1 = await page.evaluate(() => {
    const s = window.__s, a = window.app;
    a.entities = []; a.historyPast = []; a.saveState();
    a.setTool('stylo');
    s.trace(s.arc(400, 400, 90, 0, Math.PI * 1.6, 40));
    const nb = (k) => a.entities.filter(e => e.constructor.name === k).length;
    return { annot: nb('Annotation'), pts: nb('Point'), cercles: nb('Circle'), segs: nb('Segment'),
             total: a.entities.length, outil: a.currentTool };
  });
  console.log('  ' + JSON.stringify(r1));
  ck('un seul objet, une annotation', r1.annot === 1 && r1.total === 1);
  ck('aucun point, cercle ni segment créé', r1.pts === 0 && r1.cercles === 0 && r1.segs === 0);
  ck('l\'outil reste le stylo (on enchaîne les annotations)', r1.outil === 'stylo');

  console.log('\n=== ENCRE SUR UN ANGLE : elle suit quand on bouge l\'angle ===');
  const r2 = await page.evaluate(() => {
    const s = window.__s, a = window.app;
    a.entities = []; a.historyPast = []; a.saveState();
    // un angle B au sommet (400,400), branches vers (600,400) et (400,200)
    a.setTool('point');
    const P = (x, y) => { const p = new (a.entities[0] ? a.entities[0].constructor : Object)(); return p; };
    // on construit l'angle par l'API interne, plus sûr
    a.setTool('move');
    const mk = (x, y, l) => { const p = a.createPointAt(x, y); p.x = x; p.y = y; p.label = l; return p; };
    const S = mk(400, 400, 'S'), A1 = mk(600, 400, 'A'), A2 = mk(400, 200, 'C');
    const ang = new (Object.getPrototypeOf(a).constructor ? window.Angle || Object : Object)();
    return { ok: true, S: [S.x, S.y] };
  });
  console.log('  (préparation)');

  const r3 = await page.evaluate(() => {
    const s = window.__s, a = window.app;
    a.entities = []; a.historyPast = []; a.saveState();
    a.setTool('angle');
    const cl = (x, y) => { const r = a.canvas.getBoundingClientRect();
      const X = x * a.view.zoom + a.view.x + r.left, Y = y * a.view.zoom + a.view.y + r.top;
      const o = { pointerId: 7, pointerType: 'mouse', isPrimary: true, button: 0, buttons: 1,
                  clientX: X, clientY: Y, bubbles: true, cancelable: true };
      a.canvas.dispatchEvent(new PointerEvent('pointerdown', o));
      window.dispatchEvent(new PointerEvent('pointerup', { ...o, buttons: 0 })); };
    cl(600, 400); cl(400, 400); cl(400, 200);   // A, sommet S, C
    const ang = a.entities.find(e => e.constructor.name === 'Angle');
    if (!ang) return { erreur: 'angle non créé', n: a.entities.length };
    // on code l'angle : un petit arc autour du sommet
    a.setTool('stylo');
    s.trace(s.arc(400, 400, 60, -Math.PI / 2, 0, 24));
    const an = a.entities.find(e => e.constructor.name === 'Annotation');
    const avant = an.versMonde().map(p => ({ x: Math.round(p.x), y: Math.round(p.y) }));
    const ancre = an.ancre ? an.ancre.constructor.name : null;
    // on DÉPLACE l'angle ENTIER : les trois points du même vecteur. Ne bouger
    // que le sommet le déformerait, et l'encre suivrait la déformation — ce qui
    // est correct, mais ce n'est pas ce qu'on veut mesurer ici.
    [ang.p1, ang.p2, ang.p3].forEach(p => { p.x += 150; p.y += 90; });
    const apres = an.versMonde().map(p => ({ x: Math.round(p.x), y: Math.round(p.y) }));
    // on TOURNE une branche
    ang.p1.x = 400 + 200 * Math.cos(0.6); ang.p1.y = 400 + 200 * Math.sin(0.6);
    const tourne = an.versMonde().map(p => ({ x: Math.round(p.x), y: Math.round(p.y) }));
    return { ancre, mode: an.mode, avant: avant[0], apres: apres[0], tourne: tourne[0],
             dSommet: [150, 90],
             deplacement: [apres[0].x - avant[0].x, apres[0].y - avant[0].y] };
  });
  console.log('  ' + JSON.stringify(r3));
  ck('l\'encre s\'est ancrée à l\'angle', r3.ancre === 'Angle', r3.ancre);
  // « marque » ou « deux » selon la taille du tracé : les deux suivent le
  // sommet et la rotation, seule l'échelle les distingue
  ck('repère à deux points (translation + rotation)', r3.mode === 'deux' || r3.mode === 'marque', r3.mode);
  ck('déplacer le sommet emmène l\'encre du même vecteur',
     Math.abs(r3.deplacement[0] - 150) < 2 && Math.abs(r3.deplacement[1] - 90) < 2, JSON.stringify(r3.deplacement));
  ck('tourner une branche fait tourner l\'encre',
     r3.tourne.x !== r3.apres.x || r3.tourne.y !== r3.apres.y, JSON.stringify([r3.apres, r3.tourne]));

  console.log('\n=== encre sur un segment : elle suit le segment ===');
  const r4 = await page.evaluate(() => {
    const s = window.__s, a = window.app;
    a.entities = []; a.historyPast = []; a.saveState();
    a.setTool('segment');
    const cl = (x, y, t, bt) => { const r = a.canvas.getBoundingClientRect();
      const o = { pointerId: 8, pointerType: 'mouse', isPrimary: true, button: 0, buttons: bt,
                  clientX: x * a.view.zoom + a.view.x + r.left, clientY: y * a.view.zoom + a.view.y + r.top,
                  bubbles: true, cancelable: true };
      (t === 'pointerup' ? window : a.canvas).dispatchEvent(new PointerEvent(t, o)); };
    cl(300, 400, 'pointerdown', 1); cl(700, 400, 'pointermove', 1); cl(700, 400, 'pointerup', 0);
    const seg = a.entities.find(e => e.constructor.name === 'Segment');
    if (!seg) return { erreur: 'segment non créé' };
    a.setTool('stylo');
    s.trace(s.seg({ x: 500, y: 370 }, { x: 500, y: 430 }, 12));   // une barre en travers
    const an = a.entities.find(e => e.constructor.name === 'Annotation');
    const avant = an.versMonde()[0];
    // on tourne le segment de 90° autour de p1
    seg.p2.x = 300; seg.p2.y = 800;
    const apres = an.versMonde()[0];
    return { ancre: an.ancre ? an.ancre.constructor.name : null, mode: an.mode,
             avant: { x: Math.round(avant.x), y: Math.round(avant.y) },
             apres: { x: Math.round(apres.x), y: Math.round(apres.y) } };
  });
  console.log('  ' + JSON.stringify(r4));
  ck('l\'encre s\'est ancrée au segment', r4.ancre === 'Segment', r4.ancre);
  ck('tourner le segment emmène l\'encre', r4.apres.x !== r4.avant.x && r4.apres.y !== r4.avant.y, JSON.stringify(r4));

  console.log('\n=== encre dans le vide : décor pur, elle ne bouge pas ===');
  const r5 = await page.evaluate(() => {
    const s = window.__s, a = window.app;
    a.entities = []; a.historyPast = []; a.saveState();
    a.setTool('stylo');
    // une courbe, pas une droite : l'allègement d'un trait rectiligne le
    // ramène légitimement à ses deux extrémités, ce qui ne prouverait rien
    const arc = []; for (let i = 0; i <= 14; i++) { const t = i / 14 * Math.PI;
      arc.push({ x: 900 + 60 * (1 - Math.cos(t)), y: 700 + 60 * Math.sin(t) }); }
    s.trace(arc);
    const an = a.entities.find(e => e.constructor.name === 'Annotation');
    return { ancre: an.ancre, mode: an.mode, p0: an.versMonde()[0], n: an.local.length };
  });
  ck('aucune ancre', r5.ancre === null && r5.mode === 'libre');
  ck('coordonnées de feuille conservées', Math.abs(r5.p0.x - 900) < 2 && Math.abs(r5.p0.y - 700) < 2, JSON.stringify(r5.p0));
  ck('la courbe garde ses points', r5.n > 4, r5.n + ' points gardés sur 15');

  console.log('\n=== enregistrement et relecture ===');
  const r6 = await page.evaluate(() => {
    const a = window.app;
    const json = a.serialize();
    const rec = a.deserialize(json);
    const an = rec.find(e => e.constructor.name === 'Annotation');
    return { present: !!an, pts: an ? an.local.length : 0, mode: an ? an.mode : null };
  });
  ck('l\'encre survit à l\'enregistrement', r6.present === true && r6.pts > 4, JSON.stringify(r6));
  ck('aucune erreur JS', errs.length === 0, errs.slice(0, 3).join(' | '));
  await b.close();
  console.log(`\n${fail ? `=== ${fail} échec(s) ===` : '=== tout passe ==='}`);
  process.exit(fail ? 1 : 0);
})();
