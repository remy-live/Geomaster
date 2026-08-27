// Le tiroir magique : compact à la souris avec infobulle, nommé au doigt.
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
  const errs = [];

  console.log('\n=== à la souris : icônes seules, infobulle au survol ===');
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  page.on('pageerror', e => errs.push(e.message));
  await page.goto(PAGE); await page.waitForTimeout(1500);
  // ouvrir le tiroir par le vrai geste : survol du bouton magique
  const btn = await page.$('.header-dropdown .top-btn.magic-btn, .header-dropdown .top-btn');
  await page.hover('.magic-menu-content', { force: true }).catch(() => {});
  const ouvrir = async () => {
    const d = await page.$('.header-dropdown:has(.magic-menu-content)');
    await d.hover();
    await page.waitForTimeout(350);
  };
  await ouvrir();
  const t = await page.evaluate(() => {
    const m = document.querySelector('.magic-menu-content');
    const b = m.getBoundingClientRect();
    const c = m.querySelector('.magic-grid-item[data-libelle]');
    const rc = c.getBoundingClientRect();
    return { visible: getComputedStyle(m).display, w: Math.round(b.width), h: Math.round(b.height),
             part: Math.round(b.width * b.height / (innerWidth * innerHeight) * 100),
             cell: { w: Math.round(rc.width), h: Math.round(rc.height) },
             libelleAffiche: getComputedStyle(c, '::after').display !== 'none',
             tooltip: c.getAttribute('data-tooltip') };
  });
  console.log('  ' + JSON.stringify(t));
  ck('le tiroir est ouvert', t.visible === 'flex');
  ck('les libellés sont masqués', t.libelleAffiche === false);
  ck('la cellule est une icône carrée', t.cell.w === 32 && t.cell.h === 32, JSON.stringify(t.cell));
  ck('le tiroir tient dans 8 % de l\'écran', t.part <= 8, t.part + ' %');

  // survol d'une icône : l'infobulle doit apparaître, lisible et non rognée
  const cell = await page.$('.magic-menu-content .magic-grid-item[data-libelle]');
  await cell.hover();
  await page.waitForTimeout(600);
  const bulle = await page.evaluate(() => {
    const vus = Array.from(document.querySelectorAll('body *')).filter((e) => {
      const c = getComputedStyle(e);
      if (c.display === 'none' || c.visibility === 'hidden' || parseFloat(c.opacity) < 0.5) return false;
      const r = e.getBoundingClientRect();
      if (r.width < 30 || r.height < 12 || r.height > 60) return false;
      return /croquis/i.test(e.textContent || '') && e.children.length === 0
             && c.position === 'fixed' || (/tooltip|bulle/i.test(e.className || '') && r.width > 0);
    }).map((e) => { const r = e.getBoundingClientRect();
      return { cls: String(e.className).slice(0, 24), txt: (e.textContent || '').slice(0, 30),
               x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height),
               dansEcran: r.left >= 0 && r.top >= 0 && r.right <= innerWidth && r.bottom <= innerHeight }; });
    return vus;
  });
  console.log('  bulles vues : ' + JSON.stringify(bulle));
  ck('une infobulle apparaît au survol', bulle.length > 0, JSON.stringify(bulle));
  ck('elle est entièrement à l\'écran', bulle.length > 0 && bulle.every(v => v.dansEcran),
     JSON.stringify(bulle.map(v => v.dansEcran)));
  await ctx.close();

  console.log('\n=== au doigt : les noms restent, la cible aussi ===');
  const ctx2 = await b.newContext({ viewport: { width: 1024, height: 768 }, hasTouch: true, isMobile: true });
  const p2 = await ctx2.newPage();
  p2.on('pageerror', e => errs.push(e.message));
  await p2.goto(PAGE); await p2.waitForTimeout(1800);
  const t2 = await p2.evaluate(() => {
    const m = document.querySelector('.magic-menu-content');
    m.style.display = 'flex';
    const b = m.getBoundingClientRect();
    const c = m.querySelector('.magic-grid-item[data-libelle]');
    const rc = c.getBoundingClientRect();
    const res = { w: Math.round(b.width), h: Math.round(b.height),
                  part: Math.round(b.width * b.height / (innerWidth * innerHeight) * 100),
                  cell: { w: Math.round(rc.width), h: Math.round(rc.height) },
                  libelle: getComputedStyle(c, '::after').content,
                  libelleAffiche: getComputedStyle(c, '::after').display !== 'none' };
    m.style.display = '';
    return res;
  });
  console.log('  ' + JSON.stringify(t2));
  ck('le nom est bien affiché', t2.libelleAffiche === true && /Croquis/.test(t2.libelle), t2.libelle);
  ck('la cible reste tapable (44px)', t2.cell.w >= 44 && t2.cell.h >= 44, JSON.stringify(t2.cell));
  ck('le tiroir a maigri', t2.h <= 460, `${t2.w}x${t2.h}, ${t2.part} %`);
  ck('aucune erreur JS', errs.length === 0, errs.slice(0, 3).join(' | '));
  await b.close();
  console.log(`\n${fail ? `=== ${fail} échec(s) ===` : '=== tout passe ==='}`);
  process.exit(fail ? 1 : 0);
})();
