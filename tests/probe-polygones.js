// Pentagone, hexagone, polygone quelconque — et surtout : où est la frontière
// avec le cercle ?
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
      regulier(cx,cy,n,R,th,rayon,pas){const s=[];
        for(let k=0;k<n;k++){const a=th+k*2*Math.PI/n;s.push({x:cx+R*Math.cos(a),y:cy+R*Math.sin(a)});}
        return this.polyArrondi(s,rayon,pas);},
      quelconque(som,rayon,pas){return this.polyArrondi(som,rayon,pas);},
      cercle(cx,cy,r,n){const o=[];for(let i=0;i<=n;i++){const a=i/n*Math.PI*2;
        o.push({x:cx+r*Math.cos(a),y:cy+r*Math.sin(a)});}return o;},
      tracer(p){const app=window.app,r=app.canvas.getBoundingClientRect();
        const cl=(q)=>({X:q.x*app.view.zoom+app.view.x+r.left,Y:q.y*app.view.zoom+app.view.y+r.top});
        const ev=(t,q,bt)=>{const c=cl(q);const o={pointerId:4,pointerType:'mouse',isPrimary:true,button:0,buttons:bt,
          clientX:c.X,clientY:c.Y,bubbles:true,cancelable:true};
          (t==='pointerup'?window:app.canvas).dispatchEvent(new PointerEvent(t,o));};
        ev('pointerdown',p[0],1); for(let i=1;i<p.length;i++) ev('pointermove',p[i],1);
        ev('pointerup',p[p.length-1],0);},
    };`);
  const rec = (code, amp, g) => page.evaluate(({ code, amp, g }) => {
    const m = window.__m;
    const r = GmCroquis.reconnaitre(m.onduler(eval(code), amp, g), 1);
    return r ? { f: r.forme, n: r.sommets ? r.sommets.length : 0 } : { f: '—', n: 0 };
  }, { code, amp, g });

  const lot = async (code, amp) => {
    const l = [];
    for (const g of [3, 11, 23, 31, 47, 59]) l.push((await rec(code, amp, g)).f);
    return l;
  };

  console.log('\n=== pentagones et hexagones réguliers (coins arrondis 8 %) ===');
  for (const [nom, code, att] of [
    ['pentagone R=130', "m.regulier(400,400,5,130,-1.57,12,12)", 'pentagone'],
    ['pentagone R=80',  "m.regulier(400,400,5,80,-1.57,8,10)", 'pentagone'],
    ['pentagone incliné', "m.regulier(400,400,5,130,0.4,12,12)", 'pentagone'],
    ['hexagone R=130',  "m.regulier(400,400,6,130,0,12,12)", 'hexagone'],
    ['hexagone R=80',   "m.regulier(400,400,6,80,8,10)".replace('80,8,10','80,0,8,10'), 'hexagone'],
  ]) {
    const l = await lot(code, 2);
    ck(`${nom} → ${att}`, l.filter(v => v === att).length >= 5, l.join(' '));
  }

  console.log('\n=== FRONTIÈRE AVEC LE CERCLE : polygones réguliers de plus en plus arrondis ===');
  for (const n of [5, 6, 8, 10, 12]) {
    const l = await lot(`m.regulier(400,400,${n},130,0,12,12)`, 2);
    console.log(`  ${n} côtés  → ${l.join(' ')}`);
  }
  console.log('\n  … et un vrai cercle, pour comparaison :');
  const cer = await lot("m.cercle(400,400,130,90)", 2);
  console.log(`  cercle    → ${cer.join(' ')}`);
  ck('le cercle reste un cercle', cer.every(v => v === 'cercle'), cer.join(' '));

  console.log('\n=== polygones quelconques : trapèze, cerf-volant, quadrilatère de travers ===');
  for (const [nom, code] of [
    ['trapèze',      "m.quelconque([{x:280,y:460},{x:560,y:460},{x:480,y:300},{x:350,y:300}],10,14)"],
    ['cerf-volant',  "m.quelconque([{x:400,y:280},{x:520,y:400},{x:400,y:560},{x:280,y:400}],10,14)"],
    ['quadrilatère quelconque', "m.quelconque([{x:300,y:300},{x:560,y:340},{x:520,y:520},{x:330,y:470}],10,14)"],
    ['pentagone irrégulier', "m.quelconque([{x:300,y:300},{x:520,y:280},{x:580,y:450},{x:420,y:560},{x:280,y:450}],10,12)"],
  ]) {
    const l = await lot(code, 2);
    const ok = l.filter(v => v !== '—').length;
    ck(`${nom} : rendu (et non refusé)`, ok >= 5, l.join(' '));
    if (nom === 'cerf-volant') ck('cerf-volant : PAS un losange', l.every(v => v !== 'losange'), l.join(' '));
  }

  console.log('\n=== dans l\'application ===');
  const app = await page.evaluate(() => {
    const m = window.__m, a = window.app;
    const test = (pts, outil) => {
      a.entities = []; a.historyPast = []; a.saveState(); a.setTool(outil || 'croquis');
      m.tracer(m.onduler(pts, 2, 3));
      const nb = (k) => a.entities.filter(e => e.constructor.name === k).length;
      return { bulle: document.getElementById('toast-notification').innerText,
               pts: nb('Point'), segs: nb('Segment'),
               modale: getComputedStyle(document.getElementById('croquisModal')).display };
    };
    const hexa = test(m.regulier(400, 400, 6, 130, 0, 12, 12));
    const trap = test(m.quelconque([{x:280,y:460},{x:560,y:460},{x:480,y:300},{x:350,y:300}], 10, 14));
    a.entities = []; a.historyPast = []; a.saveState(); a.setTool('magic_croquis');
    m.tracer(m.onduler(m.regulier(400, 400, 6, 130, 0, 12, 12), 2, 3));
    const q = { modale: getComputedStyle(document.getElementById('croquisModal')).display,
                quoi: document.getElementById('croquisQuoi').textContent, avant: a.entities.length };
    a.repondreChoixCroquis(true);
    q.anims = a.entities.filter(e => e.constructor.name === 'ToolAnimation').length;
    return { hexa, trap, q };
  });
  console.log('  hexagone : ' + JSON.stringify(app.hexa));
  console.log('  trapèze  : ' + JSON.stringify(app.trap));
  console.log('  tiroir   : ' + JSON.stringify(app.q));
  ck('hexagone : 6 points, 6 côtés', app.hexa.pts === 6 && app.hexa.segs === 6);
  ck('hexagone : la bulle le nomme', /Hexagone/.test(app.hexa.bulle), app.hexa.bulle);
  ck('trapèze : 4 points, 4 côtés', app.trap.pts === 4 && app.trap.segs === 4);
  ck('trapèze : annoncé comme polygone', /Polygone/.test(app.trap.bulle), app.trap.bulle);
  ck('hexagone : la construction est proposée', app.q.modale === 'flex' && /hexagone/i.test(app.q.quoi), app.q.quoi);
  ck('hexagone : rien avant la réponse', app.q.avant === 0);
  ck('hexagone : construction instrumentée', app.q.anims > 3, `${app.q.anims}`);
  ck('aucune erreur JS', errs.length === 0, errs.slice(0, 3).join(' | '));
  await b.close();
  console.log(`\n${fail ? `=== ${fail} échec(s) ===` : '=== tout passe ==='}`);
  process.exit(fail ? 1 : 0);
})();
