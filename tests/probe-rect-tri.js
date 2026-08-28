// Deux demandes d'un utilisateur :
//  1. la construction du rectangle doit partir de DEUX points et tracer la
//     perpendiculaire à une extrémité, comme celle du carré — pas de trois
//     points déjà posés au début de l'animation ;
//  2. un triangle rectangle tracé à main levée doit être reconnu comme tel.
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
  await page.evaluate(`
    window.__m = {
      alea:(s)=>{let x=s;return()=>{x=(x*1103515245+12345)%2147483648;return x/2147483648;};},
      onduler(p,amp,s){const r=this.alea(s);let vx=0,vy=0;
        return p.map(q=>{vx=vx*0.86+(r()-0.5)*amp*0.5;vy=vy*0.86+(r()-0.5)*amp*0.5;return {x:q.x+vx,y:q.y+vy};});},
      polyArrondi(som,rayon,n){const N=som.length,o=[];
        const lerp=(A,B,t)=>({x:A.x+(B.x-A.x)*t,y:A.y+(B.y-A.y)*t});
        for(let i=0;i<N;i++){const P=som[(i-1+N)%N],C=som[i],Q=som[(i+1)%N];
          const lp=Math.hypot(C.x-P.x,C.y-P.y),lq=Math.hypot(Q.x-C.x,Q.y-C.y);
          const rp=Math.min(rayon,lp*0.45),rq=Math.min(rayon,lq*0.45);
          const A=lerp(C,P,rp/lp),B=lerp(C,Q,rq/lq);
          const prev=o.length?o[o.length-1]:null;const k=Math.max(2,Math.round(n*0.5));
          for(let j=0;j<k;j++){const t=j/k;o.push(lerp(prev||A,A,prev?t:1));}
          const m=Math.max(3,Math.round(rayon/2));
          for(let j=0;j<=m;j++){const t=j/m;
            o.push({x:(1-t)*(1-t)*A.x+2*(1-t)*t*C.x+t*t*B.x, y:(1-t)*(1-t)*A.y+2*(1-t)*t*C.y+t*t*B.y});}}
        o.push({...o[0]});return o;},
      // triangle : sommet A, une jambe de longueur L1 à l'angle theta,
      // l'autre côté de longueur L2 refermant un angle « ouv » en A
      triangle(ax,ay,theta,L1,L2,ouv,rayon,n){
        const A={x:ax,y:ay};
        const B={x:ax+Math.cos(theta)*L1, y:ay+Math.sin(theta)*L1};
        const C={x:ax+Math.cos(theta+ouv)*L2, y:ay+Math.sin(theta+ouv)*L2};
        return this.polyArrondi([A,B,C],rayon,n);},
      rect(cx,cy,w,h,theta,rayon,n){
        const R=(x,y)=>({x:cx+x*Math.cos(theta)-y*Math.sin(theta), y:cy+x*Math.sin(theta)+y*Math.cos(theta)});
        return this.polyArrondi([R(-w/2,-h/2),R(w/2,-h/2),R(w/2,h/2),R(-w/2,h/2)],rayon,n);},
      tracer(p){const app=window.app,r=app.canvas.getBoundingClientRect();
        const cl=(q)=>({X:q.x*app.view.zoom+app.view.x+r.left,Y:q.y*app.view.zoom+app.view.y+r.top});
        const ev=(t,q,bt)=>{const c=cl(q);const o={pointerId:4,pointerType:'mouse',isPrimary:true,button:0,buttons:bt,
          clientX:c.X,clientY:c.Y,bubbles:true,cancelable:true};
          (t==='pointerup'?window:app.canvas).dispatchEvent(new PointerEvent(t,o));};
        ev('pointerdown',p[0],1); for(let i=1;i<p.length;i++) ev('pointermove',p[i],1);
        ev('pointerup',p[p.length-1],0);},
    };`);
  const rec = (code, amp, graine) => page.evaluate(({ code, amp, graine }) => {
    const m = window.__m;
    return GmCroquis.reconnaitre(m.onduler(eval(code), amp, graine), 1);
  }, { code, amp, graine });
  const D = Math.PI / 180;

  console.log('\n=== le triangle rectangle est-il reconnu ? ===');
  const droits = [
    ['jambes 300 et 200, horizontal', `m.triangle(300,600,-${Math.PI / 2},300,200,${Math.PI / 2},10,14)`],
    ['incliné 30°',                   `m.triangle(400,600,${-Math.PI / 2 + 30 * D},300,200,${Math.PI / 2},10,14)`],
    ['incliné 200°',                  `m.triangle(500,450,${-Math.PI / 2 + 200 * D},280,190,${Math.PI / 2},10,14)`],
    ['isocèle rectangle',             `m.triangle(350,600,${-Math.PI / 2},240,240,${Math.PI / 2},10,14)`],
    ['très aplati (300 et 110)',      `m.triangle(300,600,${-Math.PI / 2},300,110,${Math.PI / 2},10,14)`],
  ];
  for (const [nom, code] of droits) {
    const l = [];
    for (const g of [3, 11, 23, 31]) { const r = await rec(code, 2, g); l.push(r ? r.forme : '—'); }
    ck(`${nom} → triangle rectangle`, l.every(v => v === 'triangle_rectangle'), l.join(' '));
  }
  // main tremblante : l'angle droit doit résister au bruit
  {
    const l = [];
    for (const g of [3, 11, 23, 31]) {
      const r = await rec(`m.triangle(300,600,${-Math.PI / 2},300,200,${Math.PI / 2},14,18)`, 9, g);
      l.push(r ? r.forme : '—');
    }
    ck('main tremblante (bruit 9) → triangle rectangle', l.every(v => v === 'triangle_rectangle'), l.join(' '));
  }

  console.log('\n=== il ne doit PAS voir un angle droit là où il n\'y en a pas ===');
  for (const [nom, ouv] of [['angle de 70°', 70], ['angle de 105°', 105], ['angle de 60° (équilatéral)', 60]]) {
    const l = [];
    for (const g of [3, 11, 23]) {
      const r = await rec(`m.triangle(300,600,${-Math.PI / 2},280,260,${ouv * D},10,14)`, 2, g);
      l.push(r ? r.forme : '—');
    }
    ck(`${nom} n'est pas dit rectangle`, l.every(v => v !== 'triangle_rectangle'), l.join(' '));
  }

  console.log('\n=== où est marqué l\'angle droit ? ===');
  const pl = await rec(`m.triangle(300,600,${-Math.PI / 2},300,200,${Math.PI / 2},10,14)`, 2, 3);
  {
    const s = pl.sommets, i = pl.droit;
    const u = { x: s[(i + 1) % 3].x - s[i].x, y: s[(i + 1) % 3].y - s[i].y };
    const v = { x: s[(i - 1 + 3) % 3].x - s[i].x, y: s[(i - 1 + 3) % 3].y - s[i].y };
    const deg = Math.acos((u.x * v.x + u.y * v.y) / (Math.hypot(u.x, u.y) * Math.hypot(v.x, v.y))) / D;
    console.log(`  sommet ${i} : ${deg.toFixed(2)}°`);
    ck('le sommet désigné mesure bien 90° à 3° près', Math.abs(deg - 90) < 3, deg.toFixed(2) + '°');
  }

  console.log('\n=== dans l\'application : figure seule ===');
  const seul = await page.evaluate((code) => {
    const m = window.__m, a = window.app;
    a.entities = []; a.historyPast = []; a.saveState();
    a.setTool('croquis');
    m.tracer(m.onduler(eval(code), 2, 3));
    const nb = (k) => a.entities.filter(e => e.constructor.name === k).length;
    const ang = a.entities.filter(e => e.constructor.name === 'Angle');
    return { bulle: document.getElementById('toast-notification').innerText,
             pts: nb('Point'), segs: nb('Segment'), angles: ang.length,
             valeurs: ang.map(x => +x.getAngleValue().toFixed(2)),
             anims: nb('ToolAnimation') };
  }, `m.triangle(300,600,${-Math.PI / 2},300,200,${Math.PI / 2},10,14)`);
  console.log('  ' + JSON.stringify(seul));
  ck('la bulle annonce le triangle rectangle', /Triangle rectangle/i.test(seul.bulle), seul.bulle);
  ck('3 points, 3 côtés', seul.pts === 3 && seul.segs === 3);
  ck('UN seul angle marqué', seul.angles === 1, String(seul.angles));
  ck('et il mesure exactement 90°', seul.valeurs.length === 1 && Math.abs(seul.valeurs[0] - 90) < 0.01,
     JSON.stringify(seul.valeurs));
  ck('aucun tracé d\'instrument', seul.anims === 0);

  console.log('\n=== dans l\'application : avec la construction ===');
  const cons = await page.evaluate(async (code) => {
    const m = window.__m, a = window.app;
    a.entities = []; a.historyPast = []; a.saveState();
    a.setTool('magic_croquis');
    m.tracer(m.onduler(eval(code), 2, 3));
    const quoi = document.getElementById('croquisQuoi').textContent;
    const modale = getComputedStyle(document.getElementById('croquisModal')).display;
    a.repondreChoixCroquis(true);
    await new Promise(r => setTimeout(r, 400));
    const ang = a.entities.filter(e => e.constructor.name === 'Angle');
    return { quoi, modale, total: a.entities.length,
             pts: a.entities.filter(e => e.constructor.name === 'Point').length,
             segs: a.entities.filter(e => e.constructor.name === 'Segment').length,
             valeurs: ang.map(x => +x.getAngleValue().toFixed(2)),
             outils: a.entities.filter(e => e.constructor.name === 'ToolAnimation').map(e => e.widgetType) };
  }, `m.triangle(300,600,${-Math.PI / 2},300,200,${Math.PI / 2},10,14)`);
  console.log('  ' + JSON.stringify(cons));
  ck('la question est posée et nomme le triangle rectangle',
     cons.modale === 'flex' && /triangle rectangle/i.test(cons.quoi), cons.quoi);
  ck('3 points, 3 côtés', cons.pts === 3 && cons.segs === 3);
  ck('l\'angle droit est marqué à 90°',
     cons.valeurs.length === 1 && Math.abs(cons.valeurs[0] - 90) < 0.01, JSON.stringify(cons.valeurs));
  ck('l\'angle droit est posé à l\'ÉQUERRE, après la règle',
     cons.outils.indexOf('ruler') === 0 && cons.outils.includes('setsquare')
     && cons.outils.indexOf('setsquare') > cons.outils.indexOf('ruler'), cons.outils.join(' '));

  /* La demande d'origine : au tout début de l'animation, le rectangle avait
     déjà TROIS points posés — il partait de trois sommets au lieu d'en
     construire un à l'équerre. Le carré, lui, faisait déjà les choses bien. */
  console.log('\n=== le rectangle part-il de deux points, comme le carré ? ===');
  for (const [nom, code, largeur] of [
    ['rectangle 400x200', 'm.rect(450,400,400,200,0,10,14)', 200],
    ['rectangle incliné 25°', `m.rect(450,400,380,220,${25 * D},10,14)`, 220],
    ['rectangle debout 200x380', 'm.rect(450,400,200,380,0,10,14)', 200],
    ['carré 280 (témoin)', 'm.rect(450,400,280,280,0,10,14)', 280],
  ]) {
    const r = await page.evaluate(async (code) => {
      const m = window.__m, a = window.app;
      a.entities = []; a.historyPast = []; a.saveState();
      a.setTool('magic_croquis');
      m.tracer(m.onduler(eval(code), 2, 3));
      const quoi = document.getElementById('croquisQuoi').textContent;
      a.repondreChoixCroquis(true);
      await new Promise(r2 => setTimeout(r2, 400));
      // rang du premier instrument : tout ce qui le précède est posé « d'avance »
      const rang = a.entities.findIndex(e => e.constructor.name === 'ToolAnimation');
      const pts = a.entities.filter(e => e.constructor.name === 'Point');
      const seg = a.entities.filter(e => e.constructor.name === 'Segment');
      return { quoi,
               avance: a.entities.slice(0, rang).filter(e => e.constructor.name === 'Point').length,
               pts: pts.length, segs: seg.length, noms: pts.map(p => p.label),
               cotes: seg.map(s => +Math.hypot(s.p2.x - s.p1.x, s.p2.y - s.p1.y).toFixed(1)),
               codes: seg.map(s => s.coding || '—'),
               outils: a.entities.filter(e => e.constructor.name === 'ToolAnimation')
                        .map(e => e.widgetType).slice(0, 4) };
    }, code);
    console.log(`  ${nom} : ${JSON.stringify(r)}`);
    ck(`${nom} : DEUX points au départ, pas trois`, r.avance === 2, String(r.avance));
    ck(`${nom} : règle puis équerre`,
       r.outils[0] === 'ruler' && r.outils.includes('setsquare'), r.outils.join(' '));
    ck(`${nom} : 4 sommets, 4 côtés`, r.pts === 4 && r.segs === 4, `${r.pts}/${r.segs}`);
    // la perpendiculaire s'élève sur le côté le PLUS LONG : le premier segment
    // tracé est la base, elle doit valoir la plus grande dimension
    ck(`${nom} : la base est le plus long côté`,
       Math.abs(Math.max(...r.cotes) - r.cotes[0]) < 1.5, r.cotes.join(' '));
    // les codages tiennent sur les côtés eux-mêmes : plus de doublure superposée
    const familles = new Set(r.codes);
    ck(`${nom} : les 4 côtés sont codés`, r.codes.every(c => c !== '—'), r.codes.join(' '));
    ck(`${nom} : ${largeur === 280 ? 'un seul codage' : 'deux codages, un par paire'}`,
       familles.size === (largeur === 280 ? 1 : 2), [...familles].join(' '));
  }

  console.log('\n=== le carré du bouton n\'a pas de côtés en double ===');
  const bouton = await page.evaluate(async () => {
    const a = window.app;
    a.entities = []; a.historyPast = []; a.saveState();
    a.buildSquare(null, 400, 400);
    await new Promise(r => setTimeout(r, 300));
    const seg = a.entities.filter(e => e.constructor.name === 'Segment');
    return { visibles: seg.filter(s => !s.hidden).length,
             codes: seg.filter(s => s.coding && s.coding !== 'mark-none').length,
             paires: seg.filter(s => !s.hidden).map(s => [s.p1.label, s.p2.label].sort().join('')) };
  });
  console.log('  ' + JSON.stringify(bouton));
  ck('4 côtés visibles, tous codés, aucun doublon',
     bouton.visibles === 4 && bouton.codes === 4 && new Set(bouton.paires).size === 4,
     JSON.stringify(bouton));

  ck('aucune erreur JS', errs.length === 0, errs.slice(0, 3).join(' | '));
  await b.close();
  console.log(`\n${fail ? `=== ${fail} échec(s) ===` : '=== tout passe ==='}`);
  process.exit(fail ? 1 : 0);
})();
