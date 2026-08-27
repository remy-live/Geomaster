// Le cadran de position du libellé doit cesser de suivre le doigt dès le
// relâchement — y compris quand le navigateur annule le pointeur au lieu de le
// relâcher, ce que fait le tactile quand il croit à un défilement.
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
    { n: 'tablette 1024x768', w: 1024, h: 768, touch: true },
    { n: 'desktop 1440x900', w: 1440, h: 900, touch: false },
  ]) {
    const page = await (await b.newContext({ viewport: { width: c.w, height: c.h }, hasTouch: c.touch })).newPage();
    const errs = []; page.on('pageerror', e => errs.push(e.message));
    await page.goto((process.env.CIBLE || PAGE)); await page.waitForTimeout(1400);
    console.log(`\n=== ${c.n} ===`);
    const r = await page.evaluate(async ({ touch }) => {
      const app = window.app, cont = app.canvas.parentElement, dodo = ms => new Promise(r => setTimeout(r, ms));
      const rc = cont.getBoundingClientRect();
      const cx = Math.max(0, rc.left) + 200, cy = Math.max(0, rc.top) + 180;
      // un point, puis son menu contextuel
      app.setTool('point');
      const ev = (t, X, Y, bt, tp, cible) => (cible || app.canvas).dispatchEvent(new PointerEvent(t, {
        pointerId: 1, pointerType: tp || 'mouse', isPrimary: true, button: 0, buttons: bt,
        clientX: X, clientY: Y, bubbles: true, cancelable: true }));
      ev('pointerdown', cx, cy, 1); window.dispatchEvent(new PointerEvent('pointerup', {
        pointerId: 1, pointerType: 'mouse', isPrimary: true, button: 0, buttons: 0,
        clientX: cx, clientY: cy, bubbles: true, cancelable: true }));
      await dodo(80);
      const pt = app.entities.find(e => e.constructor.name === 'Point');
      const out = { point: !!pt };
      app.setTool('move');
      app.selectedObject = pt;
      // ouvrir le menu contextuel à la souris (le clic droit passe partout)
      ev('pointerdown', cx, cy, 1, 'mouse'); window.dispatchEvent(new PointerEvent('pointerup', {
        pointerId: 1, pointerType: 'mouse', isPrimary: true, button: 0, buttons: 0,
        clientX: cx, clientY: cy, bubbles: true, cancelable: true }));
      app.canvas.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true,
        view: window, button: 2, buttons: 2, clientX: cx, clientY: cy }));
      await dodo(80);
      const menu = document.getElementById('contextMenu');
      out.menu = menu.style.display;
      const box = document.getElementById('labelPosBox');
      const rb = box.getBoundingClientRect();
      out.boite = [Math.round(rb.width), Math.round(rb.height)];
      out.touchAction = getComputedStyle(box).touchAction;
      const bx = rb.left + rb.width / 2, by = rb.top + rb.height / 2;
      const bev = (t, X, Y, bt, tp) => box.dispatchEvent(new PointerEvent(t, {
        pointerId: 5, pointerType: tp, isPrimary: true, button: 0, buttons: bt,
        clientX: X, clientY: Y, bubbles: true, cancelable: true }));
      const wev = (t, X, Y, bt, tp) => window.dispatchEvent(new PointerEvent(t, {
        pointerId: 5, pointerType: tp, isPrimary: true, button: 0, buttons: bt,
        clientX: X, clientY: Y, bubbles: true, cancelable: true }));
      const ang = () => Math.round((pt.labelAngle || 0) * 1000) / 1000;

      // --- scénario A : glisser puis RELÂCHER proprement
      bev('pointerdown', bx + 20, by, 1, 'touch');
      wev('pointermove', bx, by + 20, 1, 'touch');
      out.aPendant = ang();
      wev('pointerup', bx, by + 20, 0, 'touch');
      wev('pointermove', bx - 20, by, 0, 'touch');   // le doigt continue de bouger ailleurs
      out.aApres = ang();

      // --- scénario B : le navigateur ANNULE le pointeur (pas de pointerup)
      bev('pointerdown', bx + 20, by, 1, 'touch');
      wev('pointermove', bx, by - 20, 1, 'touch');
      out.bPendant = ang();
      box.dispatchEvent(new PointerEvent('pointercancel', { pointerId: 5, pointerType: 'touch',
        isPrimary: true, clientX: bx, clientY: by - 20, bubbles: true, cancelable: true }));
      wev('pointermove', bx - 20, by, 0, 'touch');
      wev('pointermove', bx, by + 20, 0, 'touch');
      out.bApres = ang();

      // --- scénario C : seul touchend arrive
      bev('pointerdown', bx + 20, by, 1, 'touch');
      wev('pointermove', bx + 14, by + 14, 1, 'touch');
      out.cPendant = ang();
      window.dispatchEvent(new Event('touchend', { bubbles: true }));
      wev('pointermove', bx - 20, by, 0, 'touch');
      out.cApres = ang();

      // --- scénario D : la souris, comportement d'origine
      bev('pointerdown', bx + 20, by, 1, 'mouse');
      wev('pointermove', bx, by + 20, 1, 'mouse');
      out.dPendant = ang();
      wev('pointerup', bx, by + 20, 0, 'mouse');
      wev('pointermove', bx - 20, by, 0, 'mouse');
      out.dApres = ang();

      // --- la poignée de déplacement du menu, même défaut
      const h = document.getElementById('menuDragHandle');
      out.hTouchAction = getComputedStyle(h).touchAction;
      const rh = h.getBoundingClientRect();
      const pos = () => [Math.round(menu.getBoundingClientRect().left), Math.round(menu.getBoundingClientRect().top)];
      const hev = (t, X, Y, bt, tp) => h.dispatchEvent(new PointerEvent(t, {
        pointerId: 9, pointerType: tp, isPrimary: true, button: 0, buttons: bt,
        clientX: X, clientY: Y, bubbles: true, cancelable: true }));
      const hx = rh.left + rh.width / 2, hy = rh.top + rh.height / 2;
      hev('pointerdown', hx, hy, 1, 'touch');
      window.dispatchEvent(new PointerEvent('pointermove', { pointerId: 9, pointerType: 'touch',
        isPrimary: true, button: 0, buttons: 1, clientX: hx + 40, clientY: hy + 30, bubbles: true }));
      out.hPendant = pos();
      h.dispatchEvent(new PointerEvent('pointercancel', { pointerId: 9, pointerType: 'touch',
        isPrimary: true, clientX: hx + 40, clientY: hy + 30, bubbles: true }));
      window.dispatchEvent(new PointerEvent('pointermove', { pointerId: 9, pointerType: 'touch',
        isPrimary: true, button: 0, buttons: 0, clientX: hx - 80, clientY: hy - 60, bubbles: true }));
      out.hApres = pos();
      return out;
    }, { touch: c.touch });
    console.log('  ' + JSON.stringify(r));
    ck('le menu contextuel est ouvert', r.menu && r.menu !== 'none', r.menu);
    ck('le cadran ignore le défilement du navigateur (touch-action)', r.touchAction === 'none', r.touchAction);
    ck('A : l\'angle suit le doigt pendant le glissement', r.aPendant !== 0);
    ck('A : il ne bouge plus après le relâchement', r.aApres === r.aPendant, `${r.aPendant} -> ${r.aApres}`);
    ck('B : il suit pendant le glissement', r.bPendant !== r.aApres);
    ck('B : il se fige sur pointercancel', r.bApres === r.bPendant, `${r.bPendant} -> ${r.bApres}`);
    ck('C : il se fige sur touchend seul', r.cApres === r.cPendant, `${r.cPendant} -> ${r.cApres}`);
    ck('D : à la souris, il suit puis se fige', r.dApres === r.dPendant, `${r.dPendant} -> ${r.dApres}`);
    ck('poignée du menu : touch-action neutralisé', r.hTouchAction === 'none', r.hTouchAction);
    ck('poignée du menu : le menu se fige sur pointercancel', JSON.stringify(r.hApres) === JSON.stringify(r.hPendant), `${r.hPendant} -> ${r.hApres}`);
    ck('aucune erreur JS', errs.length === 0, errs.slice(0, 2).join(' | '));
    await page.context().close();
  }
  await b.close();
  console.log(`\n${fail ? `=== ${fail} échec(s) ===` : '=== tout passe ==='}`);
  process.exit(fail ? 1 : 0);
})();
