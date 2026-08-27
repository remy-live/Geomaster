// Sur tablette, chercher un point à l'appui maintenu avec un outil de tracé ne
// doit PAS ouvrir le menu contextuel — ni par notre minuteur, ni par celui du
// navigateur. Le clic droit à la souris, lui, doit continuer de l'ouvrir.
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
  for (const c of [
    { n: 'tablette 1024x768 tactile', w: 1024, h: 768, touch: true },
    { n: 'iPhone 390x844 tactile', w: 390, h: 844, touch: true },
    { n: 'desktop 1440x900 souris', w: 1440, h: 900, touch: false },
  ]) {
    const page = await (await b.newContext({ viewport: { width: c.w, height: c.h }, hasTouch: c.touch })).newPage();
    const errs = []; page.on('pageerror', e => errs.push(e.message));
    await page.goto(PAGE); await page.waitForTimeout(1400);
    console.log(`\n=== ${c.n} ===`);
    const r = await page.evaluate(async ({ touch }) => {
      const app = window.app, cont = app.canvas.parentElement, dodo = ms => new Promise(r => setTimeout(r, ms));
      const menu = document.getElementById('contextMenu');
      const ferme = () => { menu.style.display = 'none'; };
      const rc = cont.getBoundingClientRect();
      const cx = Math.max(0, rc.left) + 180, cy = Math.max(0, rc.top) + 160;
      const pd = (tp) => app.canvas.dispatchEvent(new PointerEvent('pointerdown', {
        pointerId: 1, pointerType: tp, isPrimary: true, button: tp === 'mouse2' ? 2 : 0,
        buttons: 1, clientX: cx, clientY: cy, bubbles: true, cancelable: true }));
      const pu = (tp) => window.dispatchEvent(new PointerEvent('pointerup', {
        pointerId: 1, pointerType: tp, isPrimary: true, button: 0, buttons: 0,
        clientX: cx, clientY: cy, bubbles: true, cancelable: true }));
      // menu contextuel NATIF du navigateur : bouton 0, pas 2
      const natif = () => app.canvas.dispatchEvent(new MouseEvent('contextmenu', {
        bubbles: true, cancelable: true, view: window, button: 0, buttons: 0,
        clientX: cx, clientY: cy }));
      const ouvert = () => menu.style.display && menu.style.display !== 'none';
      const out = {};
      // pour que le menu ait quelque chose à montrer : un segment sous le doigt,
      // tracé à la souris comme le ferait l'utilisateur
      app.setTool('segment');
      const sev = (t, X, Y, bt) => {
        const ev = new PointerEvent(t, { pointerId: 7, pointerType: 'mouse', isPrimary: true,
          button: 0, buttons: bt, clientX: X, clientY: Y, bubbles: true, cancelable: true });
        (t === 'pointerup' ? window : app.canvas).dispatchEvent(ev);
      };
      sev('pointerdown', cx - 70, cy, 1); sev('pointermove', cx + 70, cy, 1); sev('pointerup', cx + 70, cy, 0);
      await dodo(80);
      out.entites = app.entities.length;
      app.render();

      for (const outil of ['polygon', 'angle', 'segment', 'move']) {
        app.setTool(outil); ferme(); await dodo(60);
        // 1) appui maintenu > 400ms, puis menu natif du navigateur
        pd('touch'); await dodo(520);
        out[outil + '_minuteur'] = ouvert(); ferme();
        natif();
        out[outil + '_natif'] = ouvert(); ferme();
        pu('touch'); await dodo(60);
      }
      // 2) clic droit souris : doit ouvrir, quel que soit l'outil
      for (const outil of ['polygon', 'move']) {
        app.setTool(outil); ferme();
        pd('mouse'); pu('mouse');
        app.canvas.dispatchEvent(new MouseEvent('contextmenu', {
          bubbles: true, cancelable: true, view: window, button: 2, buttons: 2,
          clientX: cx, clientY: cy }));
        out['souris_' + outil] = ouvert(); ferme();
      }
      return out;
    }, { touch: c.touch });
    console.log('  ' + JSON.stringify(r));
    for (const o of ['polygon', 'angle', 'segment']) {
      ck(`outil ${o} : notre minuteur n'ouvre rien`, r[o + '_minuteur'] === false);
      ck(`outil ${o} : le menu natif du navigateur est bloqué`, r[o + '_natif'] === false);
    }
    ck('outil souris : l\'appui long ouvre bien le menu', r.move_minuteur === true);
    ck('outil souris : le menu natif passe aussi', r.move_natif === true);
    ck('clic droit souris : ouvre même avec l\'outil polygone', r.souris_polygon === true);
    ck('clic droit souris : ouvre avec l\'outil curseur', r.souris_move === true);
    ck('aucune erreur JS', errs.length === 0, errs.slice(0, 2).join(' | '));
    await page.context().close();
  }
  await b.close();
  console.log(`\n${fail ? `=== ${fail} échec(s) ===` : '=== tout passe ==='}`);
  process.exit(fail ? 1 : 0);
})();
