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
  const r = await page.evaluate(() => {
    const a = window.app, cv = a.canvas, rc = cv.getBoundingClientRect();
    const ev = (t, x, y, bt, id) => { const o = { pointerId: id, pointerType:'mouse', isPrimary:true, button:0, buttons:bt,
      clientX: x*a.view.zoom+a.view.x+rc.left, clientY: y*a.view.zoom+a.view.y+rc.top, bubbles:true, cancelable:true };
      (t==='pointerup'?window:cv).dispatchEvent(new PointerEvent(t,o)); };
    a.entities = []; a.historyPast = []; a.saveState();
    a.setTool('stylo');
    ev('pointerdown',300,300,1,5);
    [[360,420],[420,300],[480,420],[540,300]].forEach(([x,y])=>ev('pointermove',x,y,1,5));
    ev('pointerup',540,300,0,5);
    const an = a.entities.find(e=>e.constructor.name==='Annotation');
    const svgL = an.versSVG();
    an.lisse = false;
    const svgD = an.versSVG();
    // le panneau d'options existe-t-il avec ses nouveaux réglages ?
    const pan = document.getElementById('styloOptions');
    pan.style.display = 'block';
    const sel = document.getElementById('optStyloEchelle');
    const cbA = document.getElementById('optStyloAdoucir');
    const vus = { sel: !!sel, n: sel ? sel.options.length : 0, cb: !!cbA,
                  hSel: sel ? Math.round(sel.getBoundingClientRect().height) : 0,
                  hPan: Math.round(pan.getBoundingClientRect().height),
                  wPan: Math.round(pan.getBoundingClientRect().width) };
    pan.style.display = 'none';
    return { svgL, svgD, vus };
  });
  console.log('\n=== export SVG ===');
  console.log('  adouci : ' + r.svgL.slice(0, 130));
  console.log('  brut   : ' + r.svgD.slice(0, 130));
  ck('l\'adouci sort en courbes', /\sQ[\d.-]/.test(r.svgL));
  ck('sans l\'option, des droites', !/\sQ[\d.-]/.test(r.svgD) && /L[\d.-]/.test(r.svgD));
  console.log('\n=== panneau d\'options ===');
  console.log('  ' + JSON.stringify(r.vus));
  ck('le choix d\'échelle est là, 3 possibilités', r.vus.sel && r.vus.n === 3);
  ck('la case adoucir est là', r.vus.cb === true);
  ck('le menu déroulant est cliquable au doigt', r.vus.hSel >= 26, r.vus.hSel + 'px');
  ck('le panneau tient dans un écran de téléphone', r.vus.wPan <= 320 && r.vus.hPan <= 400,
     `${r.vus.wPan}x${r.vus.hPan}`);
  ck('aucune erreur JS', errs.length === 0, errs.slice(0,3).join(' | '));
  await b.close();
  console.log(`\n${fail ? `=== ${fail} échec(s) ===` : '=== tout passe ==='}`);
  process.exit(fail ? 1 : 0);
})();
