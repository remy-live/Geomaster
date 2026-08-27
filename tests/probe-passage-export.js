// L'export suit-il les passages ? Et les anciens liens se relisent-ils ?
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
  await page.goto(PAGE); await page.waitForTimeout(1500);

  console.log('\n=== SVG : les abscisses sont celles du canevas ===');
  const r = await page.evaluate(() => {
    const a = window.app; a.clearCanvas();
    const t = new TextLabel(200, 200, 'Le triangle est isocele');
    t.fontSize = 20;
    t.morceaux = [[
      { t: 'Le ', g: false, i: false, s: false },
      { t: 'triangle', g: true, i: false, s: false },
      { t: ' est ', g: false, i: false, s: false },
      { t: 'isocele', g: false, i: true, s: true },
    ]];
    a.addEntity(t);
    // les abscisses attendues, calculées par le même chemin que le dessin
    const attendues = []; let x = 200;
    t.morceaux[0].forEach(m => { attendues.push(Math.round(x * 100) / 100);
      a.ctx.font = t.policeMorceau(m); x += a.ctx.measureText(m.t).width; });
    const svg = a.generateSVGString(false, 'text');
    const balise = (svg.match(/<text[^>]*>[\s\S]*?<\/text>/) || [''])[0];
    return { attendues, largeur: Math.round(x - 200),
             nText: (svg.match(/<text/g) || []).length,
             nTspan: (balise.match(/<tspan/g) || []).length,
             debut: +(balise.match(/<text x="([\d.]+)"/) || [0, 0])[1],
             ordre: (balise.match(/>([^<]*)<\/tspan>/g) || []).map(x => x.slice(1, -8)),
             gras: /<tspan font-weight="bold">triangle<\/tspan>/.test(balise),
             ital: /<tspan font-style="italic">isocele<\/tspan>/.test(balise),
             filets: (svg.match(/<rect/g) || []).length,
             extrait: [balise.replace(/font-family="[^"]*" /, '')] };
  });
  r.extrait.forEach(l => console.log('  ' + l));
  /* Le contrat a changé, et pour la bonne raison : poser chaque passage à une
     abscisse calculée sur le canevas supposait que le PDF les rende exactement
     aussi larges, et la moindre différence de police les faisait se chevaucher.
     Une balise par ligne, un tspan par passage, et c'est le rendu qui avance. */
  ck('une seule balise de texte pour la ligne', r.nText === 1, r.nText + '');
  ck('un tspan par passage, dans l\'ordre', r.nTspan === 4
     && r.ordre.join('') === 'Le triangle est isocele', JSON.stringify(r.ordre));
  ck('la ligne commence à l\'abscisse du canevas', r.debut === r.attendues[0],
     `${r.debut} vs ${r.attendues[0]}`);
  ck('le mot gras porte font-weight', r.gras === true);
  ck('le mot italique porte font-style', r.ital === true);
  ck('un seul filet de soulignement', r.filets === 1, r.filets + '');

  console.log('\n=== un lien d\'avant : le style d\'ensemble tient toujours ===');
  const vieux = await page.evaluate(() => {
    const a = window.app;
    // écrit à la main comme le faisait la version précédente : bits 1+4 = gras+souligné
    const brut = "Ancien;0;0¦9;100;100;Ancienne remarque;18;3;'Segoe UI', sans-serif;5";
    const u = LZString.compressToEncodedURIComponent(brut);
    a.clearCanvas(); a.loadFromCompressedString(u);
    const t = a.entities.find(e => e.constructor.name === 'TextLabel');
    if (!t) return null;
    const l = t.lignesRiches()[0][0];
    const svg = a.generateSVGString(false, 'text');
    return { text: t.text, gras: t.gras, souligne: t.souligne, morceaux: t.morceaux,
             passage: l, police: t.policeMorceau(l), svgGras: /font-weight="bold"/.test(svg) };
  });
  console.log('  ' + JSON.stringify(vieux));
  ck('le texte est relu', vieux && vieux.text === 'Ancienne remarque');
  ck('sans passages enregistrés', vieux && vieux.morceaux === null);
  ck('mais le repli rend le gras et le souligné',
     vieux && vieux.passage.g === true && vieux.passage.s === true && vieux.passage.i === false,
     JSON.stringify(vieux && vieux.passage));
  ck('et l\'export le porte aussi', vieux && vieux.svgGras === true);

  console.log('\n=== une formule en gras reste composée ===');
  const fo = await page.evaluate(() => {
    const a = window.app; a.clearCanvas();
    const t = new TextLabel(200, 200, 'Aire = \\frac{b}{2}');
    t.fontSize = 22;
    t.morceaux = [[{ t: 'Aire = \\frac{b}{2}', g: true, i: false, s: false }]];
    a.addEntity(t);
    const em = t.emprise(a.ctx);
    const svg = a.generateSVGString(false, 'text');
    return { haut: Math.round(em.hauteur), fragments: (svg.match(/<text/g) || []).length,
             gras: /font-weight="bold"/.test(svg) };
  });
  console.log('  ' + JSON.stringify(fo));
  ck('la fraction est bien composée', fo.haut > 22 * 1.5, fo.haut + 'px');
  ck('en plusieurs fragments', fo.fragments >= 3, fo.fragments + '');
  ck('tous en gras', fo.gras === true);

  ck('aucune erreur JS', errs.length === 0, errs.slice(0, 3).join(' | '));
  await b.close();
  console.log(`\n${fail ? `=== ${fail} échec(s) ===` : '=== tout passe ==='}`);
  process.exit(fail ? 1 : 0);
})();
