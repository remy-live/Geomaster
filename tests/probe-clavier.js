// 1) Le double-appui réédite-t-il un texte, même quand iOS ne synthétise pas de
//    dblclick (preventDefault sur les événements tactiles) ?
// 2) Champ et barre restent-ils visibles quand le clavier logiciel réduit la
//    fenêtre visuelle ?
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
  const page = await (await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true })).newPage();
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.goto(PAGE); await page.waitForTimeout(1500);

  console.log('\n=== réédition au doigt, dblclick natif supprimé ===');
  const r = await page.evaluate(async () => {
    const dodo = (ms) => new Promise(r => setTimeout(r, ms));
    const app = window.app, cont = app.canvas.parentElement;
    // on reproduit iOS : plus aucun dblclick ne sera livré
    app.canvas.ondblclick = null;
    const out = {};
    const rc = cont.getBoundingClientRect();
    const cx = Math.max(0, rc.left) + cont.clientWidth * 0.3;
    const cy = Math.max(0, rc.top) + cont.clientHeight * 0.35;
    const ev = (t, bt) => app.canvas.dispatchEvent(new PointerEvent(t, {
      pointerId: 1, pointerType: 'touch', isPrimary: true, button: 0, buttons: bt,
      clientX: cx, clientY: cy, bubbles: true, cancelable: true }));
    app.setTool('text'); ev('pointerdown', 1); ev('pointerup', 0);
    const g = document.getElementById('ghostTextInput');
    g.focus(); document.execCommand('insertText', false, 'Bonjour');
    app.validerTexteFantome();
    out.cree = app.entities.filter(e => e.constructor.name === 'TextLabel').length;
    app.setTool('move');
    await dodo(600);              // sinon la tape de création s'apparie avec la suivante
    ev('pointerdown', 1); ev('pointerup', 0);
    await dodo(120);
    ev('pointerdown', 1); ev('pointerup', 0);
    out.champ = g.style.display; out.contenu = g.innerText;
    out.restant = app.entities.filter(e => e.constructor.name === 'TextLabel').length;
    app.validerTexteFantome();
    out.apres = app.entities.filter(e => e.constructor.name === 'TextLabel').length;
    // un double-appui lent ne doit RIEN déclencher
    ev('pointerdown', 1); ev('pointerup', 0);
    return out;
  });
  console.log('  ' + JSON.stringify(r));
  ck('le texte est créé', r.cree === 1);
  ck('le double-appui rouvre la saisie', r.champ === 'block');
  ck('avec son contenu d\'origine', r.contenu === 'Bonjour', r.contenu);
  ck('l\'ancien objet est retiré pendant l\'édition', r.restant === 0);
  ck('et rétabli à la validation, sans doublon', r.apres === 1);

  console.log('\n=== double-appui lent : rien ne doit s\'ouvrir ===');
  const lent = await page.evaluate(async () => {
    const app = window.app, cont = app.canvas.parentElement;
    app.validerTexteFantome(); app.setTool('move');
    const rc = cont.getBoundingClientRect();
    const cx = Math.max(0, rc.left) + cont.clientWidth * 0.3;
    const cy = Math.max(0, rc.top) + cont.clientHeight * 0.35;
    const ev = (t, bt) => app.canvas.dispatchEvent(new PointerEvent(t, {
      pointerId: 1, pointerType: 'touch', isPrimary: true, button: 0, buttons: bt,
      clientX: cx, clientY: cy, bubbles: true, cancelable: true }));
    ev('pointerdown', 1); ev('pointerup', 0);
    await new Promise(r => setTimeout(r, 600));
    ev('pointerdown', 1); ev('pointerup', 0);
    return document.getElementById('ghostTextInput').style.display;
  });
  ck('deux appuis à 600ms n\'ouvrent pas la saisie', lent === 'none', lent);

  console.log('\n=== clavier logiciel : 844 -> 420 de fenêtre visuelle ===');
  const clav = await page.evaluate(() => {
    const app = window.app, cont = app.canvas.parentElement;
    app.validerTexteFantome();
    app.entities = [];   // sinon la tape retombe sur le texte de la sonde 1
    // On simule le clavier : visualViewport rétrécit, la mise en page ne bouge pas.
    const vv = window.visualViewport;
    const vrai = { h: vv.height, t: vv.offsetTop };
    Object.defineProperty(vv, 'height', { configurable: true, get: () => 420 });
    const res = [];
    for (const f of [0.2, 0.55, 0.9]) {
      app.validerTexteFantome(); app.setTool('text');
      const rc = cont.getBoundingClientRect();
      const cx = Math.max(0, rc.left) + cont.clientWidth * 0.3;
      // un doigt ne peut viser que la bande visible : entre le haut du
      // conteneur et le clavier
      const hautVu = Math.max(0, rc.top), basVu = Math.min(420, rc.bottom);
      const cy = hautVu + (basVu - hautVu) * f;
      const ev = (t, bt) => app.canvas.dispatchEvent(new PointerEvent(t, {
        pointerId: 1, pointerType: 'touch', isPrimary: true, button: 0, buttons: bt,
        clientX: cx, clientY: cy, bubbles: true, cancelable: true }));
      ev('pointerdown', 1); ev('pointerup', 0);
      // le clavier apparaît après coup : visualViewport émet un resize
      vv.dispatchEvent(new Event('resize'));
      const g = document.getElementById('ghostTextInput'), bt2 = document.getElementById('textFormatToolbar');
      if (g.style.display !== 'block') { res.push({ f, champ: false, barre: false, rg: 'saisie non ouverte', rb: '', V: '' }); continue; }
      const rg = g.getBoundingClientRect(), rb = bt2.getBoundingClientRect();
      // fenêtre réellement visible, en coordonnées de fenêtre
      const V = { l: 0, t: Math.max(0, rc.top), r: 390, b: Math.min(420, rc.bottom) };
      const dans = (r) => r.left >= V.l - 1 && r.right <= V.r + 1 && r.top >= V.t - 1 && r.bottom <= V.b + 1;
      res.push({ f, champ: dans(rg), barre: dans(rb),
                 rg: [Math.round(rg.top), Math.round(rg.bottom)],
                 rb: [Math.round(rb.top), Math.round(rb.bottom)], V: [Math.round(V.t), Math.round(V.b)] });
    }
    app.validerTexteFantome();
    Object.defineProperty(vv, 'height', { configurable: true, get: () => vrai.h });
    return res;
  });
  clav.forEach(c => {
    console.log(`  saisie à ${c.f} : champ ${c.rg} barre ${c.rb} | visible ${c.V}`);
    ck(`champ visible sous le clavier (${c.f})`, c.champ === true);
    ck(`barre visible sous le clavier (${c.f})`, c.barre === true);
  });
  ck('aucune erreur JS', errs.length === 0, errs.slice(0, 3).join(' | '));
  await b.close();
  console.log(`\n${fail ? `=== ${fail} échec(s) ===` : '=== tout passe ==='}`);
  process.exit(fail ? 1 : 0);
})();
