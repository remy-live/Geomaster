// Le chemin d'import d'un PDF est-il atteignable et lisible sur tablette ?
const { chromium } = require('playwright');
const path = require('path');
// La page testée est celle du dépôt, quel que soit l'endroit où il est cloné.
const PAGE = 'file://' + path.resolve(__dirname, '..', 'index.html');
// Le navigateur : celui que Playwright a installé, sauf indication contraire.
const NAVIGATEUR = process.env.GM_CHROME || undefined;
const D = path.resolve(__dirname, 'fixtures') + '/';
(async () => {
  const b = await chromium.launch({ executablePath: NAVIGATEUR });
  let fail = 0;
  const ck = (l, ok, d) => { console.log(`  ${ok ? '✓' : '✗'} ${l}${d ? ' — ' + d : ''}`); if (!ok) fail++; };
  for (const c of [{ n: 'tablette 1024x768', w: 1024, h: 768, touch: true },
                   { n: 'iPhone 390x844', w: 390, h: 844, touch: true }]) {
    const page = await (await b.newContext({ viewport: { width: c.w, height: c.h }, hasTouch: c.touch })).newPage();
    const errs = []; page.on('pageerror', e => errs.push(e.message));
    await page.goto(PAGE); await page.waitForTimeout(1400);
    console.log(`\n=== ${c.n} ===`);

    const r = await page.evaluate(() => {
      const inp = document.getElementById('bgImageInput');
      const btn = document.querySelector('[data-libelle="Image / PDF"]');
      const out = { accept: inp.accept, trouve: !!btn };
      if (!btn) return out;
      // ouvrir le tiroir fichier comme le ferait un doigt
      const dd = btn.closest('.header-dropdown');
      if (dd) dd.classList.add('gm-open');
      const feuille = btn.closest('.header-dropdown-content');
      if (feuille) feuille.classList.add('gm-ouvert');
      const rb = btn.getBoundingClientRect();
      const cs = getComputedStyle(btn, '::after');
      out.boite = [Math.round(rb.width), Math.round(rb.height)];
      out.visible = rb.width > 0 && rb.height > 0;
      out.libelle = cs.content;
      out.dansEcran = rb.left >= 0 && rb.right <= innerWidth && rb.top >= 0 && rb.bottom <= innerHeight;
      // le centre du bouton atteint-il bien le bouton ?
      const el = document.elementFromPoint(rb.left + rb.width / 2, rb.top + rb.height / 2);
      out.atteint = !!(el && (el === btn || btn.contains(el)));
      return out;
    });
    console.log('  ' + JSON.stringify(r));
    ck('l\'entrée « Image / PDF » existe', r.trouve === true);
    ck('le champ accepte explicitement les PDF', /application\/pdf/.test(r.accept), r.accept);
    ck('et garde l\'extension en secours', /\.pdf/.test(r.accept));
    ck('la cible est visible', r.visible === true, `${r.boite}`);
    ck('la cible fait au moins 40px', r.boite && r.boite[0] >= 40 && r.boite[1] >= 40, `${r.boite}`);
    ck('elle tient dans l\'écran', r.dansEcran === true);
    ck('son centre atteint bien le bouton', r.atteint === true);
    ck('le libellé annonce le PDF', /PDF/.test(r.libelle || ''), r.libelle);
    ck('aucune erreur JS', errs.length === 0, errs.slice(0, 2).join(' | '));
    await page.context().close();
  }
  await b.close();
  console.log(`\n${fail ? `=== ${fail} échec(s) ===` : '=== tout passe ==='}`);
  process.exit(fail ? 1 : 0);
})();
