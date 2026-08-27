// La reprise après fermeture : proposée, et fidèle.
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
  const ctx = await b.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.goto(PAGE); await page.waitForTimeout(1800);

  const sig = () => page.evaluate(() => window.app.entities.map(e =>
    e.constructor.name + (e.label || e.text || '')).join('|'));

  await page.evaluate(() => {
    const a = window.app; a.clearCanvas();
    const A = new Point(200, 200, 'A'), B = new Point(500, 300, 'B');
    a.addEntity(A); a.addEntity(B); a.addEntity(new Segment(A, B));
    const t = new TextLabel(300, 500, 'Un mot'); t.cadre = true; a.addEntity(t);
    a.projectTitle = 'Reprise';
    a.stepInstructions = { 2: 'Trace [AB].' };
    a.saveState();
  });
  const avant = await sig();
  const stock = await page.evaluate(() => (localStorage.getItem('geoMaster_backup') || '').length);
  console.log(`\n=== avant fermeture : ${avant} (${stock} caractères en réserve) ===`);
  ck('la sauvegarde locale est écrite', stock > 100, stock + ' caractères');

  await page.reload(); await page.waitForTimeout(2200);
  const modale = await page.evaluate(() => {
    const vus = [];
    document.querySelectorAll('div, dialog').forEach((e) => {
      const s = getComputedStyle(e);
      if (s.display === 'none' || s.visibility === 'hidden') return;
      if (/sauvegarde automatique/i.test(e.textContent || '') && e.children.length < 6) {
        const r = e.getBoundingClientRect();
        vus.push({ id: e.id || e.className, w: Math.round(r.width), h: Math.round(r.height) });
      }
    });
    const btns = Array.from(document.querySelectorAll('button')).filter(x => {
      const s = getComputedStyle(x);
      return s.display !== 'none' && /oui|restaurer|confirmer|ok/i.test(x.innerText || '');
    }).map(x => x.innerText.trim().slice(0, 16));
    return { vus, btns, objets: window.app.entities.length };
  });
  console.log('  ' + JSON.stringify(modale));
  ck('la restauration est proposée', modale.vus.length > 0, JSON.stringify(modale.vus));
  ck('rien n\'est restauré avant qu\'on accepte', modale.objets === 0, modale.objets + ' objets');
  ck('un bouton de confirmation est offert', modale.btns.length > 0, JSON.stringify(modale.btns));

  // on accepte
  const clic = await page.evaluate(() => {
    const b = document.getElementById('btnModalConfirm');
    if (!b) return 'bouton absent';
    b.click();
    return 'cliqué';
  });
  console.log('  ' + clic);
  await page.waitForTimeout(600);
  const apres = await sig();
  const detail = await page.evaluate(() => ({
    titre: window.app.projectTitle,
    etapes: JSON.stringify(window.app.stepInstructions),
    cadre: (window.app.entities.find(e => e.constructor.name === 'TextLabel') || {}).cadre,
  }));
  console.log('  après restauration : ' + apres + ' ' + JSON.stringify(detail));
  ck('la figure revient à l\'identique', apres === avant, `${avant} → ${apres}`);
  ck('le titre revient', detail.titre === 'Reprise', detail.titre);
  ck('les consignes d\'étape reviennent', detail.etapes === JSON.stringify({ 2: 'Trace [AB].' }), detail.etapes);
  ck('l\'encadré du texte revient', detail.cadre === true);
  ck('aucune erreur JS', errs.length === 0, errs.slice(0, 3).join(' | '));
  await b.close();
  console.log(`\n${fail ? `=== ${fail} échec(s) ===` : '=== tout passe ==='}`);
  process.exit(fail ? 1 : 0);
})();
