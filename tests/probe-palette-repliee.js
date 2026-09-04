// La palette de style repliée : l'essentiel dans 50 px, le reste au dépliage.
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
  const ctx = await b.newContext({ viewport: { width: 1400, height: 1000 } });
  const page = await ctx.newPage();
  const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.goto(PAGE); await page.waitForTimeout(1500);

  const etat = () => page.evaluate(() => {
    const p = document.getElementById('stylePalettePanel');
    const gs = app.globalStyle || {};
    return { repliee: p.classList.contains('repliee'),
             largeur: Math.round(p.getBoundingClientRect().width),
             couleur: gs.color, tirets: (gs.dash || []).length > 0, epaisseur: gs.width,
             peinture: !!app.isPaintMode,
             chiffre: document.getElementById('puceEpaisseurChiffre').textContent,
             rond: document.getElementById('puceCouleurRond').style.background,
             nuancier: document.getElementById('nuancierCompact').classList.contains('ouvert') };
  });

  console.log('\n=== repliée au départ : 50 px au lieu de 212 ===');
  const depart = await etat();
  console.log('  ' + JSON.stringify(depart));
  /* Sur ses 23 commandes, trois servent à chaque trait. Les autres n'avaient
     aucune raison d'occuper le bord de la feuille en permanence. */
  ck('elle s\'ouvre repliée', depart.repliee === true);
  ck('elle mesure 50 px et non 212', depart.largeur <= 56, depart.largeur + ' px');
  ck('la pastille montre le crayon en cours',
     depart.rond.replace(/\s/g, '') === 'rgb(51,51,51)' && depart.chiffre === '2',
     `${depart.rond} · ${depart.chiffre}`);

  console.log('\n=== un clic sur la couleur passe à la suivante ===');
  const couleurs = await page.evaluate(() => app.couleursRapides());
  console.log('  cycle : ' + couleurs.join(' → '));
  const vues = [];
  for (let i = 0; i < couleurs.length + 1; i++) {
    vues.push((await etat()).couleur.toLowerCase());
    await page.click('#puceCouleur'); await page.waitForTimeout(110);
  }
  console.log('  ' + vues.join(' → '));
  /* Le cycle est LU dans la palette : une couleur ajoutée à la rangée y entre
     d'elle-même, il n'y a pas deux listes à tenir d'accord. */
  ck('il parcourt les couleurs de la palette, puis revient au début',
     vues.slice(1, couleurs.length + 1).join() === couleurs.map(c => c.toLowerCase()).join(),
     vues.join(' → '));

  console.log('\n=== un appui maintenu ouvre la rangée ===');
  const boite = await page.locator('#puceCouleur').boundingBox();
  await page.mouse.move(boite.x + boite.width / 2, boite.y + boite.height / 2);
  await page.mouse.down(); await page.waitForTimeout(600); await page.mouse.up();
  await page.waitForTimeout(200);
  const ouvert = await etat();
  const place = await page.evaluate(() => {
    const n = document.getElementById('nuancierCompact');
    const r = n.getBoundingClientRect(), p = document.getElementById('stylePalettePanel').getBoundingClientRect();
    return { pastilles: n.querySelectorAll('button').length, droite: Math.round(r.right),
             gauchePalette: Math.round(p.left), haut: Math.round(r.top),
             // ce qui se trouve au milieu de la rangée : elle doit être cliquable
             dessus: (document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2) || {}).tagName };
  });
  console.log('  ' + JSON.stringify(place));
  ck('la rangée s\'ouvre', ouvert.nuancier === true);
  ck('elle porte toutes les couleurs', place.pastilles === couleurs.length, String(place.pastilles));
  /* Elle sortait AU-DESSUS : la palette est en haut à droite, et la barre de
     l'en-tête recouvrait les pastilles. Elle sort donc sur le côté. */
  ck('elle sort à gauche de la palette, pas au-dessus',
     place.droite <= place.gauchePalette + 2 && place.haut > 40,
     `droite ${place.droite} / palette à ${place.gauchePalette}, haut ${place.haut}`);
  /* « overflow: hidden », posé pour arrondir les coins du panneau déplié, la
     coupait net : elle était visible mais le canevas recevait les clics. */
  ck('et elle est vraiment cliquable', place.dessus === 'BUTTON', place.dessus);

  await page.locator('#nuancierCompact button').nth(3).click();
  await page.waitForTimeout(160);
  const choisi = await etat();
  ck('on y choisit une couleur', choisi.couleur.toLowerCase() === couleurs[3].toLowerCase(),
     choisi.couleur);
  ck('et la rangée se referme', choisi.nuancier === false);

  console.log('\n=== le trait, l\'épaisseur, la peinture ===');
  await page.click('#puceTrait'); await page.waitForTimeout(120);
  ck('le trait passe en pointillés', (await etat()).tirets === true);
  await page.click('#puceTrait'); await page.waitForTimeout(120);
  ck('et revient plein', (await etat()).tirets === false);
  const eps = [];
  for (let i = 0; i < 7; i++) {
    eps.push((await etat()).epaisseur);
    await page.click('#puceEpaisseur'); await page.waitForTimeout(100);
  }
  console.log('  ' + eps.join(' → '));
  ck('l\'épaisseur tourne sur les six valeurs et boucle',
     eps.join() === '2,3,4,6,8,1,2', eps.join(' → '));
  await page.click('#pucePeinture'); await page.waitForTimeout(180);
  const pe = await page.evaluate(() => ({ mode: !!app.isPaintMode,
    allume: document.getElementById('pucePeinture').classList.contains('active') }));
  ck('le mode peinture s\'allume et se voit', pe.mode && pe.allume, JSON.stringify(pe));
  await page.click('#pucePeinture'); await page.waitForTimeout(180);

  console.log('\n=== dépliée, c\'est la palette d\'avant ===');
  await page.click('#paletteCompacte .btn-pliage'); await page.waitForTimeout(350);
  const deplie = await page.evaluate(() => {
    const p = document.getElementById('stylePalettePanel');
    return { largeur: Math.round(p.getBoundingClientRect().width),
             repliee: p.classList.contains('repliee'),
             commandes: p.querySelectorAll('.palette-content [onclick],.palette-content [oninput],.palette-content [onchange]').length,
             contenuVisible: getComputedStyle(p.querySelector('.palette-content')).display };
  });
  console.log('  ' + JSON.stringify(deplie));
  ck('elle reprend ses 212 px', deplie.largeur >= 200 && !deplie.repliee, String(deplie.largeur));
  /* Rien n'a été retiré du panneau : c'est exactement celui d'avant. */
  ck('avec toutes ses commandes', deplie.commandes >= 22, String(deplie.commandes));

  await page.locator('#stylePalettePanel .quick-color-bar .color-swatch').nth(2).click();
  await page.waitForTimeout(160);
  const croise = await etat();
  ck('changer la couleur dans le panneau met la pastille à jour',
     croise.rond.replace(/\s/g, '') === 'rgb(192,57,43)', croise.rond);

  console.log('\n=== le pliage se retient d\'une fois sur l\'autre ===');
  await page.click('.palette-drag-handle .btn-pliage'); await page.waitForTimeout(300);
  ck('elle se replie', (await etat()).repliee === true);
  await page.reload(); await page.waitForTimeout(1600);
  ck('et rouvre repliée', (await etat()).repliee === true);
  await page.click('#paletteCompacte .btn-pliage'); await page.waitForTimeout(300);
  await page.reload(); await page.waitForTimeout(1600);
  const apres = await etat();
  ck('dépliée à la main, elle rouvre dépliée', apres.repliee === false, JSON.stringify(apres));

  ck('aucune erreur JS', errs.length === 0, errs.slice(0, 3).join(' | '));
  await b.close();
  console.log(`\n${fail ? `=== ${fail} échec(s) ===` : '=== tout passe ==='}`);
  process.exit(fail ? 1 : 0);
})();
