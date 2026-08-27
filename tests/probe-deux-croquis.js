// Deux outils : la barre gauche construit direct et code ; le tiroir demande.
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
    window.__t = {
      alea:(s)=>{let x=s;return()=>{x=(x*1103515245+12345)%2147483648;return x/2147483648;};},
      bruit(p,a,s){const r=this.alea(s);return p.map(q=>({x:q.x+(r()-.5)*a,y:q.y+(r()-.5)*a}));},
      rect(x,y,w,h,k){const s=[{x,y},{x:x+w,y},{x:x+w,y:y+h},{x,y:y+h}];const o=[];
        for(let j=0;j<4;j++){const A=s[j],B=s[(j+1)%4];for(let i=0;i<k;i++){const t=i/k;
          o.push({x:A.x+(B.x-A.x)*t,y:A.y+(B.y-A.y)*t});}}o.push({...s[0]});return o;},
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

  const croquer = (outil, code) => page.evaluate(({ outil, code }) => {
    const t = window.__t, app = window.app;
    app.entities = []; app.historyPast = []; app.saveState();
    app.setTool(outil);
    t.tracer(eval(code));
    const nb = (k) => app.entities.filter(e => e.constructor.name === k).length;
    const segs = app.entities.filter(e => e.constructor.name === 'Segment');
    return { modale: getComputedStyle(document.getElementById('croquisModal')).display,
             quoi: document.getElementById('croquisQuoi').textContent,
             pts: nb('Point'), segs: segs.length, angles: nb('Angle'), anims: nb('ToolAnimation'),
             cercles: nb('Circle'), total: app.entities.length,
             codes: segs.filter(s => s.coding && s.coding !== 'mark-none').length,
             bulle: document.getElementById('toast-notification').innerText, outil: app.currentTool };
  }, { outil, code });

  console.log('\n=== barre de gauche : direct, nu, codé ===');
  const a = await croquer('croquis', "t.bruit(t.rect(300,300,260,160,14),4,3)");
  console.log('  ' + JSON.stringify(a));
  ck('aucune question posée', a.modale === 'none');
  ck('aucun tracé d\'instrument', a.anims === 0, `${a.anims} animations`);
  ck('4 points et 4 côtés', a.pts === 4 && a.segs === 4, `${a.pts}pts ${a.segs}seg`);
  ck('les côtés opposés sont codés', a.codes === 4, `${a.codes} codés`);
  ck('les 4 angles droits sont posés', a.angles === 4, `${a.angles}`);
  ck('la bulle annonce le rectangle', /Rectangle reconnu/.test(a.bulle), a.bulle);
  // L'outil RESTE armé : on enchaîne les figures sans retourner le chercher.
  ck('l\'outil reste armé', a.outil === 'croquis', a.outil);

  const carre = await croquer('croquis', "t.bruit(t.rect(300,300,220,220,14),4,5)");
  ck('carré : 4 côtés tous marqués du même symbole', carre.codes === 4 && carre.segs === 4);
  const cer = await croquer('croquis', "t.bruit(t.cercle(400,400,120,90),4,7)");
  ck('cercle : centre + bord, aucune animation', cer.cercles === 1 && cer.pts === 2 && cer.anims === 0);

  console.log('\n=== tiroir magique : la question est posée, rien n\'est bâti ===');
  const q = await croquer('magic_croquis', "t.bruit(t.rect(300,300,260,160,14),4,3)");
  console.log('  ' + JSON.stringify(q));
  ck('la modale s\'ouvre', q.modale === 'flex');
  ck('elle nomme la figure reconnue', /rectangle/i.test(q.quoi), q.quoi);
  ck('RIEN n\'est construit avant la réponse', q.total === 0, `${q.total} entités`);

  const rep = (v) => page.evaluate((v) => {
    window.app.repondreChoixCroquis(v);
    const nb = (k) => window.app.entities.filter(e => e.constructor.name === k).length;
    return { modale: getComputedStyle(document.getElementById('croquisModal')).display,
             total: window.app.entities.length, anims: nb('ToolAnimation'), pts: nb('Point'),
             segs: nb('Segment'), outil: window.app.currentTool };
  }, v);

  const r1 = await rep(false);
  console.log('  « figure seule » : ' + JSON.stringify(r1));
  ck('figure seule : la modale se ferme', r1.modale === 'none');
  ck('figure seule : aucun tracé d\'instrument', r1.anims === 0);
  ck('figure seule : 4 points, 4 côtés', r1.pts === 4 && r1.segs === 4);

  await croquer('magic_croquis', "t.bruit(t.rect(300,300,260,160,14),4,3)");
  const r2 = await rep(true);
  console.log('  « avec construction » : ' + JSON.stringify(r2));
  ck('construction : la modale se ferme', r2.modale === 'none');
  ck('construction : les tracés d\'instruments sont là', r2.anims > 0, `${r2.anims}`);

  await croquer('magic_croquis', "t.bruit(t.rect(300,300,260,160,14),4,3)");
  const r3 = await rep(null);
  console.log('  « annuler » : ' + JSON.stringify(r3));
  ck('annuler : rien n\'est construit', r3.total === 0 && r3.modale === 'none');

  console.log('\n=== les interrupteurs du tiroir sont respectés ===');
  const sansOutils = await page.evaluate(() => {
    const t = window.__t, app = window.app;
    app.entities = []; app.historyPast = []; app.saveState();
    app.magicUseTools = false;
    app.setTool('magic_croquis');
    t.tracer(t.bruit(t.rect(300,300,260,160,14),4,3));
    app.repondreChoixCroquis(true);
    const n = app.entities.filter(e => e.constructor.name === 'ToolAnimation').length;
    app.magicUseTools = true;
    return { anims: n, total: app.entities.length };
  });
  console.log('  « Tracés animés » éteint : ' + JSON.stringify(sansOutils));
  ck('aucun tracé d\'instrument quand l\'interrupteur est éteint', sansOutils.anims === 0, `${sansOutils.anims}`);
  ck('la figure est quand même construite', sansOutils.total > 4);

  console.log('\n=== l\'option « coder les croquis » ===');
  const sansCode = await page.evaluate(() => {
    const t = window.__t, app = window.app;
    app.entities = []; app.historyPast = []; app.saveState();
    app.croquisCodage = false;
    app.setTool('croquis');
    t.tracer(t.bruit(t.rect(300,300,260,160,14),4,3));
    const segs = app.entities.filter(e => e.constructor.name === 'Segment');
    const r = { codes: segs.filter(s => s.coding && s.coding !== 'mark-none').length,
                angles: app.entities.filter(e => e.constructor.name === 'Angle').length, segs: segs.length };
    app.croquisCodage = true;
    return r;
  });
  console.log('  ' + JSON.stringify(sansCode));
  ck('option éteinte : aucun codage', sansCode.codes === 0 && sansCode.angles === 0);
  ck('mais la figure est bien là', sansCode.segs === 4);
  ck('aucune erreur JS', errs.length === 0, errs.slice(0, 3).join(' | '));
  await b.close();
  console.log(`\n${fail ? `=== ${fail} échec(s) ===` : '=== tout passe ==='}`);
  process.exit(fail ? 1 : 0);
})();
