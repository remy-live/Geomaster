// L'échappement minimal : plus court, et les anciens liens se relisent.
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

  const r = await page.evaluate(() => {
    const a = window.app;
    // du texte piégeux : les deux séparateurs, un pourcent, une barre, des accents
    const html = "<b>Exercice 3.</b><br>Tracer ABC ; AB = 6 cm, l'angle B̂ = 60°. "
               + "Réduction de 25% ; garder |AB| et le signe ¦ tel quel.<br><i>Traits apparents.</i>";
    document.getElementById('instrContent').innerHTML = html;
    document.getElementById('instructionBox').style.display = 'block';
    a.stepInstructions = { 1: "Trace [AB] ; 6 cm.", 2: "Reporte 60° | en B.", 3: "Place C à 4,5 cm." };
    const lu = () => document.getElementById('instrContent').innerHTML;
    const attendu = lu();                       // ce que le navigateur a réellement gardé
    const etapes = JSON.parse(JSON.stringify(a.stepInstructions));

    const neuf = a.getCompressedString();
    const brutNeuf = LZString.decompressFromEncodedURIComponent(neuf);

    // le MÊME contenu écrit à l'ancienne, tout encodeURIComponent
    const brutVieux = brutNeuf.split('¦').map(l => {
      if (l.indexOf('INSTRUCTIONS:') === 0) {
        const v = l.slice(13); const i = v.indexOf(';');
        return 'INSTRUCTIONS:' + v.slice(0, i + 1) + encodeURIComponent(decodeURIComponent(v.slice(i + 1)));
      }
      if (l.indexOf('STEPS:') === 0) {
        return 'STEPS:' + l.slice(6).split('|').map(p => {
          const i = p.indexOf('='); return p.slice(0, i + 1) + encodeURIComponent(decodeURIComponent(p.slice(i + 1)));
        }).join('|');
      }
      return l;
    }).join('¦');
    const vieux = LZString.compressToEncodedURIComponent(brutVieux);

    const relire = (url) => {
      a.clearCanvas(); document.getElementById('instrContent').innerHTML = '';
      a.stepInstructions = {};
      a.loadFromCompressedString(url);
      return { html: lu(), etapes: JSON.parse(JSON.stringify(a.stepInstructions)) };
    };
    const rNeuf = relire(neuf);
    const rVieux = relire(vieux);
    const bloc = (s, p) => (s.split('¦').find(l => l.indexOf(p) === 0) || '').length;
    return { attendu, etapes, rNeuf, rVieux,
             brutNeuf: brutNeuf.length, brutVieux: brutVieux.length,
             instrNeuf: bloc(brutNeuf, 'INSTRUCTIONS:'), instrVieux: bloc(brutVieux, 'INSTRUCTIONS:'),
             stepsNeuf: bloc(brutNeuf, 'STEPS:'), stepsVieux: bloc(brutVieux, 'STEPS:'),
             compNeuf: neuf.length, compVieux: vieux.length };
  });

  console.log('\n=== relecture du nouveau format ===');
  ck('consigne identique', r.rNeuf.html === r.attendu, r.rNeuf.html === r.attendu ? '' : r.rNeuf.html.slice(0, 90));
  ck('étapes identiques', JSON.stringify(r.rNeuf.etapes) === JSON.stringify(r.etapes), JSON.stringify(r.rNeuf.etapes));
  console.log('\n=== relecture d\'un lien à l\'ancienne (compatibilité) ===');
  ck('consigne identique', r.rVieux.html === r.attendu, r.rVieux.html === r.attendu ? '' : r.rVieux.html.slice(0, 90));
  ck('étapes identiques', JSON.stringify(r.rVieux.etapes) === JSON.stringify(r.etapes), JSON.stringify(r.rVieux.etapes));
  console.log('\n=== gain ===');
  console.log(`  consigne  ${r.instrVieux} → ${r.instrNeuf} car.  |  étapes ${r.stepsVieux} → ${r.stepsNeuf} car.`);
  console.log(`  brut ${r.brutVieux} → ${r.brutNeuf}  |  lien ${r.compVieux} → ${r.compNeuf} car.`);
  ck('la consigne raccourcit d\'au moins 25 %', r.instrNeuf < r.instrVieux * 0.75,
     Math.round((1 - r.instrNeuf / r.instrVieux) * 100) + ' %');
  ck('le lien raccourcit', r.compNeuf < r.compVieux,
     Math.round((1 - r.compNeuf / r.compVieux) * 100) + ' %');
  ck('aucune erreur JS', errs.length === 0, errs.slice(0, 3).join(' | '));
  await b.close();
  console.log(`\n${fail ? `=== ${fail} échec(s) ===` : '=== tout passe ==='}`);
  process.exit(fail ? 1 : 0);
})();
