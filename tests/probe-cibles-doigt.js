// Au doigt, une commande se vise : ce qui fait 23 px se rate. On mesure la zone
// touchable réelle, sur les écrans sans souris.
const { chromium } = require('playwright');
const path = require('path');
// La page testée est celle du dépôt, quel que soit l'endroit où il est cloné.
const PAGE = 'file://' + path.resolve(__dirname, '..', 'index.html');
// Le navigateur : celui que Playwright a installé, sauf indication contraire.
const NAVIGATEUR = process.env.GM_CHROME || undefined;
const MINI = 32;   // en deçà, on tape à côté et l'on croit que rien n'a réagi

(async () => {
  const b = await chromium.launch({ executablePath: NAVIGATEUR });
  let fail = 0;
  const ck = (l, ok, d) => { console.log(`  ${ok ? '✓' : '✗'} ${l}${d ? ' — ' + d : ''}`); if (!ok) fail++; };

  const petites = async (page) => page.evaluate((mini) => {
    const out = [];
    document.querySelectorAll('button, .icon-btn, .tool-btn, .top-btn, [onclick]').forEach(el => {
      const cs = getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden' || !el.offsetParent) return;
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height) return;
      if (r.width < mini || r.height < mini) {
        out.push({ q: (el.id || el.getAttribute('aria-label') || el.className || el.textContent)
                      .toString().trim().slice(0, 30),
                   w: Math.round(r.width), h: Math.round(r.height) });
      }
    });
    return out;
  }, MINI);

  console.log('\n=== au téléphone, tout se vise au doigt ===');
  const tel = await (await b.newContext({ viewport: { width: 390, height: 844 },
    hasTouch: true, isMobile: true })).newPage();
  const errs = []; tel.on('pageerror', e => errs.push(e.message));
  await tel.goto(PAGE); await tel.waitForTimeout(1500);
  /* On ouvre le panneau des consignes : c'est lui qui portait les plus petites
     commandes — une croix de 23 px, une roue de 26, un chevron de 25. */
  await tel.evaluate(() => window.app.toggleInstructions());
  await tel.waitForTimeout(400);
  const p1 = await petites(tel);
  p1.forEach(x => console.log('    ' + x.q + '  ' + x.w + '×' + x.h));
  ck(`aucune commande sous ${MINI} px, panneau des consignes ouvert`, p1.length === 0,
     `${p1.length} trop petites`);

  /* La barre des pages n'apparaît qu'à partir de deux pages : elle a ses
     propres flèches, qui se ratent tout autant. */
  await tel.evaluate(() => {
    const app = window.app;
    if (app.ajouterPage) app.ajouterPage();
    else if (app.nouvellePage) app.nouvellePage();
  });
  await tel.waitForTimeout(500);
  const p2 = await petites(tel);
  p2.forEach(x => console.log('    ' + x.q + '  ' + x.w + '×' + x.h));
  ck(`aucune commande sous ${MINI} px, deux pages ouvertes`, p2.length === 0,
     `${p2.length} trop petites`);
  ck('aucune erreur JS', errs.length === 0, errs.slice(0, 2).join(' | '));

  console.log('\n=== à la souris, rien n\'a gonflé ===');
  /* La règle ne vaut que pour les écrans sans souris : l'interface du
     professeur sur son ordinateur garde sa densité. */
  const bureau = await (await b.newContext({ viewport: { width: 1400, height: 1000 } })).newPage();
  await bureau.goto(PAGE); await bureau.waitForTimeout(1400);
  await bureau.evaluate(() => window.app.toggleInstructions());
  await bureau.waitForTimeout(300);
  const fin = await bureau.evaluate(() => {
    const q = (sel) => { const el = document.querySelector(sel); if (!el) return null;
      const r = el.getBoundingClientRect(); return [Math.round(r.width), Math.round(r.height)]; };
    return { croix: q('.instr-close'), aide: q('#btnConsigneAide'), roue: q('.csl-roue') };
  });
  console.log('  ' + JSON.stringify(fin));
  ck('les petites commandes restent petites au bureau',
     fin.croix && fin.croix[1] < 32 && fin.aide && fin.aide[1] < 32,
     JSON.stringify(fin));

  await b.close();
  console.log(`\n${fail ? `=== ${fail} échec(s) ===` : '=== tout passe ==='}`);
  process.exit(fail ? 1 : 0);
})();
