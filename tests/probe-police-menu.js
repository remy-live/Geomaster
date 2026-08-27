// Le menu des polices ne ment plus : ce qu'on choisit est ce qui sort.
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
  const page = await (await b.newContext({ viewport: { width: 1280, height: 900 } })).newPage();
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.goto(PAGE); await page.waitForTimeout(1800);

  const r = await page.evaluate(() => {
    const a = window.app;
    const choix = Array.from(document.getElementById('ghostTextFont').options).map(o => ({ v: o.value, t: o.text }));
    const sortie = choix.map((c) => {
      a.clearCanvas();
      const t = new TextLabel(100, 100, 'Essai'); t.fontFamily = c.v; t.fontSize = 16; a.addEntity(t);
      const svg = a.generateSVGString(false, 'text');
      const fam = (svg.match(/<text[^>]*font-family="([^"]*)"/) || [])[1];
      return { menu: c.t, canevas: t.famillePolice(), pdf: fam };
    });
    // un texte enregistré à l'ancienne
    a.clearCanvas();
    const vieux = new TextLabel(100, 100, 'Ancien');
    vieux.fontFamily = "'Segoe UI', sans-serif";
    a.addEntity(vieux);
    const svgV = a.generateSVGString(false, 'text');
    return { sortie, ancien: { canevas: vieux.famillePolice(),
             pdf: (svgV.match(/<text[^>]*font-family="([^"]*)"/) || [])[1] },
             defaut: new TextLabel(0, 0, 'x').fontFamily };
  });

  console.log('');
  r.sortie.forEach((x) => console.log(`  ${x.menu.padEnd(12)} canevas « ${x.canevas} »\n  ${' '.repeat(12)} pdf     « ${x.pdf} »`));
  ck('« Standard » sort en GeoSans des deux côtés',
     /GeoSans/.test(r.sortie[0].canevas) && /^GeoSans/.test(r.sortie[0].pdf), r.sortie[0].pdf);
  const autres = r.sortie.slice(1);
  ck('les autres polices ne sont plus remplacées par GeoSans',
     autres.every(x => !/GeoSans/.test(x.pdf)), JSON.stringify(autres.map(x => x.pdf)));
  ck('Arial reste Arial', /^Arial/.test(autres[0].pdf), autres[0].pdf);
  ck('Courier reste monospace', /Courier/.test(autres[1].pdf) && !/Arial/.test(autres[1].pdf), autres[1].pdf);
  ck('une fantaisie garde un repli sans empattements', /Arial|sans-serif/.test(autres[2].pdf), autres[2].pdf);

  console.log('\n=== un texte écrit avant ce changement ===');
  console.log('  ' + JSON.stringify(r.ancien));
  ck('il passe à la police du logiciel, des deux côtés',
     /GeoSans/.test(r.ancien.canevas) && /^GeoSans/.test(r.ancien.pdf), JSON.stringify(r.ancien));
  ck('le défaut d\'un nouveau texte est la police du logiciel', /^GeoSans/.test(r.defaut), r.defaut);

  console.log('\n=== le lien ne paie pas la police par défaut ===');
  const url = await page.evaluate(() => {
    const a = window.app; a.clearCanvas();
    a.addEntity(new TextLabel(100, 100, 'Simple'));
    return LZString.decompressFromEncodedURIComponent(a.getCompressedString())
      .split('¦').find(l => l.indexOf('9;') === 0);
  });
  console.log('  ' + JSON.stringify(url));
  ck('aucun champ de police écrit', url.split(';').length <= 4, url);
  ck('aucune erreur JS', errs.length === 0, errs.slice(0, 3).join(' | '));
  await b.close();
  console.log(`\n${fail ? `=== ${fail} échec(s) ===` : '=== tout passe ==='}`);
  process.exit(fail ? 1 : 0);
})();
