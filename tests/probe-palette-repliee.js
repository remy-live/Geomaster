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

  console.log('\n=== la poignée et la croix ne se superposent plus ===');
  /* La croix est posée contre le bord droit, la poignée est centrée : sur 212 px
     elles se tiennent à distance, sur 50 px elles se recouvraient — au téléphone
     on voyait une poignée barrée d'une croix, un seul objet illisible. */
  const haut = await page.evaluate(() => {
    const p = document.getElementById('stylePalettePanel');
    const cadre = (s) => { const e = p.querySelector(s); if (!e) return null;
      const st = getComputedStyle(e); if (st.display === 'none' || st.visibility === 'hidden') return null;
      const r = e.getBoundingClientRect(); return [Math.round(r.left), Math.round(r.right)]; };
    return { pastille: cadre('.drag-pill'), croix: cadre('.close-palette'),
             bouton: !!document.getElementById('btnToggleStylePalette') };
  });
  console.log('  ' + JSON.stringify(haut));
  ck('la poignée est là', !!haut.pastille, JSON.stringify(haut.pastille));
  ck('la croix ne l\'est plus, donc rien ne se chevauche', haut.croix === null, JSON.stringify(haut.croix));
  /* Refermer reste à un doigt : c'est le bouton de la barre du haut. */
  ck('le bouton de la barre du haut ferme toujours la palette', haut.bouton);
  const ferme = await page.evaluate(() => {
    app.toggleStylePalette();
    const v = document.getElementById('stylePalettePanel').style.display;
    app.toggleStylePalette();
    return v;
  });
  ck('et il la ferme vraiment', ferme === 'none', ferme);

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
  await page.click('#paletteCompacte .barre-pliage'); await page.waitForTimeout(350);
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
  const croixRevenue = await page.evaluate(() => {
    const c = document.querySelector('#stylePalettePanel .close-palette');
    return c ? getComputedStyle(c).display !== 'none' : false;
  });
  ck('et sa croix revient, là où il y a la place', croixRevenue);

  await page.locator('#stylePalettePanel .quick-color-bar .color-swatch').nth(2).click();
  await page.waitForTimeout(160);
  const croise = await etat();
  ck('changer la couleur dans le panneau met la pastille à jour',
     croise.rond.replace(/\s/g, '') === 'rgb(192,57,43)', croise.rond);

  console.log('\n=== le pliage se retient d\'une fois sur l\'autre ===');
  await page.click('.palette-content .barre-pliage'); await page.waitForTimeout(300);
  ck('elle se replie', (await etat()).repliee === true);
  await page.reload(); await page.waitForTimeout(1600);
  ck('et rouvre repliée', (await etat()).repliee === true);
  await page.click('#paletteCompacte .barre-pliage'); await page.waitForTimeout(300);
  await page.reload(); await page.waitForTimeout(1600);
  const apres = await etat();
  ck('dépliée à la main, elle rouvre dépliée', apres.repliee === false, JSON.stringify(apres));

  /* ============================================================
     DÉPLIÉE, LES RANGÉES PARTAGENT LEURS DEUX BORDS

     « La toolbar de style, je la trouve très déséquilibrée (sauf quand elle est
       réduite, je la trouve parfaite). »

     La remarque désigne exactement le contraste : repliée, une seule rangée ;
     dépliée, six rangées qui ne s'alignaient sur rien. Mesuré, panneau de
     212 px, distance du premier contrôle au bord du contenu :

         couleurs        28 px
         épaisseur       14 px   (et le nombre DÉBORDAIT de 8 px à droite)
         grille de 4     33 px
         grille de 5     14 px
         grille de 4     33 px

     Cinq marges différentes dans un panneau large comme la main. Chaque rangée
     était CENTRÉE avec un écart fixe : sa largeur dépendait donc du nombre de
     boutons, et rien ne tombait en face de rien.

     CE QUE LA SONDE MESURE EST L'ALIGNEMENT, PAS UNE VALEUR. Elle ne demande
     pas « 14 px » — elle exige que TOUTES les rangées commencent et finissent
     à la même distance du bord, quelle que soit cette distance. C'est la seule
     formulation qui survivra au jour où l'on changera la marge du panneau.

     LA TOLÉRANCE DE 3 PX N'EST PAS DU CONFORT : la pastille de couleur
     sélectionnée porte un anneau et un agrandissement de 1,15 qui débordent de
     deux pixels, et cette pastille se déplace quand on change de couleur.
     ============================================================ */
  console.log('\n=== dépliée, toutes les rangées s\'alignent ===');
  await page.evaluate(() => window.app.basculerPliagePalette(false));
  await page.waitForTimeout(300);
  const rangees = await page.evaluate(() => {
    const c = document.querySelector('#stylePalettePanel .palette-content');
    const cr = c.getBoundingClientRect();
    return [...c.children]
      .filter(el => !el.classList.contains('p-divider')
                 && el.getBoundingClientRect().height > 4)
      .map(el => {
        const enfants = [...el.children].filter(k => k.getBoundingClientRect().width > 1);
        const kb = enfants.map(k => k.getBoundingClientRect());
        const b = el.getBoundingClientRect();
        /* DEUX RANGÉES SE JUGENT SUR LEURS PROPRES BORDS et non sur leur
           contenu : le bouton large du mode peinture, dont l'icône est centrée,
           et l'INTERRUPTEUR, dont la piste est le contrôle — son rembourrage
           intérieur est voulu, c'est la piste qui doit tomber en face. */
        const propre = kb.length <= 1 || el.classList.contains('p-segment');
        return {
          nom: el.className.split(' ')[0] || el.tagName.toLowerCase(),
          gauche: Math.round((propre ? b.left : kb[0].left) - cr.left),
          droite: Math.round(cr.right - (propre ? b.right : kb[kb.length - 1].right)),
          /* même tolérance de 3 px, et pour la même raison : l'anneau de
             sélection est peint HORS de la boîte de la pastille */
          deborde: kb.some(k => k.right > b.right + 3 || k.left < b.left - 3),
        };
      });
  });
  const g = rangees.map(r => r.gauche), d = rangees.map(r => r.droite);
  const ecart = (t) => Math.max(...t) - Math.min(...t);
  ck(`les ${rangees.length} rangées commencent au même endroit`, ecart(g) <= 3,
     rangees.map(r => `${r.nom} ${r.gauche}`).join(' · '));
  ck('  et finissent au même endroit', ecart(d) <= 3,
     rangees.map(r => `${r.nom} ${r.droite}`).join(' · '));
  ck('  et rien ne déborde de sa rangée',
     rangees.every(r => !r.deborde),
     rangees.filter(r => r.deborde).map(r => r.nom).join(' ') || 'aucun débordement');

  /* ============================================================
     CHOISIR, OU AGIR — DEUX NATURES, DEUX FORMES

     Sept dispositions ont été montrées avant celle-ci, et les six premières
     partageaient la même hypothèse fausse : garder six rangées de carrés
     identiques et les ranger autrement. Aucune ne convainquait, et la raison
     était ailleurs que dans les marges — la barre REPLIÉE plaît parce qu'elle
     montre un ÉTAT ; le panneau déplié alignait vingt-deux icônes muettes où
     rien ne distinguait un choix d'une action.

     Or « croix, disque, pixel » est un choix EXCLUSIF — un seul peut être vrai —
     quand « rayons X » ou « codage auto » sont des bascules indépendantes.

     LA FORME A ÉTÉ CHERCHÉE EN DEUX TEMPS, et les deux comptent.
     D'abord des intitulés au-dessus de chaque groupe ; ils ont été ESSAYÉS PUIS
     RETIRÉS — le panneau passait de 361 à 507 px pour nommer des rangées qui se
     lisent seules, des ronds colorés et des traits. Sans eux il tient en 312 px,
     MOINS que l'original.
     Ensuite le segment lui-même : trois cases bordées côte à côte se lisaient
     encore comme trois boutons, et l'on pouvait croire en enfoncer plusieurs.
     C'est maintenant un INTERRUPTEUR — une piste grise, une pastille blanche qui
     se déplace —, la forme que tout le monde connaît, et qui dit la règle sans
     un mot.

     CE QUE LA SONDE VÉRIFIE EST CETTE DISTINCTION, et non un pixel : que les
     choix exclusifs soient sur une piste, jointifs et pleine largeur ; que les
     bascules restent des carrés séparés. C'est la forme qui doit survivre, pas
     la mesure du jour.
     ============================================================ */
  console.log('\n=== un choix exclusif est un interrupteur, une bascule ne l\'est pas ===');
  const formes = await page.evaluate(() => {
    const c = document.querySelector('#stylePalettePanel .palette-content');
    const seg = [...c.querySelectorAll('.p-segment')].map(s => {
      const b = [...s.querySelectorAll('.btn')];
      const r = b.map(x => x.getBoundingClientRect());
      const sr = s.getBoundingClientRect();
      const cs = getComputedStyle(s);
      const pad = parseFloat(cs.paddingLeft) || 0;
      /* JOINTIFS : d'une case à la suivante, aucun blanc. */
      let joints = true;
      for (let i = 1; i < r.length; i++) if (r[i].left - r[i - 1].right > 0.5) joints = false;
      return {
        n: b.length, joints,
        /* les cases occupent toute la PISTE, à son rembourrage près */
        remplit: Math.abs(r[0].left - (sr.left + pad)) < 1.5
              && Math.abs(r[r.length - 1].right - (sr.right - pad)) < 1.5,
        /* une piste : un fond à elle, et les cases sans bordure entre elles */
        piste: cs.backgroundColor !== 'rgba(0, 0, 0, 0)'
            && cs.backgroundColor !== 'transparent',
        /* et la position courante est marquée, une seule fois */
        actives: b.filter(x => x.classList.contains('active')).length,
      };
    });
    const grilles = [...c.querySelectorAll('.p-grid-5')].map(g => {
      const r = [...g.querySelectorAll('.btn')].map(x => x.getBoundingClientRect());
      let separes = true;
      for (let i = 1; i < r.length; i++) if (r[i].left - r[i - 1].right < 2) separes = false;
      return { n: r.length, separes };
    });
    return { seg, grilles,
             grilleAvecLesPoints: !!c.querySelector('.p-segment #btnGrid'),
             styles: [...c.querySelectorAll('.p-segment .btn')].map(b => b.id),
             /* les intitulés ont été retirés : ni eux, ni leur CSS */
             intitules: c.querySelectorAll('.p-titre').length };
  });
  ck('deux groupes sont des interrupteurs — le trait et les points',
     formes.seg.length === 2, formes.seg.map(s => s.n + ' positions').join(' · '));
  ck('  chacun a sa piste', formes.seg.every(s => s.piste),
     JSON.stringify(formes.seg.map(s => s.piste)));
  ck('  les cases sont jointives et remplissent la piste',
     formes.seg.every(s => s.joints && s.remplit),
     JSON.stringify(formes.seg.map(s => [s.joints, s.remplit])));
  ck('  et une seule position est marquée par interrupteur',
     formes.seg.every(s => s.actives === 1),
     JSON.stringify(formes.seg.map(s => s.actives)));
  ck('  les trois styles de point y sont, et rien d\'autre',
     formes.styles.filter(i => /^btnPt/.test(i)).length === 3
     && !formes.grilleAvecLesPoints, formes.styles.join(' '));
  ck('les bascules, elles, restent des carrés séparés',
     formes.grilles.length === 2 && formes.grilles.every(g => g.separes && g.n === 5),
     formes.grilles.map(g => g.n + (g.separes ? ' séparés' : ' COLLÉS')).join(' · '));
  ck('  et plus aucun intitulé : ils ont été essayés, puis retirés',
     formes.intitules === 0, formes.intitules + ' intitulé(s)');

  /* ============================================================
     LE TIROIR SE VOIT

     « Je trouve ça un peu moche, la petite flèche pour étendre le menu
       contextuel — idem pour la flèche du menu de style. »

     Ce n'est pas qu'une affaire de goût : un chevron de 15 px posé dans un coin
     dit « il se passe quelque chose », une barre pleine largeur dit « cela
     s'ouvre ». Mesuré, la cible passait de 27 × 21 px à toute la largeur du
     panneau — au doigt, cela change tout.

     ET LES DEUX PANNEAUX PARLENT LA MÊME LANGUE. Le menu contextuel et la
     palette s'ouvraient par deux petits chevrons qui ne se ressemblaient pas,
     posés à deux endroits différents — l'un en haut à droite, l'autre en haut à
     gauche. La même barre les sert maintenant, et elle vit EN BAS dans les deux
     cas : là où s'ouvre ce qu'elle montre.
     ============================================================ */
  console.log('\n=== la barre de pliage, et non un chevron perdu ===');
  /* CHAQUE BARRE SE MESURE DANS SON ÉTAT. Une première version les relevait
     toutes les deux d'un coup : la barre de la version repliée était alors
     dans un panneau en display:none et rendait 0 × 0 — une mesure qui ne
     mesurait rien, et qui passait pour vraie. */
  const barreDe = (quoi) => page.evaluate((quoi) => {
    const p = document.getElementById('stylePalettePanel');
    const b = p.querySelector(quoi + ' .barre-pliage');
    if (!b) return null;
    const r = b.getBoundingClientRect();
    const pere = b.parentElement.getBoundingClientRect();
    return { l: Math.round(r.width), h: Math.round(r.height),
             pleine: r.width > 0 && r.width > pere.width - 30,
             dessine: !!b.querySelector('svg path') };
  }, quoi);

  await page.evaluate(() => window.app.basculerPliagePalette(false));
  await page.waitForTimeout(250);
  const bDeplie = await barreDe('.palette-content');
  ck('dépliée, la barre est en bas et pleine largeur',
     !!bDeplie && bDeplie.pleine && bDeplie.h >= 28, JSON.stringify(bDeplie));
  ck('  son chevron est un tracé, pas un caractère', !!bDeplie && bDeplie.dessine);

  await page.evaluate(() => window.app.basculerPliagePalette(true));
  await page.waitForTimeout(250);
  const bReplie = await barreDe('#paletteCompacte');
  ck('repliée, elle a la sienne', !!bReplie && bReplie.pleine && bReplie.h >= 28,
     JSON.stringify(bReplie));
  ck('  et le même chevron dessiné', !!bReplie && bReplie.dessine);

  const restes = await page.evaluate(() => ({
    palette: document.querySelectorAll('#stylePalettePanel .btn-pliage').length,
    menu: !!document.querySelector('#contextMenu .barre-pliage'),
  }));
  ck('plus aucun petit chevron ne traîne', restes.palette === 0,
     restes.palette + ' .btn-pliage');
  ck('  et le menu contextuel porte la MÊME barre', restes.menu);

  ck('aucune erreur JS', errs.length === 0, errs.slice(0, 3).join(' | '));
  await b.close();
  console.log(`\n${fail ? `=== ${fail} échec(s) ===` : '=== tout passe ==='}`);
  process.exit(fail ? 1 : 0);
})();
