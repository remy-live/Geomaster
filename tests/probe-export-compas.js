// La pastille d'ouverture ne doit pas partir dans les exports.
const { chromium } = require('playwright');
const path = require('path');
// La page testée est celle du dépôt, quel que soit l'endroit où il est cloné.
const PAGE = 'file://' + path.resolve(__dirname, '..', 'index.html');
// Le navigateur : celui que Playwright a installé, sauf indication contraire.
const NAVIGATEUR = process.env.GM_CHROME || undefined;
(async () => {
  const b = await chromium.launch({ executablePath: NAVIGATEUR });
  const page = await (await b.newContext({ viewport: { width: 1024, height: 768 } })).newPage();
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.goto(PAGE); await page.waitForTimeout(1400);
  const r = await page.evaluate(() => {
    const app = window.app;
    if (!app.activeWidgets.compass) app.toggleWidget('compass');
    const w = app.compassWidget;
    w.x = 400; w.y = 400; w.angle = 0; w.radius = 120;
    const po = w.constructor.pastilleOuverture(w.radius);
    const g = w.toGlobal(po.x, po.y);
    const lire = () => {
      const px = Math.round(g.x * app.view.zoom + app.view.x), py = Math.round(g.y * app.view.zoom + app.view.y);
      // encre sur un carré de 20px centré sur la pastille
      const d = app.ctx.getImageData(px - 10, py - 10, 20, 20).data;
      let n = 0;
      for (let i = 0; i < d.length; i += 4) if (d[i + 3] > 10 && (d[i] < 200 || d[i + 1] < 200 || d[i + 2] < 200)) n++;
      return n;
    };
    app.isExporting = false; app.render(); const ecran = lire();
    app.isExporting = true; app.render(); const expo = lire();
    app.isExporting = false; app.render();
    const svg = w.getSVG('all');
    return { ecran, expo, svgPastille: /↔|M -6 0|stroke="#34495e"/.test(svg), svgLong: svg.length };
  });
  console.log(JSON.stringify(r));
  const ok = r.ecran > 40 && r.expo === 0 && !r.svgPastille && errs.length === 0;
  console.log(ok ? '=== tout passe ===' : '=== échec ===', errs.slice(0, 2).join(' | '));
  await b.close(); process.exit(ok ? 0 : 1);
})();
