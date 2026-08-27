// La barre de style du texte et le panneau d'aide restent-ils dans l'écran,
// quel que soit l'endroit où l'on écrit ?
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
    { n: 'iPhone 390x844', w: 390, h: 844, touch: true },
    { n: 'tablette 1024x768', w: 1024, h: 768, touch: true },
    { n: 'desktop 1440x900', w: 1440, h: 900, touch: false },
  ]) {
    const page = await (await b.newContext({ viewport: { width: c.w, height: c.h }, hasTouch: c.touch })).newPage();
    const errs = []; page.on('pageerror', e => errs.push(e.message));
    await page.goto(PAGE); await page.waitForTimeout(1400);
    console.log(`\n=== ${c.n} ===`);
    // 9 emplacements de saisie répartis sur la zone visible du conteneur
    const res = await page.evaluate(() => {
      const app = window.app, cont = app.canvas.parentElement;
      const out = [];
      const fx = [0.05, 0.5, 0.95], fy = [0.05, 0.5, 0.95];
      for (const ax of fx) for (const ay of fy) {
        // coordonnées SCÈNE correspondant au point visé de la bande visible
        const sx = (cont.scrollLeft + cont.clientWidth * ax - app.view.x) / app.view.zoom;
        const sy = (cont.scrollTop + cont.clientHeight * ay - app.view.y) / app.view.zoom;
        app.validerTexteFantome();
        app.setTool('text');
        const r = app.canvas.getBoundingClientRect();
        const cx = sx * app.view.zoom + app.view.x + r.left, cy = sy * app.view.zoom + app.view.y + r.top;
        const ev = (t, bt) => app.canvas.dispatchEvent(new PointerEvent(t, {
          pointerId: 1, pointerType: 'mouse', isPrimary: true, button: 0, buttons: bt,
          clientX: cx, clientY: cy, bubbles: true, cancelable: true }));
        ev('pointerdown', 1); ev('pointerup', 0);
        const g = document.getElementById('ghostTextInput');
        if (g.style.display !== 'block') { out.push({ ax, ay, ouvert: false }); continue; }
        g.focus(); document.execCommand('insertText', false, '\\frac{b \\times h}{2}');
        app.basculerAideFormule(true);
        const R = (id) => document.getElementById(id).getBoundingClientRect();
        const rb = R('textFormatToolbar'), ra = R('aideFormule'), rg = R('ghostTextInput');
        const rc = cont.getBoundingClientRect();
        const rp = document.getElementById('stylePalettePanel');
        // bande visible en coordonnées de fenêtre
        const V = { l: Math.max(0, rc.left), t: Math.max(0, rc.top),
                    r: Math.min(innerWidth, rc.right), b: Math.min(innerHeight, rc.bottom) };
        const dehors = (r) => ({ g: Math.max(0, Math.round(V.l - r.left)), d: Math.max(0, Math.round(r.right - V.r)),
                                 h: Math.max(0, Math.round(V.t - r.top)), b: Math.max(0, Math.round(r.bottom - V.b)) });
        const chev = (a, z) => { const dx = Math.min(a.right, z.right) - Math.max(a.left, z.left);
          const dy = Math.min(a.bottom, z.bottom) - Math.max(a.top, z.top);
          return (dx > 0 && dy > 0) ? Math.round(dx * dy) : 0; };
        out.push({ ax, ay, ouvert: true, barre: dehors(rb), aide: dehors(ra),
                   aideSurBarre: chev(ra, rb), aideSurChamp: chev(ra, rg),
                   bAide: [Math.round(ra.width), Math.round(ra.height)],
                   aideSurPalette: (rp && rp.offsetParent !== null) ? chev(ra, rp.getBoundingClientRect()) : 0 });
      }
      app.validerTexteFantome();
      return out;
    });
    let sortBarre = 0, sortAide = 0, chevB = 0, chevC = 0, chevP = 0, nb = 0;
    for (const r of res) {
      if (!r.ouvert) { console.log(`  (${r.ax},${r.ay}) saisie non ouverte`); fail++; continue; }
      nb++;
      const sb = Object.values(r.barre).reduce((a, v) => a + v, 0);
      const sa = Object.values(r.aide).reduce((a, v) => a + v, 0);
      sortBarre += sb; sortAide += sa; chevB += r.aideSurBarre; chevC += r.aideSurChamp; chevP += r.aideSurPalette;
      if (sb || sa || r.aideSurBarre || r.aideSurChamp || r.aideSurPalette)
        console.log(`  (${r.ax},${r.ay}) barre hors=${JSON.stringify(r.barre)} aide hors=${JSON.stringify(r.aide)} chevauche barre=${r.aideSurBarre} champ=${r.aideSurChamp} palette=${r.aideSurPalette}`);
    }
    console.log(`  ${nb} emplacements | aide ${res.find(r => r.ouvert) ? res.find(r => r.ouvert).bAide.join('x') : '?'}`);
    ck('la barre reste entièrement dans l\'écran', sortBarre === 0, `${sortBarre}px de débord cumulé`);
    ck('l\'aide reste entièrement dans l\'écran', sortAide === 0, `${sortAide}px de débord cumulé`);
    ck('l\'aide ne recouvre jamais la barre', chevB === 0, `${chevB}px² cumulés`);
    ck('l\'aide ne recouvre jamais le champ', chevC === 0, `${chevC}px² cumulés`);
    ck('l\'aide ne recouvre jamais la palette de style', chevP === 0, `${chevP}px² cumulés`);
    ck('aucune erreur JS', errs.length === 0, errs.slice(0, 2).join(' | '));
    await page.context().close();
  }
  await b.close();
  console.log(`\n${fail ? `=== ${fail} échec(s) ===` : '=== tout passe ==='}`);
  process.exit(fail ? 1 : 0);
})();
