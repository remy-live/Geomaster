// Une petite marque garde sa taille ; un trait étendu grandit avec l'objet.
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
      seg(a,bb,n){const o=[];for(let i=0;i<=n;i++){const t=i/n;
        o.push({x:a.x+(bb.x-a.x)*t,y:a.y+(bb.y-a.y)*t});}return o;},
      segment(x1,y1,x2,y2){const a=window.app;a.setTool('segment');
        const r=a.canvas.getBoundingClientRect();
        const ev=(t,x,y,bt)=>{const o={pointerId:9,pointerType:'mouse',isPrimary:true,button:0,buttons:bt,
          clientX:x*a.view.zoom+a.view.x+r.left,clientY:y*a.view.zoom+a.view.y+r.top,bubbles:true,cancelable:true};
          (t==='pointerup'?window:a.canvas).dispatchEvent(new PointerEvent(t,o));};
        ev('pointerdown',x1,y1,1); ev('pointermove',x2,y2,1); ev('pointerup',x2,y2,0);
        return a.entities.find(e=>e.constructor.name==='Segment');},
    };`);

  const essai = (encre) => page.evaluate(({ encre }) => {
    const s = window.__s, a = window.app;
    a.entities = []; a.historyPast = []; a.saveState();
    const seg = s.segment(300, 400, 700, 400);          // longueur 400
    a.setTool('stylo');
    s.trace(eval(encre));
    const an = a.entities.find(e => e.constructor.name === 'Annotation');
    const mesure = () => {
      const p = an.versMonde();
      let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
      p.forEach(q => { x0 = Math.min(x0, q.x); x1 = Math.max(x1, q.x); y0 = Math.min(y0, q.y); y1 = Math.max(y1, q.y); });
      return { larg: +(x1 - x0).toFixed(1), haut: +(y1 - y0).toFixed(1),
               cx: +((x0 + x1) / 2).toFixed(1), cy: +((y0 + y1) / 2).toFixed(1) };
    };
    const avant = mesure();
    seg.p2.x = 1100;                                     // segment doublé : 400 -> 800
    const apres = mesure();
    return { mode: an.mode, avant, apres };
  }, { encre });

  console.log('\n=== petite marque : une barre de codage en travers, au milieu ===');
  const m = await essai("s.seg({x:500,y:375},{x:500,y:425},10)");
  console.log('  ' + JSON.stringify(m));
  ck('reconnue comme marque', m.mode === 'marque', m.mode);
  ck('taille inchangée quand le segment double', Math.abs(m.apres.haut - m.avant.haut) < 1,
     `${m.avant.haut} → ${m.apres.haut}`);
  ck('mais la position suit : elle reste au milieu', Math.abs(m.apres.cx - 700) < 2, `cx ${m.apres.cx}`);

  console.log('\n=== marque au quart : elle reste au quart ===');
  const q = await essai("s.seg({x:400,y:375},{x:400,y:425},10)");
  ck('reste au quart du segment', Math.abs(q.apres.cx - 500) < 3, `cx ${q.apres.cx} (attendu 500)`);
  ck('et garde sa taille', Math.abs(q.apres.haut - q.avant.haut) < 1, `${q.avant.haut} → ${q.apres.haut}`);

  console.log('\n=== trait étendu : un surlignage sur tout le segment ===');
  const e = await essai("s.seg({x:310,y:390},{x:690,y:390},20)");
  console.log('  ' + JSON.stringify(e));
  ck('reconnu comme étendue', e.mode === 'deux', e.mode);
  ck('il double avec le segment', Math.abs(e.apres.larg / e.avant.larg - 2) < 0.05,
     `${e.avant.larg} → ${e.apres.larg}`);

  console.log('\n=== l\'orientation suit dans les deux cas ===');
  const rot = await page.evaluate(() => {
    const s = window.__s, a = window.app;
    a.entities = []; a.historyPast = []; a.saveState();
    const seg = s.segment(300, 400, 700, 400);
    a.setTool('stylo');
    s.trace(s.seg({ x: 500, y: 375 }, { x: 500, y: 425 }, 10));   // barre verticale
    const an = a.entities.find(e => e.constructor.name === 'Annotation');
    const angle = () => { const p = an.versMonde();
      return Math.round(Math.atan2(p[p.length-1].y - p[0].y, p[p.length-1].x - p[0].x) * 180 / Math.PI); };
    const avant = angle();
    seg.p2.x = 300; seg.p2.y = 800;                                // segment tourné de 90°
    return { avant, apres: angle() };
  });
  console.log('  ' + JSON.stringify(rot));
  ck('la barre tourne avec le segment', Math.abs(Math.abs(rot.apres - rot.avant) - 90) < 3, JSON.stringify(rot));
  ck('aucune erreur JS', errs.length === 0, errs.slice(0, 3).join(' | '));
  await b.close();
  console.log(`\n${fail ? `=== ${fail} échec(s) ===` : '=== tout passe ==='}`);
  process.exit(fail ? 1 : 0);
})();
