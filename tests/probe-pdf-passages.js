// Un mot en gras au milieu d'une phrase : le PDF ne doit ni le recouvrir ni
// laisser de trou, et écrire la même police que le canevas.
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
  /* On attend que la police embarquée soit VRAIMENT chargée. Elle arrive de façon
     asynchrone ; sur une machine lente, le canevas mesurait encore avec la police
     de repli pendant que le PDF, lui, écrivait GeoSans — 2,78pt d'écart, dus à
     l'attente et non au code. */
  await page.evaluate(() => Promise.all([
    document.fonts.load("400 16px GeoSans"),
    document.fonts.load("700 16px GeoSans"),
  ]).then(() => document.fonts.ready));

  const r = await page.evaluate(async () => {
    const a = window.app; a.clearCanvas();
    const mots = ['fddsffds', 'fsdfsdfsdfdsdfs', 'fdsffds'];
    const t = new TextLabel(100, 100, mots.join(''));
    t.fontSize = 16;
    t.morceaux = [[
      { t: mots[0], g: false, i: false, s: false },
      { t: mots[1], g: true, i: false, s: false },
      { t: mots[2], g: false, i: false, s: false },
    ]];
    a.addEntity(t);
    window.gmEnsurePdfLibs();
    const svg = a.generateSVGString(false, 'text');
    const racine = svg.match(/^<svg[^>]*>/)[0];
    const w = parseFloat(racine.match(/width="([\d.]+)"/)[1]);
    const h = parseFloat(racine.match(/height="([\d.]+)"/)[1]);
    const el = new DOMParser().parseFromString(svg, "image/svg+xml").documentElement;
    const doc = new jspdf.jsPDF({ orientation: w > h ? "landscape" : "portrait", unit: "pt", format: [w, h] });
    if (window.gmEnregistrerPolice) window.gmEnregistrerPolice(doc);
    await doc.svg(el, { x: 0, y: 0, width: w, height: h });
    const buf = new Uint8Array(doc.output('arraybuffer'));
    let flux = ''; for (let i = 0; i < buf.length; i++) flux += String.fromCharCode(buf[i]);
    // largeurs vraies du PDF
    doc.setFontSize(16);
    doc.setFont('GeoSans', 'normal'); const wNorm = mots.map(m => doc.getTextWidth(m));
    doc.setFont('GeoSans', 'bold');   const wGras = mots.map(m => doc.getTextWidth(m));
    // largeurs du canevas
    const wCanevas = t.morceaux[0].map(mo => { a.ctx.save(); a.ctx.font = t.policeMorceau(mo);
      const x = a.ctx.measureText(mo.t).width; a.ctx.restore(); return x; });
    return { flux, svgTexte: (svg.match(/<text[^>]*>[\s\S]*?<\/text>/g) || []).join('\n'),
             wNorm, wGras, wCanevas, famille: t.famillePolice(),
             police: (svg.match(/font-family="([^"]*)"/g) || []) };
  });

  console.log('\n=== le SVG exporté ===');
  console.log('  ' + r.svgTexte.slice(0, 240));
  ck('un seul <text> pour la ligne', (r.svgTexte.match(/<text/g) || []).length === 1,
     (r.svgTexte.match(/<text/g) || []).length + ' balises');
  ck('trois tspan', (r.svgTexte.match(/<tspan/g) || []).length === 3);
  ck('le gras est porté par le tspan du milieu', /<tspan font-weight="bold">fsdfsdfsdfdsdfs<\/tspan>/.test(r.svgTexte));
  ck('la famille est celle du logiciel', /GeoSans/.test(r.famille), r.famille);

  console.log('\n=== largeurs : canevas contre PDF ===');
  console.log('  canevas ' + r.wCanevas.map(x => x.toFixed(1)).join(' / '));
  console.log('  pdf     ' + [r.wNorm[0], r.wGras[1], r.wNorm[2]].map(x => x.toFixed(1)).join(' / '));
  const pdfW = [r.wNorm[0], r.wGras[1], r.wNorm[2]];
  /* La tolérance est exprimée en POURCENTAGE, et pas en points. La mesure du
     texte n'appartient pas au logiciel : selon la version du navigateur, elle
     diffère — certaines livrent des largeurs entières et donnent la même valeur
     pour le maigre et le gras (mesuré : 114,86 sur un Chromium 141, 120 tout
     rond sur un autre 141, pour le même mot). Ce qui doit être vrai, c'est que
     les deux mesures parlent bien de la même police, à quelques pour cent près,
     et non qu'elles coïncident au point. */
  const ecarts = r.wCanevas.map((c, i) => Math.abs(c - pdfW[i]) / pdfW[i]);
  ck('les trois passages font la même largeur des deux côtés (< 8 %)',
     ecarts.every(e => e < 0.08), ecarts.map(e => (e * 100).toFixed(1) + ' %').join(' / '));

  console.log('\n=== positions dans le PDF ===');
  const tms = [...r.flux.matchAll(/1\. 0\. 0\. -1\. ([\d.]+) ([\d.]+) Tm/g)].map(m => +m[1]);
  console.log('  abscisses : ' + JSON.stringify(tms));
  if (tms.length >= 3) {
    const d1 = tms[1] - tms[0], d2 = tms[2] - tms[1];
    console.log(`  avance 1 : ${d1.toFixed(2)} (largeur pdf ${pdfW[0].toFixed(2)})`);
    console.log(`  avance 2 : ${d2.toFixed(2)} (largeur pdf ${pdfW[1].toFixed(2)})`);
    /* Le vrai enjeu : PAS DE CHEVAUCHEMENT. Le défaut corrigé décalait de 9 % dès
       le premier passage et s'accumulait de passage en passage — un mot en gras
       mordait sur le précédent. L'écart qui subsiste vient de la mesure du
       navigateur, ne s'accumule pas, et reste sous les 6 %. */
    const e1 = Math.abs(d1 - pdfW[0]) / pdfW[0], e2 = Math.abs(d2 - pdfW[1]) / pdfW[1];
    ck('le 2e passage commence là où finit le 1er, à 6 % près', e1 < 0.06,
       `${(e1 * 100).toFixed(1)} % (${(d1 - pdfW[0]).toFixed(2)}pt)`);
    ck('le 3e aussi', e2 < 0.06, `${(e2 * 100).toFixed(1)} % (${(d2 - pdfW[1]).toFixed(2)}pt)`);
  } else {
    ck('trois positions de texte dans le PDF', false, tms.length + ' trouvées');
  }
  ck('aucune erreur JS', errs.length === 0, errs.slice(0, 3).join(' | '));
  await b.close();
  console.log(`\n${fail ? `=== ${fail} échec(s) ===` : '=== tout passe ==='}`);
  process.exit(fail ? 1 : 0);
})();
