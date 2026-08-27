// Parcours complet : importer un PDF, tourner les pages sur place, zoomer net.
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
  const page = await (await b.newContext({ viewport: { width: 1280, height: 900 } })).newPage();
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.goto(PAGE); await page.waitForTimeout(1500);

  // import par le vrai circuit : handleFileUpload, comme un glisser-déposer
  const b64 = require('fs').readFileSync(D + 'trois.pdf').toString('base64');
  await page.evaluate(async (b64) => {
    const bin = atob(b64); const u = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i);
    const f = new File([u], 'trois.pdf', { type: 'application/pdf' });
    await window.app.handleFileUpload(f);
  }, b64);
  await page.waitForTimeout(2500);
  const modale = await page.evaluate(() => ({
    aff: getComputedStyle(document.getElementById('pdfSelectorModal')).display,
    info: document.getElementById('pdfPageInfo').textContent,
  }));
  console.log('  modale de sélection : ' + JSON.stringify(modale));
  ck('la modale de choix de page s\'ouvre', modale.aff !== 'none');
  ck('elle annonce 3 pages', /\/\s*3/.test(modale.info), modale.info);

  await page.evaluate(() => app.changePdfPage(1));
  await page.waitForTimeout(600);
  await page.evaluate(() => app.confirmPdfPage());
  await page.waitForTimeout(2500);

  const ap = await page.evaluate(() => {
    const g = app.bgImage;
    return { doc: !!(g && g.pdfDoc), page: g && g.pdfPage, pages: g && g.pdfPages,
             info: document.getElementById('docPageInfo').textContent,
             pagesAff: getComputedStyle(document.getElementById('docPages')).display,
             barre: getComputedStyle(document.getElementById('barreDocument')).display,
             larg: g && Math.round(g.img.width) };
  });
  console.log('  après import : ' + JSON.stringify(ap));
  ck('le document PDF reste ouvert après import', ap.doc === true);
  ck('la page 2 est celle qui a été choisie', ap.page === 2);
  ck('la barre affiche la pagination', ap.pagesAff !== 'none' && ap.info === '2/3', ap.info);

  // tourner la page SUR PLACE, en conservant cadre et zoom
  const avant = await page.evaluate(() => {
    const g = app.bgImage; app.choisirModeDocument('page'); g.zoomContenu(1.8, 0, 0);
    return { w: g.width, h: g.height, L: g.cropL, R: g.cropR, op: g.opacity };
  });
  await page.evaluate(() => app.changerPageDocument(1));
  await page.waitForTimeout(1800);
  const apres = await page.evaluate(() => {
    const g = app.bgImage;
    return { page: g.pdfPage, info: document.getElementById('docPageInfo').textContent,
             w: g.width, h: g.height, L: g.cropL, R: g.cropR, op: g.opacity, larg: Math.round(g.img.width) };
  });
  console.log('  page tournée : ' + JSON.stringify(apres));
  ck('on est passé à la page 3 sans réimporter', apres.page === 3 && apres.info === '3/3');
  ck('le cadre est conservé', Math.abs(apres.w - avant.w) < 1e-6 && Math.abs(apres.h - avant.h) < 1e-6);
  ck('le zoom du document est conservé', Math.abs(apres.L - avant.L) < 1e-9 && Math.abs(apres.R - avant.R) < 1e-9);
  ck('l\'opacité est conservée', apres.op === avant.op);
  // ce qui compte n'est pas la taille brute du raster mais la finesse RÉELLE de
  // la portion affichée : au moins autant de pixels source que de pixels écran
  const vus = apres.larg * (apres.R - apres.L);
  ck('la portion affichée est au moins à 1:1', vus >= apres.w, `${Math.round(vus)} px source pour ${Math.round(apres.w)} px de cadre`);
  ck('avec une marge de sur-échantillonnage', vus >= apres.w * 1.2, `${(vus / apres.w).toFixed(2)}x`);

  // butée : pas de page 4
  await page.evaluate(() => app.changerPageDocument(1));
  await page.waitForTimeout(400);
  const bt = await page.evaluate(() => app.bgImage.pdfPage);
  ck('impossible de dépasser la dernière page', bt === 3);
  ck('aucune erreur JS', errs.length === 0, errs.slice(0, 3).join(' | '));
  await b.close();
  console.log(`\n${fail ? `=== ${fail} échec(s) ===` : '=== tout passe ==='}`);
  process.exit(fail ? 1 : 0);
})();
