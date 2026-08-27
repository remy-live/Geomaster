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
  for (const c of [{ n: 'iPhone 390', w: 390, h: 844 }, { n: 'tablette 1024', w: 1024, h: 768 }]) {
    const page = await (await b.newContext({ viewport: { width: c.w, height: c.h }, hasTouch: true })).newPage();
    await page.goto(PAGE); await page.waitForTimeout(1300);
    console.log(`\n=== ${c.n} ===`);
    const r = await page.evaluate(() => {
      const noms = Object.keys(GM_CONSIGNES_MAGIE);
      const plusLong = noms.reduce((a, t) => GM_CONSIGNES_MAGIE[t].length > GM_CONSIGNES_MAGIE[a].length ? t : a, noms[0]);
      app.setTool(plusLong);
      const t = document.getElementById('toast-notification');
      const b = t.getBoundingClientRect();
      const cs = getComputedStyle(t);
      return { outil: plusLong, n: GM_CONSIGNES_MAGIE[plusLong].length,
               boite: [Math.round(b.left), Math.round(b.top), Math.round(b.width), Math.round(b.height)],
               debordeD: Math.max(0, Math.round(b.right - innerWidth)), debordeG: Math.max(0, Math.round(-b.left)),
               debordeB: Math.max(0, Math.round(b.bottom - innerHeight)), debordeH: Math.max(0, Math.round(-b.top)),
               coupe: t.scrollWidth > t.clientWidth + 1 || t.scrollHeight > t.clientHeight + 1,
               taille: cs.fontSize, retour: cs.whiteSpace };
    });
    console.log('  ' + JSON.stringify(r));
    ck('la bulle ne déborde pas de l\'écran', r.debordeD === 0 && r.debordeG === 0 && r.debordeB === 0 && r.debordeH === 0);
    ck('le texte n\'est pas tronqué', r.coupe === false);
    await page.context().close();
  }
  await b.close();
  console.log(`\n${fail ? `=== ${fail} échec(s) ===` : '=== tout passe ==='}`);
  process.exit(fail ? 1 : 0);
})();
