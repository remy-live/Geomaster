// Au téléphone, le panneau des consignes ne recouvre pas la figure : il prend la
// moitié basse de l'écran, et la feuille est raccourcie d'autant.
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

  const mesurer = async (page) => page.evaluate(() => {
    const boite = document.getElementById('instructionBox');
    const box = boite.getBoundingClientRect();
    const feuille = document.querySelector('.canvas-container').getBoundingClientRect();
    // ce qui flotte par-dessus la feuille et retomberait dans les consignes
    const dessus = [];
    document.querySelectorAll('body *').forEach(e => {
      const cs = getComputedStyle(e);
      if (cs.position !== 'fixed' && cs.position !== 'absolute') return;
      if (cs.display === 'none' || cs.visibility === 'hidden') return;
      if (boite.contains(e) || e.contains(boite)) return;
      const r = e.getBoundingClientRect();
      if (!r.width || !r.height) return;
      // un voile transparent plein écran ne gêne personne
      if (r.width >= window.innerWidth && r.height >= window.innerHeight) return;
      if (r.bottom > box.top + 4 && r.top < box.bottom - 4) dessus.push(e.id || e.className);
    });
    return {
      partage: document.body.classList.contains('consignes-partage'),
      box: [box.x, box.y, box.width, box.height].map(Math.round),
      feuille: [feuille.x, feuille.y, feuille.width, feuille.height].map(Math.round),
      fenetre: [window.innerWidth, window.innerHeight],
      dessus,
    };
  });

  console.log('\n=== au téléphone : l\'écran est partagé en deux ===');
  const tel = await (await b.newContext({ viewport: { width: 390, height: 844 } })).newPage();
  const errs = []; tel.on('pageerror', e => errs.push(e.message));
  await tel.goto(PAGE); await tel.waitForTimeout(1500);
  const ferme = await tel.evaluate(() =>
    document.querySelector('.canvas-container').getBoundingClientRect().height);
  await tel.evaluate(() => app.toggleInstructions());
  await tel.waitForTimeout(400);
  const m = await mesurer(tel);
  console.log('  ' + JSON.stringify(m));
  ck('le panneau prend toute la largeur', m.box[0] === 0 && m.box[2] === 390,
     `x ${m.box[0]}, large de ${m.box[2]}`);
  ck('il est collé en bas', m.box[1] + m.box[3] === 844, String(m.box[1] + m.box[3]));
  /* LA FEUILLE EST RACCOURCIE, pas seulement recouverte : on voit ce qu'on
     construit pendant qu'on l'écrit. C'est toute la différence avec une fenêtre
     flottante de 340 px sur un écran de 390. */
  ck('la feuille est raccourcie d\'autant', m.feuille[3] < ferme - 300,
     `${ferme} → ${m.feuille[3]}`);
  ck('et ne passe pas sous le panneau', m.feuille[1] + m.feuille[3] <= m.box[1],
     `${m.feuille[1] + m.feuille[3]} / ${m.box[1]}`);
  /* La loupe et le bouton de lecture sont calés sur le bas de l'écran : ils
     tombaient au milieu des consignes. */
  ck('rien ne flotte par-dessus les consignes', m.dessus.length === 0, m.dessus.join(', '));

  console.log('\n=== on referme : la feuille reprend toute la place ===');
  await tel.evaluate(() => app.toggleInstructions());
  await tel.waitForTimeout(400);
  const apres = await tel.evaluate(() => ({
    partage: document.body.classList.contains('consignes-partage'),
    h: Math.round(document.querySelector('.canvas-container').getBoundingClientRect().height),
  }));
  console.log('  ' + JSON.stringify(apres));
  ck('la feuille est rendue', apres.partage === false && apres.h === Math.round(ferme),
     `${apres.h} / ${Math.round(ferme)}`);

  console.log('\n=== on écrit une consigne, on la voit se faire ===');
  await tel.evaluate(() => { app.entities = []; app.historyPast = []; app.saveState(); app.toggleInstructions(); });
  await tel.waitForTimeout(300);
  await tel.fill('.csl-champ[data-i="0"]', 'Trace un triangle ABC');
  await tel.press('.csl-champ[data-i="0"]', 'Enter');
  await tel.waitForTimeout(500);
  const fait = await tel.evaluate(() => ({
    objets: app.entities.length,
    num: document.querySelector('.csl-num').textContent,
    rep: (document.querySelector('.csl-reponse').textContent || '').slice(0, 40),
  }));
  console.log('  ' + JSON.stringify(fait));
  ck('la consigne est faite', fait.objets > 0 && /Triangle/.test(fait.rep), JSON.stringify(fait));
  ck('et la ligne porte son ✓', fait.num === '✓', fait.num);

  console.log('\n=== sur grand écran, rien ne change : la fenêtre flotte ===');
  const bureau = await (await b.newContext({ viewport: { width: 1400, height: 1000 } })).newPage();
  bureau.on('pageerror', e => errs.push(e.message));
  await bureau.goto(PAGE); await bureau.waitForTimeout(1500);
  await bureau.evaluate(() => app.toggleInstructions());
  await bureau.waitForTimeout(300);
  const g = await mesurer(bureau);
  console.log('  ' + JSON.stringify({ partage: g.partage, box: g.box, feuille: g.feuille }));
  ck('l\'écran n\'est pas partagé', g.partage === false);
  ck('le panneau reste une fenêtre étroite', g.box[2] > 300 && g.box[2] < 420, String(g.box[2]));
  ck('et la feuille garde toute sa hauteur', g.feuille[3] > 900, String(g.feuille[3]));

  ck('aucune erreur JS', errs.length === 0, errs.slice(0, 3).join(' | '));
  await b.close();
  console.log(`\n${fail ? `=== ${fail} échec(s) ===` : '=== tout passe ==='}`);
  process.exit(fail ? 1 : 0);
})();
