// Le premier côté d'une construction issue d'un croquis doit lui aussi être
// tracé à la règle, comme les suivants.
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
      carre(x,y,c,r,n){return this.polyArrondi([{x,y},{x:x+c,y},{x:x+c,y:y+c},{x,y:y+c}],r,n);},
      tri(x,y,c,r,n){const h=c*Math.sqrt(3)/2;
        return this.polyArrondi([{x,y:y+h},{x:x+c,y:y+h},{x:x+c/2,y}],r,n);},
      rect(x,y,w,h,r,n){return this.polyArrondi([{x,y},{x:x+w,y},{x:x+w,y:y+h},{x,y:y+h}],r,n);},
      tracer(p){const app=window.app,r=app.canvas.getBoundingClientRect();
        const cl=(q)=>({X:q.x*app.view.zoom+app.view.x+r.left,Y:q.y*app.view.zoom+app.view.y+r.top});
        const ev=(t,q,bt)=>{const c=cl(q);const o={pointerId:4,pointerType:'mouse',isPrimary:true,button:0,buttons:bt,
          clientX:c.X,clientY:c.Y,bubbles:true,cancelable:true};
          (t==='pointerup'?window:app.canvas).dispatchEvent(new PointerEvent(t,o));};
        ev('pointerdown',p[0],1); for(let i=1;i<p.length;i++) ev('pointermove',p[i],1);
        ev('pointerup',p[p.length-1],0);},
    };`);

  const essai = (code) => page.evaluate(async ({ code }) => {
    const m = window.__m, a = window.app;
    a.entities = []; a.historyPast = []; a.saveState();
    a.magicUseTools = true; a.magicAnimate = true;
    a.setTool('magic_croquis');
    m.tracer(eval(code));
    const ouverte = getComputedStyle(document.getElementById('croquisModal')).display !== 'none';
    if (ouverte) a.repondreChoixCroquis(true);
    // suite des entités jusqu'au premier segment visible
    const suite = [];
    for (const e of a.entities) {
      const n = e.constructor.name;
      suite.push(n === 'ToolAnimation' ? ('anim:' + (e.type || e.originalType || '?') + (e.widgetType ? '/' + e.widgetType : '')) : n);
      if (n === 'Segment') break;
    }
    // ... et surtout : la RELECTURE démarre-t-elle avant ce premier trait ?
    // (playStepLoop s'exécute dans un setTimeout de 50 ms)
    await new Promise(r2 => setTimeout(r2, 260));
    const depart = a.loopStartIndex;
    // le premier segment est-il précédé d'un tracé à la règle ?
    const iSeg = a.entities.findIndex(e => e.constructor.name === 'Segment');
    let regleAvant = false;
    for (let i = iSeg - 1; i >= 0 && i >= iSeg - 3; i--) {
      const e = a.entities[i];
      if (e.constructor.name === 'ToolAnimation' && e.widgetType === 'ruler') { regleAvant = true; break; }
    }
    return { ouverte, suite, regleAvant, iSeg, depart,
             anims: a.entities.filter(e => e.constructor.name === 'ToolAnimation').length };
  }, { code });

  for (const [nom, code] of [
    ['carré', "m.carre(300,300,220,10,14)"],
    ['triangle équilatéral', "m.tri(300,300,220,10,14)"],
    ['rectangle', "m.rect(300,300,280,170,10,14)"],
  ]) {
    const r = await essai(code);
    console.log(`\n  ${nom} : ${r.suite.join(' → ')}`);
    ck(`${nom} : la modale a bien été posée`, r.ouverte === true);
    ck(`${nom} : le PREMIER trait passe par la règle`, r.regleAvant === true);
    ck(`${nom} : la construction est instrumentée`, r.anims > 3, `${r.anims} animations`);
    ck(`${nom} : la relecture démarre AVANT le premier trait`, r.depart <= r.iSeg - 1,
       `départ=${r.depart}, premier segment à ${r.iSeg}`);
  }

  console.log('\n=== « Tracés animés » éteint : plus aucune animation, même sur le premier trait ===');
  const sans = await page.evaluate(() => {
    const m = window.__m, a = window.app;
    a.entities = []; a.historyPast = []; a.saveState();
    a.magicUseTools = false;
    a.setTool('magic_croquis');
    m.tracer(m.carre(300, 300, 220, 10, 14));
    a.repondreChoixCroquis(true);
    const n = a.entities.filter(e => e.constructor.name === 'ToolAnimation').length;
    a.magicUseTools = true;
    return { anims: n, segs: a.entities.filter(e => e.constructor.name === 'Segment').length };
  });
  console.log('  ' + JSON.stringify(sans));
  ck('aucune animation', sans.anims === 0);
  ck('la figure est quand même construite', sans.segs >= 4);
  ck('aucune erreur JS', errs.length === 0, errs.slice(0, 3).join(' | '));
  await b.close();
  console.log(`\n${fail ? `=== ${fail} échec(s) ===` : '=== tout passe ==='}`);
  process.exit(fail ? 1 : 0);
})();
