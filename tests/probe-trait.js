// Segment, demi-droite ou droite : le tracé décide. Et les options s'ouvrent.
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
  const page = await (await b.newContext({ viewport: { width: 1100, height: 800 }, hasTouch: true })).newPage();
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.goto(PAGE); await page.waitForTimeout(1500);
  await page.evaluate(`
    window.__l = {
      // trace en coordonnées ÉCRAN (clientX/clientY)
      tracer(a, bb, n){const app=window.app,cv=app.canvas;
        const ev=(t,x,y,bt)=>{const o={pointerId:4,pointerType:'mouse',isPrimary:true,button:0,buttons:bt,
          clientX:x,clientY:y,bubbles:true,cancelable:true};
          (t==='pointerup'?window:cv).dispatchEvent(new PointerEvent(t,o));};
        ev('pointerdown',a.x,a.y,1);
        for(let i=1;i<=n;i++){const t=i/n; ev('pointermove',a.x+(bb.x-a.x)*t,a.y+(bb.y-a.y)*t,1);}
        ev('pointerup',bb.x,bb.y,0);},
      vue(){const r=window.app.canvas.getBoundingClientRect();
        return {l:Math.max(0,r.left),t:Math.max(0,r.top),r:Math.min(innerWidth,r.right),b:Math.min(innerHeight,r.bottom)};},
    };`);
  const essai = (fa, fb) => page.evaluate(({ fa, fb }) => {
    const l = window.__l, a = window.app;
    a.entities = []; a.historyPast = []; a.saveState();
    a.setTool('croquis');
    const v = l.vue();
    const P = (f) => ({ x: v.l + (v.r - v.l) * f[0], y: v.t + (v.b - v.t) * f[1] });
    l.tracer(P(fa), P(fb), 30);
    const nb = (k) => a.entities.filter(e => e.constructor.name === k).length;
    const ray = a.entities.find(e => e.constructor.name === 'Ray');
    return { bulle: document.getElementById('toast-notification').innerText,
             seg: nb('Segment'), droite: nb('Line'), demi: nb('Ray'), pts: nb('Point'),
             origine: ray ? { x: Math.round(ray.p1.x), y: Math.round(ray.p1.y) } : null,
             vers: ray ? { x: Math.round(ray.p2.x), y: Math.round(ray.p2.y) } : null };
  }, { fa, fb });

  console.log('\n=== les deux bouts au bord → droite ===');
  let r = await essai([0.005, 0.5], [0.995, 0.55]);
  console.log('  ' + JSON.stringify(r));
  ck('une droite est créée', r.droite === 1 && r.seg === 0 && r.demi === 0);
  ck('la bulle l\'annonce', /Droite reconnu/.test(r.bulle), r.bulle);

  console.log('\n=== un seul bout au bord → demi-droite, origine à l\'intérieur ===');
  r = await essai([0.45, 0.5], [0.995, 0.5]);
  console.log('  ' + JSON.stringify(r));
  ck('une demi-droite est créée', r.demi === 1 && r.droite === 0 && r.seg === 0);
  ck('la bulle l\'annonce', /Demi-droite reconnu/.test(r.bulle), r.bulle);
  const vue = await page.evaluate(() => window.__l.vue());
  const orig = await page.evaluate((o) => {
    const a = window.app, r2 = a.canvas.getBoundingClientRect();
    return { x: o.x * a.view.zoom + a.view.x + r2.left, y: o.y * a.view.zoom + a.view.y + r2.top };
  }, r.origine);
  ck('l\'origine est le bout INTÉRIEUR', orig.x < (vue.l + vue.r) / 2 + 60, `x=${Math.round(orig.x)} milieu=${Math.round((vue.l+vue.r)/2)}`);

  console.log('\n=== l\'autre sens : le bord d\'abord ===');
  r = await essai([0.005, 0.4], [0.5, 0.4]);
  ck('toujours une demi-droite', r.demi === 1);
  const o2 = await page.evaluate((o) => {
    const a = window.app, r2 = a.canvas.getBoundingClientRect();
    return { x: o.x * a.view.zoom + a.view.x + r2.left };
  }, r.origine);
  ck('origine du côté intérieur, pas du bord', o2.x > vue.l + 100, `x=${Math.round(o2.x)}`);

  console.log('\n=== trait long au centre → droite ===');
  r = await essai([0.15, 0.25], [0.85, 0.75]);
  console.log('  ' + JSON.stringify(r));
  ck('une droite', r.droite === 1, JSON.stringify(r));

  console.log('\n=== trait court au centre → segment ===');
  r = await essai([0.42, 0.45], [0.58, 0.55]);
  console.log('  ' + JSON.stringify(r));
  ck('un segment', r.seg === 1 && r.droite === 0 && r.demi === 0);

  console.log('\n=== options débrayées : tout redevient segment ===');
  const sans = await page.evaluate(() => {
    const l = window.__l, a = window.app;
    a.reglerCroquis('droiteLongue', false); a.reglerCroquis('bord', false);
    const out = [];
    for (const [fa, fb] of [[[0.005,0.5],[0.995,0.55]], [[0.45,0.5],[0.995,0.5]], [[0.15,0.25],[0.85,0.75]]]) {
      a.entities = []; a.historyPast = []; a.saveState(); a.setTool('croquis');
      const v = l.vue(); const P = (f) => ({ x: v.l + (v.r - v.l) * f[0], y: v.t + (v.b - v.t) * f[1] });
      l.tracer(P(fa), P(fb), 30);
      out.push({ seg: a.entities.filter(e => e.constructor.name === 'Segment').length,
                 droite: a.entities.filter(e => e.constructor.name === 'Line').length,
                 demi: a.entities.filter(e => e.constructor.name === 'Ray').length });
    }
    a.reglerCroquis('droiteLongue', true); a.reglerCroquis('bord', true);
    return out;
  });
  console.log('  ' + JSON.stringify(sans));
  ck('les trois donnent un segment', sans.every(o => o.seg === 1 && o.droite === 0 && o.demi === 0));

  console.log('\n=== le panneau d\'options ===');
  const opt = await page.evaluate(async () => {
    const btn = document.getElementById('btnCroquis');
    const r2 = btn.getBoundingClientRect();
    btn.dispatchEvent(new PointerEvent('pointerdown', { pointerId: 9, pointerType: 'touch', isPrimary: true,
      button: 0, buttons: 1, clientX: r2.left + 10, clientY: r2.top + 10, bubbles: true, cancelable: true }));
    await new Promise(r3 => setTimeout(r3, 620));
    const pan = document.getElementById('croquisOptions');
    const p = pan.getBoundingClientRect();
    const res = { disp: getComputedStyle(pan).display,
                  dansEcran: p.left >= 0 && p.right <= innerWidth && p.top >= 0 && p.bottom <= innerHeight,
                  cases: pan.querySelectorAll('input[type=checkbox]').length,
                  boite: [Math.round(p.left), Math.round(p.top), Math.round(p.width), Math.round(p.height)] };
    // fermeture par appui à l'extérieur
    // sur body : un vrai appui vise toujours un élément, jamais document
    document.body.dispatchEvent(new PointerEvent('pointerdown', { pointerId: 9, clientX: 5, clientY: innerHeight - 5, bubbles: true }));
    res.dispApres = getComputedStyle(pan).display;
    return res;
  });
  console.log('  ' + JSON.stringify(opt));
  ck('l\'appui long ouvre les options', opt.disp === 'block');
  ck('quatre réglages', opt.cases === 4, `${opt.cases}`);
  ck('le panneau tient dans l\'écran', opt.dansEcran === true);
  ck('il se ferme à l\'appui extérieur', opt.dispApres === 'none');
  ck('aucune erreur JS', errs.length === 0, errs.slice(0, 3).join(' | '));
  await b.close();
  console.log(`\n${fail ? `=== ${fail} échec(s) ===` : '=== tout passe ==='}`);
  process.exit(fail ? 1 : 0);
})();
