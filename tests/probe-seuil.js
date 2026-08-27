// Le seuil « trop petit » doit valoir la même chose à l'écran, quel que soit le zoom.
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
  await page.goto(PAGE); await page.waitForTimeout(1400);
  await page.evaluate(`
    window.__s = {
      carre(x,y,c,k){const s=[{x,y},{x:x+c,y},{x:x+c,y:y+c},{x,y:y+c}];const o=[];
        for(let j=0;j<4;j++){const A=s[j],B=s[(j+1)%4];for(let i=0;i<k;i++){const t=i/k;
          o.push({x:A.x+(B.x-A.x)*t,y:A.y+(B.y-A.y)*t});}}o.push({...s[0]});return o;},
      tracerEcran(p){const app=window.app,r=app.canvas.getBoundingClientRect();
        const ev=(t,q,bt)=>{const o={pointerId:4,pointerType:'mouse',isPrimary:true,button:0,buttons:bt,
          clientX:r.left+q.x,clientY:r.top+q.y,bubbles:true,cancelable:true};
          (t==='pointerup'?window:app.canvas).dispatchEvent(new PointerEvent(t,o));};
        ev('pointerdown',p[0],1); for(let i=1;i<p.length;i++) ev('pointermove',p[i],1);
        ev('pointerup',p[p.length-1],0);},
    };`);
  const essai = (zoom, cote) => page.evaluate(({ zoom, cote }) => {
    const s = window.__s, app = window.app;
    app.entities = []; app.historyPast = []; app.saveState();
    app.view.zoom = zoom; app.view.x = 30; app.view.y = 30; app.render();
    app.setTool('croquis');
    s.tracerEcran(s.carre(300, 300, cote, 12));
    return document.getElementById('toast-notification').innerText.includes('Carré');
  }, { zoom, cote });

  console.log('=== même carré à l\'écran, seuil identique à tous les zooms ===');
  for (const cote of [60, 40, 30, 22, 16]) {
    const l = [];
    for (const z of [3, 1, 0.3]) l.push(await essai(z, cote) ? 'oui' : 'non');
    const memeReponse = l.every(v => v === l[0]);
    console.log(`  ${String(cote).padEnd(3)}px écran → z3:${l[0]}  z1:${l[1]}  z0.3:${l[2]}`);
    ck(`${cote}px : même réponse à tous les zooms`, memeReponse, l.join('/'));
  }
  const grand = await essai(1, 60), minuscule = await essai(1, 16);
  ck('un carré de 60px est reconnu', grand === true);
  ck('un carré de 16px est refusé', minuscule === false);
  await b.close();
  console.log(`\n${fail ? `=== ${fail} échec(s) ===` : '=== tout passe ==='}`);
  process.exit(fail ? 1 : 0);
})();
