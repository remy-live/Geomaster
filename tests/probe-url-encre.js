// L'encre survit au lien de partage, et ce qu'elle y coûte.
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
    const ev = (t, x, y, bt, id) => { const o = { pointerId: id, pointerType: 'mouse', isPrimary: true, button: 0, buttons: bt,
      clientX: x * a.view.zoom + a.view.x + rc.left, clientY: y * a.view.zoom + a.view.y + rc.top, bubbles: true, cancelable: true };
      (t === 'pointerup' ? window : cv).dispatchEvent(new PointerEvent(t, o)); };
    a.entities = []; a.historyPast = []; a.saveState();
    a.setTool('segment'); ev('pointerdown',300,400,1,3); ev('pointermove',700,400,1,3); ev('pointerup',700,400,0,3);
    const sansEncre = a.getCompressedString().length;
    // une marque sinueuse de 40 points en travers du segment
    a.setTool('stylo');
    ev('pointerdown',500,370,1,4);
    for (let i=1;i<=40;i++) ev('pointermove', 500 + 6*Math.sin(i/3), 370 + i*1.5, 1, 4);
    ev('pointerup',500,430,0,4);
    const an = a.entities.find(e => e.constructor.name === 'Annotation');
    const avant = { mode: an.mode, n: an.local.length, lisse: an.lisse,
                    pts: an.versMonde().map(p => [Math.round(p.x*10)/10, Math.round(p.y*10)/10]) };
    const url = a.getCompressedString();
    const brut = LZString.decompressFromEncodedURIComponent(url);
    const ligne = brut.split('\u00a6').find(l => l.indexOf('14;') === 0);
    a.clearCanvas();
    a.loadFromCompressedString(url);
    const an2 = a.entities.find(e => e.constructor.name === 'Annotation');
    const seg2 = a.entities.find(e => e.constructor.name === 'Segment');
    const apres = an2 ? { mode: an2.mode, n: an2.local.length, lisse: an2.lisse,
                          ancre: an2.ancre === seg2,
                          pts: an2.versMonde().map(p => [Math.round(p.x*10)/10, Math.round(p.y*10)/10]) } : null;
    let ecart = 0;
    if (apres && apres.pts.length === avant.pts.length)
      avant.pts.forEach((p,i) => { ecart = Math.max(ecart, Math.hypot(p[0]-apres.pts[i][0], p[1]-apres.pts[i][1])); });
    return { sansEncre, avecEncre: url.length, ligne: ligne.length, brutLigne: ligne,
             avant, apres, ecart: Math.round(ecart*1000)/1000 };
  });

  console.log('\n=== aller-retour par le lien ===');
  console.log('  points bruts simplifiés à ' + r.avant.n + ' points, mode ' + r.avant.mode);
  ck('l\'encre est bien dans le lien', !!r.apres);
  ck('même mode', r.apres && r.apres.mode === r.avant.mode, r.apres && r.apres.mode);
  ck('même nombre de points', r.apres && r.apres.n === r.avant.n, r.apres && `${r.avant.n} → ${r.apres.n}`);
  ck('rattachée au bon segment', r.apres && r.apres.ancre === true);
  ck('adoucissement conservé', r.apres && r.apres.lisse === r.avant.lisse);
  ck('écart de position < 0,5 px', r.ecart < 0.5, r.ecart + ' px');
  console.log('\n=== coût dans l\'URL ===');
  const cout = r.avecEncre - r.sansEncre;
  console.log(`  lien sans encre ${r.sansEncre} car., avec ${r.avecEncre} → ${cout} car. compressés`);
  console.log('  ligne brute : ' + JSON.stringify(r.brutLigne));
  ck('moins de 3,5 caractères bruts par point', r.ligne / r.avant.n < 3.5,
     `${r.ligne} car. pour ${r.avant.n} points = ${Math.round(r.ligne/r.avant.n*100)/100} car./point`);
  ck('aucune erreur JS', errs.length === 0, errs.slice(0,3).join(' | '));
  await b.close();
  console.log(`\n${fail ? `=== ${fail} échec(s) ===` : '=== tout passe ==='}`);
  process.exit(fail ? 1 : 0);
})();
