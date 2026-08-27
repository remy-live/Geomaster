// Les deux nouvelles options du stylo : adoucir, et l'échelle imposée.
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
  await page.evaluate(`window.__t = {
    trace(pts){const a=window.app,cv=a.canvas,r=cv.getBoundingClientRect();
      const ev=(t,q,bt)=>{const o={pointerId:7,pointerType:'mouse',isPrimary:true,button:0,buttons:bt,
        clientX:q.x*a.view.zoom+a.view.x+r.left,clientY:q.y*a.view.zoom+a.view.y+r.top,bubbles:true,cancelable:true};
        (t==='pointerup'?window:cv).dispatchEvent(new PointerEvent(t,o));};
      ev('pointerdown',pts[0],1); for(let i=1;i<pts.length;i++) ev('pointermove',pts[i],1);
      ev('pointerup',pts[pts.length-1],0);},
    segment(x1,y1,x2,y2){const a=window.app;a.setTool('segment');
      const r=a.canvas.getBoundingClientRect();
      const ev=(t,x,y,bt)=>{const o={pointerId:9,pointerType:'mouse',isPrimary:true,button:0,buttons:bt,
        clientX:x*a.view.zoom+a.view.x+r.left,clientY:y*a.view.zoom+a.view.y+r.top,bubbles:true,cancelable:true};
        (t==='pointerup'?window:a.canvas).dispatchEvent(new PointerEvent(t,o));};
      ev('pointerdown',x1,y1,1); ev('pointermove',x2,y2,1); ev('pointerup',x2,y2,0);
      return a.entities.find(e=>e.constructor.name==='Segment');},
  };`);

  console.log('\n=== l\'option d\'échelle impose le comportement ===');
  const ech = await page.evaluate(() => {
    const t = window.__t, a = window.app;
    const essai = (choix, pts) => {
      a.entities = []; a.historyPast = []; a.saveState();
      const seg = t.segment(300, 400, 700, 400);
      a.reglerStylo('echelle', choix); a.setTool('stylo');
      t.trace(pts);
      const an = a.entities.find(e => e.constructor.name === 'Annotation');
      const larg = () => { const p = an.versMonde(); let x0=Infinity,x1=-Infinity,y0=Infinity,y1=-Infinity;
        p.forEach(q=>{x0=Math.min(x0,q.x);x1=Math.max(x1,q.x);y0=Math.min(y0,q.y);y1=Math.max(y1,q.y);});
        return Math.round(Math.max(x1-x0, y1-y0)); };
      const avant = larg(); seg.p2.x = 1100; const apres = larg();
      return { mode: an.mode, avant, apres };
    };
    const barre = []; for (let i=0;i<=10;i++) barre.push({x:500+i*0.4, y:375+i*5});      // petite
    const long  = []; for (let i=0;i<=20;i++) long.push({x:320+i*18, y:390+2*Math.sin(i)}); // étendue
    return {
      autoPetit: essai('auto', barre), autoLong: essai('auto', long),
      fixeLong: essai('fixe', long), suitPetit: essai('suit', barre),
    };
  });
  console.log('  ' + JSON.stringify(ech));
  ck('auto : la petite marque garde sa taille', ech.autoPetit.mode === 'marque'
     && ech.autoPetit.apres === ech.autoPetit.avant, `${ech.autoPetit.avant} → ${ech.autoPetit.apres}`);
  ck('auto : le trait étendu double', ech.autoLong.mode === 'deux'
     && Math.abs(ech.autoLong.apres / ech.autoLong.avant - 2) < 0.06, `${ech.autoLong.avant} → ${ech.autoLong.apres}`);
  ck('« taille d\'origine » fige aussi un trait étendu', ech.fixeLong.mode === 'marque'
     && ech.fixeLong.apres === ech.fixeLong.avant, `${ech.fixeLong.avant} → ${ech.fixeLong.apres}`);
  ck('« à l\'échelle » fait grandir même une petite marque', ech.suitPetit.mode === 'deux'
     && Math.abs(ech.suitPetit.apres / ech.suitPetit.avant - 2) < 0.06, `${ech.suitPetit.avant} → ${ech.suitPetit.apres}`);

  console.log('\n=== adoucir : le trait change de dessin, pas de données ===');
  const ad = await page.evaluate(() => {
    const t = window.__t, a = window.app;
    a.entities = []; a.historyPast = []; a.saveState();
    a.reglerStylo('echelle', 'auto'); a.setTool('stylo');
    // un zigzag franc : l'adoucissement doit se voir
    t.trace([{x:300,y:300},{x:360,y:420},{x:420,y:300},{x:480,y:420},{x:540,y:300}]);
    const an = a.entities.find(e => e.constructor.name === 'Annotation');
    const encre = () => { a.render();
      const d = a.ctx.getImageData(0, 0, a.canvas.width, a.canvas.height).data;
      let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 40) n++; return n; };
    a.reglerStylo('adoucir', true);  const lisse = encre();  const nL = an.local.length;
    a.reglerStylo('adoucir', false); const dur = encre();    const nD = an.local.length;
    return { lisse, dur, nL, nD, drapeau: an.lisse };
  });
  console.log('  ' + JSON.stringify(ad));
  ck('le rendu diffère selon l\'option', Math.abs(ad.lisse - ad.dur) > 200, `${ad.dur} → ${ad.lisse} px d'encre`);
  ck('l\'adouci est plus court (les angles sont coupés)', ad.lisse < ad.dur, `${ad.lisse} < ${ad.dur}`);
  ck('aucun point n\'est ajouté ni perdu', ad.nL === ad.nD && ad.nL === 5, `${ad.nD} points`);
  ck('décocher se répercute sur le trait déjà posé', ad.drapeau === false);
  ck('aucune erreur JS', errs.length === 0, errs.slice(0, 3).join(' | '));
  await b.close();
  console.log(`\n${fail ? `=== ${fail} échec(s) ===` : '=== tout passe ==='}`);
  process.exit(fail ? 1 : 0);
})();
