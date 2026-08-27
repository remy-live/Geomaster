// Le tiroir magique nommé tient-il à l'écran, et « Croquis » se voit-il sans défiler ?
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
  for (const c of [{ n: 'bureau 1440x900', w: 1440, h: 900, touch: false },
                   { n: 'tablette 1024x768', w: 1024, h: 768, touch: true },
                   { n: 'tablette 1440x900 tactile', w: 1440, h: 900, touch: true },
                   { n: 'iPhone 390x844', w: 390, h: 844, touch: true }]) {
    const page = await (await b.newContext({ viewport: { width: c.w, height: c.h }, hasTouch: c.touch })).newPage();
    const errs = []; page.on('pageerror', e => errs.push(e.message));
    await page.goto(PAGE); await page.waitForTimeout(1400);
    console.log(`\n=== ${c.n} ===`);
    const r = await page.evaluate(() => {
      const el = document.querySelector("[onclick^=\"app.setTool('magic_croquis')\"]");
      const dd = el.closest('.header-dropdown'); if (dd) dd.classList.add('gm-open');
      const f = el.closest('.magic-menu-content'); if (f) f.classList.add('gm-ouvert');
      const rf = f.getBoundingClientRect(), rb = el.getBoundingClientRect();
      const items = [...f.querySelectorAll('.magic-grid-item[data-libelle]')];
      const lus = items.map(i => getComputedStyle(i, '::after').content).filter(v => v && v !== 'none');
      // chaque item atteint-il bien sa propre commande en son centre ?
      let atteints = 0, cibleMin = 1e9;
      items.forEach(i => {
        const b2 = i.getBoundingClientRect();
        cibleMin = Math.min(cibleMin, b2.width, b2.height);
        const e2 = document.elementFromPoint(b2.left + b2.width / 2, b2.top + 8);
        if (e2 && (e2 === i || i.contains(e2))) atteints++;
      });
      return {
        items: items.length, nommes: lus.length, atteints, cibleMin: Math.round(cibleMin),
        tiroir: [Math.round(rf.left), Math.round(rf.top), Math.round(rf.width), Math.round(rf.height)],
        defile: f.scrollHeight > f.clientHeight + 1,
        debordeD: Math.max(0, Math.round(rf.right - innerWidth)),
        debordeG: Math.max(0, Math.round(-rf.left)),
        debordeB: Math.max(0, Math.round(rf.bottom - innerHeight)),
        croquisVisible: rb.top >= rf.top - 1 && rb.bottom <= rf.bottom + 1 && rb.top >= 0 && rb.bottom <= innerHeight,
        croquisNom: getComputedStyle(el, '::after').content,
      };
    });
    console.log('  ' + JSON.stringify(r));
    ck('les 19 outils portent leur nom', r.items === 19 && r.nommes === 19, `${r.nommes}/${r.items}`);
    ck('chacun atteint sa propre commande', r.atteints === r.items, `${r.atteints}/${r.items}`);
    // 44px est la règle du DOIGT ; à la souris, 30px suffisent largement
    const seuil = c.touch ? 44 : 30;
    ck(`cible d'au moins ${seuil}px`, r.cibleMin >= seuil, `${r.cibleMin}px`);
    ck('le tiroir ne déborde pas latéralement', r.debordeD === 0 && r.debordeG === 0);
    ck('il tient à l\'écran, ou défile', r.debordeB === 0 || r.defile, `débord bas ${r.debordeB}, défilable ${r.defile}`);
    ck('« Croquis » est visible sans défiler', r.croquisVisible === true);
    ck('et porte bien son nom', /Croquis/.test(r.croquisNom), r.croquisNom);
    ck('aucune erreur JS', errs.length === 0, errs.slice(0, 2).join(' | '));
    await page.context().close();
  }
  await b.close();
  console.log(`\n${fail ? `=== ${fail} échec(s) ===` : '=== tout passe ==='}`);
  process.exit(fail ? 1 : 0);
})();
