// La loupe : apparition, suivi du doigt, contenu, disparition.
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
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
  const page = await ctx.newPage();
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.goto(PAGE); await page.waitForTimeout(1600);

  const geste = (dx, dy, attente) => page.evaluate(async ({ dx, dy, attente }) => {
    const app = window.app, cv = app.canvas;
    const r = cv.getBoundingClientRect();
    const bulle = document.getElementById('zoomBubble');
    const ev = (t, x, y, bt) => {
      const o = { pointerId: 1, pointerType: 'touch', isPrimary: true, button: 0, buttons: bt,
                  clientX: x, clientY: y, bubbles: true, cancelable: true };
      (t === 'pointerup' ? window : cv).dispatchEvent(new PointerEvent(t, o));
    };
    const x0 = r.left + 100, y0 = r.top + 300;
    app.setTool('segment');
    ev('pointerdown', x0, y0, 1);
    if (attente) await new Promise(r2 => setTimeout(r2, 300));
    for (let i = 1; i <= 12; i++) ev('pointermove', x0 + dx * i / 12, y0 + dy * i / 12, 1);
    await new Promise(r2 => requestAnimationFrame(() => requestAnimationFrame(r2)));
    const cs = getComputedStyle(bulle);
    const bb = bulle.getBoundingClientRect();
    const fx = x0 + dx, fy = y0 + dy;
    // encre non blanche dans la loupe = elle montre quelque chose
    const z = document.getElementById('zoomCanvas');
    const d = z.getContext('2d').getImageData(0, 0, z.width, z.height).data;
    let encre = 0;
    for (let i = 0; i < d.length; i += 4) if (d[i] < 235 || d[i + 1] < 235 || d[i + 2] < 235) encre++;
    const res = { disp: cs.display, transform: cs.transform !== 'none',
                  boite: [Math.round(bb.left), Math.round(bb.top), Math.round(bb.width), Math.round(bb.height)],
                  doigt: [Math.round(fx), Math.round(fy)],
                  auDessus: bb.bottom <= fy + 1, centree: Math.abs((bb.left + bb.right) / 2 - fx) < 30,
                  dansEcran: bb.left >= 0 && bb.right <= innerWidth && bb.top >= 0 && bb.bottom <= innerHeight,
                  encre: encre };
    ev('pointerup', fx, fy, 0);
    res.dispApres = getComputedStyle(bulle).display;
    res.transformApres = getComputedStyle(bulle).transform;
    return res;
  }, { dx, dy, attente });

  console.log('\n=== glissement franc : la loupe sort et suit ===');
  const g = await geste(120, -60, false);
  console.log('  ' + JSON.stringify(g));
  ck('la loupe est visible', g.disp === 'block');
  ck('elle est placée par transform', g.transform === true);
  ck('au-dessus du doigt', g.auDessus === true);
  ck('centrée sur le doigt', g.centree === true);
  ck('entièrement dans l\'écran', g.dansEcran === true);
  ck('elle montre bien quelque chose', g.encre > 50, `${g.encre} pixels d'encre`);
  ck('elle disparaît au relâchement', g.dispApres === 'none');
  ck('et rend son ancrage d\'origine', g.transformApres === 'none' || g.transformApres === '');

  console.log('\n=== maintien sans glisser : elle sort après le délai ===');
  const m = await geste(4, 3, true);
  ck('visible après maintien', m.disp === 'block');
  ck('dans l\'écran', m.dansEcran === true);

  console.log('\n=== près du haut de l\'écran : elle se décale sur le côté ===');
  const h = await page.evaluate(async () => {
    const app = window.app, cv = app.canvas, bulle = document.getElementById('zoomBubble');
    const r = cv.getBoundingClientRect();
    const ev = (t, x, y, bt) => { const o = { pointerId: 1, pointerType: 'touch', isPrimary: true, button: 0,
      buttons: bt, clientX: x, clientY: y, bubbles: true, cancelable: true };
      (t === 'pointerup' ? window : cv).dispatchEvent(new PointerEvent(t, o)); };
    const x0 = r.left + 80, y0 = Math.max(r.top + 6, 60);
    app.setTool('segment');
    ev('pointerdown', x0, y0, 1);
    for (let i = 1; i <= 12; i++) ev('pointermove', x0 + i * 3, y0 + i, 1);
    await new Promise(r2 => requestAnimationFrame(() => requestAnimationFrame(r2)));
    const bb = bulle.getBoundingClientRect();
    const res = { dansEcran: bb.left >= 0 && bb.right <= innerWidth && bb.top >= 0 && bb.bottom <= innerHeight,
                  boite: [Math.round(bb.left), Math.round(bb.top)] };
    ev('pointerup', x0 + 36, y0 + 12, 0);
    return res;
  });
  console.log('  ' + JSON.stringify(h));
  ck('toujours entièrement dans l\'écran', h.dansEcran === true);
  ck('aucune erreur JS', errs.length === 0, errs.slice(0, 3).join(' | '));
  await b.close();
  console.log(`\n${fail ? `=== ${fail} échec(s) ===` : '=== tout passe ==='}`);
  process.exit(fail ? 1 : 0);
})();
