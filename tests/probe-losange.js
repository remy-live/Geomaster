// Le losange est-il reconnu, redressé exactement, et distingué du carré ?
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
      // losange par ses diagonales, tourné de theta
      losange(cx,cy,d1,d2,theta,rayon,n){
        const R=(x,y)=>({x:cx+x*Math.cos(theta)-y*Math.sin(theta), y:cy+x*Math.sin(theta)+y*Math.cos(theta)});
        return this.polyArrondi([R(d1/2,0),R(0,d2/2),R(-d1/2,0),R(0,-d2/2)],rayon,n);},
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

  console.log('\n=== losanges de formes et tailles variées ===');
  const cas = [
    ['large  d 240x140', "m.losange(400,400,240,140,0,10,14)"],
    ['étroit d 260x90',  "m.losange(400,400,260,90,0,10,14)"],
    ['incliné 35°',      "m.losange(400,400,220,130,0.61,10,14)"],
    ['petit  d 90x54',   "m.losange(400,400,90,54,6,12)"],
    ['vertical d 120x210', "m.losange(400,400,120,210,0,10,14)"],
  ];
  for (const [nom, code] of cas) {
    const l = [];
    for (const g of [3, 11, 23, 31]) { const r = await rec(code, 2, g); l.push(r ? r.forme : '—'); }
    ck(`${nom} → losange`, l.every(v => v === 'losange'), l.join(' '));
  }

  console.log('\n=== il ne doit pas manger le carré ni le rectangle ===');
  for (const [nom, code, att] of [
    ['carré', "m.polyArrondi([{x:300,y:300},{x:480,y:300},{x:480,y:480},{x:300,y:480}],10,14)", 'carre'],
    ['carré tourné 45°', "m.losange(400,400,220,220,0,10,14)", 'carre'],
    ['rectangle', "m.polyArrondi([{x:300,y:300},{x:540,y:300},{x:540,y:440},{x:300,y:440}],10,14)", 'rectangle'],
  ]) {
    const l = [];
    for (const g of [3, 11, 23]) { const r = await rec(code, 2, g); l.push(r ? r.forme : '—'); }
    ck(`${nom} reste ${att}`, l.every(v => v === att), l.join(' '));
  }

  console.log('\n=== le losange rendu est-il EXACT ? ===');
  const r = await rec("m.losange(400,400,240,140,0.4,10,14)", 2, 3);
  const s = r.sommets;
  const cot = s.map((v, i) => Math.hypot(v.x - s[(i+1)%4].x, v.y - s[(i+1)%4].y));
  const d1 = Math.hypot(s[0].x-s[2].x, s[0].y-s[2].y), d2 = Math.hypot(s[1].x-s[3].x, s[1].y-s[3].y);
  const u = { x: s[0].x-s[2].x, y: s[0].y-s[2].y }, v = { x: s[1].x-s[3].x, y: s[1].y-s[3].y };
  const perp = Math.abs(u.x*v.x + u.y*v.y) / (d1*d2);
  console.log(`  côtés ${cot.map(c=>c.toFixed(2)).join(' ')} | diagonales ${d1.toFixed(1)} et ${d2.toFixed(1)} | centre ${r.centre.x.toFixed(1)},${r.centre.y.toFixed(1)}`);
  ck('les 4 côtés sont rigoureusement égaux', (Math.max(...cot) - Math.min(...cot)) < 0.01, (Math.max(...cot)-Math.min(...cot)).toExponential(2));
  ck('les diagonales sont rigoureusement perpendiculaires', perp < 1e-9, perp.toExponential(2));
  ck('les diagonales sont inégales (ce n\'est pas un carré)', Math.abs(d1 - d2) > 40);
  ck('centre à moins de 4px de 400,400', Math.hypot(r.centre.x-400, r.centre.y-400) < 4);
  ck('grande diagonale à moins de 8px de 240', Math.abs(Math.max(d1,d2) - 240) < 8, Math.max(d1,d2).toFixed(1));

  console.log('\n=== dans l\'application : figure seule, codée, sans question ===');
  const app = await page.evaluate(() => {
    const m = window.__m, a = window.app;
    a.entities = []; a.historyPast = []; a.saveState();
    a.setTool('croquis');
    m.tracer(m.onduler(m.losange(400,400,240,140,0.3,10,14), 2, 3));
    const nb = (k) => a.entities.filter(e => e.constructor.name === k).length;
    const segs = a.entities.filter(e => e.constructor.name === 'Segment');
    return { modale: getComputedStyle(document.getElementById('croquisModal')).display,
             bulle: document.getElementById('toast-notification').innerText,
             pts: nb('Point'), segs: segs.length, angles: nb('Angle'), anims: nb('ToolAnimation'),
             codes: segs.filter(s2 => s2.coding && s2.coding !== 'mark-none').length,
             memeCode: new Set(segs.map(s2 => s2.coding)).size };
  });
  console.log('  ' + JSON.stringify(app));
  ck('la bulle annonce le losange', /Losange reconnu/.test(app.bulle), app.bulle);
  ck('4 points, 4 côtés', app.pts === 4 && app.segs === 4);
  ck('les 4 côtés portent le MÊME codage', app.codes === 4 && app.memeCode === 1);
  ck('aucun angle droit marqué (un losange n\'en a pas)', app.angles === 0);
  ck('aucun tracé d\'instrument', app.anims === 0);

  const tiroir = await page.evaluate(() => {
    const m = window.__m, a = window.app;
    a.entities = []; a.historyPast = []; a.saveState();
    a.setTool('magic_croquis');
    m.tracer(m.onduler(m.losange(400,400,240,140,0.3,10,14), 2, 3));
    return { modale: getComputedStyle(document.getElementById('croquisModal')).display, total: a.entities.length };
  });
  ck('tiroir : pas de question pour un losange, figure posée directement',
     tiroir.modale === 'none' && tiroir.total > 4, JSON.stringify(tiroir));
  ck('aucune erreur JS', errs.length === 0, errs.slice(0, 3).join(' | '));
  await b.close();
  console.log(`\n${fail ? `=== ${fail} échec(s) ===` : '=== tout passe ==='}`);
  process.exit(fail ? 1 : 0);
})();
