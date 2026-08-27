// Chaque construction magique annonce-t-elle ce qu'elle attend VRAIMENT ?
// On lit la consigne, puis on joue l'entrée qu'elle décrit et on vérifie que ça
// construit — un message juste doit conduire au résultat.
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

  // 1) chaque outil du menu a-t-il sa consigne, et est-elle distincte ?
  const inv = await page.evaluate(() => {
    const outils = [...document.querySelectorAll("[onclick^=\"app.setTool('magic_\"]")]
      .map(e => ({ t: e.getAttribute('onclick').match(/magic_[a-z_]+/)[0],
                   nom: e.getAttribute('data-tooltip') || '' }));
    return outils.map(o => ({ ...o, msg: GM_CONSIGNES_MAGIE[o.t] || null }));
  });
  console.log(`\n=== ${inv.length} constructions au menu ===`);
  inv.forEach(o => console.log(`  ${o.nom.padEnd(32)} ${o.msg || '(aucune)'}`));
  ck('toutes ont une consigne propre', inv.every(o => o.msg), inv.filter(o => !o.msg).map(o => o.t).join(','));

  // 2) le message affiché correspond-il à l'outil choisi ?
  console.log('\n=== la bulle affiche bien la consigne de l\'outil ===');
  for (const t of ['magic_rectangle', 'magic_parallelogram', 'magic_bisector', 'magic_square', 'magic_sym_axiale']) {
    const r = await page.evaluate((t) => {
      app.setTool(t);
      return { bulle: document.getElementById('toast-notification').innerText, attendu: GM_CONSIGNES_MAGIE[t] };
    }, t);
    ck(`${t}`, r.bulle.includes(r.attendu), r.bulle);
  }

  // 3) aucune consigne ne parle de triangle là où il n'y en a pas
  console.log('\n=== plus de « triangle » là où il n\'y en a pas ===');
  const faux = await page.evaluate(() =>
    ['magic_rectangle', 'magic_parallelogram', 'magic_bisector']
      .filter(t => /triangle/i.test(GM_CONSIGNES_MAGIE[t])));
  ck('rectangle, parallélogramme et bissectrice ne parlent plus de triangle', faux.length === 0, faux.join(','));

  // 4) la consigne du rectangle est-elle exacte ? (2e point = coin, angle droit)
  console.log('\n=== on joue ce que dit la consigne ===');
  const rect = await page.evaluate(() => {
    const rc = app.canvas.getBoundingClientRect();
    const cl = (sx, sy) => ({ X: sx * app.view.zoom + app.view.x + rc.left, Y: sy * app.view.zoom + app.view.y + rc.top });
    const clic = (sx, sy) => { const c = cl(sx, sy);
      const o = { pointerId: 9, pointerType: 'mouse', isPrimary: true, button: 0, clientX: c.X, clientY: c.Y, bubbles: true, cancelable: true };
      app.canvas.dispatchEvent(new PointerEvent('pointerdown', { ...o, buttons: 1 }));
      window.dispatchEvent(new PointerEvent('pointerup', { ...o, buttons: 0 })); };
    const essai = (pts) => {
      app.entities = []; app.anglePoints = []; app.setTool('magic_rectangle');
      pts.forEach(([a, c]) => clic(a, c));
      return app.entities.filter(e => e.constructor.name === 'Segment').length;
    };
    // 2e point = coin, angle droit en B
    const droit = essai([[300, 300], [300, 500], [500, 500]]);
    // même trio mais l'angle au 2e point n'est PAS droit
    const oblique = essai([[300, 300], [300, 500], [420, 380]]);
    return { droit, oblique, refus: document.getElementById('toast-notification').innerText };
  });
  console.log('  ' + JSON.stringify(rect));
  ck('3 sommets à angle droit : le rectangle est construit', rect.droit >= 4, `${rect.droit} segments`);
  ck('angle non droit : refus explicite', /angle n'est pas droit/i.test(rect.refus), rect.refus);

  const carre = await page.evaluate(() => {
    const rc = app.canvas.getBoundingClientRect();
    const cl = (sx, sy) => ({ X: sx * app.view.zoom + app.view.x + rc.left, Y: sy * app.view.zoom + app.view.y + rc.top });
    const clic = (sx, sy) => { const c = cl(sx, sy);
      const o = { pointerId: 9, pointerType: 'mouse', isPrimary: true, button: 0, clientX: c.X, clientY: c.Y, bubbles: true, cancelable: true };
      app.canvas.dispatchEvent(new PointerEvent('pointerdown', { ...o, buttons: 1 }));
      window.dispatchEvent(new PointerEvent('pointerup', { ...o, buttons: 0 })); };
    app.entities = []; app.anglePoints = []; app.setTool('magic_square');
    clic(300, 300); clic(500, 300);   // 2 points : le carré part du côté du 2e clic
    return app.entities.filter(e => e.constructor.name === 'Segment').length;
  });
  ck('carré : 2 points suffisent, comme annoncé', carre >= 4, `${carre} segments`);
  ck('aucune erreur JS', errs.length === 0, errs.slice(0, 3).join(' | '));
  await b.close();
  console.log(`\n${fail ? `=== ${fail} échec(s) ===` : '=== tout passe ==='}`);
  process.exit(fail ? 1 : 0);
})();
