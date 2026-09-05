// L'aperçu du lien élève : ce qu'on y voit doit être ce que l'élève verra, sur
// l'appareil qu'il aura entre les mains.
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
  const page = await (await b.newContext({ viewport: { width: 1400, height: 1000 } })).newPage();
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.goto(PAGE); await page.waitForTimeout(1500);

  // une figure, puis l'aperçu
  await page.evaluate(() => {
    const app = window.app;
    app.entities = []; app.historyPast = []; app.stepInstructions = {}; app.saveState();
    /* Une sauvegarde automatique dans le magasin local : c'est elle qui faisait
       s'ouvrir l'aperçu sur « Voulez-vous la restaurer ? ». */
    localStorage.setItem('geoMaster_backup', JSON.stringify({ title: 'Test', data: '[{"x":1}]' }));
    app.executerConsigne('Trace un triangle ABC tel que AB = 5 cm, AC = 4 cm et BC = 3 cm');
    openPreview();
  });
  await page.waitForTimeout(2600);

  const cadre = () => page.frames().find(f => f !== page.mainFrame());
  const lire = async () => {
    const dehors = await page.evaluate(() => ({
      etiquette: document.getElementById('previewTaille').textContent,
      lien: document.getElementById('previewLien').value,
      actif: [...document.querySelectorAll('.preview-appareil.actif')].map(b => b.textContent.trim()),
      transform: document.querySelector('.phone-mockup').style.transform,
    }));
    const f = cadre();
    let dedans = null;
    if (f) {
      try {
        dedans = await f.evaluate(() => ({
          l: window.innerWidth, h: window.innerHeight,
          objets: window.app ? window.app.entities.length : null,
          lecture: document.body.classList.contains('mode-lecture'),
          // une boîte de dialogue ouverte par-dessus la figure, l'élève ne la verrait pas
          dialogue: [...document.querySelectorAll('.modal-overlay')]
            .some(m => getComputedStyle(m).display !== 'none'),
        }));
      } catch (e) { dedans = { err: String(e).slice(0, 60) }; }
    }
    return { ...dehors, dedans };
  };

  console.log('\n=== l\'aperçu est la vraie page, en mode lecture ===');
  const un = await lire();
  console.log('  ' + JSON.stringify(un));
  ck('le cadre porte bien le logiciel en mode lecture',
     un.dedans && un.dedans.lecture === true, JSON.stringify(un.dedans));
  ck('la figure y est', un.dedans && un.dedans.objets === 7, String(un.dedans && un.dedans.objets));
  /* Le mode lecture peut être demandé dans l'adresse OU dans son dièse — l'aperçu
     passe par le dièse. La question de la sauvegarde n'était posée qu'à
     l'adresse : l'aperçu s'ouvrait donc sur une boîte de dialogue. */
  ck('aucune boîte de dialogue ne s\'ouvre par-dessus',
     un.dedans && un.dedans.dialogue === false, JSON.stringify(un.dedans));
  ck('le lien élève est écrit, pas seulement copiable',
     /mode=lecture&fig=/.test(un.lien), un.lien.slice(0, 50));

  console.log('\n=== chaque appareil a ses vraies dimensions ===');
  /* Le cadre ne fait pas SEMBLANT d'être un téléphone : son document mesure
     vraiment 390 px de large, donc les règles d'affichage du logiciel — qui
     changent à 820 px et à 480 px — s'y appliquent comme sur l'appareil. */
  const attendus = [['Téléphone', 390, 844], ['Tablette', 820, 1180], ['Ordinateur', 1280, 800]];
  for (const [nom, l, h] of attendus) {
    await page.click(`.preview-appareil:has-text("${nom}")`);
    await page.waitForTimeout(700);
    const r = await lire();
    console.log(`  ${nom} : ${r.etiquette} — dedans ${r.dedans.l}×${r.dedans.h}`);
    ck(`${nom} : le document mesure vraiment ${l} × ${h}`,
       r.dedans.l === l && r.dedans.h === h, `${r.dedans.l}×${r.dedans.h}`);
    ck(`${nom} : la taille est écrite`, r.etiquette.startsWith(`${l} × ${h} px`), r.etiquette);
    ck(`${nom} : c'est lui qui est marqué actif`, r.actif.join('').includes(nom), r.actif.join(','));
  }

  console.log('\n=== pivoter ===');
  await page.click('#previewRotation');
  await page.waitForTimeout(700);
  const pivote = await lire();
  console.log('  ' + pivote.etiquette + ' — dedans ' + pivote.dedans.l + '×' + pivote.dedans.h);
  ck('l\'ordinateur pivoté fait 800 × 1280',
     pivote.dedans.l === 800 && pivote.dedans.h === 1280, `${pivote.dedans.l}×${pivote.dedans.h}`);

  console.log('\n=== ça tient dans la fenêtre, et on sait à quelle échelle ===');
  /* Réduire à l'affichage ne change pas la largeur intérieure : c'est ce qui
     permet de montrer une tablette de 1180 px de haut dans une fenêtre qui en
     fait 1000, sans mentir sur ce que voit l'élève. */
  await page.click('.preview-appareil:has-text("Tablette")');
  await page.waitForTimeout(700);
  const tab = await lire();
  const k = parseFloat((tab.transform.match(/scale\(([\d.]+)\)/) || [])[1] || '1');
  console.log(`  ${tab.etiquette} · échelle ${k}`);
  ck('la tablette est réduite pour tenir', k > 0 && k < 1, String(k));
  ck('mais son document fait toujours 820 px de large', tab.dedans.l === 820, String(tab.dedans.l));
  ck('et le rapport est écrit', /affiché à \d+ %/.test(tab.etiquette), tab.etiquette);

  console.log('\n=== le cadrage automatique propose, le professeur tranche ===');
  await page.click('.preview-appareil:has-text("Téléphone")');
  await page.waitForTimeout(700);
  const mesurer = async () => (cadre()).evaluate(() => {
    const app = window.app, b = app.getSceneBounds(false), z = app.view.zoom;
    const boite = app.canvas.parentElement.getBoundingClientRect();
    return { zoom: +z.toFixed(3),
             l: Math.round((b.maxX - b.minX) * z), h: Math.round((b.maxY - b.minY) * z),
             x0: Math.round(b.minX * z + app.view.x), x1: Math.round(b.maxX * z + app.view.x),
             y0: Math.round(b.minY * z + app.view.y), y1: Math.round(b.maxY * z + app.view.y),
             ecranL: Math.round(boite.width), ecranH: Math.round(boite.height) };
  });
  const avant = await mesurer();
  const lienAvant = await page.evaluate(() => document.getElementById('previewLien').value);
  console.log('  avant : ' + JSON.stringify(avant));
  /* Le cadrage recopié de l'écran du professeur laisse la figure minuscule sur un
     téléphone : c'est précisément ce que l'aperçu sert à voir. */
  ck('sans rien faire, la figure est petite sur le téléphone',
     avant.l < avant.ecranL / 3, `${avant.l} px de large sur ${avant.ecranL}`);

  await page.click('#previewCadrer');
  await page.waitForTimeout(700);
  const apres = await mesurer();
  console.log('  après : ' + JSON.stringify(apres));
  ck('le cadrage automatique la fait tenir en grand',
     apres.l > avant.l * 2 && apres.l <= apres.ecranL && apres.h <= apres.ecranH,
     `${apres.l}×${apres.h} dans ${apres.ecranL}×${apres.ecranH}`);
  ck('elle est entièrement dans l\'écran',
     apres.x0 >= 0 && apres.y0 >= 0 && apres.x1 <= apres.ecranL && apres.y1 <= apres.ecranH,
     JSON.stringify([apres.x0, apres.y0, apres.x1, apres.y1]));
  ck('et centrée',
     Math.abs(apres.x0 - (apres.ecranL - apres.x1)) <= 2, `${apres.x0} / ${apres.ecranL - apres.x1}`);

  /* LE PROFESSEUR A LE DERNIER MOT : le cadrage proposé ne part PAS dans le lien.
     Il reste une proposition, qu'on peut encore déplacer, jusqu'à « Définir vue ». */
  const noteProposee = await page.evaluate(() => document.getElementById('previewNote').textContent);
  console.log('  note : ' + noteProposee);
  ck('le lien n\'a pas bougé pour autant',
     (await page.evaluate(() => document.getElementById('previewLien').value)) === lienAvant);
  ck('et la note dit qui tranche', /Définir la vue/.test(noteProposee), noteProposee);

  /* « DÉFINIR LA VUE » A QUITTÉ LA MAQUETTE. Le bouton vivait DANS l'aperçu,
     au fond du téléphone dessiné et à 59 % de taille : on ne le voyait pas,
     alors que c'est le seul geste qui met le cadrage dans le lien. Il est
     maintenant dans la barre de la fenêtre, à côté de « Cadrer » qui propose. */
  const dehors = await page.evaluate(() => {
    const d = document.getElementById('previewDefinirVue');
    return d ? { visible: getComputedStyle(d).display !== 'none',
                 boite: (() => { const r = d.getBoundingClientRect();
                                 return [Math.round(r.width), Math.round(r.height)]; })() } : null;
  });
  console.log('  bouton : ' + JSON.stringify(dehors));
  ck('« Définir la vue » est dans la barre, pas dans la maquette',
     !!dehors && dehors.visible && dehors.boite[0] > 80, JSON.stringify(dehors));
  const dedans = await cadre().evaluate(() => !!document.getElementById('btnSaveView'));
  ck('et il n\'est plus dans l\'aperçu', dedans === false, String(dedans));

  await page.click('#previewDefinirVue');
  await page.waitForTimeout(900);
  const lienApres = await page.evaluate(() => document.getElementById('previewLien').value);
  const noteFinale = await page.evaluate(() => document.getElementById('previewNote').textContent);
  console.log('  note : ' + noteFinale);
  ck('« Définir vue » met le cadrage dans le lien', lienApres !== lienAvant);
  ck('et le dit', /enregistr/i.test(noteFinale), noteFinale);

  console.log('\n=== le fond s\'assombrit ===');
  const buf = await page.screenshot();
  const px = await page.evaluate(async (b64) => {
    const im = new Image();
    await new Promise(r => { im.onload = r; im.src = 'data:image/png;base64,' + b64; });
    const c = document.createElement('canvas');
    c.width = im.width; c.height = im.height;
    const x = c.getContext('2d'); x.drawImage(im, 0, 0);
    const d = x.getImageData(40, 300, 1, 1).data;
    return [d[0], d[1], d[2]];
  }, buf.toString('base64'));
  console.log('  pixel hors du cadre : ' + JSON.stringify(px));
  ck('la feuille du professeur passe derrière', Math.max(...px) < 70, JSON.stringify(px));

  ck('aucune erreur JS', errs.length === 0, errs.slice(0, 3).join(' | '));
  await b.close();
  console.log(`\n${fail ? `=== ${fail} échec(s) ===` : '=== tout passe ==='}`);
  process.exit(fail ? 1 : 0);
})();
