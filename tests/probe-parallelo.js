// Parallélogramme reconnu, exact, constructible — et lettres dans l'ordre du tracé.
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
      // parallélogramme : base b, décalage d, hauteur h
      para(x,y,bw,dx,h,rayon,n){return this.polyArrondi(
        [{x,y:y+h},{x:x+bw,y:y+h},{x:x+bw+dx,y},{x:x+dx,y}],rayon,n);},
      carre(x,y,c,r,n){return this.polyArrondi([{x,y},{x:x+c,y},{x:x+c,y:y+c},{x,y:y+c}],r,n);},
      rect(x,y,w,h,r,n){return this.polyArrondi([{x,y},{x:x+w,y},{x:x+w,y:y+h},{x,y:y+h}],r,n);},
      losange(cx,cy,d1,d2,th,r,n){const R=(x,y)=>({x:cx+x*Math.cos(th)-y*Math.sin(th),y:cy+x*Math.sin(th)+y*Math.cos(th)});
        return this.polyArrondi([R(d1/2,0),R(0,d2/2),R(-d1/2,0),R(0,-d2/2)],r,n);},
      tracer(p){const app=window.app,r=app.canvas.getBoundingClientRect();
        const cl=(q)=>({X:q.x*app.view.zoom+app.view.x+r.left,Y:q.y*app.view.zoom+app.view.y+r.top});
        const ev=(t,q,bt)=>{const c=cl(q);const o={pointerId:4,pointerType:'mouse',isPrimary:true,button:0,buttons:bt,
          clientX:c.X,clientY:c.Y,bubbles:true,cancelable:true};
          (t==='pointerup'?window:app.canvas).dispatchEvent(new PointerEvent(t,o));};
        ev('pointerdown',p[0],1); for(let i=1;i<p.length;i++) ev('pointermove',p[i],1);
        ev('pointerup',p[p.length-1],0);},
    };`);
  const rec = (code, g) => page.evaluate(({ code, g }) => {
    const m = window.__m;
    return GmCroquis.reconnaitre(m.onduler(eval(code), 2, g), 1);
  }, { code, g });

  console.log('\n=== parallélogrammes ===');
  for (const [nom, code] of [
    ['penché à droite', "m.para(300,300,220,80,140,10,14)"],
    ['penché à gauche', "m.para(400,300,220,-90,150,10,14)"],
    ['très aplati',     "m.para(300,340,260,120,90,10,14)"],
    ['petit',           "m.para(350,350,110,45,75,6,12)"],
  ]) {
    const l = [];
    for (const g of [3, 11, 23, 31]) { const r = await rec(code, g); l.push(r ? r.forme : '—'); }
    ck(`${nom} → parallélogramme`, l.every(v => v === 'parallelogramme'), l.join(' '));
  }

  console.log('\n=== il ne mange pas les cas particuliers ===');
  for (const [nom, code, att] of [
    ['carré', "m.carre(300,300,200,10,14)", 'carre'],
    ['rectangle', "m.rect(300,300,260,160,10,14)", 'rectangle'],
    ['losange', "m.losange(400,400,240,140,0,10,14)", 'losange'],
  ]) {
    const l = [];
    for (const g of [3, 11, 23]) { const r = await rec(code, g); l.push(r ? r.forme : '—'); }
    ck(`${nom} reste ${att}`, l.every(v => v === att), l.join(' '));
  }

  console.log('\n=== la figure rendue est-elle un vrai parallélogramme ? ===');
  const r = await rec("m.para(300,300,220,80,140,10,14)", 3);
  const s = r.sommets;
  const cot = s.map((v, i) => Math.hypot(v.x - s[(i+1)%4].x, v.y - s[(i+1)%4].y));
  const ang = (i) => Math.atan2(s[(i+1)%4].y - s[i].y, s[(i+1)%4].x - s[i].x);
  const dPar = (a, b2) => { let t = Math.abs(a - b2) % Math.PI; return Math.min(t, Math.PI - t); };
  console.log(`  côtés ${cot.map(c=>c.toFixed(2)).join(' ')}`);
  ck('côtés opposés rigoureusement égaux', Math.abs(cot[0]-cot[2]) < 1e-9 && Math.abs(cot[1]-cot[3]) < 1e-9);
  ck('côtés opposés rigoureusement parallèles', dPar(ang(0), ang(2)) < 1e-9 && dPar(ang(1), ang(3)) < 1e-9);
  ck('ce n\'est ni un losange ni un rectangle', Math.abs(cot[0]-cot[1]) > 20);

  console.log('\n=== dans l\'application ===');
  const a1 = await page.evaluate(() => {
    const m = window.__m, a = window.app;
    a.entities = []; a.historyPast = []; a.saveState();
    a.setTool('magic_croquis');
    m.tracer(m.onduler(m.para(300,300,220,80,140,10,14), 2, 3));
    const ouverte = getComputedStyle(document.getElementById('croquisModal')).display !== 'none';
    const quoi = document.getElementById('croquisQuoi').textContent;
    a.repondreChoixCroquis(true);
    return { ouverte, quoi, anims: a.entities.filter(e => e.constructor.name === 'ToolAnimation').length,
             segs: a.entities.filter(e => e.constructor.name === 'Segment').length };
  });
  console.log('  ' + JSON.stringify(a1));
  ck('la construction est proposée', a1.ouverte === true && /parallélogramme/i.test(a1.quoi), a1.quoi);
  ck('et elle est instrumentée', a1.anims > 3, `${a1.anims}`);

  console.log('\n=== lettres dans l\'ordre du tracé ===');
  const ordre = await page.evaluate(() => {
    const m = window.__m, a = window.app;
    const lire = () => a.entities.filter(e => e.constructor.name === 'Point')
      .map(p => ({ l: p.label, x: Math.round(p.x), y: Math.round(p.y) }));
    const test = (pts) => {
      a.entities = []; a.historyPast = []; a.saveState(); a.setTool('croquis');
      m.tracer(m.onduler(pts, 2, 3));
      return lire();
    };
    // carré parcouru dans le sens horaire depuis le coin haut-gauche
    const A = test(m.carre(300, 300, 200, 10, 14));
    // même carré parcouru dans l'AUTRE sens (liste de sommets inversée)
    const inv = m.polyArrondi([{x:300,y:300},{x:300,y:500},{x:500,y:500},{x:500,y:300}], 10, 14);
    const B = test(inv);
    return { A, B };
  });
  const pos = (l, lettre) => l.find(p => p.l === lettre);
  console.log('  sens 1 : ' + ordre.A.map(p => `${p.l}(${p.x},${p.y})`).join(' '));
  console.log('  sens 2 : ' + ordre.B.map(p => `${p.l}(${p.x},${p.y})`).join(' '));
  ck('sens 1 : A puis B vers la droite', pos(ordre.A,'B') && pos(ordre.A,'B').x > pos(ordre.A,'A').x + 100,
     `A=${JSON.stringify(pos(ordre.A,'A'))} B=${JSON.stringify(pos(ordre.A,'B'))}`);
  ck('sens 2 : A puis B vers le bas', pos(ordre.B,'B') && pos(ordre.B,'B').y > pos(ordre.B,'A').y + 100,
     `A=${JSON.stringify(pos(ordre.B,'A'))} B=${JSON.stringify(pos(ordre.B,'B'))}`);

  console.log('\n=== l\'option « nommer les sommets » ===');
  const sansNom = await page.evaluate(() => {
    const m = window.__m, a = window.app;
    a.reglerCroquis('nommer', false);
    a.entities = []; a.historyPast = []; a.saveState(); a.setTool('croquis');
    m.tracer(m.onduler(m.carre(300, 300, 200, 10, 14), 2, 3));
    const pts = a.entities.filter(e => e.constructor.name === 'Point');
    a.reglerCroquis('nommer', true);
    return { n: pts.length, labels: pts.map(p => p.label) };
  });
  console.log('  ' + JSON.stringify(sansNom));
  ck('les points existent toujours', sansNom.n === 4);
  ck('mais sans lettre', sansNom.labels.every(l => !l));
  ck('aucune erreur JS', errs.length === 0, errs.slice(0, 3).join(' | '));
  await b.close();
  console.log(`\n${fail ? `=== ${fail} échec(s) ===` : '=== tout passe ==='}`);
  process.exit(fail ? 1 : 0);
})();
