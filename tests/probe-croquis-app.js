// Le croquis devient-il une VRAIE figure géométrique, annulable d'un coup ?
// Outil de la barre de gauche : construction directe, sans question. Le parcours
// avec modale du tiroir magique est couvert par probe-deux-croquis.
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
  for (const c of [{ n: 'souris 1280', w: 1280, h: 900, tp: 'mouse', touch: false },
                   { n: 'tactile 1024', w: 1024, h: 768, tp: 'touch', touch: true }]) {
    const page = await (await b.newContext({ viewport: { width: c.w, height: c.h }, hasTouch: c.touch })).newPage();
    const errs = []; page.on('pageerror', e => errs.push(e.message));
    await page.goto(PAGE); await page.waitForTimeout(1400);
    console.log(`\n=== ${c.n} ===`);
    await page.evaluate(`
      window.__t = {
        alea: (s) => { let x = s; return () => { x = (x*1103515245+12345)%2147483648; return x/2147483648; }; },
        bruit(p, a, s) { const r = this.alea(s); return p.map(q => ({x: q.x+(r()-.5)*a, y: q.y+(r()-.5)*a})); },
        cercle(cx, cy, r, n) { const o=[]; for(let i=0;i<=n;i++){const a=i/n*Math.PI*2; o.push({x:cx+r*Math.cos(a), y:cy+r*Math.sin(a)});} return o; },
        poly(s, k) { const o=[]; const n=s.length; for(let j=0;j<n;j++){const A=s[j],B=s[(j+1)%n];
          for(let i=0;i<k;i++){const t=i/k; o.push({x:A.x+(B.x-A.x)*t, y:A.y+(B.y-A.y)*t});}} o.push({...s[0]}); return o; },
        ligne(a,bb,n){const o=[];for(let i=0;i<=n;i++){const t=i/n;o.push({x:a.x+(bb.x-a.x)*t,y:a.y+(bb.y-a.y)*t});}return o;},
        tracer(pts, tp) {
          const app = window.app, r = app.canvas.getBoundingClientRect();
          const cl = (p) => ({X: p.x*app.view.zoom+app.view.x+r.left, Y: p.y*app.view.zoom+app.view.y+r.top});
          const ev = (t, p, bt) => { const q = cl(p);
            const o = {pointerId: 4, pointerType: tp, isPrimary: true, button: 0, buttons: bt, clientX: q.X, clientY: q.Y, bubbles: true, cancelable: true};
            (t === 'pointerup' ? window : app.canvas).dispatchEvent(new PointerEvent(t, o)); };
          ev('pointerdown', pts[0], 1);
          for (let i = 1; i < pts.length; i++) ev('pointermove', pts[i], 1);
          ev('pointerup', pts[pts.length-1], 0);
        },
      };`);

    const croquer = (code) => page.evaluate(({ code, tp }) => {
      const t = window.__t, app = window.app;
      app.entities = []; app.historyPast = []; app.saveState();
      const avant = app.historyPast.length;
      app.setTool('croquis');
      t.tracer(eval(code), tp);
      const nb = (k) => app.entities.filter(e => e.constructor.name === k).length;
      return { bulle: document.getElementById('toast-notification').innerText,
               pts: nb('Point'), segs: nb('Segment'), cercles: nb('Circle'),
               total: app.entities.length, outil: app.currentTool,
               instantanes: app.historyPast.length - avant, trait: !!app.traitCroquis };
    }, { code, tp: c.tp });

    const r1 = await croquer("t.bruit(t.cercle(400,400,120,90),4,7)");
    console.log('  cercle : ' + JSON.stringify(r1));
    ck('cercle : un objet Circle est créé', r1.cercles === 1);
    ck('cercle : le centre ET un point du bord sont posés', r1.pts === 2, `${r1.pts} points`);
    ck('cercle : la bulle annonce la forme', /Cercle reconnu/.test(r1.bulle), r1.bulle);
    ck('cercle : un seul instantané d\'historique', r1.instantanes === 1, `${r1.instantanes}`);
    ck('cercle : le tracé est effacé', r1.trait === false);
    // L'outil RESTE armé : on enchaîne les figures sans retourner le chercher.
    ck('cercle : l\'outil reste armé', r1.outil === 'croquis', r1.outil);

    const r2 = await croquer("t.bruit(t.poly([{x:300,y:300},{x:500,y:300},{x:500,y:500},{x:300,y:500}],14),4,3)");
    console.log('  carré : ' + JSON.stringify(r2));
    ck('carré : la bulle annonce le carré', /Carré reconnu/.test(r2.bulle), r2.bulle);
    ck('carré : au moins 4 points et 4 segments', r2.pts >= 4 && r2.segs >= 4, `${r2.pts}pts ${r2.segs}seg`);
    ck('carré : un seul instantané', r2.instantanes === 1);

    // le carré est-il VRAIMENT carré ?
    const geo = await page.evaluate(() => {
      const pts = window.app.entities.filter(e => e.constructor.name === 'Point');
      const segs = window.app.entities.filter(e => e.constructor.name === 'Segment' && !e.hidden);
      const L = segs.map(s => Math.hypot(s.p2.x - s.p1.x, s.p2.y - s.p1.y));
      return { n: L.length, min: Math.min(...L), max: Math.max(...L), pts: pts.length };
    });
    console.log(`  côtés : ${geo.n} de ${geo.min.toFixed(2)} à ${geo.max.toFixed(2)}`);
    ck('carré : les côtés sont rigoureusement égaux', (geo.max - geo.min) < 0.01, `${(geo.max - geo.min).toFixed(4)}`);

    const r3 = await croquer("t.bruit(t.ligne({x:300,y:300},{x:600,y:420},40),3,19)");
    ck('segment : 2 points, 1 segment', r3.pts === 2 && r3.segs === 1, `${r3.pts}pts ${r3.segs}seg`);

    const r4 = await croquer("t.bruit(t.poly([{x:300,y:460},{x:560,y:430},{x:380,y:280}],16),4,17)");
    ck('triangle quelconque : 3 points, 3 segments', r4.pts === 3 && r4.segs === 3, `${r4.pts}pts ${r4.segs}seg`);

    const r5 = await croquer("t.bruit(t.cercle(400,400,120,90),70,41)");
    console.log('  gribouillis : ' + JSON.stringify(r5));
    ck('gribouillis : rien n\'est construit', r5.total === 0, `${r5.total} entités`);
    ck('gribouillis : on le dit', /non reconnue/i.test(r5.bulle), r5.bulle);

    // annulation d'un seul coup
    const und = await page.evaluate(({ tp }) => {
      const t = window.__t, app = window.app;
      app.entities = []; app.historyPast = []; app.saveState();
      app.setTool('croquis');
      t.tracer(t.bruit(t.poly([{x:300,y:300},{x:500,y:300},{x:500,y:500},{x:300,y:500}],14),4,3), tp);
      const apres = app.entities.length;
      app.undo();
      return { apres, apresUndo: app.entities.length };
    }, { tp: c.tp });
    console.log('  annulation : ' + JSON.stringify(und));
    ck('une seule annulation efface toute la figure', und.apres > 4 && und.apresUndo === 0, JSON.stringify(und));
    ck('aucune erreur JS', errs.length === 0, errs.slice(0, 3).join(' | '));
    await page.context().close();
  }
  await b.close();
  console.log(`\n${fail ? `=== ${fail} échec(s) ===` : '=== tout passe ==='}`);
  process.exit(fail ? 1 : 0);
})();
